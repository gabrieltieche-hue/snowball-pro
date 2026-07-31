import type { SimulationInputs, YearRow } from "../types"
import { mulberry32, gaussian } from "./rng"
import { monthlyRate } from "./math"
import { roundCent, clamp, computeTaxBreakdown, dividendTaxRate } from "./taxes"
import { crisisAdjustment } from "./crisis"
import { getHistoricalDataset, INFLATION_SERIES } from "./historical"
import { sanitizeInputs } from "./validation"

function annualReturnForYear(inputs: SimulationInputs, yearIndex: number): number {
  if (inputs.returnMode === "historical") {
    const dataset = getHistoricalDataset(inputs.historicalIndex)
    return dataset.years[yearIndex % dataset.years.length]?.return ?? inputs.annualReturn
  }
  return inputs.annualReturn
}

function annualInflationForYear(inputs: SimulationInputs, yearIndex: number): number {
  if (inputs.inflationMode === "historical")
    return INFLATION_SERIES[yearIndex % INFLATION_SERIES.length] ?? inputs.inflation
  if (inputs.inflationMode === "dynamic") {
    const cycle = Math.sin((yearIndex / 7) * Math.PI * 2) * 0.006
    const crisisBoost =
      inputs.crisisEnabled && inputs.crisisProfile === "stagflation" && yearIndex + 1 >= inputs.crisisYear ? 0.035 : 0
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
  if (inputs.envelope === "pea") return inputs.peaYearsHeld + projectionYear
  if (inputs.envelope === "av") return inputs.avYearsHeld + projectionYear
  return projectionYear
}

export function runSimulation(rawInputs: SimulationInputs): YearRow[] {
  const inputs = sanitizeInputs(rawInputs)
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
  let dividendsGross = 0
  let dividendsNet = 0
  let dividendTaxPaid = 0
  let peak = Math.max(capital, 0.01)
  let previousCapitalExContribution = capital

  const pushRow = (month: number) => {
    const year = Math.round(month / 12)
    const date = new Date(startYear, inputs.startMonth + month, 1).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    })
    const grossGains = Math.max(0, capital - investedNom)
    const tax = computeTaxBreakdown(
      grossGains,
      inputs.envelope,
      taxYearsHeld(inputs, year),
      inputs.taxCouple,
      dividendTaxPaid,
      investedNom,
    )
    const exitTax = Math.max(0, tax.totalTax - tax.dividendTax)
    const taxNet = Math.max(0, capital - exitTax)
    peak = Math.max(peak, capital)
    const drawdownPct = peak > 0 ? (capital - peak) / peak : 0
    const yearlyReturn =
      month === 0 || previousCapitalExContribution <= 0
        ? 0
        : (capital - annualContribution) / previousCapitalExContribution - 1
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
      dividendTax: tax.dividendTax,
      taxNet: roundCent(taxNet),
      fees: roundCent(annualFees),
      feesLost: roundCent(feesLost),
      dividendsGross: roundCent(dividendsGross),
      dividendsNet: roundCent(dividendsNet),
      annualContribution: roundCent(annualContribution),
      yearlyReturn: roundCent(yearlyReturn * 100) / 100,
      netYield: roundCent(tax.netGains),
      drawdownPct: roundCent(drawdownPct * 10000) / 100,
      investedReal: roundCent(investedNom / inflationIndex),
      interestsReal: roundCent(Math.max(0, capital / inflationIndex - investedNom / inflationIndex)),
    })
    previousCapitalExContribution = capital
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

    const annualReturn = annualReturnForYear(inputs, yearIndex)
    const baseMarketReturn = sampledMonthlyReturn(inputs, annualReturn, month, rng)
    const crisis = crisisAdjustment(inputs, month)
    const totalMarketReturn = (1 + baseMarketReturn) * (1 + crisis.returnShock) - 1
    const monthlyDividendRate = Math.max(0, monthlyRate(inputs.dividendYield))
    const priceReturn = (1 + totalMarketReturn) / (1 + monthlyDividendRate) - 1

    capital = roundCent(Math.max(0, capital * (1 + priceReturn)))
    const grossDividend = roundCent(Math.max(0, capital * monthlyDividendRate))
    const divTax = roundCent(grossDividend * dividendTaxRate(inputs.envelope))
    capital = roundCent(Math.max(0, capital + grossDividend - divTax))
    dividendsGross = roundCent(dividendsGross + grossDividend)
    dividendsNet = roundCent(dividendsNet + grossDividend - divTax)
    dividendTaxPaid = roundCent(dividendTaxPaid + divTax)

    const aumFeeRate = monthlyRate(
      Math.max(0, inputs.etfFees + inputs.managementFees + (inputs.envelope === "av" ? inputs.insuranceFees : 0)),
    )
    const aumFee = roundCent(Math.max(0, capital * aumFeeRate))
    capital = roundCent(Math.max(0, capital - aumFee))
    feesLost = roundCent(feesLost + aumFee)
    annualFees = roundCent(annualFees + aumFee)

    const allowedPayment = Math.max(0, Math.min(monthlyPayment, peaCap - investedNom))
    const brokerFee = roundCent(allowedPayment * Math.max(0, inputs.brokerageFees))
    capital = roundCent(Math.max(0, capital + allowedPayment - brokerFee))
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
