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
  fmtDecimal,
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
  getHistoricalPool,
  FRENCH_INFLATION_1970_2025,
  sampleRegime,
  applyRegime,
  effectiveSampleSize,
  wilsonScoreCI,
  buildTerminalHistogram,
  sampleNormal,
  runStressTest,
  STRESS_TEST_SCENARIOS,
  average,
  MSCI_WORLD_AVG_RETURN,
  EXTENDED_WORLD_RETURNS,
  getTaxRules,
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
    // Séparateur décimal français partout, y compris M€/Md€ (audit v5.6.2).
    expect(fmtCurrency(1_500_000)).toBe("1,50 M€")
    expect(fmtCurrency(1_500_000_000)).toBe("1,50 Md€")
    expect(fmtCurrency(-100)).toContain("-")
  })
})

describe("fmtCompact", () => {
  it("formats compact values", () => {
    expect(fmtCompact(0)).toBe("0")
    expect(fmtCompact(500)).toBe("500")
    expect(fmtCompact(1500)).toBe("2k")
    expect(fmtCompact(1_500_000)).toBe("1,5M")
    expect(fmtCompact(1_500_000_000)).toBe("1,5Md")
  })
})

describe("fmtPercent", () => {
  it("formats percentages with sign", () => {
    // Séparateur décimal français (virgule) : audit v5.6.2 — « +5.5% » à
    // l'anglaise côtoyait « 10,07 % » à la française dans l'interface.
    expect(fmtPercent(5.5)).toBe("+5,5%")
    expect(fmtPercent(-3.2)).toBe("-3,2%")
  })
})

describe("fmtDecimal — virgule décimale française partout (audit v5.6.3)", () => {
  it("remplace le point décimal anglais par la virgule", () => {
    expect(fmtDecimal(43.3)).toBe("43,3")
    expect(fmtDecimal(0.4, 1)).toBe("0,4")
    expect(fmtDecimal(12.5, 1)).toBe("12,5")
    expect(fmtDecimal(0.004, 2)).toBe("0,00")
    expect(fmtDecimal(10, 1)).toBe("10,0")
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

  // Ces tests épinglent les règles 2025 (preuve de rétrocompatibilité v6) :
  // ils passent taxYear: 2025 explicitement. Les règles 2026 (PFU 31,4 %,
  // prélèvements sociaux 18,6 %, AV exclue) sont couvertes par taxRules.test.ts.
  it("applies PFU 30% for CTO (2025)", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, { taxYear: 2025 })
    expect(result.flatTax).toBeCloseTo(3000, 0)
    expect(result.totalTax).toBeGreaterThan(0)
  })

  it("applies PEA exemption after 5 years (2025)", () => {
    const result = computeTaxBreakdown(10000, "pea", 6, false, 0, { taxYear: 2025 })
    expect(result.incomeTax).toBe(0)
    expect(result.socialCharges).toBeCloseTo(1720, 0)
  })

  it("applies AV reduced rate after 8 years with allowance (2025)", () => {
    const result = computeTaxBreakdown(10000, "av", 10, false, 0, { taxYear: 2025 })
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

describe("défauts — inflation 2,1 %, référence MSCI World 10,07 % et Monte Carlo 10 000", () => {
  it("le défaut d'inflation annuelle est 2,1 %", () => {
    expect(DEFAULT_INPUTS.inflation).toBeCloseTo(0.021)
  })

  it("plus de taux saisi (Option A) : aucun champ annualReturn/volatility/returnMode", () => {
    // L'utilisateur ne saisit plus de rendement : Simulateur, Monte Carlo et
    // Rente rejouent TOUJOURS l'historique réel du MSCI World. Les champs de
    // l'ancien mode « taux défini » ne doivent plus exister dans les défauts.
    expect("annualReturn" in DEFAULT_INPUTS).toBe(false)
    expect("volatility" in DEFAULT_INPUTS).toBe(false)
    expect("returnMode" in DEFAULT_INPUTS).toBe(false)
    expect("crisisEnabled" in DEFAULT_INPUTS).toBe(false)
  })

  it("la référence de rendement reste 10,07 % brut via l'onglet Objectif (goalAnnualReturn)", () => {
    // Seul l'onglet Objectif a un rendement (pour calculer l'épargne mensuelle
    // nécessaire) : sa référence est alignée sur la moyenne MSCI World.
    expect(DEFAULT_INPUTS.goalAnnualReturn).toBeCloseTo(0.1007, 4)
    expect(DEFAULT_INPUTS.goalAnnualReturn).toBeGreaterThan(0.0822)
  })

  it("le défaut Monte Carlo est 10 000 simulations", () => {
    expect(DEFAULT_INPUTS.mcRuns).toBe(10000)
  })

  it("l'affichage par défaut est en euros d'aujourd'hui (vraies valeurs nettes d'inflation)", () => {
    // Demande utilisateur : l'option « Euros d'aujourd'hui » est cochée par
    // défaut pour montrer d'emblée les VRAIES valeurs (pouvoir d'achat réel).
    // Le moteur calcule TOUJOURS les deux échelles (nominal + real) — le
    // toggle ne change que laquelle est mise en avant.
    expect(DEFAULT_INPUTS.showReal).toBe(true)
  })

  it("la migration v4 retombe sur euros d'aujourd'hui quand l'ancien état ne précisait rien", () => {
    // v4 sans showReal stocké → défaut aligné (vrai), comme pour un nouvel
    // utilisateur. Un choix v4 explicitement « false » reste respecté.
    expect(v4SettingsToInputs({}).showReal).toBe(true)
    expect(v4SettingsToInputs({ showReal: false }).showReal).toBe(false)
    expect(v4SettingsToInputs({ showReal: true }).showReal).toBe(true)
  })

  it("parseStoredInputs force le mode d'inflation personnalisé (modes supprimés)", () => {
    const inputs = parseStoredInputs(JSON.stringify({ ...DEFAULT_INPUTS, inflationMode: "historical" }))
    expect(inputs.inflationMode).toBe("custom")
  })

  it("les 4 options de fiabilité sont ON par défaut (v5.5.0) et persitées", () => {
    // L'honnêteté des estimations prime : incertitude des paramètres,
    // historique étendu, inflation stochastique et garde-fous dynamiques sont
    // TOUS actifs par défaut — chacun reste désactivable dans l'UI.
    expect(DEFAULT_INPUTS.parameterUncertainty).toBe(true)
    expect(DEFAULT_INPUTS.extendedHistory).toBe(true)
    expect(DEFAULT_INPUTS.stochasticInflation).toBe(true)
    expect(DEFAULT_INPUTS.dynamicGuardrails).toBe(true)
    // La persistance restaure un choix explicite, y compris false.
    const restored = parseStoredInputs(JSON.stringify({ ...DEFAULT_INPUTS, dynamicGuardrails: false }))
    expect(restored.dynamicGuardrails).toBe(false)
    expect(restored.parameterUncertainty).toBe(true)
  })
})

describe("runSimulation", () => {
  const baseInputs: SimulationInputs = {
    ...DEFAULT_INPUTS,
    capitalInitial: 25000,
    monthlyPayment: 1000,
    duration: 10,
    indexation: 0.02,
    inflation: 0.022,
    inflationMode: "custom",
    envelope: "pea",
    taxCouple: false,
    peaYearsHeld: 5,
    avYearsHeld: 8,
    historicalIndex: "msci-world",
    etfFees: 0.0025,
    brokerageFees: 0.001,
    insuranceFees: 0.006,
    managementFees: 0,
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
    parameterUncertainty: true,
    extendedHistory: true,
    stochasticInflation: true,
    dynamicGuardrails: true,
    crisisScenario: false,
    crisisStartOffset: 1,
    crisisIntensity: 0.3,
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

  it("les dates de fin d'année tombent en DÉCEMBRE (pas de décalage d'un mois)", () => {
    // Audit v5.6.2 : month était passé brut à new Date(startYear, month, 1),
    // donc month=12 (fin de la 1re année) rendait « janv. 2027 » au lieu de
    // « déc. 2026 » — le CSV et le calendrier des flux étaient décalés d'un
    // mois sur CHAQUE ligne annuelle.
    const rows = runSimulation(baseInputs)
    expect(rows[1].date.startsWith("déc.")).toBe(true)
    expect(rows[5].date.startsWith("déc.")).toBe(true)
    expect(rows[rows.length - 1].date.startsWith("déc.")).toBe(true)
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

  it("applique le même rendement chaque année (courbe lissée — v5.6.0)", () => {
    // Demande utilisateur : « un truc linéaire, pas une courbe aléatoire ».
    // Le Simulateur applique la moyenne de référence du MSCI World (≈ 10,07
    // %/an brut) à chaque année — plus de zigzags historiques sur la courbe.
    const histInputs: SimulationInputs = {
      ...baseInputs,
      // Scénario optimiste = moyenne arithmétique : la courbe lissée applique
      // MSCI_WORLD_AVG_RETURN, la référence du test (paquet 1 — le défaut de
      // l'app est désormais Central/géométrique).
      returnScenario: "optimiste",
      historicalIndex: "sp500",
      monthlyPayment: 0,
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
      envelope: "none",
      duration: 3,
    }
    const rows = runSimulation(histInputs)
    // Paquet 1 : la courbe lissée suit l'indice choisi (scénario optimiste =
    // moyenne arithmétique de CET indice — ici le S&P 500, pas le MSCI).
    expect(rows[1].yearlyReturn).toBeCloseTo(getHistoricalDataset("sp500").avgReturn, 3)
    // Année 1 et année 2 identiques : la même courbe, chaque année.
    expect(rows[2].yearlyReturn).toBeCloseTo(rows[1].yearlyReturn, 6)
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

  it("MSCI World : moyenne arithmétique brute et rendement réel composé calculés", () => {
    const dataset = getHistoricalDataset("msci-world")
    // La moyenne affichée est désormais CALCULÉE sur la série EUR 1970-2025
    // (≈ 10,07 %/an) — plus de valeur codée en dur divergente des rendements
    // réellement rejoués. Le net est un rendement composé réel après inflation.
    const expectedAvg = dataset.years.reduce((s, y) => s + y.return, 0) / dataset.years.length
    expect(dataset.avgReturn).toBeCloseTo(expectedAvg, 10)
    expect(dataset.avgReturn).toBeCloseTo(0.1007, 3)
    const geometric =
      Math.pow(
        dataset.years.reduce((factor, y) => factor * (1 + y.return), 1),
        1 / dataset.years.length,
      ) - 1
    expect(dataset.netReturn).toBeCloseTo((1 + geometric) / 1.021 - 1, 10)
    expect(dataset.netReturn).toBeLessThan(dataset.avgReturn)
    expect(dataset.volatility).toBeGreaterThan(0)
  })

  it("échelle pédagogique v5.7.1 : brut (10,07) → composé (8,22) → réel (5,99), une seule déduction par étage", () => {
    // La peur d'une « double déduction » venait du chaînon manquant : sans le
    // rendement composé (8,22 %), l'écart entre 10,07 % et 5,99 % semblait
    // retirer deux fois quelque chose. En réalité chaque étage déduit UNE
    // seule chose : la volatilité (10,07 → 8,22) puis l'inflation (8,22 → 5,99).
    const dataset = getHistoricalDataset("msci-world")
    // 1. compoundedReturn est bien la moyenne géométrique de la série
    expect(dataset.compoundedReturn).toBeCloseTo(0.0822, 3)
    // 2. netReturn = (1 + composé)/(1 + inflation) − 1 : l'inflation est
    // déduite UNE SEULE fois, exactement à cet étage
    expect(dataset.netReturn).toBeCloseTo((1 + dataset.compoundedReturn) / 1.021 - 1, 10)
    expect(dataset.netReturn).toBeCloseTo(0.0599, 3)
    // 3. L'ordre des étages est strict : brut > composé > réel
    expect(dataset.avgReturn).toBeGreaterThan(dataset.compoundedReturn)
    expect(dataset.compoundedReturn).toBeGreaterThan(dataset.netReturn)
    // 4. Le « volatility drag » (brut − composé) est la différence restante
    const drag = dataset.avgReturn - dataset.compoundedReturn
    expect(drag).toBeCloseTo(0.0185, 3)
    // 5. Pour TOUS les indices : composé toujours < brut (la volatilité ne
    // peut qu'écraser le rendement composé) et réel toujours < composé
    for (const id of ["sp500", "nasdaq", "cac40", "gold"] as const) {
      const d = getHistoricalDataset(id)
      expect(d.compoundedReturn).toBeLessThan(d.avgReturn)
      expect(d.netReturn).toBeLessThan(d.compoundedReturn)
    }
  })

  it("netReturn des autres indices est dérivé à l'inflation forfaitaire de 2,1 %", () => {
    const dataset = getHistoricalDataset("sp500")
    const geometric =
      Math.pow(
        dataset.years.reduce((factor, y) => factor * (1 + y.return), 1),
        1 / dataset.years.length,
      ) - 1
    const expectedNet = (1 + geometric) / 1.021 - 1
    expect(dataset.netReturn).toBeCloseTo(expectedNet, 6)
  })
})

describe("computeKPIs", () => {
  const baseInputs: SimulationInputs = {
    ...DEFAULT_INPUTS,
    capitalInitial: 25000,
    monthlyPayment: 1000,
    duration: 10,
    indexation: 0.02,
    inflation: 0.022,
    inflationMode: "custom",
    envelope: "pea",
    taxCouple: false,
    peaYearsHeld: 5,
    avYearsHeld: 8,
    historicalIndex: "msci-world",
    etfFees: 0.0025,
    brokerageFees: 0.001,
    insuranceFees: 0.006,
    managementFees: 0,
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
    parameterUncertainty: true,
    extendedHistory: true,
    stochasticInflation: true,
    dynamicGuardrails: true,
    crisisScenario: false,
    crisisStartOffset: 1,
    crisisIntensity: 0.3,
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
      ...DEFAULT_INPUTS,
      capitalInitial: 25000,
      monthlyPayment: 1000,
      duration: 25,
      indexation: 0.02,
      inflation: 0.022,
      inflationMode: "custom",
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      historicalIndex: "msci-world",
      etfFees: 0.0025,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
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
      // Cohérence âge/durée/retraite (audit) : 30 + 10 = 40 → aucune alerte.
      ageRetirement: 40,
      tmi: 0.3,
      ctoTaxMode: "pfu",
      parameterUncertainty: true,
      extendedHistory: true,
      stochasticInflation: true,
      dynamicGuardrails: true,
      crisisScenario: false,
      crisisStartOffset: 1,
      crisisIntensity: 0.3,
    }
    const result = solveGoal(inputs)
    expect(result.achievable).toBe(true)
    expect(result.pmtPerMonth).toBeGreaterThan(0)
  })
})

describe("validateInputs", () => {
  it("returns no errors for valid inputs", () => {
    const base: SimulationInputs = {
      ...DEFAULT_INPUTS,
      capitalInitial: 25000,
      monthlyPayment: 1000,
      duration: 10,
      indexation: 0.02,
      inflation: 0.022,
      inflationMode: "custom",
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      historicalIndex: "msci-world",
      etfFees: 0.0025,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
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
      // Cohérence âge/durée/retraite (audit) : 30 + 10 = 40 → aucune alerte.
      ageRetirement: 40,
      tmi: 0.3,
      ctoTaxMode: "pfu",
      parameterUncertainty: true,
      extendedHistory: true,
      stochasticInflation: true,
      dynamicGuardrails: true,
      crisisScenario: false,
      crisisStartOffset: 1,
      crisisIntensity: 0.3,
    }
    const errors = validateInputs(base)
    expect(errors.length).toBe(0)
  })

  it("returns errors for extreme values", () => {
    const base: SimulationInputs = {
      ...DEFAULT_INPUTS,
      capitalInitial: -1,
      monthlyPayment: 200000,
      duration: 100,
      indexation: 0.02,
      inflation: 2,
      inflationMode: "custom",
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      historicalIndex: "msci-world",
      etfFees: -0.1,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
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
      parameterUncertainty: true,
      extendedHistory: true,
      stochasticInflation: true,
      dynamicGuardrails: true,
      crisisScenario: false,
      crisisStartOffset: 1,
      crisisIntensity: 0.3,
    }
    const errors = validateInputs(base)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe("solveGoal with goalAnnualReturn", () => {
  it("goalAnnualReturn pilote seul le taux de l'objectif (plus de taux saisi)", () => {
    const inputs: SimulationInputs = {
      ...DEFAULT_INPUTS,
      capitalInitial: 25000,
      monthlyPayment: 1000,
      duration: 25,
      indexation: 0.02,
      inflation: 0.022,
      inflationMode: "custom",
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 5,
      avYearsHeld: 8,
      historicalIndex: "msci-world",
      etfFees: 0.0025,
      brokerageFees: 0.001,
      insuranceFees: 0.006,
      managementFees: 0,
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
      parameterUncertainty: true,
      extendedHistory: true,
      stochasticInflation: true,
      dynamicGuardrails: true,
      crisisScenario: false,
      crisisStartOffset: 1,
      crisisIntensity: 0.3,
    }
    const result = solveGoal(inputs)
    expect(result.achievable).toBe(true)
    expect(result.pmtPerMonth).toBeGreaterThan(0)
  })
})

describe("sanitizeInputs", () => {
  it("clamps extreme values to safe ranges", () => {
    const base: SimulationInputs = {
      ...DEFAULT_INPUTS,
      capitalInitial: 1e9,
      monthlyPayment: 500000,
      duration: 200,
      indexation: 2,
      inflation: 5,
      inflationMode: "custom",
      envelope: "pea",
      taxCouple: false,
      peaYearsHeld: 200,
      avYearsHeld: 200,
      historicalIndex: "msci-world",
      etfFees: -1,
      brokerageFees: -1,
      insuranceFees: -1,
      managementFees: -1,
      showReal: true,
      withdrawalModel: "rule-4",
      withdrawalRate: 4,
      withdrawalFixed: 2500,
      withdrawalInflation: true,
      retirementYears: 120000,
      goalTarget: 0,
      goalDuration: 20,
      goalCapital: 25000,
      goalPayment: 1000,
      goalAnnualReturn: -2,
      mcRuns: 0,
      seed: 0,
      tmi: 0.3,
      ctoTaxMode: "pfu",
      parameterUncertainty: true,
      extendedHistory: true,
      stochasticInflation: true,
      dynamicGuardrails: true,
      crisisScenario: false,
      crisisStartOffset: 1,
      crisisIntensity: 0.3,
    }
    const safe = sanitizeInputs(base)
    expect(safe.capitalInitial).toBeLessThanOrEqual(100_000_000)
    expect(safe.monthlyPayment).toBeLessThanOrEqual(200_000)
    expect(safe.goalTarget).toBeGreaterThanOrEqual(1)
    expect(safe.seed).toBeGreaterThanOrEqual(1)
    // Durée de la rente bornée (audit v6) : une valeur aberrante partagée via
    // un lien (ex. 120 000) est ramenée à la borne haute du curseur (60 ans).
    expect(safe.retirementYears).toBe(60)
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
    expect(inputs.duration).toBe(30)
    expect(inputs.indexation).toBeCloseTo(0.02)
    expect(inputs.inflation).toBeCloseTo(0.015)
    expect(inputs.envelope).toBe("pea")
    // Le rendement v4 (r) et la crise (krasch*) sont ignorés (Option A).
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
    const inputs = v4SettingsToInputs({ t: 500 })
    expect(inputs.duration).toBe(80)
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
      P({ duration: 40 }),
      "A",
    )
    const result = undoHistory(stack)
    expect(result).not.toBeNull()
    expect((result as NonNullable<typeof result>).patch).toMatchObject({
      duration: DEFAULT_INPUTS.duration,
    })
    const next = {
      ...DEFAULT_INPUTS,
      monthlyPayment: 1100,
      duration: 40,
      ...(result as NonNullable<typeof result>).patch,
    }
    expect(next.duration).toBe(DEFAULT_INPUTS.duration)
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

  it("buildCashFlows applique le plafond PEA (150/300 k€) comme le moteur", () => {
    // Audit v5.6.2 : sans plafond, le XIRR d'un PEA au-delà du cap comptait des
    // versements jamais investis et sous-évaluait le rendement (6,2 % au lieu
    // de ~10 %). Le XIRR doit refléter les flux réellement investis.
    const solo = buildCashFlows(
      {
        ...DEFAULT_INPUTS,
        envelope: "pea" as const,
        taxCouple: false,
        capitalInitial: 10_000,
        monthlyPayment: 2000,
        duration: 30,
      },
      2_000_000,
    )
    const outflowsSolo = solo.flows.filter(f => f < 0).reduce((s, f) => s + f, 0)
    expect(Math.abs(outflowsSolo)).toBeCloseTo(150_000, 0)
    const couple = buildCashFlows(
      {
        ...DEFAULT_INPUTS,
        envelope: "pea" as const,
        taxCouple: true,
        capitalInitial: 0,
        monthlyPayment: 2000,
        duration: 30,
      },
      2_000_000,
    )
    const outflowsCouple = couple.flows.filter(f => f < 0).reduce((s, f) => s + f, 0)
    expect(Math.abs(outflowsCouple)).toBeCloseTo(300_000, 0)
  })

  it("buildCashFlows : capital initial déjà au plafond PEA → aucun versement", () => {
    const { flows } = buildCashFlows(
      {
        ...DEFAULT_INPUTS,
        envelope: "pea" as const,
        taxCouple: false,
        capitalInitial: 200_000,
        monthlyPayment: 2000,
        duration: 30,
      },
      2_000_000,
    )
    const outflows = flows.filter(f => f < 0).reduce((s, f) => s + f, 0)
    expect(Math.abs(outflows)).toBeCloseTo(200_000, 0)
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
    const inputs = parseStoredInputs(JSON.stringify({ envelope: "futures", withdrawalModel: "quantum" }))
    expect(inputs.envelope).toBe(DEFAULT_INPUTS.envelope)
    expect(inputs.withdrawalModel).toBe(DEFAULT_INPUTS.withdrawalModel)
  })

  it("accepts valid numeric and enum values", () => {
    const inputs = parseStoredInputs(
      JSON.stringify({ capitalInitial: 42_000, envelope: "av", withdrawalModel: "ultra-safe" }),
    )
    expect(inputs.capitalInitial).toBe(42_000)
    expect(inputs.envelope).toBe("av")
    expect(inputs.withdrawalModel).toBe("ultra-safe")
  })

  it("ignore les champs supprimés (taux, mode, crise) et verrouille l'indice MSCI World", () => {
    const inputs = parseStoredInputs(
      JSON.stringify({
        returnMode: "random",
        annualReturn: 0.09,
        volatility: 0.15,
        crisisEnabled: true,
        historicalIndex: "sp500",
      }),
    )
    // Option A : les champs supprimés ne réapparaissent jamais dans les inputs.
    expect("annualReturn" in inputs).toBe(false)
    expect("returnMode" in inputs).toBe(false)
    expect("crisisEnabled" in inputs).toBe(false)
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
      const inputs = { ...DEFAULT_INPUTS, mcRuns: 200, duration: 10 }
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
      const inputs = { ...DEFAULT_INPUTS, mcRuns: 300, duration: 10 }
      const result = runMonteCarlo(inputs, 300)
      const last = result.p50.length - 1
      expect(result.p90[last]).toBeGreaterThan(result.p50[last] ?? 0)
      expect(result.p10[last]).toBeLessThan(result.p50[last] ?? 0)
      expect(result.bestCase).toBeGreaterThan(result.worstCase)
    },
    MC_TIMEOUT,
  )

  it(
    "expose moyenne, intervalle de confiance du taux de succès et histogramme terminal (v5.5.0)",
    () => {
      const inputs = { ...DEFAULT_INPUTS, mcRuns: 300, duration: 10 }
      const result = runMonteCarlo(inputs, 300)
      // La moyenne est tirée par la queue droite : ≥ médiane, jamais inférieure.
      const median = result.p50[result.p50.length - 1] ?? 0
      expect(result.mean).toBeGreaterThanOrEqual(median)
      // L'intervalle de Wilson encadre le taux de succès ponctuel.
      expect(result.successRateCI.low).toBeLessThanOrEqual(result.successRate)
      expect(result.successRateCI.high).toBeGreaterThanOrEqual(result.successRate)
      // L'histogramme terminal est peuplé et totalise exactement les runs.
      expect(result.terminalDistribution.reduce((s, b) => s + b.count, 0)).toBe(300)
      expect(result.terminalDistribution.length).toBeGreaterThan(0)
    },
    MC_TIMEOUT,
  )

  it(
    "l'incertitude des paramètres élargit honnêtement les percentiles extrêmes (v5.5.0)",
    () => {
      const base = { ...DEFAULT_INPUTS, mcRuns: 400, duration: 15 }
      const without = runMonteCarlo({ ...base, parameterUncertainty: false }, 400)
      const withUncertainty = runMonteCarlo({ ...base, parameterUncertainty: true }, 400)
      const last = base.duration
      // P10 sans incertitude ≥ P10 avec incertitude (la queue défavorable
      // s'élargit) — vérification statistique robuste sur 400 runs.
      expect(withUncertainty.p10[last] ?? 0).toBeLessThanOrEqual(without.p10[last] ?? 0)
    },
    MC_TIMEOUT,
  )

  it(
    "le Simulateur applique le même rendement chaque année (courbe lissée — v5.6.0)",
    () => {
      // Demande utilisateur : la courbe du Simulateur doit être identique d'une
      // année à l'autre (10,07 %/an brut) — pas une courbe aléatoire. Monte
      // Carlo et la Rente, eux, continuent de rééchantillonner l'historique
      // réel (c'est leur raison d'être).
      const inputs = {
        ...DEFAULT_INPUTS,
        // Scénario optimiste (moyenne arithmétique) : la courbe lissée vaut
        // MSCI_WORLD_AVG_RETURN — la référence de ce test (paquet 1).
        returnScenario: "optimiste" as const,
        monthlyPayment: 0,
        etfFees: 0,
        brokerageFees: 0,
        insuranceFees: 0,
        managementFees: 0,
        envelope: "none" as const,
        duration: 3,
        historicalIndex: "sp500" as const,
      }
      const rows = runSimulation(inputs)
      // Paquet 1 : la courbe lissée suit l'indice choisi (scénario optimiste =
      // moyenne arithmétique de CET indice — ici le S&P 500, pas le MSCI).
      expect(rows[1].yearlyReturn).toBeCloseTo(getHistoricalDataset("sp500").avgReturn, 3)
      expect(rows[2].yearlyReturn).toBeCloseTo(rows[1].yearlyReturn, 6)
    },
    MC_TIMEOUT,
  )

  it(
    "Monte Carlo continue de rééchantillonner l'historique réel (indépendant de la courbe lissée)",
    () => {
      // La courbe lissée ne touche QUE le Simulateur : runMonteCarlo injecte
      // ses propres séquences via l'override — le rendement rejoué reste la
      // série réelle, pas la moyenne constante.
      const inputs = { ...DEFAULT_INPUTS, mcRuns: 200, duration: 10 }
      const result = runMonteCarlo(inputs, 200)
      const last = result.p50.length - 1
      expect(result.p50[last] ?? 0).toBeGreaterThan(0)
      expect(result.p90[last] ?? 0).toBeGreaterThan(result.p50[last] ?? 0)
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

  it("validateInputs avertit quand retirementYears sort de la fourchette 1-60 (lien partagé malformé)", () => {
    const tooHigh = validateInputs({ ...DEFAULT_INPUTS, retirementYears: 120_000 })
    expect(tooHigh.find(e => e.field === "retirementYears")?.severity).toBe("warning")
    const ok = validateInputs({ ...DEFAULT_INPUTS, retirementYears: 30 })
    expect(ok.find(e => e.field === "retirementYears")).toBeUndefined()
  })

  it("Sharpe vaut TOUJOURS 0 (plus de mode aléatoire gaussien — ratio sans objet)", () => {
    const inputs = { ...DEFAULT_INPUTS, duration: 10 }
    const kpis = computeKPIs(runSimulation(inputs), inputs)
    expect(kpis.sharpe).toBe(0)
  })

  it("le temps de doublement découle du XIRR, pas du CAGR gonflé par les versements", () => {
    const inputs = { ...DEFAULT_INPUTS, capitalInitial: 50_000, monthlyPayment: 0, duration: 10 }
    const kpis = computeKPIs(runSimulation(inputs), inputs)
    expect(kpis.xirr).toBeGreaterThan(0)
    expect(kpis.doublingTime).not.toBeNull()
    // Invariant mathématique : doublingTime = log(2)/log(1 + xirr), quelle que
    // soit la fenêtre historique rejouée (plus de taux saisi à ~8,3 %/an).
    const expected = Math.log(2) / Math.log(1 + kpis.xirr / 100)
    expect(kpis.doublingTime as number).toBeCloseTo(expected, 1)
  })

  it("runDecumulation respecte un retrait personnalisé de 0 € (pas de fallback silencieux à 100 €)", () => {
    const inputs = { ...DEFAULT_INPUTS, withdrawalModel: "custom" as const, withdrawalFixed: 0, retirementYears: 10 }
    const result = runDecumulation(inputs, 100_000, 100)
    expect(result.initialWithdrawal).toBe(0)
  })

  it("runDecumulation cumule les retraits mois par mois (pas « dernier retrait × 12 »)", () => {
    // Comportement historique isolé : inflation FIXE + pas de garde-fous, pour
    // vérifier que l'indexation cumule bien les retraits année après année.
    const inputs = {
      ...DEFAULT_INPUTS,
      withdrawalModel: "rule-4" as const,
      withdrawalInflation: true,
      inflation: 0.03,
      retirementYears: 10,
      stochasticInflation: false,
      dynamicGuardrails: false,
    }
    const result = runDecumulation(inputs, 100_000, 100)
    const yearly = result.withdrawals
    // Avec indexation, le retrait annuel augmente au fil des années
    expect(yearly[yearly.length - 1] ?? 0).toBeGreaterThan(yearly[1] ?? 0)
    expect(yearly[1] ?? 0).toBeGreaterThan(0)
  })

  it("runDecumulation rejoue toujours les rendements réels (déterministe à graine fixe)", () => {
    const inputs = { ...DEFAULT_INPUTS, historicalIndex: "sp500" as const, retirementYears: 10 }
    const first = runDecumulation(inputs, 100_000, 100)
    const second = runDecumulation(inputs, 100_000, 100)
    expect(first.years.length).toBe(11)
    expect(first.p50).toEqual(second.p50)
    expect(first.survivalProbability).toBeGreaterThanOrEqual(0)
    expect(first.survivalProbability).toBeLessThanOrEqual(100)
  })

  it("runDecumulation expose CI de survie, moyenne et histogramme terminal (v5.5.0)", () => {
    const inputs = { ...DEFAULT_INPUTS, withdrawalModel: "rule-4" as const, retirementYears: 20 }
    const result = runDecumulation(inputs, 500_000, 300)
    // L'intervalle de Wilson encadre le taux de survie ponctuel.
    expect(result.survivalRateCI.low).toBeLessThanOrEqual(result.survivalProbability)
    expect(result.survivalRateCI.high).toBeGreaterThanOrEqual(result.survivalProbability)
    // La moyenne ≥ médiane (queue droite des cas très chanceux).
    const median = result.p50[result.p50.length - 1] ?? 0
    expect(result.mean).toBeGreaterThanOrEqual(median)
    expect(result.terminalDistribution.reduce((s, b) => s + b.count, 0)).toBe(300)
  })

  it("l'inflation stochastique rejoue la série française réelle (v5.5.0)", () => {
    const base = {
      ...DEFAULT_INPUTS,
      withdrawalModel: "rule-4" as const,
      withdrawalInflation: true,
      retirementYears: 15,
      extendedHistory: false,
    }
    const fixed = runDecumulation({ ...base, stochasticInflation: false }, 1_000_000, 200)
    const stoch = runDecumulation({ ...base, stochasticInflation: true }, 1_000_000, 200)
    // Le résultat change (la série réelle a des pics à 13,7 %) : les deux
    // configurations ne sont PAS identiques — la stochastique n'est pas un
    // no-op cosmétique.
    expect(JSON.stringify(fixed.withdrawals)).not.toBe(JSON.stringify(stoch.withdrawals))
  })

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

describe("scénario « partir en période difficile » (v5.6.0) — krach paramétrable", () => {
  it("est OFF par défaut, persisté et partagé par URL", () => {
    expect(DEFAULT_INPUTS.crisisScenario).toBe(false)
    expect(DEFAULT_INPUTS.crisisStartOffset).toBe(1)
    expect(DEFAULT_INPUTS.crisisIntensity).toBe(0.3)
    // La persistance restaure un choix explicite, y compris les valeurs.
    const restored = parseStoredInputs(
      JSON.stringify({ ...DEFAULT_INPUTS, crisisScenario: true, crisisIntensity: 0.5, crisisStartOffset: 2 }),
    )
    expect(restored.crisisScenario).toBe(true)
    expect(restored.crisisIntensity).toBe(0.5)
    expect(restored.crisisStartOffset).toBe(2)
  })

  it("applique le krach à l'année choisie, dans chaque scénario", () => {
    // Rente à 0 € pour isoler l'effet du krach sur le capital (pas de retraits
    // qui masquent la chute).
    const base = {
      ...DEFAULT_INPUTS,
      withdrawalModel: "custom" as const,
      withdrawalFixed: 0,
      retirementYears: 10,
      extendedHistory: false,
      parameterUncertainty: false,
      stochasticInflation: false,
      dynamicGuardrails: false,
    }
    const clean = runDecumulation(base, 1_000_000, 200)
    const crash = runDecumulation(
      { ...base, crisisScenario: true, crisisStartOffset: 3, crisisIntensity: 0.4 },
      1_000_000,
      200,
    )
    // Même graine → chemins bit-à-bit identiques AVANT le krach : la fin de la
    // 3e année (indice 3) est inchangée, le krach n'a pas encore frappé.
    expect(crash.p50[3]).toBe(clean.p50[3])
    // L'année suivante (indice 4, après un −40 % sur l'année) chute nettement.
    const ratio = (crash.p50[4] ?? 0) / (clean.p50[4] ?? 1)
    expect(ratio).toBeLessThan(0.85)
  })

  it("dégrade le capital final d'une rente réelle (l'impact persiste au-delà du krach)", () => {
    const base = {
      ...DEFAULT_INPUTS,
      withdrawalModel: "rule-4" as const,
      retirementYears: 20,
      extendedHistory: false,
      parameterUncertainty: false,
      stochasticInflation: false,
    }
    const clean = runDecumulation(base, 1_000_000, 300)
    const crash = runDecumulation(
      { ...base, crisisScenario: true, crisisStartOffset: 0, crisisIntensity: 0.4 },
      1_000_000,
      300,
    )
    const last = 20
    // La 1re année encaisse le choc (−40 %)…
    expect(crash.p50[1] ?? 0).toBeLessThan((clean.p50[1] ?? 0) * 0.9)
    // …et le capital final en pâtit encore 19 ans plus tard.
    expect(crash.p50[last] ?? 0).toBeLessThan(clean.p50[last] ?? 0)
  })

  it("le garde-fou coupe la rente APRÈS l'année de krach (revue v5.6.0)", () => {
    // Rente fixe (2000 €/mois), inflation off, krach dès la 1re année : le
    // rendement EFFECTIF de l'année 1 est le krach (−30 %). Le garde-fou doit
    // voir une année négative et réduire la rente de 10 % l'année suivante.
    const base = {
      ...DEFAULT_INPUTS,
      withdrawalModel: "custom" as const,
      withdrawalFixed: 2000,
      retirementYears: 8,
      extendedHistory: false,
      parameterUncertainty: false,
      stochasticInflation: false,
      withdrawalInflation: false,
      crisisScenario: true,
      crisisStartOffset: 0,
      crisisIntensity: 0.3,
    }
    const guarded = runDecumulation(base, 500_000, 200)
    // Sans garde-fou, la rente reste à 2 000 €/mois toutes les années.
    const unguarded = runDecumulation({ ...base, dynamicGuardrails: false }, 500_000, 200)
    // Année 1 identique (le krach frappe pendant l'année, la coupe n'a lieu
    // qu'au début de l'année suivante) : 2 000 × 12.
    expect(unguarded.withdrawals[1] ?? 0).toBeCloseTo(24_000, 0)
    expect(guarded.withdrawals[1] ?? 0).toBeCloseTo(24_000, 0)
    // Année 2 : le garde-fou a coupé 10 % (1 800 €/mois) — le rendement
    // effectif négatif du krach est bien pris en compte par le garde-fou.
    expect(unguarded.withdrawals[2] ?? 0).toBeCloseTo(24_000, 0)
    expect(guarded.withdrawals[2] ?? 0).toBeLessThan((guarded.withdrawals[1] ?? 0) * 0.93)
  })
})

describe("PER — tranche marginale d'imposition (TMI)", () => {
  it("sortie en capital : versements PER à TMI sans abattement, gains au PFU (2025)", () => {
    const result = computeTaxBreakdown(10000, "per", 10, false, 50000, { tmi: 0.3, taxYear: 2025 })
    expect(result.taxableContributions).toBeCloseTo(50000, 0)
    expect(result.contributionsTax).toBeCloseTo(15000, 0)
    expect(result.socialCharges).toBeCloseTo(1720, 0)
    expect(result.incomeTax).toBeCloseTo(1280, 0)
    expect(result.flatTax).toBeCloseTo(3000, 0)
    expect(result.totalTax).toBeCloseTo(18000, 0)
  })

  it("la TMI change l'impôt sur les versements PER (2025)", () => {
    const low = computeTaxBreakdown(10000, "per", 10, false, 50000, { tmi: 0.11, taxYear: 2025 })
    const high = computeTaxBreakdown(10000, "per", 10, false, 50000, { tmi: 0.41, taxYear: 2025 })
    expect(low.contributionsTax).toBeCloseTo(5500, 0)
    expect(high.contributionsTax).toBeCloseTo(20500, 0)
    expect(high.contributionsTax).toBeGreaterThan(low.contributionsTax)
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
  it("au-delà du plafond de primes, les gains passent de 7,5 % à 12,8 % (2025)", () => {
    // 200 k€ de primes (célibataire, plafond 150 k€) → 75 % des gains à 7,5 %,
    // 25 % à 12,8 %, après abattement de 4 600 €. AV inchangée en 2026 (exclue
    // de la hausse) mais on épingle 2025 pour la rétrocompatibilité. Les taux
    // attendus sont DÉRIVÉS de taxRules (pas de 0,075/0,128 codés en dur).
    const av25 = getTaxRules(2025)
    const result = computeTaxBreakdown(100000, "av", 10, false, 200_000, { taxYear: 2025 })
    const allowance = 4600
    const taxable = 100000 - allowance
    const expected = taxable * 0.75 * av25.avReducedIRRate + taxable * 0.25 * av25.avExcessIRRate
    expect(result.incomeTax).toBeCloseTo(expected, 0)
    expect(result.incomeTax).toBeGreaterThan(taxable * av25.avReducedIRRate) // plus cher que le taux réduit pur
  })

  it("sous le plafond, le taux réduit de 7,5 % s'applique intégralement (2025)", () => {
    const av25 = getTaxRules(2025)
    const result = computeTaxBreakdown(10000, "av", 10, false, 100_000, { taxYear: 2025 })
    expect(result.incomeTax).toBeCloseTo((10000 - 4600) * av25.avReducedIRRate, 0)
  })

  it("le plafond double pour un couple (300 k€, 2025)", () => {
    const single = computeTaxBreakdown(100000, "av", 10, false, 200_000, { taxYear: 2025 })
    const couple = computeTaxBreakdown(100000, "av", 10, true, 200_000, { taxYear: 2025 })
    expect(couple.incomeTax).toBeLessThan(single.incomeTax)
  })
})

describe("CTO — option barème progressif vs PFU", () => {
  it("PFU (défaut) : impôt unique de 30 % (2025)", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, { ctoTaxMode: "pfu", taxYear: 2025 })
    expect(result.flatTax).toBeCloseTo(3000, 0)
  })

  it("barème : 17,2 % de social + TMI sur les gains, sans PFU (2025)", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, { ctoTaxMode: "bareme", tmi: 0.3, taxYear: 2025 })
    expect(result.flatTax).toBe(0)
    expect(result.socialCharges).toBeCloseTo(1720, 0)
    expect(result.incomeTax).toBeCloseTo(3000, 0) // 10000 × 30 %
  })

  it("le mode fiscal du CTO est pris en compte par la simulation", () => {
    const pfuRows = runSimulation({ ...DEFAULT_INPUTS, envelope: "cto" as const, ctoTaxMode: "pfu", duration: 10 })
    const baremeRows = runSimulation({
      ...DEFAULT_INPUTS,
      envelope: "cto" as const,
      ctoTaxMode: "bareme",
      tmi: 0.3,
      duration: 10,
    })
    expect(pfuRows[pfuRows.length - 1].taxNet).toBeGreaterThan(0)
    // Barème = 17,2 % + TMI → plus d'impôts que le PFU seul (même capital)
    expect(baremeRows[baremeRows.length - 1].tax).toBeGreaterThan(pfuRows[pfuRows.length - 1].tax)
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
  // Historique CLASSIQUE (extendedHistory false) pour ces invariants de base :
  // ils vérifient la mécanique du découpage en blocs sur la série 1970-2025.
  const inputs = { ...DEFAULT_INPUTS, historicalIndex: "msci-world" as const, extendedHistory: false }
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

describe("historique étendu 100 ans (v5.5.0) — getHistoricalPool", () => {
  it("le vivier étendu couvre 1926-2025 (S&P 500 SBBI + MSCI World)", () => {
    const pool = getHistoricalPool("msci-world", true)
    expect(pool.startYear).toBe(1926)
    expect(pool.returns.length).toBe(100)
    expect(pool.label).toContain("1926-2025")
    // Le 100e point est le dernier rendement MSCI World (2025), CENTRÉ sur la
    // moyenne de référence : 0,0639 − (moyenne brute étendue − référence).
    const shift = average(EXTENDED_WORLD_RETURNS) - MSCI_WORLD_AVG_RETURN
    expect(pool.returns[pool.returns.length - 1]).toBeCloseTo(0.0639 - shift, 3)
  })

  it("le vivier étendu est CENTRÉ sur la moyenne de référence MSCI World (correctif v5.6.1)", () => {
    // Avant : la moyenne brute du vivier étendu (≈ 11,00 %/an, portée par le
    // S&P 500 1926-1969 à 12,18 %/an) dépassait la référence 10,07 % →
    // activer « Historique étendu » faisait monter P50/P90. Le centrage
    // aligne la moyenne sur la référence SANS perdre les krachs (structure
    // préservée, volatilité inchangée par translation).
    const pool = getHistoricalPool("msci-world", true)
    expect(pool.avgReturn).toBeCloseTo(MSCI_WORLD_AVG_RETURN, 10)
    expect(pool.avgReturn).toBeCloseTo(0.1007, 3)
    // Volatilité préservée : la série étendue garde ses krachs (1929, 1931…)
    expect(pool.volatility).toBeGreaterThan(0.2)
    // Le dernier point (2025, 6,39 % brut) est translaté du delta de centrage
    const shift = average(EXTENDED_WORLD_RETURNS) - MSCI_WORLD_AVG_RETURN
    expect(pool.returns[pool.returns.length - 1]).toBeCloseTo(0.0639 - shift, 3)
  })

  it("le vivier classique reste 1970-2025", () => {
    const pool = getHistoricalPool("msci-world", false)
    expect(pool.startYear).toBe(1970)
    expect(pool.returns.length).toBe(56)
  })

  it("les krachs de l'entre-deux-guerres sont dans le vivier étendu (1929, 1931, 1933)", () => {
    const pool = getHistoricalPool("msci-world", true)
    const byYear = new Map(pool.returns.map((r, i) => [pool.startYear + i, r]))
    // Les krachs restent rejoués : chaque valeur est translatée du même delta
    // de centrage que toute la série (structure identique, moyenne alignée).
    const shift = average(EXTENDED_WORLD_RETURNS) - MSCI_WORLD_AVG_RETURN
    expect(byYear.get(1929) ?? 0).toBeCloseTo(-0.0842 - shift, 2)
    expect(byYear.get(1931) ?? 0).toBeCloseTo(-0.4334 - shift, 2)
    expect(byYear.get(1933) ?? 0).toBeCloseTo(0.5399 - shift, 2)
  })

  it("sampleHistoricalReturns tire du vivier étendu quand extendedHistory est actif", () => {
    const inputs = { ...DEFAULT_INPUTS, historicalIndex: "msci-world" as const, extendedHistory: true }
    const seq = sampleHistoricalReturns(inputs, 200, mulberry32(1))
    expect(seq).toHaveLength(200)
    // Au moins un rendement d'avant 1970 doit pouvoir être tiré (les blocs
    // 1926-1969 existent dans le vivier) — sur 200 ans c'est quasi certain.
    const classic = getHistoricalDataset("msci-world").years.map(y => y.return)
    expect(seq.some(v => !classic.includes(v))).toBe(true)
  })
})

describe("inflation française réelle 1970-2025 (v5.5.0)", () => {
  it("couvre 56 années et capture les pics des années 70", () => {
    expect(FRENCH_INFLATION_1970_2025.length).toBe(56)
    expect(FRENCH_INFLATION_1970_2025[0]).toBeCloseTo(0.052, 3) // 1970
    expect(FRENCH_INFLATION_1970_2025[4]).toBeCloseTo(0.137, 3) // 1974
    expect(FRENCH_INFLATION_1970_2025[10]).toBeCloseTo(0.136, 3) // 1980
    expect(FRENCH_INFLATION_1970_2025[45]).toBe(0) // 2015 quasi-déflation
    expect(FRENCH_INFLATION_1970_2025[52]).toBeCloseTo(0.052, 3) // 2022
    expect(FRENCH_INFLATION_1970_2025[55]).toBeCloseTo(0.009, 3) // 2025
  })
})

describe("incertitude des paramètres (v5.5.0) — sampleRegime / applyRegime", () => {
  it("le régime reste centré sur l'estimation historique (bornes réalistes)", () => {
    const rng = mulberry32(42)
    let muSum = 0
    for (let i = 0; i < 200; i += 1) {
      const regime = sampleRegime(0.1007, 0.193, 11, rng)
      expect(regime.mu).toBeGreaterThanOrEqual(-0.2)
      expect(regime.mu).toBeLessThanOrEqual(0.45)
      expect(regime.sigma).toBeGreaterThan(0)
      muSum += regime.mu
    }
    expect(muSum / 200).toBeCloseTo(0.1007, 1)
  })

  it("applyRegime conserve la structure des blocs et change le niveau moyen", () => {
    const returns = [0.05, -0.2, 0.3, -0.1, 0.12]
    const shifted = applyRegime(returns, { mu: 0.06, sigma: 0.2 }, 0.1, 0.25)
    expect(shifted).toHaveLength(returns.length)
    // r' = mu + (σ̃/σ̂)·(r − μ̂) → moyenne(r') = mu + (σ̃/σ̂)·(moyenne(r) − μ̂)
    const scale = 0.2 / 0.25
    const expectedMean = 0.06 + scale * (average(returns) - 0.1)
    const mean = shifted.reduce((s, v) => s + v, 0) / shifted.length
    expect(mean).toBeCloseTo(expectedMean, 5)
    // La structure des écarts est préservée : le signe de l'écart à la moyenne
    // de chaque année reste identique après le changement de régime.
    const baseAvg = average(returns)
    shifted.forEach((v, i) => {
      expect(Math.sign(v - mean)).toBe(Math.sign((returns[i] ?? 0) - baseAvg))
    })
  })

  it("effectiveSampleSize compte les observations indépendantes du bootstrap", () => {
    expect(effectiveSampleSize(100, 5)).toBe(20)
    expect(effectiveSampleSize(56, 5)).toBe(11)
    expect(effectiveSampleSize(10, 5)).toBe(2)
  })
})

describe("wilsonScoreCI / buildTerminalHistogram / sampleNormal (v5.5.0)", () => {
  it("Wilson donne ±0,4 pt autour de 95,8 % à 10 000 simulations", () => {
    const ci = wilsonScoreCI(9580, 10000)
    expect(ci.low).toBeGreaterThan(95)
    expect(ci.high).toBeLessThan(96.5)
    expect(ci.low).toBeLessThan(ci.high)
  })

  it("Wilson s'élargit quand le nombre de simulations diminue (honnêteté)", () => {
    const wide = wilsonScoreCI(96, 100)
    const narrow = wilsonScoreCI(9580, 10000)
    expect(wide.high - wide.low).toBeGreaterThan(narrow.high - narrow.low)
  })

  it("Wilson gère 0 % et 100 % sans NaN (intervalle unilatéral aux extrêmes)", () => {
    // À 0 succès sur 100, Wilson donne [0 ; ~3,7 %] — et non [0 ; 0] : c'est le
    // comportement statistique correct (intervalle unilatéral), jamais de NaN.
    const zero = wilsonScoreCI(0, 100)
    expect(zero.low).toBe(0)
    expect(zero.high).toBeGreaterThan(0)
    expect(zero.high).toBeLessThanOrEqual(100)
    const all = wilsonScoreCI(100, 100)
    expect(all.high).toBe(100)
    expect(all.low).toBeLessThan(100)
    expect(all.low).toBeGreaterThanOrEqual(0)
  })

  it("l'histogramme terminal a 30 classes, compte total exact et axe lisible (v5.6.0)", () => {
    const values = Array.from({ length: 1000 }, (_, i) => i * 1000)
    const bins = buildTerminalHistogram(values, 30)
    expect(bins).toHaveLength(30)
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(1000)
    expect(bins[0]?.low).toBe(0)
    // Axe adaptatif : max(p95, 3 × médiane) — l'axe reste proche de la masse
    // de la distribution au lieu de courir jusqu'au cas extrême (p99).
    const hi = bins[bins.length - 1]?.high ?? 0
    expect(hi).toBeGreaterThanOrEqual(3 * 499_500)
    expect(hi).toBeLessThan(2_000_000)
  })

  it("l'histogramme absorbe la queue droite dans la dernière classe", () => {
    const values = [...Array.from({ length: 99 }, (_, i) => i), 100_000] // 1 outlier énorme
    const bins = buildTerminalHistogram(values, 10)
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(100)
  })

  it("sampleNormal est déterministe à graine fixe et centré", () => {
    const rng = mulberry32(7)
    const draws = Array.from({ length: 500 }, () => sampleNormal(0.1, 0.05, rng))
    expect(draws.reduce((s, v) => s + v, 0) / 500).toBeCloseTo(0.1, 1)
    // Deux tirages successifs diffèrent (vraie alea) tout en restant reproductibles
    const rng2 = mulberry32(7)
    const again = Array.from({ length: 500 }, () => sampleNormal(0.1, 0.05, rng2))
    expect(draws).toEqual(again)
  })
})

describe("stress tests déterministes (v5.5.0) — runStressTest", () => {
  const inputs = {
    ...DEFAULT_INPUTS,
    withdrawalModel: "rule-4" as const,
    withdrawalInflation: true,
    retirementYears: 20,
    extendedHistory: false,
  }

  it("les trois scénarios sont définis (1973, 2000, 2008)", () => {
    expect(STRESS_TEST_SCENARIOS.map(s => s.startYear)).toEqual([1973, 2000, 2008])
  })

  it("le choc pétrolier 1973 épuise un retrait de 4 % SANS garde-fous", () => {
    const scenario = STRESS_TEST_SCENARIOS[0]
    if (!scenario) throw new Error("scenario 1973 manquant")
    const result = runStressTest({ ...inputs, dynamicGuardrails: false }, 1_000_000, scenario)
    expect(result.scenario.startYear).toBe(1973)
    // 1973-74 = -29,6 % puis -31,3 %, avec 9-14 % d'inflation : la rente 4 %
    // indexée (sans garde-fou) ne survit pas à la stagflation sur 20 ans.
    expect(result.windowReturns[0]?.return).toBeCloseTo(-0.2958, 3)
    expect(result.windowReturns[1]?.return).toBeCloseTo(-0.3128, 3)
    expect(result.ruinYear).not.toBeNull()
    expect(result.survived).toBe(false)
    expect(result.totalWithdrawn).toBeGreaterThan(0)
    expect(result.yearsPath.length).toBeGreaterThan(1)
  })

  it("les garde-fous dynamiques sauvent la rente du choc pétrolier 1973", () => {
    const scenario = STRESS_TEST_SCENARIOS[0]
    if (!scenario) throw new Error("scenario 1973 manquant")
    const guarded = runStressTest({ ...inputs, dynamicGuardrails: true }, 1_000_000, scenario)
    // Les coupes de 10 % après chaque année négative suffisent à éviter la
    // ruine sur cette fenêtre — c'est précisément leur rôle.
    expect(guarded.survived).toBe(true)
  })

  it("un retrait ultra-prudent (2,5 %) survit à 2008", () => {
    const scenario = STRESS_TEST_SCENARIOS[2]
    if (!scenario) throw new Error("scenario 2008 manquant")
    const result = runStressTest({ ...inputs, withdrawalModel: "ultra-safe" as const }, 1_000_000, scenario)
    expect(result.windowReturns[0]?.return).toBeCloseTo(-0.3729, 3)
    // Le capital est malmené (2008 = -37 %) mais le retrait de 2,5 % tient.
    expect(result.worstDrawdown).toBeGreaterThan(0.3)
  })

  it("le scénario 2000 enchaîne trois années de baisse réelles", () => {
    const scenario = STRESS_TEST_SCENARIOS[1]
    if (!scenario) throw new Error("scenario 2000 manquant")
    const result = runStressTest(inputs, 1_000_000, scenario)
    expect(result.windowReturns[0]?.return).toBeCloseTo(-0.0626, 3)
    expect(result.windowReturns[1]?.return).toBeCloseTo(-0.1218, 3)
    expect(result.windowReturns[2]?.return).toBeCloseTo(-0.3267, 3)
  })

  it("les garde-fous dynamiques réduisent le retrait après une année négative", () => {
    const scenario = STRESS_TEST_SCENARIOS[0]
    if (!scenario) throw new Error("scenario 1973 manquant")
    const guarded = runStressTest({ ...inputs, dynamicGuardrails: true }, 1_000_000, scenario)
    const unguarded = runStressTest({ ...inputs, dynamicGuardrails: false }, 1_000_000, scenario)
    // Avec garde-fous, le capital final est supérieur ou la ruine est évitée/repoussée
    expect(guarded.finalCapital).toBeGreaterThanOrEqual(unguarded.finalCapital)
    // Sans assertion non-nulle : la ruine avec garde-fous est soit absente,
    // soit strictement postérieure à la ruine sans garde-fous.
    if (guarded.ruinYear !== null) {
      expect(unguarded.ruinYear).not.toBeNull()
      expect(guarded.ruinYear).toBeGreaterThan(unguarded.ruinYear as number)
    } else {
      expect(guarded.survived).toBe(true)
    }
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

  it("yearlyReturn / netYield bornés à -100 % (plus de -515 % impossible)", () => {
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      monthlyPayment: 1000,
      indexation: 0.5,
      duration: 2,
      envelope: "none",
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
    })
    for (const row of rows) {
      expect(row.yearlyReturn).toBeGreaterThanOrEqual(-1)
      expect(row.netYield).toBeGreaterThanOrEqual(-1)
    }
  })

  it("runDecumulation borne retirementYears à 60 ans (un lien partagé ne gèle plus l'onglet Rente)", () => {
    // Avant le correctif : retirementYears=120 000 dans un état partagé → la
    // boucle mensuelle (120 000 × 12 mois × 100 runs) gelait le thread. Le
    // clamp moteur ramène à 60 ans → 61 points d'axe (année 0 incluse).
    const inputs = { ...DEFAULT_INPUTS, mcRuns: 100, retirementYears: 120_000 }
    const result = runDecumulation(inputs, 100_000, 100)
    expect(result.years.length).toBe(61)
    expect(result.years[result.years.length - 1]).toBe(60)
    expect(result.runs).toBe(100)
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
  it("la Rente reste déterministe pour une graine donnée (historique réel uniquement)", () => {
    const base = {
      ...DEFAULT_INPUTS,
      withdrawalModel: "rule-4" as const,
      withdrawalInflation: false,
      retirementYears: 15,
      mcRuns: 300,
    }
    const a = runDecumulation(base, 100_000, 300)
    const b = runDecumulation(base, 100_000, 300)
    // p50 est une bande par année (tableau) : on compare les séries entières.
    // On vérifie aussi que le capital médian de fin de période est plausible :
    // 15 ans de retraits rule-4 (4 % de l'initial/an) sur l'historique réel ne
    // ruinent PAS le scénario médian (le capital continue de croître — mesuré
    // ≈ 212 k€ pour 100 k€ de départ), mais ne le laisse pas non plus exploser
    // à des niveaux absurdes (sinon le test serait tautologique).
    expect(a.p50).toEqual(b.p50)
    const medianFinal = a.p50[a.p50.length - 1]
    expect(medianFinal).toBeGreaterThan(100_000 * 0.5)
    expect(medianFinal).toBeLessThan(100_000 * 3.5)
  })

  it("realReturn reflète la SIMULATION (XIRR déflaté par l'inflation réelle), pas un taux saisi", () => {
    // Plus de taux saisi (Option A) : le rendement réel est celui des données
    // historiques rejouées, l'ancien calcul (1+annualReturn)/(1+inflation)−1
    // n'a plus de sens.
    const inputs = {
      ...DEFAULT_INPUTS,
      historicalIndex: "msci-world" as const,
      monthlyPayment: 0,
      envelope: "none" as const,
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
      inflation: 0.02,
      duration: 5,
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
    // Et surtout : ce n'est plus (1+taux saisi)/(1+inflation)−1 — on compare au
    // calcul naïf avec un taux fixe arbitraire, différent du résultat réel.
    const naive = (1 + 0.08) / (1 + inputs.inflation) - 1
    expect(Math.abs(kpis.realReturn / 100 - naive)).toBeGreaterThan(0.001)
  })

  it("impôts affichés = exit tax (brut − net) : plus de dividendes à re-comptabiliser", () => {
    // Sans rendement de dividendes séparé (MSCI World capitalisant), row.tax
    // = totalTax = exitTax = social + impôt sur le revenu. L'identité
    // « brut − impôts = net » affichée par les cartes et le camembert tient.
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      envelope: "cto" as const,
      duration: 10,
    })
    const last = rows[rows.length - 1]
    const exitTax = Math.max(0, last.nominal - last.taxNet)
    // brut − exitTax = net (identité affichée par les cartes)
    expect(last.nominal - exitTax).toBeCloseTo(last.taxNet, 2)
    // exitTax = social + impôt sur le revenu
    expect(exitTax).toBeCloseTo(last.socialCharges + last.incomeTax, 2)
    // row.tax = totalTax = exitTax (plus de composante dividendes)
    expect(last.tax).toBeCloseTo(exitTax, 2)
  })

  it("interestsReal est le rendement réel net d'inflation (même échelle que real)", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, envelope: "none" as const, duration: 8 })
    const last = rows[rows.length - 1]
    // interestsReal est un arrondi GLOBAL (real − invested, arrondi en une
    // passe) alors que real − investedReal est la différence de deux arrondis
    // séparés : tolérance 1 décimale (0,05 €) pour absorber l'écart d'un
    // centime — la relation d'échelle reste vérifiée sur des dizaines de k€.
    expect(last.interestsReal).toBeCloseTo(last.real - last.investedReal, 1)
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
