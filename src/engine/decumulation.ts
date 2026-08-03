import type { SimulationInputs, DecumulationResult, StressTestResult, StressTestScenario } from "../types"
import { mulberry32 } from "./rng"
import { monthlyRate, percentile, average, buildTerminalHistogram, wilsonScoreCI, calcMaxDrawdown } from "./math"
import { roundCent, clamp } from "./taxes"
import { sampleHistoricalReturns } from "./montecarlo"
// Rééchantillonnage par blocs NON CHEVAUCHANTS partagé avec l'onglet Monte
// Carlo (une seule implémentation, pas de copie locale qui dérive) : des blocs
// de 5 années consécutives réelles sont tirés avec remise, sans jamais
// reboucler 2025 → 1970. Les krachs et les bull markets réels sont rejoués.
import {
  getHistoricalPool,
  sampleBlocks,
  BLOCK_LENGTH,
  FRENCH_INFLATION_1970_2025,
  MSCI_WORLD_AVG_RETURN,
} from "./historical"
import { applyRegime, effectiveSampleSize, sampleRegime } from "./reliability"

// Taille de chunk de la variante asynchrone : laisse le thread principal
// respirer entre deux tranches (même principe que runMonteCarloAsync).
const DECUM_CHUNK_SIZE = 150

/**
 * Retrait mensuel de base selon le modèle choisi (règle de Bengen sur le
 * capital INITIAL, indexé ensuite sur l'inflation — la « rente constante »).
 */
function computeBaseWithdrawal(inputs: SimulationInputs, startingCapital: number): number {
  if (inputs.withdrawalModel === "rule-4") return (startingCapital * 0.04) / 12
  if (inputs.withdrawalModel === "ultra-safe") return (startingCapital * 0.025) / 12
  if (inputs.withdrawalModel === "optimistic") return (startingCapital * 0.055) / 12
  // custom : montant fixe mensuel choisi par l'utilisateur (0 € est un choix valide)
  return Math.max(0, inputs.withdrawalFixed)
}

/** Accumulateurs partagés entre la variante synchrone et asynchrone. */
interface DecumAccumulator {
  paths: number[][]
  ruinYears: number[]
  withdrawalByYear: number[]
}

/**
 * Rejoue UNE simulation de décaissement sur une séquence de rendements
 * annuels donnée. C'est LE cœur unique du décaissement : utilisé par le Monte
 * Carlo (séquences rééchantillonnées) ET par les stress tests déterministes
 * (séquences historiques réelles) — une seule implémentation, pas de copie
 * locale qui dérive.
 *
 * Garde-fous dynamiques (Guyton–Klinger, règle de préservation du capital) :
 * si l'année précédente a été négative, la rente de l'année qui commence est
 * réduite de 10 % et l'indexation de cette année est sautée — couper un peu
 * pour sauver le capital, c'est ce qui sauve la majorité des cas de ruine.
 */
function runDecumulationPath(
  inputs: SimulationInputs,
  startingCapital: number,
  baseWithdrawal: number,
  years: number,
  returns: number[],
  inflations: number[] | null,
  applyGuardrails: boolean,
): { capitalPath: number[]; ruinYear: number | null; withdrawalByYear: number[] } {
  const capitalPath: number[] = [roundCent(startingCapital)]
  const withdrawalByYear: number[] = Array.from({ length: years + 1 }, () => 0)
  let capital = startingCapital
  let monthlyWithdrawal = baseWithdrawal
  let ruinYear: number | null = null
  let lastYearReturn = 0
  let guardrailCut = false

  for (let month = 1; month <= years * 12; month += 1) {
    const yearIndex = Math.floor((month - 1) / 12)
    const monthInYear = (month - 1) % 12
    // Début d'année : décision de garde-fou fondée sur le rendement de l'année
    // précédente (connu depuis la fin de l'année précédente).
    if (monthInYear === 0) {
      if (month > 1) {
        guardrailCut = applyGuardrails && (lastYearReturn ?? 0) < 0
        if (guardrailCut) monthlyWithdrawal = roundCent(monthlyWithdrawal * 0.9)
      } else {
        guardrailCut = false
      }
    }
    // Rendement réel de l'année rejouée, lissé au mois (comme runSimulation).
    // Repli défensif : moyenne de la série MSCI World si le tableau est vide
    // (le taux saisi a été supprimé — Option A).
    const marketReturn = monthlyRate(returns[yearIndex] ?? MSCI_WORLD_AVG_RETURN)
    const capitalAfterReturn = roundCent(capital * (1 + marketReturn))
    // On ne peut retirer que ce qui existe : si le capital ne couvre pas le
    // retrait prévu, seule la part disponible est réellement retirée (le
    // reste serait retiré d'un capital inexistant — retraits « fantômes »,
    // audit B6). actualWithdrawal vaut donc 0 après la faillite.
    const actualWithdrawal = roundCent(Math.min(monthlyWithdrawal, Math.max(0, capitalAfterReturn)))
    capital = roundCent(Math.max(0, capitalAfterReturn - monthlyWithdrawal))
    // Indexation inflation — taux fixe (inflation saisie) OU série française
    // réelle rejouée (stochasticInflation). Sautée l'année d'un garde-fou.
    if (inputs.withdrawalInflation && !guardrailCut) {
      const annualInflation = inflations?.[yearIndex] ?? inputs.inflation
      monthlyWithdrawal = roundCent(monthlyWithdrawal * (1 + monthlyRate(annualInflation)))
    }
    if (capital <= 0 && ruinYear === null) ruinYear = Math.ceil(month / 12)
    // Cumul mensuel des retraits (et non « dernier retrait × 12 ») pour que
    // l'indexation inflation soit prise en compte année après année.
    withdrawalByYear[Math.ceil(month / 12)] = roundCent(
      (withdrawalByYear[Math.ceil(month / 12)] ?? 0) + actualWithdrawal,
    )
    if (month % 12 === 0) {
      capitalPath.push(roundCent(capital))
      lastYearReturn = returns[yearIndex] ?? MSCI_WORLD_AVG_RETURN
    }
  }
  return { capitalPath, ruinYear, withdrawalByYear }
}

/**
 * Rejoue `simCount` simulations consécutives (à partir de `simStart`) et
 * accumule les résultats dans `acc`. C'est LE cœur unique du décaissement :
 * la version synchrone l'appelle en une fois, la version asynchrone par
 * chunks — les deux produisent des résultats bit-à-bit identiques.
 */
function runDecumulationRange(
  inputs: SimulationInputs,
  startingCapital: number,
  baseWithdrawal: number,
  years: number,
  simStart: number,
  simCount: number,
  acc: DecumAccumulator,
): void {
  const pool = getHistoricalPool(inputs.historicalIndex, inputs.extendedHistory)
  for (let sim = simStart; sim < simStart + simCount; sim += 1) {
    const rng = mulberry32(inputs.seed + 100_003 + sim * 3571)
    // Le décaissement est un Monte-Carlo : les rendements réels passés sont
    // TOUJOURS rééchantillonnés (taux défini inclus, comme l'onglet Monte
    // Carlo) — les krachs et les bull markets réels sont rejoués. La crise
    // synthétique est neutralisée : les krachs réels sont déjà dans les
    // rendements rejoués (règle identique à runSimulation).
    let historicalReturns = sampleHistoricalReturns(inputs, years, rng)
    // Incertitude des paramètres : chaque scénario tire son régime (moyenne /
    // volatilité) autour des estimations historiques — voir montecarlo.ts.
    if (inputs.parameterUncertainty) {
      const regime = sampleRegime(
        pool.avgReturn,
        pool.volatility,
        effectiveSampleSize(pool.returns.length, BLOCK_LENGTH),
        rng,
      )
      historicalReturns = applyRegime(historicalReturns, regime, pool.avgReturn, pool.volatility)
    }
    // Inflation réelle rejouée (blocs non chevauchants sur la série française
    // 1970-2025) — indépendante des rendements (modélisation volontairement
    // simple : on capture les pics d'inflation, pas la corrélation fine).
    const inflations =
      inputs.withdrawalInflation && inputs.stochasticInflation
        ? sampleBlocks(FRENCH_INFLATION_1970_2025, years, rng, BLOCK_LENGTH)
        : null
    const path = runDecumulationPath(
      inputs,
      startingCapital,
      baseWithdrawal,
      years,
      historicalReturns,
      inflations,
      inputs.dynamicGuardrails,
    )
    if (path.ruinYear !== null) acc.ruinYears.push(path.ruinYear)
    acc.paths.push(path.capitalPath)
    for (let y = 1; y <= years; y += 1) {
      acc.withdrawalByYear[y] = roundCent((acc.withdrawalByYear[y] ?? 0) + (path.withdrawalByYear[y] ?? 0))
    }
  }
}

/** Calcule les bandes de percentiles et les statistiques terminales. */
function finalizeDecumulation(
  years: number,
  paths: number[][],
  ruinYears: number[],
  withdrawalByYear: number[],
  simCount: number,
  baseWithdrawal: number,
): DecumulationResult {
  const yearAxis = Array.from({ length: years + 1 }, (_, i) => i)
  const band = (pct: number) =>
    yearAxis.map((_, year) => {
      const values = paths.map(p => p[year] ?? 0).sort((a, b) => a - b)
      return roundCent(percentile(values, pct))
    })
  const ruinProbability = ruinYears.length / simCount
  const sortedRuin = [...ruinYears].sort((a, b) => a - b)
  const withdrawals = withdrawalByYear.map(v => roundCent(v / simCount))
  // Issues terminales : le « 95,8 % » n'est pas un point exact — avec N
  // simulations, le taux de survie vaut ±0,4 pt (Wilson). La moyenne est
  // tirée par la queue droite (cas très chanceux) : l'écart moyenne/P50 est
  // précisément ce qui rendait les 3 lignes difficiles à lire.
  const terminalValues = paths.map(p => p[p.length - 1] ?? 0)
  const survived = simCount - ruinYears.length

  return {
    years: yearAxis,
    p10: band(0.1),
    p50: band(0.5),
    p90: band(0.9),
    withdrawals,
    ruinProbability: roundCent(ruinProbability * 100),
    survivalProbability: roundCent((1 - ruinProbability) * 100),
    survivalRateCI: wilsonScoreCI(survived, simCount),
    mean: roundCent(average(terminalValues)),
    terminalDistribution: buildTerminalHistogram(terminalValues),
    ruinYearMedian: sortedRuin.length ? Math.round(percentile(sortedRuin, 0.5)) : null,
    initialWithdrawal: roundCent(baseWithdrawal),
    runs: simCount,
    capital: band(0.5),
    success: 1 - ruinProbability > 0.85,
    withdrawal: withdrawals,
  }
}

// ───────────────────────────────────────────────────────────────
// Stress tests déterministes — « et si vous subissiez 1973-74,
// 2000-03 ou 2008 ? »
// ───────────────────────────────────────────────────────────────

/**
 * Fenêtres historiques réelles rejouées telles quelles (déterministe) : au
 * lieu d'un percentile, on montre ce qui arrive VRAIMENT à la rente quand le
 * retraité démarre pile au début d'une période noire. Le moteur rejoue les
 * rendements réels contigus de l'indice depuis l'année de départ — aucune
 * reconstitution, aucun hasard : c'est ce que la bourse a réellement fait.
 */
export const STRESS_TEST_SCENARIOS: StressTestScenario[] = [
  {
    id: "1973",
    startYear: 1973,
    label: "Choc pétrolier 1973-74",
    desc: "−30 % puis −31 % deux années de suite, avec 9-14 % d'inflation (stagflation)",
    color: "#F87171",
  },
  {
    id: "2000",
    startYear: 2000,
    label: "Bulle internet 2000-03",
    desc: "Trois années de baisse consécutives (−6 %, −12 %, −33 %) après le pic",
    color: "#FB923C",
  },
  {
    id: "2008",
    startYear: 2008,
    label: "Crise financière 2008",
    desc: "−37 % sur un an (GFC), la pire année de l'après-guerre",
    color: "#F59E0B",
  },
]

/**
 * Rejoue le décaissement sur la fenêtre historique réelle commençant à
 * l'année du scénario (durée = retirementYears, bornée par la fin de la
 * série). Réutilise le même chemin mensuel que le Monte Carlo — les
 * garde-fous et l'indexation inflation s'appliquent à l'identique, seule
 * la source des rendements change (déterministe au lieu de rééchantillonné).
 */
export function runStressTest(
  inputs: SimulationInputs,
  startingCapital: number,
  scenario: StressTestScenario,
): StressTestResult {
  const pool = getHistoricalPool(inputs.historicalIndex, inputs.extendedHistory)
  const startIdx = Math.max(0, scenario.startYear - pool.startYear)
  const windowLen = Math.min(Math.max(1, inputs.retirementYears), Math.max(0, pool.returns.length - startIdx))
  const windowReturns = pool.returns.slice(startIdx, startIdx + windowLen)
  // Inflation alignée sur les ANNÉES CALENDAIRES rejouées (la série réelle
  // française couvre 1970-2025) : pendant 1973-74, la rente est érodée par
  // 9-14 % — un taux fixe de 2,1 % masquerait précisément la période étudiée.
  const inflations = windowReturns.map((_, i) => {
    const year = pool.startYear + startIdx + i
    const frIndex = year - 1970
    return frIndex >= 0 && frIndex < FRENCH_INFLATION_1970_2025.length
      ? (FRENCH_INFLATION_1970_2025[frIndex] ?? inputs.inflation)
      : inputs.inflation
  })
  const baseWithdrawal = computeBaseWithdrawal(inputs, startingCapital)
  const path = runDecumulationPath(
    inputs,
    startingCapital,
    baseWithdrawal,
    windowLen,
    windowReturns,
    inflations,
    inputs.dynamicGuardrails,
  )
  const { maxDrawdownPct } = calcMaxDrawdown(path.capitalPath)
  return {
    scenario,
    finalCapital: path.capitalPath[path.capitalPath.length - 1] ?? 0,
    survived: path.ruinYear === null,
    ruinYear: path.ruinYear,
    minCapital: Math.min(...path.capitalPath),
    worstDrawdown: maxDrawdownPct,
    totalWithdrawn: path.withdrawalByYear.reduce((s, v) => s + v, 0),
    yearsPath: path.capitalPath,
    windowReturns: windowReturns.map((r, i) => ({ year: pool.startYear + startIdx + i, return: r })),
  }
}

export function runDecumulation(
  inputs: SimulationInputs,
  startingCapital: number,
  runs = Math.min(inputs.mcRuns, 10_000),
): DecumulationResult {
  const simCount = Math.round(clamp(runs, 100, 10_000))
  const years = Math.max(1, inputs.retirementYears)
  const baseWithdrawal = computeBaseWithdrawal(inputs, startingCapital)
  const acc: DecumAccumulator = {
    paths: [],
    ruinYears: [],
    withdrawalByYear: Array.from({ length: years + 1 }, () => 0),
  }
  runDecumulationRange(inputs, startingCapital, baseWithdrawal, years, 0, simCount, acc)
  return finalizeDecumulation(years, acc.paths, acc.ruinYears, acc.withdrawalByYear, simCount, baseWithdrawal)
}

/**
 * Variante asynchrone non bloquante : les simulations sont découpées en
 * chunks, le thread principal respire entre chaque chunk (résultats
 * intermédiaires via onProgress). Permet 10 000 scénarios sans geler
 * l'interface (contrairement à runDecumulation, audit B2). Prend un signal
 * d'annulation (AbortController) et produit des résultats identiques à la
 * version synchrone.
 */
export async function runDecumulationAsync(
  inputs: SimulationInputs,
  startingCapital: number,
  runs = Math.min(inputs.mcRuns, 10_000),
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<DecumulationResult> {
  const simCount = Math.round(clamp(runs, 100, 10_000))
  const years = Math.max(1, inputs.retirementYears)
  const baseWithdrawal = computeBaseWithdrawal(inputs, startingCapital)
  const acc: DecumAccumulator = {
    paths: [],
    ruinYears: [],
    withdrawalByYear: Array.from({ length: years + 1 }, () => 0),
  }
  const breathe = () => new Promise<void>(resolve => setTimeout(resolve, 0))

  for (let sim = 0; sim < simCount; sim += DECUM_CHUNK_SIZE) {
    if (signal?.aborted) throw new DOMException("Décaissement annulé", "AbortError")
    const chunk = Math.min(DECUM_CHUNK_SIZE, simCount - sim)
    runDecumulationRange(inputs, startingCapital, baseWithdrawal, years, sim, chunk, acc)
    onProgress?.(Math.min(sim + chunk, simCount), simCount)
    // Laisse le temps à l'interface de peindre entre deux chunks
    await breathe()
  }

  return finalizeDecumulation(years, acc.paths, acc.ruinYears, acc.withdrawalByYear, simCount, baseWithdrawal)
}
