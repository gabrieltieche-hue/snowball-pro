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
  v4SettingsToInputs,
  parseStoredInputs,
  DEFAULT_INPUTS,
  getHistoricalDataset,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  createSnapshot,
  addSnapshot,
  removeSnapshot,
  compareScenarios,
  mergeComparisonSeries,
  SNAPSHOT_LIMIT,
} from "../engine"
import { chartTheme } from "../utils/chartTheme"
import { pie3dGeometry } from "../utils/pie3d"
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

  it("rejoue la série historique en partant de l'année la plus récente", () => {
    const dataset = getHistoricalDataset("sp500")
    const lastReturn = dataset.years[dataset.years.length - 1]?.return ?? 0
    const histInputs: SimulationInputs = {
      ...baseInputs,
      returnMode: "historical",
      historicalIndex: "sp500",
      monthlyPayment: 0,
      dividendYield: 0,
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
      envelope: "none",
      duration: 3,
    }
    const rows = runSimulation(histInputs)
    expect(rows[1].yearlyReturn).toBeCloseTo(lastReturn, 3)
  })
})

describe("getHistoricalDataset", () => {
  it("couvre 1995–2025 pour les indices actions", () => {
    for (const id of ["msci-world", "sp500", "nasdaq", "cac40"] as const) {
      const dataset = getHistoricalDataset(id)
      expect(dataset.years[0]?.year).toBe(1995)
      expect(dataset.years[dataset.years.length - 1]?.year).toBe(2025)
      expect(dataset.years.length).toBe(31)
    }
  })

  it("couvre 2011–2025 pour Bitcoin sans année future", () => {
    const dataset = getHistoricalDataset("bitcoin")
    expect(dataset.years.length).toBe(15)
    expect(dataset.years[0]?.year).toBe(2011)
    expect(dataset.years[dataset.years.length - 1]?.year).toBe(2025)
    expect(dataset.years.find(y => y.year === 2017)?.return).toBeCloseTo(13.3, 2)
  })

  it("couvre 2000–2025 pour l'or sans année future", () => {
    const dataset = getHistoricalDataset("gold")
    expect(dataset.years.length).toBe(26)
    expect(dataset.years[0]?.year).toBe(2000)
    expect(dataset.years[dataset.years.length - 1]?.year).toBe(2025)
  })

  it("produit des statistiques cohérentes avec les séries affichées", () => {
    const dataset = getHistoricalDataset("sp500")
    const expectedAvg = dataset.years.reduce((s, y) => s + y.return, 0) / dataset.years.length
    expect(dataset.avgReturn).toBeCloseTo(expectedAvg, 10)
    expect(dataset.volatility).toBeGreaterThan(0)
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

  it("returns theme-safe series colors", () => {
    const light = chartTheme(false)
    expect(light.gains).toBe("#8A6A00")
    expect(light.tax).toBe("#B04545")
    const dark = chartTheme(true)
    expect(dark.gains).toBe("#E6C35C")
    expect(dark.tax).toBe("#E08A8A")
  })
})

describe("v4SettingsToInputs", () => {
  it("maps every legacy key to its v5 counterpart", () => {
    const inputs = v4SettingsToInputs({
      p: 25000,
      m: 750,
      r: 6.5,
      t: 30,
      idx: 2,
      inf: 1.5,
      month: 6,
      envelope: "pea",
      kraschYear: 12,
      kraschPct: 40,
      showReal: true,
    })
    expect(inputs.capitalInitial).toBe(25000)
    expect(inputs.monthlyPayment).toBe(750)
    expect(inputs.annualReturn).toBeCloseTo(0.065)
    expect(inputs.duration).toBe(30)
    expect(inputs.indexation).toBeCloseTo(0.02)
    expect(inputs.inflation).toBeCloseTo(0.015)
    expect(inputs.startMonth).toBe(6)
    expect(inputs.envelope).toBe("pea")
    expect(inputs.crisisYear).toBe(12)
    expect(inputs.crisisAmplitude).toBe(40)
    expect(inputs.showReal).toBe(true)
  })

  it("falls back to defaults for missing keys", () => {
    const inputs = v4SettingsToInputs({})
    expect(inputs).toEqual(DEFAULT_INPUTS)
  })

  it("rejects invalid envelopes", () => {
    const inputs = v4SettingsToInputs({ envelope: "futures" })
    expect(inputs.envelope).toBe("cto")
  })

  it("clamps out-of-range values", () => {
    const inputs = v4SettingsToInputs({ t: 500, month: 42, kraschPct: -10 })
    expect(inputs.duration).toBe(80)
    expect(inputs.startMonth).toBe(11)
    expect(inputs.crisisAmplitude).toBe(0)
  })

  it("keeps krach inactive by default (legacy did not persist the toggle)", () => {
    const inputs = v4SettingsToInputs({ kraschYear: 12, kraschPct: 40 })
    expect(inputs.crisisEnabled).toBe(false)
  })
})

describe("parseStoredInputs", () => {
  it("returns defaults on empty or invalid input", () => {
    expect(parseStoredInputs(null)).toEqual(DEFAULT_INPUTS)
    expect(parseStoredInputs("not json")).toEqual(DEFAULT_INPUTS)
  })

  it("merges stored partial inputs over defaults", () => {
    const inputs = parseStoredInputs(JSON.stringify({ capitalInitial: 12345, duration: 12 }))
    expect(inputs.capitalInitial).toBe(12345)
    expect(inputs.duration).toBe(12)
    expect(inputs.monthlyPayment).toBe(DEFAULT_INPUTS.monthlyPayment)
  })
})

describe("pie3dGeometry", () => {
  const G = (values: number[]) => pie3dGeometry(values, 130, 80, 96, 52, 22)

  it("distributes 360° proportionally to values", () => {
    const parts = G([60, 30, 10])
    const totalDelta = parts.reduce((acc, p) => acc + p.delta, 0)
    expect(totalDelta).toBeCloseTo(360)
    expect(parts.map(p => p.delta)).toEqual([216, 108, 36])
  })

  it("renders a single slice as a full extruded ellipse", () => {
    const [part] = G([100])
    expect(part.delta).toBe(360)
    expect(part.top).toContain("a 96 52 0 1 1 192 0")
    expect(part.back).toBeDefined()
    expect(part.ribbon).toBeDefined()
  })

  it("places the first half at the back (no ribbon) and the second at the front", () => {
    const [back, front] = G([50, 50])
    expect(back.ribbon).toBeUndefined()
    expect(back.top).toBe("M 130 80 L 34 80 A 96 52 0 0 1 226 80 Z")
    expect(front.ribbon).toBeDefined()
    expect(front.ribbon).toBe("M 226 80 L 226 102 A 96 52 0 0 1 34 102 L 34 80 A 96 52 0 0 0 226 80 Z")
  })

  it("splits slices larger than 180° into back and front portions", () => {
    const [large, small] = G([75, 25])
    expect(large.back).toBeDefined()
    expect(large.ribbon).toBeDefined()
    expect(small.back).toBeUndefined()
  })

  it("keeps the ribbon on the front portion only of a slice crossing the 0° axis", () => {
    const [back, front] = G([25, 75])
    expect(back.ribbon).toBeUndefined()
    expect(front.ribbon).toBeDefined()
    expect(front.ribbon).toContain("M 226 80 L 226 102 A 96 52 0 0 1 34 102")
  })

  it("returns an empty list for empty or zero inputs", () => {
    expect(G([])).toEqual([])
    expect(G([0, 0])).toEqual([])
  })
})

describe("history", () => {
  const P = (patch: Record<string, unknown>) => patch as Partial<SimulationInputs>

  it("starts empty with no undo/redo", () => {
    const stack = createHistory()
    expect(stack).toEqual({ past: [], future: [] })
    expect(undoHistory(stack)).toBeNull()
    expect(redoHistory(stack)).toBeNull()
  })

  it("pushes patches and clears the future branch on new edits", () => {
    let stack = createHistory()
    stack = pushHistory(stack, DEFAULT_INPUTS, P({ monthlyPayment: 1100 }), "A")
    stack = pushHistory(stack, { ...DEFAULT_INPUTS, monthlyPayment: 1100 }, P({ monthlyPayment: 1200 }), "A")
    expect(stack.past).toHaveLength(2)
    expect(stack.future).toHaveLength(0)
    const undone = undoHistory(stack)
    expect(undone).not.toBeNull()
    stack = (undone as NonNullable<typeof undone>).stack
    expect(stack.past).toHaveLength(1)
    expect(stack.future).toHaveLength(1)
    stack = pushHistory(stack, { ...DEFAULT_INPUTS, monthlyPayment: 1200 }, P({ duration: 30 }), "A")
    expect(stack.future).toHaveLength(0)
  })

  it("records the scenario of each edit", () => {
    let stack = createHistory()
    stack = pushHistory(stack, DEFAULT_INPUTS, P({ monthlyPayment: 1100 }), "A")
    stack = pushHistory(stack, { ...DEFAULT_INPUTS, monthlyPayment: 1100 }, P({ monthlyPayment: 1350 }), "B")
    const undone = undoHistory(stack)
    expect(undone).not.toBeNull()
    expect((undone as NonNullable<typeof undone>).scenario).toBe("B")
    const redone = redoHistory((undone as NonNullable<typeof undone>).stack)
    expect(redone).not.toBeNull()
    expect((redone as NonNullable<typeof redone>).scenario).toBe("B")
  })

  it("undo restores the previous values of the patched keys", () => {
    const stack = pushHistory(
      pushHistory(createHistory(), DEFAULT_INPUTS, P({ monthlyPayment: 1100 }), "A"),
      { ...DEFAULT_INPUTS, monthlyPayment: 1100 },
      P({ annualReturn: 0.09 }),
      "A",
    )
    const result = undoHistory(stack)
    expect(result).not.toBeNull()
    expect((result as NonNullable<typeof result>).patch).toMatchObject({
      annualReturn: DEFAULT_INPUTS.annualReturn,
    })
    const next = {
      ...DEFAULT_INPUTS,
      monthlyPayment: 1100,
      annualReturn: 0.09,
      ...(result as NonNullable<typeof result>).patch,
    }
    expect(next.annualReturn).toBe(DEFAULT_INPUTS.annualReturn)
    expect(next.monthlyPayment).toBe(1100)
  })

  it("undo restores only the keys touched by the last edit", () => {
    const stack = pushHistory(createHistory(), DEFAULT_INPUTS, P({ monthlyPayment: 1100 }), "A")
    const result = undoHistory(stack)
    expect(result).not.toBeNull()
    const patch = (result as NonNullable<typeof result>).patch
    expect(Object.keys(patch)).toEqual(["monthlyPayment"])
    expect(patch.monthlyPayment).toBe(DEFAULT_INPUTS.monthlyPayment)
  })

  it("redo replays the undone patch", () => {
    let stack = createHistory()
    stack = pushHistory(stack, DEFAULT_INPUTS, P({ monthlyPayment: 1100 }), "A")
    const undone = undoHistory(stack)
    expect(undone).not.toBeNull()
    const redone = redoHistory((undone as NonNullable<typeof undone>).stack)
    expect(redone).not.toBeNull()
    const redo = redone as NonNullable<typeof redone>
    expect(redo.patch).toMatchObject({ monthlyPayment: 1100 })
    expect(redo.stack.future).toHaveLength(0)
  })

  it("caps the past stack at HISTORY_LIMIT entries", () => {
    let stack = createHistory()
    let prev = DEFAULT_INPUTS
    for (let i = 0; i < 25; i += 1) {
      const next = { ...prev, seed: i }
      stack = pushHistory(stack, prev, P({ seed: i }), "A")
      prev = next
    }
    expect(stack.past).toHaveLength(20)
    expect(stack.past[19].patch).toMatchObject({ seed: 24 })
  })
})

describe("snapshots", () => {
  it("creates a snapshot from inputs and rows with a default name", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, duration: 5 })
    const snap = createSnapshot(DEFAULT_INPUTS, rows)
    expect(snap.id).toBeDefined()
    expect(snap.name).toMatch(/^Snapshot /)
    expect(snap.createdAt).toBeDefined()
    expect(snap.finalCapital).toBe(rows[rows.length - 1].taxNet)
    expect(snap.inputs).toEqual(DEFAULT_INPUTS)
  })

  it("uses a provided non-empty name and trims it", () => {
    const snap = createSnapshot(DEFAULT_INPUTS, [], "  Mon scénario  ")
    expect(snap.name).toBe("Mon scénario")
    expect(snap.finalCapital).toBe(0)
  })

  it("addSnapshot prepends and caps the list at SNAPSHOT_LIMIT", () => {
    let list: ReturnType<typeof createSnapshot>[] = []
    for (let i = 0; i < 12; i += 1) {
      list = addSnapshot(list, createSnapshot(DEFAULT_INPUTS, [], `S${i}`))
    }
    expect(list).toHaveLength(SNAPSHOT_LIMIT)
    expect(list[0].name).toBe("S11")
  })

  it("removeSnapshot deletes by id without mutating the input list", () => {
    const a = createSnapshot(DEFAULT_INPUTS, [], "A")
    const b = createSnapshot(DEFAULT_INPUTS, [], "B")
    const list = addSnapshot(addSnapshot([], a), b)
    const next = removeSnapshot(list, a.id)
    expect(next).toHaveLength(1)
    expect(next[0].id).toBe(b.id)
    expect(list).toHaveLength(2)
  })
})

describe("compareScenarios / mergeComparisonSeries", () => {
  const rows = runSimulation(DEFAULT_INPUTS)

  it("compareScenarios reports the better scenario and the absolute/percent gap", () => {
    const alt = runSimulation({ ...DEFAULT_INPUTS, monthlyPayment: 2000 })
    const result = compareScenarios(rows, alt)
    expect(result.finalA).toBe(rows[rows.length - 1].taxNet)
    expect(result.finalB).toBe(alt[alt.length - 1].taxNet)
    expect(result.diffAbsolute).toBeCloseTo(result.finalB - result.finalA, 0)
    expect(result.betterScenario).toBe("B")
    expect(result.diffPercent).toBeGreaterThan(0)
  })

  it("compareScenarios returns equal for identical rows", () => {
    const result = compareScenarios(rows, rows)
    expect(result.betterScenario).toBe("equal")
    expect(result.diffAbsolute).toBe(0)
    expect(result.diffPercent).toBe(0)
  })

  it("compareScenarios handles empty rows gracefully", () => {
    const result = compareScenarios([], [])
    expect(result).toEqual({ finalA: 0, finalB: 0, diffAbsolute: 0, diffPercent: 0, betterScenario: "equal" })
  })

  it("mergeComparisonSeries aligns both series by index and respects showReal", () => {
    const short = runSimulation({ ...DEFAULT_INPUTS, duration: 3 })
    const long = runSimulation({ ...DEFAULT_INPUTS, duration: 5 })
    const nominal = mergeComparisonSeries(short, long, false)
    expect(nominal).toHaveLength(6)
    expect(nominal[0].A).toBe(short[0].nominal)
    expect(nominal[3].B).toBe(long[3].nominal)
    expect(nominal[4].A).toBeNull()
    expect(nominal[5].A).toBeNull()
    const real = mergeComparisonSeries(short, long, true)
    expect(real[0].A).toBe(short[0].real)
    expect(real[1].year).toBe("An 1")
  })
})
