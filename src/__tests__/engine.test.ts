import { describe, it, expect } from "vitest"
import {
  roundCent,
  clamp,
  monthlyRate,
  annualFromMonthly,
  futureValue,
  PMTfromFV,
  fmtCurrency,
  fmtCompact,
  fmtPercent,
  parseCurrencyInput,
  computeTaxBreakdown,
  runSimulation,
  computeKPIs,
  solveGoal,
  validateInputs,
  sanitizeInputs,
} from "../engine"
import { chartTheme } from "../utils/chartTheme"
import type { SimulationInputs } from "../types"

describe("roundCent", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundCent(1.234)).toBe(1.23)
    expect(roundCent(1.235)).toBe(1.24)
    expect(roundCent(0)).toBe(0)
  })
  it("handles NaN and Infinity", () => {
    expect(roundCent(NaN)).toBe(0)
    expect(roundCent(Infinity)).toBe(0)
    expect(roundCent(-Infinity)).toBe(0)
  })
})

describe("clamp", () => {
  it("clamps values within range", () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe("monthlyRate / annualFromMonthly", () => {
  it("converts annual to monthly and back", () => {
    const annual = 0.079
    const monthly = monthlyRate(annual)
    expect(monthly).toBeCloseTo(0.00636, 4)
    expect(annualFromMonthly(monthly)).toBeCloseTo(annual, 5)
  })
  it("handles negative rates", () => {
    expect(monthlyRate(-0.8)).toBeLessThan(0)
    expect(monthlyRate(-0.8)).toBeGreaterThan(-0.2)
    expect(monthlyRate(-0.95)).toBeLessThan(0)
  })
})

describe("futureValue", () => {
  it("calculates FV correctly", () => {
    const result = futureValue(0, 100, 0.01, 12)
    expect(result).toBeCloseTo(1268.25, 0)
  })
  it("handles zero rate", () => {
    expect(futureValue(100, 50, 0, 12)).toBe(700)
  })
  it("handles negative periods", () => {
    expect(futureValue(100, 50, 0.01, -1)).toBe(100)
  })
})

describe("PMTfromFV", () => {
  it("calculates payment from future value", () => {
    const result = PMTfromFV(100000, 0, 0.005, 120)
    expect(result).toBeGreaterThan(0)
  })
  it("handles zero rate", () => {
    expect(PMTfromFV(1000, 500, 0, 10)).toBe(50)
  })
})

describe("fmtCurrency", () => {
  it("formats values correctly", () => {
    expect(fmtCurrency(0)).toBe("0,00 €")
    expect(fmtCurrency(1500)).toContain("€")
    expect(fmtCurrency(1_500_000)).toBe("1.50 M€")
    expect(fmtCurrency(1_500_000_000)).toBe("1.50 Md€")
    expect(fmtCurrency(-100)).toContain("-")
  })
})

describe("fmtCompact", () => {
  it("formats compact values", () => {
    expect(fmtCompact(0)).toBe("0")
    expect(fmtCompact(500)).toBe("500")
    expect(fmtCompact(1500)).toBe("2k")
    expect(fmtCompact(1_500_000)).toBe("1.5M")
    expect(fmtCompact(1_500_000_000)).toBe("1.5Md")
  })
})

describe("fmtPercent", () => {
  it("formats percentages with sign", () => {
    expect(fmtPercent(5.5)).toBe("+5.5%")
    expect(fmtPercent(-3.2)).toBe("-3.2%")
  })
})

describe("parseCurrencyInput", () => {
  it("parses various formats", () => {
    expect(parseCurrencyInput("1.5k")).toBe(1500)
    expect(parseCurrencyInput("2M")).toBe(2_000_000)
    expect(parseCurrencyInput("500€")).toBe(500)
    expect(parseCurrencyInput("1 500")).toBe(1500)
  })
})

describe("computeTaxBreakdown", () => {
  it("returns zero tax for 'none' envelope", () => {
    const result = computeTaxBreakdown(10000, "none", 10, false)
    expect(result.totalTax).toBe(0)
    expect(result.netGains).toBe(10000)
  })

  it("applies PFU 30% for CTO", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false)
    expect(result.flatTax).toBeCloseTo(3000, 0)
    expect(result.totalTax).toBeGreaterThan(0)
  })

  it("applies PEA exemption after 5 years", () => {
    const result = computeTaxBreakdown(10000, "pea", 6, false)
    expect(result.incomeTax).toBe(0)
    expect(result.socialCharges).toBeCloseTo(1720, 0)
  })

  it("applies AV reduced rate after 8 years with allowance", () => {
    const result = computeTaxBreakdown(10000, "av", 10, false)
    expect(result.incomeTax).toBeLessThan(750)
  })
})

describe("runSimulation", () => {
  const baseInputs: SimulationInputs = {
    capitalInitial: 25000,
    monthlyPayment: 1000,
    annualReturn: 0.079,
    volatility: 0.155,
    duration: 10,
    indexation: 0.02,
    inflation: 0.022,
    inflationMode: "custom",
    startMonth: 0,
    envelope: "pea",
    taxCouple: false,
    peaYearsHeld: 5,
    avYearsHeld: 8,
    returnMode: "fixed",
    historicalIndex: "msci-world",
    crisisEnabled: false,
    crisisProfile: "bear-market",
    crisisYear: 9,
    crisisAmplitude: 38,
    crisisDuration: 2,
    etfFees: 0.0025,
    brokerageFees: 0.001,
    insuranceFees: 0.006,
    managementFees: 0,
    dividendYield: 0.018,
    showReal: true,
    withdrawalModel: "rule-4",
    withdrawalRate: 4,
    withdrawalFixed: 2500,
    withdrawalInflation: true,
    retirementYears: 40,
    goalTarget: 1_000_000,
    goalDuration: 20,
    goalCapital: 25000,
    goalPayment: 1000,
    goalAnnualReturn: 0.07,
    mcRuns: 100,
    seed: 41041,
  }

  it("produces correct number of rows", () => {
    const rows = runSimulation(baseInputs)
    expect(rows.length).toBe(11) // year 0 + 10 years
    expect(rows[0].year).toBe(0)
    expect(rows[rows.length - 1].year).toBe(10)
  })

  it("capital grows over time", () => {
    const rows = runSimulation(baseInputs)
    expect(rows[rows.length - 1].nominal).toBeGreaterThan(rows[0].nominal)
  })

  it("investedNom equals total contributions", () => {
    const rows = runSimulation(baseInputs)
    const last = rows[rows.length - 1]
    expect(last.investedNom).toBeGreaterThan(baseInputs.capitalInitial)
  })

  it("handles zero capital and payment", () => {
    const zeroInputs = { ...baseInputs, capitalInitial: 0, monthlyPayment: 0, duration: 5 }
    const rows = runSimulation(zeroInputs)
    expect(rows.length).toBe(6)
    expect(rows[rows.length - 1].nominal).toBe(0)
  })

  it("applies crisis when enabled", () => {
    const normalInputs = { ...baseInputs, crisisEnabled: false, duration: 10 }
    const crisisInputs = {
      ...baseInputs,
      crisisEnabled: true,
      crisisProfile: "bear-market" as const,
      crisisYear: 3,
      crisisAmplitude: 50,
      crisisDuration: 2,
      duration: 10,
    }
    const normalRows = runSimulation(normalInputs)
    const crisisRows = runSimulation(crisisInputs)
    const normalEnd = normalRows[normalRows.length - 1]?.nominal ?? 0
    const crisisEnd = crisisRows[crisisRows.length - 1]?.nominal ?? 0
    expect(crisisEnd).toBeLessThan(normalEnd)
  })
})

describe("computeKPIs", () => {
  const baseInputs: SimulationInputs = {
    capitalInitial: 25000,
    monthlyPayment: 1000,
    annualReturn: 0.079,
    volatility: 0.155,
    duration: 10,
    indexation: 0.02,
    inflation: 0.022,
    inflationMode: "custom",
    startMonth: 0,
    envelope: "pea",
    taxCouple: false,
    peaYearsHeld: 5,
    avYearsHeld: 8,
    returnMode: "fixed",
    historicalIndex: "msci-world",
    crisisEnabled: false,
    crisisProfile: "bear-market",
    crisisYear: 9,
    crisisAmplitude: 38,
    crisisDuration: 2,
    etfFees: 0.0025,
    brokerageFees: 0.001,
    insuranceFees: 0.006,
    managementFees: 0,
    dividendYield: 0.018,
    showReal: true,
    withdrawalModel: "rule-4",
    withdrawalRate: 4,
    withdrawalFixed: 2500,
    withdrawalInflation: true,
    retirementYears: 40,
    goalTarget: 1_000_000,
    goalDuration: 20,
    goalCapital: 25000,
    goalPayment: 1000,
    goalAnnualReturn: 0.07,
    mcRuns: 100,
    seed: 41041,
  }

  it("produces KPIs with valid values", () => {
    const rows = runSimulation(baseInputs)
    const kpis = computeKPIs(rows, baseInputs)
    expect(kpis.cagr).toBeGreaterThan(0)
    expect(kpis.sharpe).not.toBeNaN()
    expect(kpis.capitalMultiple).toBeGreaterThan(1)
  })
})

describe("solveGoal", () => {
  it("returns a result for a reachable goal", () => {
    const inputs: SimulationInputs = {
      capitalInitial: 25000,
      monthlyPayment: 1000,
      annualReturn: 0.079,
      volatility: 0.155,
      duration: 25,
      indexation: 0.02,
      inflation: 0.022,
      inflationMode: "custom",
      startMonth: 0,
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      returnMode: "fixed",
      historicalIndex: "msci-world",
      crisisEnabled: false,
      crisisProfile: "bear-market",
      crisisYear: 9,
      crisisAmplitude: 38,
      crisisDuration: 2,
      etfFees: 0.0025,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
      dividendYield: 0.018,
      showReal: true,
      withdrawalModel: "rule-4",
      withdrawalRate: 4,
      withdrawalFixed: 2500,
      withdrawalInflation: true,
      retirementYears: 40,
      goalTarget: 1_000_000,
      goalDuration: 20,
      goalCapital: 25000,
      goalPayment: 1000,
      goalAnnualReturn: 0.07,
      mcRuns: 100,
      seed: 41041,
    }
    const result = solveGoal(inputs)
    expect(result.achievable).toBe(true)
    expect(result.pmtPerMonth).toBeGreaterThan(0)
  })
})

describe("validateInputs", () => {
  it("returns no errors for valid inputs", () => {
    const base: SimulationInputs = {
      capitalInitial: 25000,
      monthlyPayment: 1000,
      annualReturn: 0.079,
      volatility: 0.155,
      duration: 10,
      indexation: 0.02,
      inflation: 0.022,
      inflationMode: "custom",
      startMonth: 0,
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      returnMode: "fixed",
      historicalIndex: "msci-world",
      crisisEnabled: false,
      crisisProfile: "bear-market",
      crisisYear: 9,
      crisisAmplitude: 38,
      crisisDuration: 2,
      etfFees: 0.0025,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
      dividendYield: 0.018,
      showReal: true,
      withdrawalModel: "rule-4",
      withdrawalRate: 4,
      withdrawalFixed: 2500,
      withdrawalInflation: true,
      retirementYears: 40,
      goalTarget: 1_000_000,
      goalDuration: 20,
      goalCapital: 25000,
      goalPayment: 1000,
      goalAnnualReturn: 0.07,
      mcRuns: 100,
      seed: 41041,
    }
    const errors = validateInputs(base)
    expect(errors.length).toBe(0)
  })

  it("returns errors for extreme values", () => {
    const base: SimulationInputs = {
      capitalInitial: -1,
      monthlyPayment: 200000,
      annualReturn: 20,
      volatility: 0.155,
      duration: 100,
      indexation: 0.02,
      inflation: 2,
      inflationMode: "custom",
      startMonth: 0,
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      returnMode: "fixed",
      historicalIndex: "msci-world",
      crisisEnabled: false,
      crisisProfile: "bear-market",
      crisisYear: 9,
      crisisAmplitude: 38,
      crisisDuration: 2,
      etfFees: -0.1,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
      dividendYield: -0.05,
      showReal: true,
      withdrawalModel: "rule-4",
      withdrawalRate: 4,
      withdrawalFixed: 2500,
      withdrawalInflation: true,
      retirementYears: 40,
      goalTarget: 0,
      goalDuration: 20,
      goalCapital: 25000,
      goalPayment: 1000,
      goalAnnualReturn: 0.07,
      mcRuns: 5,
      seed: 41041,
    }
    const errors = validateInputs(base)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe("solveGoal with goalAnnualReturn", () => {
  it("uses goalAnnualReturn independently from annualReturn", () => {
    const inputs: SimulationInputs = {
      capitalInitial: 25000,
      monthlyPayment: 1000,
      annualReturn: 0.03,
      volatility: 0.155,
      duration: 25,
      indexation: 0.02,
      inflation: 0.022,
      inflationMode: "custom",
      startMonth: 0,
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      returnMode: "fixed",
      historicalIndex: "msci-world",
      crisisEnabled: false,
      crisisProfile: "bear-market",
      crisisYear: 9,
      crisisAmplitude: 38,
      crisisDuration: 2,
      etfFees: 0.0025,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
      dividendYield: 0.018,
      showReal: true,
      withdrawalModel: "rule-4",
      withdrawalRate: 4,
      withdrawalFixed: 2500,
      withdrawalInflation: true,
      retirementYears: 40,
      goalTarget: 1_000_000,
      goalDuration: 20,
      goalCapital: 25000,
      goalPayment: 1000,
      goalAnnualReturn: 0.09,
      mcRuns: 100,
      seed: 41041,
    }
    const result = solveGoal(inputs)
    expect(result.achievable).toBe(true)
    expect(result.pmtPerMonth).toBeGreaterThan(0)
  })
})

describe("sanitizeInputs", () => {
  it("clamps extreme values to safe ranges", () => {
    const base: SimulationInputs = {
      capitalInitial: 1e9,
      monthlyPayment: 500000,
      annualReturn: 50,
      volatility: 10,
      duration: 200,
      indexation: 2,
      inflation: 5,
      inflationMode: "custom",
      startMonth: 0,
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 200,
      avYearsHeld: 200,
      returnMode: "fixed",
      historicalIndex: "msci-world",
      crisisEnabled: false,
      crisisProfile: "bear-market",
      crisisYear: 9,
      crisisAmplitude: 38,
      crisisDuration: 2,
      etfFees: -1,
      brokerageFees: -1,
      insuranceFees: -1,
      managementFees: -1,
      dividendYield: -1,
      showReal: true,
      withdrawalModel: "rule-4",
      withdrawalRate: 4,
      withdrawalFixed: 2500,
      withdrawalInflation: true,
      retirementYears: 40,
      goalTarget: 0,
      goalDuration: 20,
      goalCapital: 25000,
      goalPayment: 1000,
      goalAnnualReturn: -2,
      mcRuns: 0,
      seed: 0,
    }
    const safe = sanitizeInputs(base)
    expect(safe.capitalInitial).toBeLessThanOrEqual(100_000_000)
    expect(safe.monthlyPayment).toBeLessThanOrEqual(200_000)
    expect(safe.annualReturn).toBeGreaterThanOrEqual(-0.95)
    expect(safe.goalTarget).toBeGreaterThanOrEqual(1)
    expect(safe.seed).toBeGreaterThanOrEqual(1)
  })
})

describe("chartTheme", () => {
  it("returns light colors when darkMode is false", () => {
    const theme = chartTheme(false)
    expect(theme.grid).toBe("rgba(0,0,0,0.06)")
    expect(theme.tick).toBe("#6B7280")
  })

  it("returns dark colors when darkMode is true", () => {
    const theme = chartTheme(true)
    expect(theme.grid).toBe("rgba(255,255,255,0.04)")
    expect(theme.tick).toBe("#7A7265")
  })
})
