/**
 * AUDIT CONSOLIDÉ — tests de non-régression pour les corrections v6.5.
 *
 * Couvre : fiscalité du décaissement (seule la part de gains est taxée),
 * réconciliation comptable de la rente, rente en euros d'aujourd'hui,
 * cohérence âge/durée/retraite, cas limites du moteur, taux 2026 (PFU 31,4 %
 * CTO / 30 % AV) et format de stockage versionné.
 */
import { describe, it, expect } from "vitest"
import {
  DEFAULT_INPUTS,
  runDecumulation,
  runStressTest,
  STRESS_TEST_SCENARIOS,
  runSimulation,
  solveGoal,
  percentile,
  computeTaxBreakdown,
  serializeInputs,
  parseStoredInputs,
  validateInputs,
  getTaxRules,
  pfuRate,
} from "../engine"
import { CURRENT_TAX_YEAR } from "../engine/taxRules"

describe("Audit — la rente CTO ne taxe QUE la part de plus-value (item 1)", () => {
  // 100 k€ de capital dont 60 k€ de versements → 40 % de gains latents.
  // Si TOUT le retrait était taxé au PFU (31,4 % en 2026), la rente nette
  // vaudrait ≈ 0,686 × la rente brute. Avec la part de gains seule :
  // net ≈ brut × (1 − 0,40 × 0,314) ≈ 0,874 × brut.
  const base = {
    ...DEFAULT_INPUTS,
    envelope: "cto" as const,
    withdrawalModel: "custom" as const,
    withdrawalFixed: 2000,
    withdrawalInflation: false,
    dynamicGuardrails: false,
    retirementYears: 20,
    mcRuns: 200,
  }

  it("le taux effectif du 1er retrait ≈ gains/ capital × PFU, pas PFU × 100 % du retrait", () => {
    const dec = runDecumulation(base, 100_000, 200, 60_000)
    const ratio = dec.netInitialWithdrawal / dec.initialWithdrawal
    // Attend ≈ 0,874 ; tolérance large autour (échantillonnage MC du 1er mois).
    expect(ratio).toBeGreaterThan(0.8)
    expect(ratio).toBeLessThan(0.94)
  })

  it("avec 100 % de gains latents (basis = 0), l'impôt s'applique à tout le retrait", () => {
    const dec = runDecumulation(base, 100_000, 200, 0)
    // basis = 0 → gainRatio = 1 → net ≈ brut × (1 − 0,314) = 0,686
    const ratio = dec.netInitialWithdrawal / dec.initialWithdrawal
    expect(ratio).toBeLessThan(0.75)
    expect(ratio).toBeGreaterThan(0.6)
  })

  it("sans fiscalité (BRUT), la rente nette = la rente brute", () => {
    const dec = runDecumulation({ ...base, envelope: "none" }, 100_000, 200, 60_000)
    expect(dec.netInitialWithdrawal).toBe(dec.initialWithdrawal)
    expect(dec.totalTaxPaid).toBe(0)
  })
})

describe("Audit — réconciliation comptable de la rente (item 11)", () => {
  const clean = {
    ...DEFAULT_INPUTS,
    envelope: "none" as const,
    etfFees: 0,
    brokerageFees: 0,
    insuranceFees: 0,
    managementFees: 0,
    withdrawalInflation: false,
    dynamicGuardrails: false,
    crisisScenario: false,
    retirementYears: 18,
    parameterUncertainty: false,
    extendedHistory: true,
  }

  it("sans retraits ni frais : capital_final = capital_initial × Π(1 + rendement annuel)", () => {
    const start = 1_000_000
    const result = runStressTest(
      { ...clean, withdrawalModel: "custom", withdrawalFixed: 0 },
      start,
      STRESS_TEST_SCENARIOS[1] ?? STRESS_TEST_SCENARIOS[0],
    )
    const growth = result.windowReturns.reduce((acc, { return: r }) => acc * (1 + r), 1)
    // La composition mensuelle est exacte : (1 + taux mensuel)^12 = 1 + taux annuel.
    expect(result.finalCapital).toBeCloseTo(start * growth, 0)
    expect(result.totalWithdrawn).toBe(0)
  })

  it("retraits fixes, sans indexation : total retiré = montant × 12 × années (pas de retrait fantôme)", () => {
    const start = 1_000_000
    const result = runStressTest(
      { ...clean, withdrawalModel: "custom", withdrawalFixed: 1000 },
      start,
      STRESS_TEST_SCENARIOS[1] ?? STRESS_TEST_SCENARIOS[0],
    )
    expect(result.totalWithdrawn).toBeCloseTo(1000 * 12 * result.windowReturns.length, 0)
    // Et la rente nette (BRUT) = la rente brute : zéro impôt, zéro frais.
    const dec = runDecumulation(clean, start, 200, start)
    expect(dec.netInitialWithdrawal).toBe(dec.initialWithdrawal)
    expect(dec.totalTaxPaid).toBe(0)
  })
})

describe("Audit — rente en euros d'aujourd'hui (item 8)", () => {
  const base = {
    ...DEFAULT_INPUTS,
    envelope: "none" as const,
    withdrawalModel: "custom" as const,
    withdrawalFixed: 2000,
    retirementYears: 20,
    mcRuns: 200,
  }

  it("sans inflation, réel = nominal", () => {
    const dec = runDecumulation({ ...base, withdrawalInflation: false, inflation: 0 }, 500_000, 200)
    expect(dec.withdrawalsNetReal[1]).toBeCloseTo(dec.withdrawalsNet[1] ?? 0, 0)
  })

  it("avec inflation, le net déflaté < le net nominal (pouvoir d'achat érodé)", () => {
    const dec = runDecumulation({ ...base, withdrawalInflation: true, inflation: 0.05 }, 500_000, 200)
    const nominalSum = dec.withdrawalsNet.slice(1).reduce((s, v) => s + v, 0)
    const realSum = dec.withdrawalsNetReal.slice(1).reduce((s, v) => s + v, 0)
    expect(realSum).toBeLessThan(nominalSum)
  })
})

describe("Audit — cohérence âge / durée / retraite (items 3 & 24)", () => {
  it("retraite avant l'âge actuel → erreur", () => {
    const errors = validateInputs({ ...DEFAULT_INPUTS, ageNow: 40, ageRetirement: 30, duration: 20 })
    expect(errors.some(e => e.field === "ageRetirement" && e.severity === "error")).toBe(true)
  })

  it("projection qui s'arrête avant la retraite → avertissement", () => {
    const errors = validateInputs({ ...DEFAULT_INPUTS, ageNow: 40, ageRetirement: 65, duration: 20 })
    expect(errors.some(e => e.field === "ageRetirement" && e.severity === "warning")).toBe(true)
  })

  it("projection qui dépasse la retraite → avertissement", () => {
    const errors = validateInputs({ ...DEFAULT_INPUTS, ageNow: 40, ageRetirement: 55, duration: 20 })
    expect(errors.some(e => e.field === "ageRetirement" && e.severity === "warning")).toBe(true)
  })

  it("âge + durée = âge de retraite → aucun avertissement de cohérence", () => {
    const errors = validateInputs({ ...DEFAULT_INPUTS, ageNow: 40, ageRetirement: 60, duration: 20 })
    expect(errors.some(e => e.field === "ageRetirement")).toBe(false)
  })
})

describe("Audit — cas limites du moteur (item 22)", () => {
  it("durée 1 an et capital nul → simulation finie, sans NaN", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, capitalInitial: 0, duration: 1, monthlyPayment: 0 })
    const last = rows[rows.length - 1]
    expect(Number.isFinite(last.nominal)).toBe(true)
    expect(Number.isFinite(last.yearlyReturn)).toBe(true)
    expect(last.year).toBe(1)
  })

  it("frais supérieurs à un rendement négatif → capital borné à 0, jamais négatif ni NaN", () => {
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      envelope: "none",
      capitalInitial: 1000,
      monthlyPayment: 0,
      duration: 5,
      etfFees: 0.5,
      returnScenario: "prudent",
    })
    for (const row of rows) {
      expect(row.nominal).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(row.nominal)).toBe(true)
    }
  })

  it("solveGoal : capital de départ ≥ objectif → versement nul, gains nuls, atteignable", () => {
    const result = solveGoal({ ...DEFAULT_INPUTS, goalTarget: 10_000, goalCapital: 50_000, goalDuration: 10 })
    expect(result.pmtPerMonth).toBe(0)
    expect(result.totalGains).toBe(0)
    expect(result.achievable).toBe(true)
    expect(result.requiredRate).toBe(0)
  })

  it("percentile : liste vide → 0, valeur unique → elle-même", () => {
    expect(percentile([], 0.5)).toBe(0)
    expect(percentile([42], 0.5)).toBe(42)
  })
})

describe("Audit — taux 2026 : PFU CTO 31,4 %, AV 30 % (à ne pas régresser)", () => {
  it("CTO 2026 : 12,8 % IR + 18,6 % sociaux = 31,4 %", () => {
    const rules = getTaxRules(CURRENT_TAX_YEAR)
    expect(rules.socialRate).toBeCloseTo(0.186, 3)
    expect(pfuRate(rules)).toBeCloseTo(0.314, 3)
    const breakdown = computeTaxBreakdown(1000, "cto", 3, false, 0, { taxYear: CURRENT_TAX_YEAR })
    expect(breakdown.totalTax).toBeCloseTo(314, 0)
  })

  it("AV (moins de 8 ans) 2026 : 17,2 % sociaux + 12,8 % IR = 30 % — exclue de la hausse", () => {
    const rules = getTaxRules(CURRENT_TAX_YEAR)
    expect(rules.avSocialRate).toBeCloseTo(0.172, 3)
    const breakdown = computeTaxBreakdown(1000, "av", 3, false, 0, { taxYear: CURRENT_TAX_YEAR })
    expect(breakdown.totalTax).toBeCloseTo(300, 0)
  })

  it("PEA détenu ≥ 5 ans 2026 : prélèvements sociaux seuls (18,6 %)", () => {
    const breakdown = computeTaxBreakdown(1000, "pea", 5, false, 0, { taxYear: CURRENT_TAX_YEAR })
    expect(breakdown.totalTax).toBeCloseTo(186, 0)
    expect(breakdown.incomeTax).toBe(0)
  })
})

describe("Audit — stockage versionné (item 27)", () => {
  it("serializeInputs écrit une enveloppe {version, inputs} lisible par parseStoredInputs", () => {
    const stored = JSON.parse(serializeInputs({ ...DEFAULT_INPUTS, capitalInitial: 12345, duration: 12 })) as {
      version: number
      inputs: Record<string, unknown>
    }
    expect(stored.version).toBe(1)
    expect(stored.inputs.capitalInitial).toBe(12345)
    const loaded = parseStoredInputs(serializeInputs({ ...DEFAULT_INPUTS, capitalInitial: 12345, duration: 12 }))
    expect(loaded.capitalInitial).toBe(12345)
    expect(loaded.duration).toBe(12)
  })

  it("le format historique (objet plat) reste lisible — aucune donnée perdue", () => {
    const loaded = parseStoredInputs(JSON.stringify({ capitalInitial: 9999, monthlyPayment: 300 }))
    expect(loaded.capitalInitial).toBe(9999)
    expect(loaded.monthlyPayment).toBe(300)
  })
})
