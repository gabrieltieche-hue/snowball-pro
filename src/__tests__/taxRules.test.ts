import { describe, it, expect } from "vitest"
import {
  getTaxRules,
  resolveTaxYear,
  pfuRate,
  fmtTaxPercent,
  TAX_RULES,
  TAX_YEARS,
  CURRENT_TAX_YEAR,
} from "../engine/taxRules"
import { computeTaxBreakdown } from "../engine/taxes"

describe("taxRules — table fiscale par année (P0-1 v6)", () => {
  it("2025 : les taux de droit commun restent 17,2 % / 30 % (rétrocompatibilité)", () => {
    const r = getTaxRules(2025)
    expect(r.socialRate).toBeCloseTo(0.172)
    expect(r.pfuIncomeRate).toBeCloseTo(0.128)
    expect(pfuRate(r)).toBeCloseTo(0.3)
    expect(r.avSocialRate).toBeCloseTo(0.172)
    expect(r.perSocialRate).toBeCloseTo(0.172)
  })

  it("2026 : prélèvements sociaux 18,6 % et PFU 31,4 % (LFSS 2026)", () => {
    const r = getTaxRules(2026)
    expect(r.socialRate).toBeCloseTo(0.186)
    expect(pfuRate(r)).toBeCloseTo(0.314)
    expect(r.pfuIncomeRate).toBeCloseTo(0.128) // part IR inchangée
    expect(r.perSocialRate).toBeCloseTo(0.186) // PER suit la hausse
  })

  it("2026 : l'assurance-vie est EXCLUE de la hausse (prélèvements sociaux 17,2 %)", () => {
    const r = getTaxRules(2026)
    expect(r.avSocialRate).toBeCloseTo(0.172)
    expect(r.avSocialRate).not.toBeCloseTo(r.socialRate)
  })

  it("les paramètres stables (abattements AV, plafonds PEA/AV) sont identiques entre 2025 et 2026", () => {
    const a = getTaxRules(2025)
    const b = getTaxRules(2026)
    expect(b.avAllowanceSingle).toBe(a.avAllowanceSingle)
    expect(b.avAllowanceCouple).toBe(a.avAllowanceCouple)
    expect(b.avPremiumCapSingle).toBe(a.avPremiumCapSingle)
    expect(b.avPremiumCapCouple).toBe(a.avPremiumCapCouple)
    expect(b.peaCapSingle).toBe(a.peaCapSingle)
    expect(b.peaCapCouple).toBe(a.peaCapCouple)
    expect(b.avReducedIRRate).toBe(a.avReducedIRRate)
    expect(b.avExcessIRRate).toBe(a.avExcessIRRate)
  })

  it("resolveTaxYear : année supportée acceptée, année inconnue → année courante", () => {
    expect(resolveTaxYear(2025)).toBe(2025)
    expect(resolveTaxYear(2026)).toBe(2026)
    expect(resolveTaxYear(2024)).toBe(CURRENT_TAX_YEAR)
    expect(resolveTaxYear(2027)).toBe(CURRENT_TAX_YEAR)
    expect(resolveTaxYear(undefined)).toBe(CURRENT_TAX_YEAR)
    expect(resolveTaxYear(NaN)).toBe(CURRENT_TAX_YEAR)
  })

  it("chaque année supportée a une entrée complète sourcée", () => {
    for (const y of TAX_YEARS) {
      const r = TAX_RULES[y]
      expect(r.country).toBe("FR")
      expect(r.sources.length).toBeGreaterThan(0)
    }
  })

  it("fmtTaxPercent : virgule française, pas de « ,0 » parasite", () => {
    expect(fmtTaxPercent(0.186)).toBe("18,6 %")
    expect(fmtTaxPercent(0.172)).toBe("17,2 %")
    expect(fmtTaxPercent(0.314)).toBe("31,4 %")
    expect(fmtTaxPercent(0.3)).toBe("30 %")
  })
})

describe("équivalence moteur — computeTaxBreakdown lit taxRules (P0-1 v6)", () => {
  it("2025 : résultats identiques aux valeurs historiques (preuve de rétrocompatibilité)", () => {
    // CTO PFU 30 %
    const cto = computeTaxBreakdown(10000, "cto", 1, false, 0, { taxYear: 2025 })
    expect(cto.flatTax).toBeCloseTo(3000, 0)
    // PEA ≥ 5 ans : 17,2 % de social seulement
    const pea = computeTaxBreakdown(10000, "pea", 6, false, 0, { taxYear: 2025 })
    expect(pea.incomeTax).toBe(0)
    expect(pea.socialCharges).toBeCloseTo(1720, 0)
    // PER : gains au PFU 30 %
    const per = computeTaxBreakdown(10000, "per", 10, false, 0, { taxYear: 2025 })
    expect(per.flatTax).toBeCloseTo(3000, 0)
  })

  it("2026 : CTO au PFU 31,4 % (12,8 % + 18,6 %)", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, { taxYear: 2026 })
    expect(result.socialCharges).toBeCloseTo(1860, 0)
    expect(result.incomeTax).toBeCloseTo(1280, 0)
    expect(result.flatTax).toBeCloseTo(3140, 0)
    expect(result.totalTax).toBeCloseTo(3140, 0)
  })

  it("2026 : PEA ≥ 5 ans → 18,6 % de social seulement ; < 5 ans → PFU 31,4 %", () => {
    const held = computeTaxBreakdown(10000, "pea", 6, false, 0, { taxYear: 2026 })
    expect(held.incomeTax).toBe(0)
    expect(held.socialCharges).toBeCloseTo(1860, 0)
    const early = computeTaxBreakdown(10000, "pea", 2, false, 0, { taxYear: 2026 })
    expect(early.flatTax).toBeCloseTo(3140, 0)
  })

  it("2026 : l'AV reste à 17,2 % (exclue de la hausse), mêmes taux IR", () => {
    const result = computeTaxBreakdown(10000, "av", 10, false, 0, { taxYear: 2026 })
    expect(result.socialCharges).toBeCloseTo(1720, 0)
    // Abattement 4 600 € puis taux réduit 7,5 % (primes sous plafond)
    expect(result.incomeTax).toBeCloseTo((10000 - 4600) * 0.075, 0)
  })

  it("2026 : PER — gains au PFU 31,4 %, versements toujours à la TMI pleine", () => {
    const result = computeTaxBreakdown(10000, "per", 10, false, 50000, { tmi: 0.3, taxYear: 2026 })
    expect(result.contributionsTax).toBeCloseTo(15000, 0) // 50 k€ × 30 % TMI, sans abattement
    expect(result.socialCharges).toBeCloseTo(1860, 0)
    expect(result.flatTax).toBeCloseTo(3140, 0)
  })

  it("2026 : barème CTO — 18,6 % de social + TMI", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, { ctoTaxMode: "bareme", tmi: 0.3, taxYear: 2026 })
    expect(result.socialCharges).toBeCloseTo(1860, 0)
    expect(result.incomeTax).toBeCloseTo(3000, 0)
    expect(result.flatTax).toBe(0)
  })

  it("sans année précisée → année courante (2026) — jamais un taux périmé par défaut", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false)
    expect(result.flatTax).toBeCloseTo(pfuRate(getTaxRules()) * 10000, 0)
  })

  it("année inconnue → repli sur l'année courante (aucun crash, aucun taux fantôme)", () => {
    const result = computeTaxBreakdown(10000, "cto", 1, false, 0, { taxYear: 1999 })
    expect(result.flatTax).toBeCloseTo(3140, 0)
  })
})
