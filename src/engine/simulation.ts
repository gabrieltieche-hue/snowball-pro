import type { SimulationInputs, YearRow } from "../types"
import { monthlyRate } from "./math"
import { roundCent, clamp, computeTaxBreakdown } from "./taxes"
import { INFLATION_SERIES, MSCI_WORLD_AVG_RETURN } from "./historical"
import { sanitizeInputs } from "./validation"

// Mémoïsation de la date affichée : elle ne dépend que de (startYear, month)
// et est identique pour les milliers de simulations Monte-Carlo. Sans cache,
// chaque appel toLocaleDateString (ICU) dominait le coût des 10 000 scénarios
// (mesuré : ~30 ms/simulation en Node, ~130 s pour 10 000 runs dans le
// navigateur). Le cache reste borné (une entrée par année × runSimulation).
const dateCache = new Map<string, string>()

/**
 * Rendement annuel de l'année de projection : le Simulateur applique le
 * rendement MOYEN de référence (≈ 10,07 %/an brut, moyenne MSCI World) chaque
 * année — la courbe est LISSÉE, identique d'une année à l'autre (demande
 * utilisateur : « un truc linéaire, pas une courbe aléatoire »). Monte Carlo
 * et la Rente, eux, continuent de rééchantillonner l'historique réel (leurs
 * krachs et bull markets rejoués) : seule la figure de référence du
 * Simulateur devient constante. Repli défensif : cette même moyenne si jamais
 * le dataset était vide.
 */
function returnForYear(_inputs: SimulationInputs, _yearIndex: number): number {
  return MSCI_WORLD_AVG_RETURN
}

/**
 * Variante Monte-Carlo : injecte une séquence de rendements annuels déjà
 * rééchantillonnée (bootstrap historique) au lieu d'utiliser la logique
 * interne de la simulation. C'est ce qui permet de rejouer les vrais
 * rendements passés dans les milliers de scénarios.
 */
function overrideReturnForYear(returns: number[], yearIndex: number, fallback: number): number {
  if (!returns.length) return fallback
  return returns[yearIndex % returns.length] ?? fallback
}

function annualInflationForYear(inputs: SimulationInputs, yearIndex: number): number {
  if (inputs.inflationMode === "historical")
    return INFLATION_SERIES[yearIndex % INFLATION_SERIES.length] ?? inputs.inflation
  if (inputs.inflationMode === "dynamic") {
    const cycle = Math.sin((yearIndex / 7) * Math.PI * 2) * 0.006
    return clamp(inputs.inflation + cycle, -0.01, 0.12)
  }
  return inputs.inflation
}

function taxYearsHeld(inputs: SimulationInputs, projectionYear: number): number {
  // PEA : le taux d'imposition dépend de la détention ACTUELLE (curseur
  // « Années de détention du PEA ») : moins de 5 ans → PFU (taux de l'année
  // fiscale, taxRules.ts), au-delà → prélèvements sociaux seuls. Avant le
  // correctif, la durée de
  // projection était ajoutée (peaYearsHeld + année) : dès qu'elle dépassait
  // 5 ans, le taux réduit s'appliquait même avec 0 an détenu, et le curseur
  // ne changeait aucun chiffre. L'AV conserve, elle, la détention cumulée
  // (abattement annuel de 4 600 €/an).
  if (inputs.envelope === "pea") return inputs.peaYearsHeld
  if (inputs.envelope === "av") return inputs.avYearsHeld + projectionYear
  return projectionYear
}

export function runSimulation(rawInputs: SimulationInputs, annualReturnsOverride?: number[]): YearRow[] {
  const inputs = sanitizeInputs(rawInputs)
  const hasOverride = Boolean(annualReturnsOverride?.length)
  const totalMonths = Math.max(0, Math.round(inputs.duration * 12))
  const rows: YearRow[] = []
  const startYear = new Date().getFullYear()
  const peaCap = inputs.envelope === "pea" ? (inputs.taxCouple ? 300_000 : 150_000) : Infinity

  let capital = roundCent(Math.max(0, inputs.capitalInitial))
  let investedNom = roundCent(Math.max(0, inputs.capitalInitial))
  let monthlyPayment = roundCent(Math.max(0, inputs.monthlyPayment))
  let inflationIndex = 1
  let feesLost = 0
  let annualFees = 0
  let annualContribution = 0
  let peak = Math.max(capital, 0.01)
  let previousCapitalExContribution = capital
  let previousTaxNetExContribution = capital

  const pushRow = (month: number) => {
    const year = Math.round(month / 12)
    const dateKey = `${startYear}-${month}`
    let date = dateCache.get(dateKey)
    if (date === undefined) {
      // CORRECTIF audit v5.6.2 : month est le mois CUMULÉ depuis le départ
      // (12 = fin de la 1re année). new Date(startYear, 12, 1) rendait
      // « janv. 2027 » pour la fin de l'année 1 — un décalage d'un mois dans
      // le CSV et le calendrier des flux (déc. 2026 attendu).
      date = new Date(startYear, Math.max(0, month - 1), 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      })
      dateCache.set(dateKey, date)
    }
    // En cas de perte, les gains sont nuls mais le capital PER correspondant
    // aux versements déductibles reste imposable à la sortie. Pour les autres
    // enveloppes, seule la plus-value positive constitue la base fiscale.
    const grossGains = Math.max(0, capital - investedNom)
    const tax = computeTaxBreakdown(
      grossGains,
      inputs.envelope,
      taxYearsHeld(inputs, year),
      inputs.taxCouple,
      investedNom,
      { tmi: inputs.tmi, ctoTaxMode: inputs.ctoTaxMode, taxYear: inputs.taxYear },
    )
    const exitTax = Math.max(0, tax.totalTax)
    const taxNet = Math.max(0, capital - exitTax)
    peak = Math.max(peak, capital)
    const drawdownPct = peak > 0 ? (capital - peak) / peak : 0
    // Une perte annuelle ne peut pas dépasser -100 % du capital : si des
    // versements abondent un capital anéanti, la formule brute donnerait des
    // taux absurdes (-515 %) — on borne à -1 (ratio).
    const yearlyReturn =
      month === 0 || previousCapitalExContribution <= 0
        ? 0
        : Math.max(-1, (capital - annualContribution) / previousCapitalExContribution - 1)
    // Rendement net de l'année en % : croissance de la valeur nette d'impôts
    // (taxNet) hors versements, rapportée à la valeur nette de fin d'année
    // précédente. Il s'agit d'un taux (0,085 = 8,5 %), pas d'un montant.
    const netYield =
      month === 0 || previousTaxNetExContribution <= 0
        ? 0
        : Math.max(-1, (taxNet - annualContribution) / previousTaxNetExContribution - 1)
    rows.push({
      year,
      month,
      date,
      nominal: roundCent(capital),
      real: roundCent(capital / inflationIndex),
      investedNom: roundCent(investedNom),
      interestsNom: roundCent(Math.max(0, capital - investedNom)),
      grossGains: roundCent(grossGains),
      netGains: tax.netGains,
      tax: tax.totalTax,
      socialCharges: tax.socialCharges,
      incomeTax: tax.incomeTax,
      taxNet: roundCent(taxNet),
      fees: roundCent(annualFees),
      feesLost: roundCent(feesLost),
      annualContribution: roundCent(annualContribution),
      yearlyReturn: roundCent(yearlyReturn * 100) / 100,
      // Même unité que yearlyReturn (ratio, ex : 0,08 = 8 %) : netYield et
      // yearlyReturn doivent être comparables (tests + cohérence moteur).
      netYield: roundCent(netYield * 100) / 100,
      drawdownPct: roundCent(drawdownPct * 10000) / 100,
      investedReal: roundCent(investedNom / inflationIndex),
      interestsReal: roundCent(Math.max(0, capital / inflationIndex - investedNom / inflationIndex)),
    })
    previousCapitalExContribution = capital
    previousTaxNetExContribution = taxNet
    annualFees = 0
    annualContribution = 0
  }

  pushRow(0)

  for (let month = 1; month <= totalMonths; month += 1) {
    const yearIndex = Math.floor((month - 1) / 12)
    const monthInYear = (month - 1) % 12
    if (monthInYear === 0 && month > 1) {
      monthlyPayment = roundCent(monthlyPayment * (1 + inputs.indexation))
    }

    const annualReturn = hasOverride
      ? overrideReturnForYear(annualReturnsOverride ?? [], yearIndex, returnForYear(inputs, yearIndex))
      : returnForYear(inputs, yearIndex)
    // Rendement mensuel composé du rendement annuel appliqué (moyenne de
    // référence pour le Simulateur ; séquence rééchantillonnée quand Monte
    // Carlo fournit un override). Plus de rendement de dividendes séparé (le
    // MSCI World est capitalisant) ni de crise synthétique (les krachs réels
    // sont déjà dans la série rejouée par Monte Carlo / la Rente).
    const baseMarketReturn = monthlyRate(annualReturn)
    capital = roundCent(Math.max(0, capital * (1 + baseMarketReturn)))

    const aumFeeRate = monthlyRate(
      Math.max(0, inputs.etfFees + inputs.managementFees + (inputs.envelope === "av" ? inputs.insuranceFees : 0)),
    )
    const aumFee = roundCent(Math.max(0, capital * aumFeeRate))
    capital = roundCent(Math.max(0, capital - aumFee))
    feesLost = roundCent(feesLost + aumFee)
    annualFees = roundCent(annualFees + aumFee)

    const allowedPayment = Math.max(0, Math.min(monthlyPayment, peaCap - investedNom))
    const brokerFee = roundCent(allowedPayment * Math.max(0, inputs.brokerageFees))
    // PER : l'économie d'impôt à l'entrée (TMI × versement) est réinvestie
    // dans le plan. Elle n'entre pas dans investedNom (ce n'est pas un
    // versement personnel) mais compose, puis sera imposée à la sortie.
    const perTaxSaving = inputs.envelope === "per" ? roundCent(allowedPayment * inputs.tmi) : 0
    capital = roundCent(Math.max(0, capital + allowedPayment + perTaxSaving - brokerFee))
    investedNom = roundCent(investedNom + allowedPayment)
    annualContribution = roundCent(annualContribution + allowedPayment)
    feesLost = roundCent(feesLost + brokerFee)
    annualFees = roundCent(annualFees + brokerFee)

    const annualInflation = annualInflationForYear(inputs, yearIndex)
    inflationIndex *= 1 + monthlyRate(annualInflation)

    if (month % 12 === 0) pushRow(month)
  }

  return rows
}
