/**
 * PAQUETS 1 & 2 — honnêteté des hypothèses.
 *
 * - Scénarios de rendement (prudent / central / optimiste) de la projection
 * - Monte Carlo en euros réels (bandes déflatées + succès réel)
 * - Fiscalité et frais du décaissement (rente nette)
 * - Inversion Monte-Carlo (versement pour P10/P50/P90)
 * - Défauts réalistes des frais + bornes des nouveaux champs du profil
 */
import { describe, it, expect } from "vitest"
import {
  DEFAULT_INPUTS,
  runSimulation,
  runMonteCarlo,
  runDecumulation,
  solveGoalMonteCarlo,
  sanitizeInputs,
  getHistoricalDataset,
} from "../engine"

describe("Paquet 1 — scénarios de rendement de la projection", () => {
  it("prudent < central < optimiste en capital final", () => {
    const finals: Record<string, number> = {}
    for (const scenario of ["prudent", "central", "optimiste"] as const) {
      const rows = runSimulation({ ...DEFAULT_INPUTS, returnScenario: scenario })
      finals[scenario] = rows[rows.length - 1].nominal
    }
    expect(finals.prudent).toBeLessThan(finals.central)
    expect(finals.central).toBeLessThan(finals.optimiste)
  })

  it("central applique exactement le rendement géométrique composé", () => {
    const dataset = getHistoricalDataset("msci-world")
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      returnScenario: "central",
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
      envelope: "none",
      capitalInitial: 1000,
      monthlyPayment: 0,
      duration: 5,
    })
    // Une année = capital × (1 + géométrique) exactement (l'écart toléré de
    // 5e-5 couvre les arrondis au centime appliqués chaque mois).
    expect(rows[1].yearlyReturn).toBeCloseTo(dataset.compoundedReturn, 4)
    expect(rows[5].nominal).toBeCloseTo(1000 * Math.pow(1 + dataset.compoundedReturn, 5), 1)
  })

  it("optimiste applique la moyenne arithmétique (10,07 %)", () => {
    const dataset = getHistoricalDataset("msci-world")
    // Versement nul et frais nuls : yearlyReturn isole alors le taux appliqué
    // (le rendement réalisé d'une simulation avec versements mensuels est
    // gonflé par les versements immédiatement rémunérés).
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      returnScenario: "optimiste",
      monthlyPayment: 0,
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
      envelope: "none",
    })
    expect(rows[1].yearlyReturn).toBeCloseTo(dataset.avgReturn, 4)
    expect(dataset.avgReturn).toBeCloseTo(0.1007, 4)
  })

  it("les défauts sont réalistes : frais 0,25 % ETF, 0,75 % AV, scénario central", () => {
    expect(DEFAULT_INPUTS.etfFees).toBe(0.0025)
    expect(DEFAULT_INPUTS.insuranceFees).toBe(0.0075)
    expect(DEFAULT_INPUTS.returnScenario).toBe("central")
    // Une projection par défaut paie donc des frais (> 0), contrairement à v6.3.
    const rows = runSimulation(DEFAULT_INPUTS)
    expect(rows[rows.length - 1].feesLost).toBeGreaterThan(0)
  })
})

describe("Paquet 1 — Monte Carlo en euros réels", () => {
  it("sans inflation, les bandes réelles égalent les bandes nominales", () => {
    const mc = runMonteCarlo({ ...DEFAULT_INPUTS, inflation: 0, mcRuns: 200 }, 200)
    const last = mc.p50.length - 1
    expect(mc.p50r[last]).toBeCloseTo(mc.p50[last] ?? 0, 1)
    expect(mc.p10r[last]).toBeCloseTo(mc.p10[last] ?? 0, 1)
    expect(mc.p90r[last]).toBeCloseTo(mc.p90[last] ?? 0, 1)
    expect(mc.successRateReal).toBe(mc.successRate)
  })

  it("avec inflation, le réel est en dessous du nominal et le succès réel ≤ nominal", () => {
    const mc = runMonteCarlo({ ...DEFAULT_INPUTS, mcRuns: 200 }, 200)
    const last = mc.p50.length - 1
    expect(mc.p50r[last] ?? 0).toBeLessThan(mc.p50[last] ?? 0)
    expect(mc.p10r[last] ?? 0).toBeLessThan(mc.p10[last] ?? 0)
    expect(mc.successRateReal).toBeLessThanOrEqual(mc.successRate)
  })
})

describe("Paquet 2 — fiscalité et frais du décaissement", () => {
  const base = { ...DEFAULT_INPUTS, mcRuns: 200, retirementYears: 20 }

  it("enveloppe BRUT : la rente nette = la rente brute, zéro impôt", () => {
    const dec = runDecumulation({ ...base, envelope: "none" }, 100_000, 200)
    expect(dec.netInitialWithdrawal).toBe(dec.initialWithdrawal)
    expect(dec.totalTaxPaid).toBe(0)
  })

  it("CTO : la rente nette < brute et des impôts sont payés", () => {
    const dec = runDecumulation({ ...base, envelope: "cto" }, 100_000, 200)
    expect(dec.netInitialWithdrawal).toBeLessThan(dec.initialWithdrawal)
    expect(dec.totalTaxPaid).toBeGreaterThan(0)
  })

  it("PEA détenu 5 ans : moins d'impôts que le CTO (sociales seules)", () => {
    const cto = runDecumulation({ ...base, envelope: "cto" }, 100_000, 200)
    const pea = runDecumulation({ ...base, envelope: "pea", peaYearsHeld: 5 }, 100_000, 200)
    expect(pea.totalTaxPaid).toBeLessThan(cto.totalTaxPaid)
    expect(pea.netInitialWithdrawal).toBeGreaterThan(cto.netInitialWithdrawal)
  })

  it("la base fiscale = les VERSEMENTS (pas le nominal) : les gains latents sont taxés dès le début", () => {
    // 100 k€ de capital dont seulement 60 k€ de versements : 40 k€ de gains
    // latents doivent être taxés dès les premiers retraits. Avec basis = 100 k€
    // (défaut des tests), ces gains ne seraient JAMAIS taxés — sous-taxation.
    const decFull = runDecumulation({ ...base, envelope: "cto" }, 100_000, 200, 100_000)
    const decPartial = runDecumulation({ ...base, envelope: "cto" }, 100_000, 200, 60_000)
    expect(decPartial.totalTaxPaid).toBeGreaterThan(decFull.totalTaxPaid)
    expect(decPartial.netInitialWithdrawal).toBeLessThan(decFull.netInitialWithdrawal)
  })

  it("AV détenue 8 ans : moins d'impôts que le CTO (abattement)", () => {
    const cto = runDecumulation({ ...base, envelope: "cto" }, 100_000, 200)
    const av = runDecumulation({ ...base, envelope: "av", avYearsHeld: 8 }, 100_000, 200)
    expect(av.totalTaxPaid).toBeLessThan(cto.totalTaxPaid)
  })

  it("des frais d'encours rognent le capital décumulé", () => {
    const noFees = runDecumulation({ ...base, envelope: "none", etfFees: 0 }, 100_000, 200)
    const withFees = runDecumulation({ ...base, envelope: "none", etfFees: 0.01 }, 100_000, 200)
    expect(withFees.totalFeesPaid).toBeGreaterThan(0)
    expect(withFees.mean).toBeLessThanOrEqual(noFees.mean)
  })
})

describe("Paquet 2 — inversion Monte-Carlo (versement pour P10/P50/P90)", () => {
  it("le versement croît avec l'exigence de certitude : P10 > P50 > P90", () => {
    const base = { ...DEFAULT_INPUTS, mcRuns: 200, duration: 20 }
    const p10 = solveGoalMonteCarlo(base, 500_000, 10, 200)
    const p50 = solveGoalMonteCarlo(base, 500_000, 50, 200)
    const p90 = solveGoalMonteCarlo(base, 500_000, 90, 200)
    expect(p90).toBeGreaterThan(0)
    expect(p50).toBeGreaterThan(p90)
    expect(p10).toBeGreaterThan(p50)
  }, 60_000)

  it("avec le versement P50, la médiane terminale atteint l'objectif (cohérence)", () => {
    const base = { ...DEFAULT_INPUTS, mcRuns: 250, duration: 20 }
    const p50 = solveGoalMonteCarlo(base, 500_000, 50, 250)
    const check = runMonteCarlo({ ...base, monthlyPayment: p50, mcRuns: 250 }, 250, 500_000)
    const last = check.p50.length - 1
    // Le p50 estimé par bisection (250 runs) et le p50 du run de vérification
    // diffèrent par la variance d'échantillonnage du percentile — on vérifie
    // l'ORDRE DE GRANDEUR (le paiement retourné doit viser l'objectif), pas
    // le centime.
    expect(check.p50[last] ?? 0).toBeGreaterThanOrEqual(480_000)
  }, 60_000)
})

describe("Paquet 3 — bornes des nouveaux champs (sanitize)", () => {
  it("normalise les enums invalides vers leurs défauts", () => {
    const s = sanitizeInputs({
      ...DEFAULT_INPUTS,
      returnScenario: "dangereux" as never,
      riskTolerance: "inconnu" as never,
    })
    expect(s.returnScenario).toBe("central")
    expect(s.riskTolerance).toBe("equilibre")
  })

  it("clamp les valeurs du profil", () => {
    const s = sanitizeInputs({
      ...DEFAULT_INPUTS,
      ageNow: 5,
      ageRetirement: 200,
      retirementExpenses: -500,
      otherPensions: 9_999_999,
      maxDrawdownTolerance: 0.99,
    })
    expect(s.ageNow).toBe(16)
    expect(s.ageRetirement).toBe(100)
    expect(s.retirementExpenses).toBe(0)
    expect(s.otherPensions).toBe(1_000_000)
    expect(s.maxDrawdownTolerance).toBe(0.6)
  })

  it("préserve les choix valides du profil", () => {
    const s = sanitizeInputs({
      ...DEFAULT_INPUTS,
      returnScenario: "prudent",
      riskTolerance: "audacieux",
      maxDrawdownTolerance: 0.4,
      goalSync: true,
    })
    expect(s.returnScenario).toBe("prudent")
    expect(s.riskTolerance).toBe("audacieux")
    expect(s.maxDrawdownTolerance).toBe(0.4)
    expect(s.goalSync).toBe(true)
  })
})
