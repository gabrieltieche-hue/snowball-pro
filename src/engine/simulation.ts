import type { SimulationInputs, YearRow } from "../types"
import { mulberry32, gaussian } from "./rng"
import { monthlyRate } from "./math"
import { roundCent, clamp, computeTaxBreakdown } from "./taxes"
import { crisisAdjustment } from "./crisis"
import { getHistoricalDataset, INFLATION_SERIES } from "./historical"
import { sanitizeInputs } from "./validation"

// Mémoïsation de la date affichée : elle ne dépend que de (startYear, month)
// et est identique pour les milliers de simulations Monte-Carlo. Sans cache,
// chaque appel toLocaleDateString (ICU) dominait le coût des 10 000 scénarios
// (mesuré : ~30 ms/simulation en Node, ~130 s pour 10 000 runs dans le
// navigateur). Le cache reste borné (une entrée par année × runSimulation).
const dateCache = new Map<string, string>()

function annualReturnForYear(inputs: SimulationInputs, yearIndex: number): number {
  if (inputs.returnMode === "historical") {
    const dataset = getHistoricalDataset(inputs.historicalIndex)
    // Ancrage inversé : l'année 1 de la projection rejoue le rendement le plus
    // récent de l'indice (backtest "à partir d'aujourd'hui"), puis remonte dans le temps.
    const returns = dataset.years.map(y => y.return)
    return returns[returns.length - 1 - (yearIndex % returns.length)] ?? inputs.annualReturn
  }
  return inputs.annualReturn
}

/**
 * Variante Monte-Carlo : injecte une séquence de rendements annuels déjà
 * rééchantillonnée (bootstrap historique) au lieu d'utiliser la logique
 * interne de la simulation. C'est ce qui permet de rejouer les vrais
 * rendements passés dans les milliers de scénarios.
 */
function annualReturnOverrideForYear(returns: number[], yearIndex: number, fallback: number): number {
  if (!returns.length) return fallback
  return returns[yearIndex % returns.length] ?? fallback
}

function annualInflationForYear(inputs: SimulationInputs, yearIndex: number): number {
  if (inputs.inflationMode === "historical")
    return INFLATION_SERIES[yearIndex % INFLATION_SERIES.length] ?? inputs.inflation
  if (inputs.inflationMode === "dynamic") {
    const cycle = Math.sin((yearIndex / 7) * Math.PI * 2) * 0.006
    // La crise synthétique est inerte en mode historique (les krachs réels
    // sont déjà rejoués) : sa composante inflation (stagflation) ne doit pas
    // non plus s'appliquer, pour rester cohérent avec la désactivation des
    // rendements (audit B3).
    const crisisBoost =
      inputs.crisisEnabled &&
      inputs.returnMode !== "historical" &&
      inputs.crisisProfile === "stagflation" &&
      yearIndex + 1 >= inputs.crisisYear
        ? 0.035
        : 0
    return clamp(inputs.inflation + cycle + crisisBoost, -0.01, 0.12)
  }
  return inputs.inflation
}

function sampledMonthlyReturn(
  inputs: SimulationInputs,
  annualExpectedReturn: number,
  monthIndex: number,
  rng: () => number,
): number {
  if (inputs.returnMode !== "random") return monthlyRate(annualExpectedReturn)
  const crisis = crisisAdjustment(inputs, monthIndex)
  const sigma = clamp(inputs.volatility * crisis.volMultiplier, 0.001, 1.4)
  const zBase = gaussian(rng)
  const z = rng() < 0.08 ? zBase * 2.35 : zBase
  const drift = Math.log1p(clamp(annualExpectedReturn, -0.8, 1.6)) - 0.5 * sigma * sigma
  return Math.exp(drift / 12 + (sigma / Math.sqrt(12)) * z) - 1
}

function taxYearsHeld(inputs: SimulationInputs, projectionYear: number): number {
  // PEA : le taux d'imposition dépend de la détention ACTUELLE (curseur
  // « Années de détention du PEA ») : moins de 5 ans → PFU 30 %, au-delà →
  // 17,2 % de cotisations sociales seules. Avant le correctif, la durée de
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
  const rng = mulberry32(inputs.seed)
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
      date = new Date(startYear, month, 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      })
      dateCache.set(dateKey, date)
    }
    const grossGains = Math.max(0, capital - investedNom)
    const tax = computeTaxBreakdown(
      grossGains,
      inputs.envelope,
      taxYearsHeld(inputs, year),
      inputs.taxCouple,
      investedNom,
      { tmi: inputs.tmi, ctoTaxMode: inputs.ctoTaxMode },
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
      ? annualReturnOverrideForYear(annualReturnsOverride ?? [], yearIndex, inputs.annualReturn)
      : annualReturnForYear(inputs, yearIndex)
    const baseMarketReturn = sampledMonthlyReturn(inputs, annualReturn, month, rng)
    // En mode historique, les rendements réels rejoués contiennent DÉJÀ les
    // krachs : appliquer la crise synthétique par-dessus les compterait deux
    // fois (incohérent avec Monte Carlo et la Rente, qui la désactivent).
    const crisis =
      inputs.returnMode === "historical" ? { returnShock: 0, volMultiplier: 1 } : crisisAdjustment(inputs, month)
    const totalMarketReturn = (1 + baseMarketReturn) * (1 + crisis.returnShock) - 1
    // Plus de rendement de dividendes séparé : le MSCI World est capitalisant
    // (les dividendes sont réinvestis dans l'indice, rendement total).
    capital = roundCent(Math.max(0, capital * (1 + totalMarketReturn)))

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
