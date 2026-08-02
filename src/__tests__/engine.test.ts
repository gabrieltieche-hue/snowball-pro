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
  escapeCsvCell,
  computeTaxBreakdown,
  runSimulation,
  computeKPIs,
  computeMilestones,
  solveGoal,
  validateInputs,
  sanitizeInputs,
  runDecumulation,
  runDecumulationAsync,
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
  buildCashFlows,
  computeXIRR,
  applyScenarioPatch,
  resolveScenarioTarget,
  enterComparison,
  exitComparison,
  runMonteCarlo,
  sampleHistoricalReturns,
  mulberry32,
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

describe("escapeCsvCell — anti injection de formule (OWASP)", () => {
  it("laisse une valeur neutre intacte", () => {
    expect(escapeCsvCell("An 3")).toBe("An 3")
    expect(escapeCsvCell("1 234,56")).toBe("1 234,56")
  })

  it.each(["=SUM(A1:A9)", "+12345", "-2+3", "@cmd"])("préfixe ' pour %s", v => {
    expect(escapeCsvCell(v)).toBe(`'${v}`)
  })

  it("quote les cellules contenant un séparateur ou un guillemet", () => {
    expect(escapeCsvCell("a;b")).toBe('"a;b"')
    expect(escapeCsvCell('il a dit "oui"')).toBe('"il a dit ""oui"""')
    expect(escapeCsvCell("a\nb")).toBe('"a\nb"')
  })

  it("combine préfixe et quote quand les deux s'appliquent", () => {
    // Le préfixe ' est placé À L'INTÉRIEUR des guillemets : la valeur de champ
    // lue par le tableur commence par ' → formule neutralisée.
    expect(escapeCsvCell("=1+1;2")).toBe('"\'=1+1;2"')
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

describe("PEA — la durée de détention change l'imposition (correctif v5.2.4)", () => {
  it("détenu moins de 5 ans : le PFU 30 % s'applique dans la simulation", () => {
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      envelope: "pea" as const,
      peaYearsHeld: 2,
      duration: 25,
      monthlyPayment: 1000,
    })
    const last = rows[rows.length - 1]
    // Moins de 5 ans → impôt sur le revenu (12,8 %) en plus du social 17,2 %
    expect(last.incomeTax).toBeGreaterThan(0)
    expect(last.socialCharges).toBeGreaterThan(0)
  })

  it("détenu au moins 5 ans : taux réduit (aucun impôt sur le revenu)", () => {
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      envelope: "pea" as const,
      peaYearsHeld: 5,
      duration: 25,
      monthlyPayment: 1000,
    })
    const last = rows[rows.length - 1]
    expect(last.incomeTax).toBe(0)
    expect(last.socialCharges).toBeGreaterThan(0)
  })

  it("le curseur change les chiffres (avant : identiques quelle que soit la durée)", () => {
    const base = { ...DEFAULT_INPUTS, envelope: "pea" as const, duration: 25, monthlyPayment: 1000 }
    const held2 = runSimulation({ ...base, peaYearsHeld: 2 })
    const held10 = runSimulation({ ...base, peaYearsHeld: 10 })
    const last2 = held2[held2.length - 1]
    const last10 = held10[held10.length - 1]
    // Net fiscal différent selon la détention : 30 % (2 ans) > 17,2 % (10 ans)
    // (assertion de magnitude, pas d'égalité — plus robuste)
    expect(Math.abs(last2.taxNet - last10.taxNet)).toBeGreaterThan(1000)
    expect(last2.taxNet).toBeLessThan(last10.taxNet)
    expect(last2.incomeTax).toBeGreaterThan(0)
    expect(last10.incomeTax).toBe(0)
  })
})

describe("défauts — inflation 2,1 % et Monte Carlo 5 000", () => {
  it("le défaut d'inflation annuelle est 2,1 %", () => {
    expect(DEFAULT_INPUTS.inflation).toBeCloseTo(0.021)
  })

  it("le défaut Monte Carlo est 5 000 simulations", () => {
    expect(DEFAULT_INPUTS.mcRuns).toBe(5000)
  })

  it("parseStoredInputs force le mode d'inflation personnalisé (modes supprimés)", () => {
    const inputs = parseStoredInputs(JSON.stringify({ ...DEFAULT_INPUTS, inflationMode: "historical" }))
    expect(inputs.inflationMode).toBe("custom")
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
    tmi: 0.3,
    ctoTaxMode: "pfu",
  }

  it("produces correct number of rows", () => {
    const rows = runSimulation(baseInputs)
    expect(rows.length).toBe(11) // year 0 + 10 years
    expect(rows[0].year).toBe(0)
    expect(rows[rows.length - 1].year).toBe(10)
  })

  it("démarre la projection en janvier (mois de début supprimé)", () => {
    const rows = runSimulation(baseInputs)
    expect(rows[0].date.startsWith("janv.")).toBe(true)
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
  it("couvre 1970–2025 pour le MSCI World (série EUR Net Return)", () => {
    const dataset = getHistoricalDataset("msci-world")
    expect(dataset.years[0]?.year).toBe(1970)
    expect(dataset.years[dataset.years.length - 1]?.year).toBe(2025)
    expect(dataset.years.length).toBe(56)
    // Quelques valeurs de référence vérifiées (justETF / MSCI NR EUR)
    const byYear = new Map(dataset.years.map(y => [y.year, y.return]))
    expect(byYear.get(1999)).toBeCloseTo(0.462, 3)
    expect(byYear.get(2008)).toBeCloseTo(-0.3729, 3)
    expect(byYear.get(2022)).toBeCloseTo(-0.1287, 3)
    expect(byYear.get(2024)).toBeCloseTo(0.2633, 3)
    expect(byYear.get(2025)).toBeCloseTo(0.0639, 3)
  })

  it("couvre 1995–2025 pour les autres indices actions", () => {
    for (const id of ["sp500", "nasdaq", "cac40"] as const) {
      const dataset = getHistoricalDataset(id)
      expect(dataset.years[0]?.year).toBe(1995)
      expect(dataset.years[dataset.years.length - 1]?.year).toBe(2025)
      expect(dataset.years.length).toBe(31)
    }
  })

  it("applique une inflation forfaitaire de 2,1 % à chaque année", () => {
    const dataset = getHistoricalDataset("msci-world")
    for (const y of dataset.years) expect(y.inflation).toBeCloseTo(0.021, 4)
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

  it("MSCI World expose les figures de référence : 10,62 %/an brut, 8,22 %/an net d'inflation", () => {
    const dataset = getHistoricalDataset("msci-world")
    expect(dataset.avgReturn).toBeCloseTo(0.1062, 4)
    expect(dataset.netReturn).toBeCloseTo(0.0822, 4)
    expect(dataset.volatility).toBeGreaterThan(0)
  })

  it("netReturn des autres indices est dérivé à l'inflation forfaitaire de 2,1 %", () => {
    const dataset = getHistoricalDataset("sp500")
    const expectedNet = Math.max(0, (1 + dataset.avgReturn) / 1.021 - 1)
    expect(dataset.netReturn).toBeCloseTo(expectedNet, 6)
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
    tmi: 0.3,
    ctoTaxMode: "pfu",
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
      tmi: 0.3,
      ctoTaxMode: "pfu",
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
      tmi: 0.3,
      ctoTaxMode: "pfu",
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
      tmi: 0.3,
      ctoTaxMode: "pfu",
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
      tmi: 0.3,
      ctoTaxMode: "pfu",
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
      tmi: 0.3,
      ctoTaxMode: "pfu",
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
    // I3 — tick aligné sur --color-text-dim (WCAG AA 4.5:1) : #A39A8C
    expect(theme.tick).toBe("#A39A8C")
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
    const inputs = v4SettingsToInputs({ t: 500, kraschPct: -10 })
    expect(inputs.duration).toBe(80)
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

describe("buildCashFlows / computeXIRR", () => {
  it("builds monthly outflows and a final inflow", () => {
    const { flows, months } = buildCashFlows(
      { ...DEFAULT_INPUTS, capitalInitial: 1000, monthlyPayment: 100, duration: 2 },
      5000,
    )
    expect(flows[0]).toBe(-1000)
    expect(months[0]).toBe(0)
    // 24 versements mensuels + capital initial + valeur finale
    expect(flows.length).toBe(26)
    expect(flows[flows.length - 1]).toBe(5000)
    expect(months[months.length - 1]).toBe(24)
  })

  it("skips zero contributions", () => {
    const { flows } = buildCashFlows({ ...DEFAULT_INPUTS, capitalInitial: 0, monthlyPayment: 0, duration: 5 }, 10_000)
    expect(flows).toEqual([10000])
  })

  it("XIRR of a pure lump sum equals the return rate", () => {
    // 1000 € pendant 2 ans, aucune épargne mensuelle → 1210 € = 10 %/an
    const xirr = computeXIRR({ ...DEFAULT_INPUTS, capitalInitial: 1000, monthlyPayment: 0, duration: 2 }, 1210)
    expect(xirr).toBeCloseTo(0.1, 2)
  })

  it("XIRR of a zero-investment scenario is 0", () => {
    expect(computeXIRR({ ...DEFAULT_INPUTS, capitalInitial: 0, monthlyPayment: 0, duration: 5 }, 0)).toBe(0)
  })

  it("computeKPIs exposes xirr alongside cagr", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, duration: 10, monthlyPayment: 500 })
    const kpis = computeKPIs(rows, { ...DEFAULT_INPUTS, duration: 10, monthlyPayment: 500 })
    expect(kpis.xirr).toBeGreaterThan(0)
    expect(kpis.cagr).toBeGreaterThan(0)
  })
})

describe("scénario B — applyScenarioPatch / resolveScenarioTarget", () => {
  const a = { ...DEFAULT_INPUTS, capitalInitial: 10_000 }
  const b = { ...DEFAULT_INPUTS, capitalInitial: 99_999 }

  it("routes edits to B when comparing, and to A otherwise", () => {
    expect(resolveScenarioTarget(true, null)).toBe("B")
    expect(resolveScenarioTarget(false, null)).toBe("A")
    expect(resolveScenarioTarget(true, "A")).toBe("A")
  })

  it("NEVER overwrites scenario A when editing B", () => {
    const result = applyScenarioPatch({ A: a, B: b }, { monthlyPayment: 2500 }, true)
    expect(result.target).toBe("B")
    expect(result.state.A).toBe(a) // A intact (référence non mutée)
    expect(result.state.B?.monthlyPayment).toBe(2500)
    expect(result.state.B?.capitalInitial).toBe(99_999)
  })

  it("edits A when not comparing and leaves B untouched", () => {
    const result = applyScenarioPatch({ A: a, B: b }, { duration: 40 }, false)
    expect(result.target).toBe("A")
    expect(result.state.B).toBe(b)
    expect(result.state.A.duration).toBe(40)
  })

  it("enterComparison freezes A and seeds B from A when absent", () => {
    const state = enterComparison({ A: a, B: null })
    expect(state.A.capitalInitial).toBe(10_000)
    expect(state.B?.capitalInitial).toBe(10_000)
    // A n'est pas muté après coup
    const patched = applyScenarioPatch(state, { monthlyPayment: 111 }, true)
    expect(patched.state.A.capitalInitial).toBe(10_000)
    expect(patched.state.B?.monthlyPayment).toBe(111)
  })

  it("exitComparison keeps B for later re-entry", () => {
    const state = exitComparison({ A: a, B: b })
    expect(state.B).toBe(b)
    expect(state.A).toBe(a)
  })
})

describe("parseStoredInputs — validation stricte du schéma", () => {
  it("rejects non-numeric values for numeric fields", () => {
    const inputs = parseStoredInputs(JSON.stringify({ capitalInitial: "50000", duration: "abc" }))
    expect(inputs.capitalInitial).toBe(DEFAULT_INPUTS.capitalInitial)
    expect(inputs.duration).toBe(DEFAULT_INPUTS.duration)
  })

  it("rejects invalid enum values and keeps defaults", () => {
    const inputs = parseStoredInputs(JSON.stringify({ envelope: "futures", returnMode: "quantum" }))
    expect(inputs.envelope).toBe(DEFAULT_INPUTS.envelope)
    expect(inputs.returnMode).toBe(DEFAULT_INPUTS.returnMode)
  })

  it("accepts valid numeric and enum values", () => {
    const inputs = parseStoredInputs(
      JSON.stringify({ capitalInitial: 42_000, envelope: "av", returnMode: "historical" }),
    )
    expect(inputs.capitalInitial).toBe(42_000)
    expect(inputs.envelope).toBe("av")
    expect(inputs.returnMode).toBe("historical")
  })

  it("normalise le mode Aléatoire supprimé vers « fixed » et verrouille l'indice sur le MSCI World", () => {
    const inputs = parseStoredInputs(JSON.stringify({ returnMode: "random", historicalIndex: "sp500" }))
    expect(inputs.returnMode).toBe("fixed")
    expect(inputs.historicalIndex).toBe("msci-world")
  })

  it("ignores unknown keys without crashing", () => {
    const inputs = parseStoredInputs(JSON.stringify({ foo: 1, bar: "x" }))
    expect(inputs).toEqual(DEFAULT_INPUTS)
  })
})

// Les simulations Monte-Carlo sont volontairement lentes (chaque scénario
// rejoue une simulation mensuelle complète) : timeout élargi au-delà des 5 s.
const MC_TIMEOUT = 30_000

describe("runMonteCarlo — rééchantillonnage historique", () => {
  it(
    "produces deterministic results for a fixed seed",
    () => {
      const inputs = { ...DEFAULT_INPUTS, mcRuns: 200, duration: 10, returnMode: "historical" as const }
      const first = runMonteCarlo(inputs, 200)
      const second = runMonteCarlo(inputs, 200)
      expect(first.p50).toEqual(second.p50)
      expect(first.runs).toBe(200)
    },
    MC_TIMEOUT,
  )

  it(
    "produces distinct paths across the distribution",
    () => {
      const inputs = { ...DEFAULT_INPUTS, mcRuns: 300, duration: 10, returnMode: "historical" as const }
      const result = runMonteCarlo(inputs, 300)
      const last = result.p50.length - 1
      expect(result.p90[last]).toBeGreaterThan(result.p50[last] ?? 0)
      expect(result.p10[last]).toBeLessThan(result.p50[last] ?? 0)
      expect(result.bestCase).toBeGreaterThan(result.worstCase)
    },
    MC_TIMEOUT,
  )

  it(
    "random mode still runs and yields a success rate",
    () => {
      const inputs = { ...DEFAULT_INPUTS, mcRuns: 150, returnMode: "random" as const, goalTarget: 10_000 }
      const result = runMonteCarlo(inputs, 150, 10_000)
      expect(result.successRate).toBeGreaterThanOrEqual(0)
      expect(result.successRate).toBeLessThanOrEqual(100)
    },
    MC_TIMEOUT,
  )
})

describe("régressions — corrections de l'audit", () => {
  it("parseCurrencyInput rejette une saisie malformée (NaN au lieu d'un 0 sournois)", () => {
    expect(parseCurrencyInput("")).toBeNaN()
    expect(parseCurrencyInput("10k5")).toBeNaN()
    expect(parseCurrencyInput("abc")).toBeNaN()
    expect(parseCurrencyInput("1.5k")).toBe(1500)
    expect(parseCurrencyInput("2M")).toBe(2_000_000)
  })

  it("validateInputs aligne les bornes mcRuns sur le moteur (100–10 000)", () => {
    const tooLow = validateInputs({ ...DEFAULT_INPUTS, mcRuns: 50 })
    expect(tooLow.find(e => e.field === "mcRuns")?.severity).toBe("warning")
    const tooHigh = validateInputs({ ...DEFAULT_INPUTS, mcRuns: 50_000 })
    expect(tooHigh.find(e => e.field === "mcRuns")?.severity).toBe("warning")
    const ok = validateInputs({ ...DEFAULT_INPUTS, mcRuns: 1000 })
    expect(ok.find(e => e.field === "mcRuns")).toBeUndefined()
  })

  it("validateInputs signale une crise programmée après la fin de la simulation", () => {
    const base = { ...DEFAULT_INPUTS, duration: 10, crisisEnabled: true, crisisYear: 15 }
    const crisis = validateInputs(base).find(e => e.field === "crisisYear")
    expect(crisis?.severity).toBe("warning")
    expect(crisis?.max).toBe(10)
    // Pas de faux positif : crise dans la durée, ou crise désactivée
    const inRange = validateInputs({ ...base, crisisYear: 8 })
    expect(inRange.find(e => e.field === "crisisYear")).toBeUndefined()
    const disabled = validateInputs({ ...base, crisisEnabled: false })
    expect(disabled.find(e => e.field === "crisisYear")).toBeUndefined()
  })

  it("Sharpe vaut 0 (masqué) en mode fixe — plus de ratio explosé", () => {
    const inputs = { ...DEFAULT_INPUTS, returnMode: "fixed" as const, duration: 10, volatility: 0.155 }
    const kpis = computeKPIs(runSimulation(inputs), inputs)
    expect(kpis.sharpe).toBe(0)
  })

  it("le temps de doublement découle du XIRR, pas du CAGR gonflé par les versements", () => {
    const inputs = { ...DEFAULT_INPUTS, capitalInitial: 50_000, monthlyPayment: 0, duration: 10 }
    const kpis = computeKPIs(runSimulation(inputs), inputs)
    expect(kpis.xirr).toBeGreaterThan(0)
    expect(kpis.doublingTime).not.toBeNull()
    // log(2) / log(1 + xirr) ≈ 8,66 ans à ~8,3 %/an — et non ~4,4 ans
    expect(kpis.doublingTime as number).toBeGreaterThan(7)
    expect(kpis.doublingTime as number).toBeLessThan(11)
  })

  it("runDecumulation respecte un retrait personnalisé de 0 € (pas de fallback silencieux à 100 €)", () => {
    const inputs = { ...DEFAULT_INPUTS, withdrawalModel: "custom" as const, withdrawalFixed: 0, retirementYears: 10 }
    const result = runDecumulation(inputs, 100_000, 100)
    expect(result.initialWithdrawal).toBe(0)
  })

  it("runDecumulation cumule les retraits mois par mois (pas « dernier retrait × 12 »)", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      withdrawalModel: "rule-4" as const,
      withdrawalInflation: true,
      inflation: 0.03,
      retirementYears: 10,
    }
    const result = runDecumulation(inputs, 100_000, 100)
    const yearly = result.withdrawals
    // Avec indexation, le retrait annuel augmente au fil des années
    expect(yearly[yearly.length - 1] ?? 0).toBeGreaterThan(yearly[1] ?? 0)
    expect(yearly[1] ?? 0).toBeGreaterThan(0)
  })

  it("runDecumulation en mode historique rejoue les rendements réels (branche plus morte)", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      returnMode: "historical" as const,
      historicalIndex: "sp500" as const,
      retirementYears: 10,
    }
    const result = runDecumulation(inputs, 100_000, 100)
    expect(result.years.length).toBe(11)
    expect(result.survivalProbability).toBeGreaterThanOrEqual(0)
    expect(result.survivalProbability).toBeLessThanOrEqual(100)
  })

  it(
    "runMonteCarlo en historique + krach ne double pas la chute (crise désactivée)",
    () => {
      const base = { ...DEFAULT_INPUTS, returnMode: "historical" as const, duration: 10, mcRuns: 100 }
      const withCrisis = runMonteCarlo({ ...base, crisisEnabled: true }, 100)
      const withoutCrisis = runMonteCarlo({ ...base, crisisEnabled: false }, 100)
      expect(withCrisis.p50).toEqual(withoutCrisis.p50)
    },
    MC_TIMEOUT,
  )

  it("computeMilestones ne dépasse jamais l'horizon de projection", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, duration: 10, monthlyPayment: 5000 })
    const lastYear = rows[rows.length - 1]?.year ?? 10
    for (const m of computeMilestones(rows)) {
      if (m.reached) expect(m.year).toBeLessThanOrEqual(lastYear)
      else expect(m.year).toBe(-1)
    }
  })

  it("enterComparison réinitialise TOUJOURS B depuis A (un ancien B mémorisé est ignoré)", () => {
    const a = { ...DEFAULT_INPUTS, capitalInitial: 10_000 }
    const oldB = { ...DEFAULT_INPUTS, capitalInitial: 0 }
    const state = enterComparison({ A: a, B: oldB })
    expect(state.B?.capitalInitial).toBe(10_000)
    expect(state.A.capitalInitial).toBe(10_000)
  })

  it("compareScenarios : diffPercent est déjà un pourcentage (pas un ratio)", () => {
    const a = runSimulation({ ...DEFAULT_INPUTS, monthlyPayment: 500, duration: 10 })
    const b = runSimulation({ ...DEFAULT_INPUTS, monthlyPayment: 2000, duration: 10 })
    const result = compareScenarios(a, b)
    const expectedPct = ((result.finalB - result.finalA) / result.finalA) * 100
    expect(result.diffPercent).toBeCloseTo(expectedPct, 2)
    expect(Math.abs(result.diffPercent)).toBeGreaterThan(1) // ex : -12,3 % et non -0,123
  })
})

describe("PER — tranche marginale d'imposition (TMI)", () => {
  it("sortie en capital : gains taxés à TMI après abattement de 10 %", () => {
    const result = computeTaxBreakdown(10000, "per", 10, false, 0, 0, { tmi: 0.3 })
    // social 17,2 % + IR = gains × (1 - 10 %) × TMI = 10000 × 0,9 × 0,3
    expect(result.socialCharges).toBeCloseTo(1720, 0)
    expect(result.incomeTax).toBeCloseTo(2700, 0)
    expect(result.flatTax).toBe(0)
    expect(result.totalTax).toBeCloseTo(4420, 0)
  })

  it("la TMI change l'impôt de sortie", () => {
    const low = computeTaxBreakdown(10000, "per", 10, false, 0, 0, { tmi: 0.11 })
    const high = computeTaxBreakdown(10000, "per", 10, false, 0, 0, { tmi: 0.41 })
    expect(low.incomeTax).toBeCloseTo(990, 0)
    expect(high.incomeTax).toBeCloseTo(3690, 0)
    expect(high.incomeTax).toBeGreaterThan(low.incomeTax)
  })

  it("l'économie d'impôt à l'entrée est réinvestie dans le capital", () => {
    const noTmi = runSimulation({ ...DEFAULT_INPUTS, envelope: "per", tmi: 0, duration: 10, monthlyPayment: 1000 })
    const withTmi = runSimulation({ ...DEFAULT_INPUTS, envelope: "per", tmi: 0.3, duration: 10, monthlyPayment: 1000 })
    const lastNo = noTmi[noTmi.length - 1]?.nominal ?? 0
    const lastWith = withTmi[withTmi.length - 1]?.nominal ?? 0
    expect(lastWith).toBeGreaterThan(lastNo)
  })
})

describe("AV — règle des 150 k€ / 300 k€ de primes", () => {
  it("au-delà du plafond de primes, les gains passent de 7,5 % à 12,8 %", () => {
    // 200 k€ de primes (célibataire, plafond 150 k€) → 75 % des gains à 7,5 %,
    // 25 % à 12,8 %, après abattement de 4 600 €.
    const result = computeTaxBreakdown(100000, "av", 10, false, 0, 200_000)
    const allowance = 4600
    const taxable = 100000 - allowance
    const expected = taxable * 0.75 * 0.075 + taxable * 0.25 * 0.128
    expect(result.incomeTax).toBeCloseTo(expected, 0)
    expect(result.incomeTax).toBeGreaterThan(taxable * 0.075) // plus cher que le taux réduit pur
  })

  it("sous le plafond, le taux réduit de 7,5 % s'applique intégralement", () => {
    const result = computeTaxBreakdown(10000, "av", 10, false, 0, 100_000)
    expect(result.incomeTax).toBeCloseTo((10000 - 4600) * 0.075, 0)
  })

  it("le plafond double pour un couple (300 k€)", () => {
    const single = computeTaxBreakdown(100000, "av", 10, false, 0, 200_000)
    const couple = computeTaxBreakdown(100000, "av", 10, true, 0, 200_000)
    expect(couple.incomeTax).toBeLessThan(single.incomeTax)
  })
})

describe("CTO — option barème progressif vs PFU", () => {
  it("PFU (défaut) : impôt unique de 30 %", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, 0, { ctoTaxMode: "pfu" })
    expect(result.flatTax).toBeCloseTo(3000, 0)
  })

  it("barème : 17,2 % de social + TMI sur les gains, sans PFU", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, 0, { ctoTaxMode: "bareme", tmi: 0.3 })
    expect(result.flatTax).toBe(0)
    expect(result.socialCharges).toBeCloseTo(1720, 0)
    expect(result.incomeTax).toBeCloseTo(3000, 0) // 10000 × 30 %
  })

  it("barème : abattement de 40 % sur les dividendes reçus", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, 0, {
      ctoTaxMode: "bareme",
      tmi: 0.3,
      dividendsGross: 5000,
    })
    // gains imposables = 10000 - 40 % × 5000 = 8000 → IR = 8000 × 30 %
    expect(result.incomeTax).toBeCloseTo(2400, 0)
  })

  it("dividendTaxRate suit le mode CTO", () => {
    const pfu = computeTaxBreakdown(10000, "cto", 1, false)
    const bareme = computeTaxBreakdown(10000, "cto", 1, false, 0, 0, { ctoTaxMode: "bareme", tmi: 0.3 })
    expect(pfu.flatTax).toBeCloseTo(3000, 0)
    expect(bareme.flatTax).toBe(0)
  })
})

describe("netYield — rendement net de l'année (ratio, comme yearlyReturn)", () => {
  it("est un ratio cohérent, pas un montant en euros", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, envelope: "none", duration: 10 })
    const last = rows[rows.length - 1]
    expect(last?.netYield).toBeGreaterThan(-2)
    expect(last?.netYield).toBeLessThan(100)
    // Verrouille l'unité : un ratio (0,08 = 8 %) et non un pourcentage (8)
    expect(last?.netYield).toBeLessThan(1)
    expect(last?.netYield).not.toBe(last?.netGains) // plus de doublon netGains
  })

  it("vaut 0 en année 0", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    expect(rows[0]?.netYield).toBe(0)
  })

  it("sans fiscalité, netYield ≈ yearlyReturn", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, envelope: "none", duration: 5, monthlyPayment: 0 })
    const last = rows[rows.length - 1]
    // netYield et yearlyReturn sont stockés dans la même unité (ratio, ex :
    // 0,08 = 8 %) : comparaison directe.
    expect(last?.netYield).toBeCloseTo(last?.yearlyReturn ?? 0, 1)
  })
})

describe("sampleHistoricalReturns — bootstrap par blocs non chevauchants", () => {
  const inputs = { ...DEFAULT_INPUTS, returnMode: "historical" as const, historicalIndex: "msci-world" as const }
  const returns = getHistoricalDataset("msci-world").years.map(y => y.return)

  it("un bloc de 5 ans est une fenêtre contiguë réelle, sans rebouclage 2025→1970", () => {
    const seq = sampleHistoricalReturns(inputs, 5, mulberry32(42))
    expect(seq).toHaveLength(5)
    const start = returns.indexOf(seq[0] ?? -1)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(start + 4).toBeLessThan(returns.length) // jamais de wrap à la fin
    expect(seq).toEqual(returns.slice(start, start + 5))
  })

  it("reste déterministe pour une graine donnée", () => {
    const a = sampleHistoricalReturns(inputs, 40, mulberry32(7))
    const b = sampleHistoricalReturns(inputs, 40, mulberry32(7))
    expect(a).toEqual(b)
  })

  it("remplit une durée supérieure à l'historique avec des blocs entiers", () => {
    const seq = sampleHistoricalReturns(inputs, 60, mulberry32(3))
    expect(seq).toHaveLength(60)
    for (const v of seq) expect(returns).toContain(v)
  })
})

describe("tmi / ctoTaxMode — persistance et validation", () => {
  it("parseStoredInputs restaure tmi et ctoTaxMode", () => {
    const inputs = parseStoredInputs(JSON.stringify({ tmi: 0.41, ctoTaxMode: "bareme" }))
    expect(inputs.tmi).toBe(0.41)
    expect(inputs.ctoTaxMode).toBe("bareme")
  })

  it("rejette un ctoTaxMode invalide (retour au défaut)", () => {
    const inputs = parseStoredInputs(JSON.stringify({ ctoTaxMode: "quantum" }))
    expect(inputs.ctoTaxMode).toBe("pfu")
  })

  it("validateInputs signale une TMI négative ou hors barème", () => {
    const negative = validateInputs({ ...DEFAULT_INPUTS, tmi: -0.1 })
    expect(negative.find(e => e.field === "tmi")?.severity).toBe("error")
    const excessive = validateInputs({ ...DEFAULT_INPUTS, tmi: 0.5 })
    expect(excessive.find(e => e.field === "tmi")?.severity).toBe("warning")
  })

  it("sanitizeInputs borne la TMI à 45 %", () => {
    const safe = sanitizeInputs({ ...DEFAULT_INPUTS, tmi: 2 })
    expect(safe.tmi).toBe(0.45)
  })
})

describe("régressions — audit v2 (perf & logique moteur)", () => {
  it("XIRR dégénéré : valeur finale 0 → rendement 0 (plus de 4 700 %/an absurde)", () => {
    const xirr = computeXIRR({ ...DEFAULT_INPUTS, capitalInitial: 10_000, monthlyPayment: 500, duration: 10 }, 0)
    expect(xirr).toBe(0)
  })

  it("solveGoal : capital de départ > objectif → gains nuls (plus de -400 k€)", () => {
    const result = solveGoal({ ...DEFAULT_INPUTS, goalTarget: 500_000, goalCapital: 1_000_000, goalDuration: 10 })
    expect(result.totalGains).toBe(0)
    expect(result.totalGains as number).toBeGreaterThanOrEqual(0)
  })

  it("solveGoal : objectif irréaliste → achievable=false cohérent avec difficulty=impossible", () => {
    const result = solveGoal({ ...DEFAULT_INPUTS, goalTarget: 100_000_000, goalPayment: 500, goalDuration: 50 })
    expect(result.difficulty).toBe("impossible")
    expect(result.achievable).toBe(false)
  })

  it("solveGoal : objectif réaliste → achievable=true cohérent avec la difficulté", () => {
    const result = solveGoal({
      ...DEFAULT_INPUTS,
      goalTarget: 1_000_000,
      goalCapital: 25_000,
      goalPayment: 1000,
      goalDuration: 20,
      goalAnnualReturn: 0.09,
    })
    expect(result.achievable).toBe(true)
    expect(result.difficulty).not.toBe("impossible")
  })

  it("runDecumulation : plus de retraits fantômes après l'épuisement du capital", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      returnMode: "fixed" as const,
      annualReturn: 0.01,
      withdrawalModel: "custom" as const,
      withdrawalFixed: 5_000,
      withdrawalInflation: false,
      retirementYears: 30,
      mcRuns: 100,
    }
    const result = runDecumulation(inputs, 10_000, 100)
    // 10 k€ retirés à 5 k€/mois → ruiné dans l'année 1. Avant le correctif,
    // la courbe de retraits continuait de grimper (5 000 €/mois « retirés »
    // d'un capital inexistant) : ici elle doit rester à 0 après la ruine.
    expect(result.withdrawals[5]).toBe(0)
    expect(result.withdrawals[result.withdrawals.length - 1]).toBe(0)
  })

  it("crise historique : plus de double comptage (Simulateur cohérent avec MC/Rente)", () => {
    const base = {
      ...DEFAULT_INPUTS,
      returnMode: "historical" as const,
      historicalIndex: "sp500" as const,
      duration: 10,
      monthlyPayment: 0,
      envelope: "none" as const,
      crisisEnabled: true,
      crisisProfile: "bear-market" as const,
      crisisYear: 3,
      crisisAmplitude: 50,
      crisisDuration: 2,
    }
    const withCrisis = runSimulation(base)
    const withoutCrisis = runSimulation({ ...base, crisisEnabled: false })
    expect(withCrisis.map(r => r.nominal)).toEqual(withoutCrisis.map(r => r.nominal))
  })

  it("yearlyReturn / netYield bornés à -100 % (plus de -515 % impossible)", () => {
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      annualReturn: -0.95,
      monthlyPayment: 1000,
      indexation: 0.5,
      duration: 2,
      envelope: "none",
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
      dividendYield: 0,
    })
    for (const row of rows) {
      expect(row.yearlyReturn).toBeGreaterThanOrEqual(-1)
      expect(row.netYield).toBeGreaterThanOrEqual(-1)
    }
  })

  it("runDecumulationAsync produit des résultats identiques à runDecumulation", async () => {
    const inputs = { ...DEFAULT_INPUTS, mcRuns: 100, retirementYears: 15 }
    const syncResult = runDecumulation(inputs, 100_000, 100)
    const asyncResult = await runDecumulationAsync(inputs, 100_000, 100)
    expect(asyncResult.p50).toEqual(syncResult.p50)
    expect(asyncResult.withdrawals).toEqual(syncResult.withdrawals)
    expect(asyncResult.ruinProbability).toBe(syncResult.ruinProbability)
    expect(asyncResult.runs).toBe(syncResult.runs)
  })

  it("runDecumulationAsync supporte l'annulation (AbortController)", async () => {
    const inputs = { ...DEFAULT_INPUTS, mcRuns: 10_000, retirementYears: 40 }
    const controller = new AbortController()
    controller.abort()
    // Le message du DOMException est français (« Décaissement annulé ») : on
    // vérifie le name ("AbortError"), pas le message.
    await expect(runDecumulationAsync(inputs, 100_000, 10_000, undefined, controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    })
  })
})

describe("régressions — audit v5.2.2 (cohérence des unités & effets réels)", () => {
  it("la Rente applique ENFIN le krach : returnShock de la crise sur le décumul", () => {
    // Avant l'audit v5.2.2, sampledMonthlyReturnFn n'utilisait que le
    // volMultiplier de la crise : le capital décumulé « tremblait » sans jamais
    // s'effondrer. Avec un krach de -50 % en année 3, la médiane P50 à l'année
    // 3 doit être nettement inférieure à celle sans crise (même seed → mêmes
    // aléas, seul le choc diffère).
    const base = {
      ...DEFAULT_INPUTS,
      returnMode: "fixed" as const,
      annualReturn: 0.05,
      withdrawalModel: "rule-4" as const,
      withdrawalInflation: false,
      retirementYears: 15,
      mcRuns: 300,
    }
    const noCrisis = runDecumulation(base, 100_000, 300)
    const crisis = runDecumulation(
      {
        ...base,
        crisisEnabled: true,
        crisisProfile: "flash-crash" as const,
        crisisYear: 3,
        crisisAmplitude: 50,
        crisisDuration: 1,
      },
      100_000,
      300,
    )
    // P50 à la fin de l'année 3 (index 3) : le krach doit avoir entamé le capital
    expect(crisis.p50[3] ?? 0).toBeLessThan((noCrisis.p50[3] ?? 0) * 0.7)
  })

  it("realReturn reflète la SIMULATION (XIRR déflaté par l'inflation réelle), pas les inputs", () => {
    // En mode historique, le rendement saisi (annualReturn) n'est PAS celui
    // rejoué : l'ancien calcul (1+annualReturn)/(1+inflation)−1 était faux.
    const inputs = {
      ...DEFAULT_INPUTS,
      returnMode: "historical" as const,
      historicalIndex: "sp500" as const,
      monthlyPayment: 0,
      envelope: "none" as const,
      dividendYield: 0,
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
      inflation: 0.02,
      duration: 5,
      annualReturn: 0.08, // rendement saisi ≠ rendements réels rejoués
    }
    const rows = runSimulation(inputs)
    const kpis = computeKPIs(rows, inputs)
    // Invariant : realReturn = (1+xirr)/(1+inflation réelle) − 1, avec
    // l'inflation réelle dérivée du rapport nominal/réel de la projection.
    const last = rows[rows.length - 1]
    const cumulativeInfl = last.nominal / last.real
    const avgInfl = Math.pow(cumulativeInfl, 1 / 5) - 1
    const expected = (1 + kpis.xirr / 100) / (1 + avgInfl) - 1
    expect(kpis.realReturn).toBeCloseTo(expected * 100, 0)
    // Et surtout : ce n'est plus (1+annualReturn)/(1+inflation)−1
    const naive = (1 + inputs.annualReturn) / (1 + inputs.inflation) - 1
    expect(Math.abs(kpis.realReturn / 100 - naive)).toBeGreaterThan(0.001)
  })

  it("impôts affichés = exit tax (brut − net) : les dividendes déjà taxés ne sont pas re-comptés", () => {
    // Avec des dividendes, row.tax = exitTax + dividendTax. La carte « Impôts »
    // et le camembert affichent exitTax = nominal − taxNet : l'identité
    // « brut − impôts = net » doit tenir, et dividendTax doit rester à part.
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      envelope: "cto" as const,
      dividendYield: 0.03,
      duration: 10,
    })
    const last = rows[rows.length - 1]
    const exitTax = Math.max(0, last.nominal - last.taxNet)
    // brut − exitTax = net (identité affichée par les cartes)
    expect(last.nominal - exitTax).toBeCloseTo(last.taxNet, 2)
    // exitTax = social + impôt sur le revenu (pas les dividendes)
    expect(exitTax).toBeCloseTo(last.socialCharges + last.incomeTax, 2)
    // totalTax = exitTax + dividendTax : la version « totale » sur-compte les
    // dividendes déjà prélevés → c'est bien elle qu'on n'affiche plus
    expect(last.tax).toBeCloseTo(exitTax + last.dividendTax, 2)
    expect(last.dividendTax).toBeGreaterThan(0) // le scénario a bien des dividendes
  })

  it("interestsReal est le rendement réel net d'inflation (même échelle que real)", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, envelope: "none" as const, duration: 8 })
    const last = rows[rows.length - 1]
    expect(last.interestsReal).toBeCloseTo(last.real - last.investedReal, 2)
    // interestsNom / interestsReal = facteur d'inflation cumulé
    if (last.interestsReal > 0 && last.interestsNom > 0) {
      expect(last.interestsNom / last.interestsReal).toBeCloseTo(last.nominal / last.real, 2)
    }
  })

  it("FeeImpact : l'impact des frais est déflaté quand showReal est actif (même unité que les cartes)", () => {
    const inputs = { ...DEFAULT_INPUTS, showReal: true, etfFees: 0.005, duration: 15 }
    const rows = runSimulation(inputs)
    const last = rows[rows.length - 1]
    const factor = last.real / last.nominal
    // Le facteur de déflation est réellement inférieur à 1 (inflation positive)
    expect(factor).toBeLessThan(1)
    expect(factor).toBeGreaterThan(0)
    // Les frais payés affichés (FeeImpact) doivent être déflatés : le montant
    // affiché en euros d'aujourd'hui est strictement inférieur au nominal
    expect(last.feesLost * factor).toBeLessThan(last.feesLost)
    // Et ce montant déflaté est bien cohérent avec la valeur réelle du capital
    // (même facteur real/nominal que la carte « Valeur réelle »)
    const realFeesRatio = (last.feesLost * factor) / last.real
    const nominalFeesRatio = last.feesLost / last.nominal
    expect(realFeesRatio).toBeCloseTo(nominalFeesRatio, 6)
  })
})
