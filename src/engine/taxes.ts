import type { EnvelopeType, TaxBreakdown, EnvelopeConfig } from "../types"

const SOCIAL_TAX_RATE = 0.172
const PFU_INCOME_RATE = 0.128
const PFU_RATE = SOCIAL_TAX_RATE + PFU_INCOME_RATE
const AV_REDUCED_IR_RATE = 0.075
const AV_IR_ALLOWANCE_SINGLE = 4_600
const AV_IR_ALLOWANCE_COUPLE = 9_200

export const ENVELOPE_CONFIGS: EnvelopeConfig[] = [
  {
    id: "cto",
    name: "Compte-titres ordinaire",
    shortLabel: "CTO",
    desc: "PFU 30% sur plus-values et dividendes",
    color: "#D4AF37",
  },
  {
    id: "pea",
    name: "Plan d'épargne en actions",
    shortLabel: "PEA",
    desc: "Après 5 ans : PS 17,2% sur les gains",
    color: "#C9A324",
  },
  {
    id: "av",
    name: "Assurance-vie",
    shortLabel: "AV",
    desc: "Après 8 ans : abattement puis 7,5% + PS",
    color: "#E8D5A3",
  },
  { id: "per", name: "PER / PERIN", shortLabel: "PER", desc: "Fiscalité simplifiée à la sortie", color: "#8B7D5E" },
  { id: "none", name: "Sans fiscalité", shortLabel: "BRUT", desc: "Projection brute avant impôts", color: "#F5F0E8" },
]

export function roundCent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function computeTaxBreakdown(
  grossGainsInput: number,
  envelope: EnvelopeType,
  yearsHeld: number,
  couple: boolean,
  dividendsTaxPaid = 0,
  contributionBase = 0,
): TaxBreakdown {
  const grossGains = Math.max(0, grossGainsInput)
  const notes: string[] = []
  let taxableGains = grossGains
  let socialCharges = 0
  let incomeTax = 0
  let flatTax = 0

  if (grossGains <= 0 || envelope === "none") {
    return {
      grossGains,
      taxableGains: 0,
      socialCharges: 0,
      incomeTax: 0,
      dividendTax: roundCent(dividendsTaxPaid),
      flatTax: 0,
      netGains: grossGains,
      totalTax: roundCent(dividendsTaxPaid),
      effectiveRate: grossGains > 0 ? dividendsTaxPaid / grossGains : 0,
      notes: envelope === "none" ? ["Simulation brute, fiscalité neutralisée."] : notes,
    }
  }

  if (envelope === "cto") {
    socialCharges = grossGains * SOCIAL_TAX_RATE
    incomeTax = grossGains * PFU_INCOME_RATE
    flatTax = grossGains * PFU_RATE
    notes.push("CTO : PFU 30% composé de 17,2% de PS et 12,8% d'IR.")
  }

  if (envelope === "pea") {
    if (yearsHeld >= 5) {
      socialCharges = grossGains * SOCIAL_TAX_RATE
      incomeTax = 0
      flatTax = 0
      notes.push("PEA mature (>5 ans) : exonération d'IR, PS 17,2% sur les gains.")
    } else {
      socialCharges = grossGains * SOCIAL_TAX_RATE
      incomeTax = grossGains * PFU_INCOME_RATE
      flatTax = grossGains * PFU_RATE
      notes.push("PEA <5 ans : PFU 30% sur les gains.")
    }
    const cap = couple ? 300_000 : 150_000
    if (contributionBase > cap)
      notes.push(`Plafond PEA dépassé : le plafond de versements est de ${(cap / 1000).toFixed(0)}k€.`)
  }

  if (envelope === "av") {
    socialCharges = grossGains * SOCIAL_TAX_RATE
    if (yearsHeld >= 8) {
      const allowance = couple ? AV_IR_ALLOWANCE_COUPLE : AV_IR_ALLOWANCE_SINGLE
      taxableGains = Math.max(0, grossGains - allowance)
      incomeTax = taxableGains * AV_REDUCED_IR_RATE
      notes.push(`AV >8 ans : PS sur tous les gains, abattement IR ${(allowance / 1000).toFixed(0)}k€/an.`)
    } else {
      incomeTax = grossGains * PFU_INCOME_RATE
      flatTax = grossGains * PFU_RATE
      notes.push("AV <8 ans : PFU 30%.")
    }
  }

  if (envelope === "per") {
    socialCharges = grossGains * SOCIAL_TAX_RATE
    incomeTax = grossGains * (couple ? 0.11 : 0.14)
    notes.push("PER : modèle simplifié de sortie en capital, hors économie d'impôt à l'entrée.")
  }

  const exitTax = socialCharges + incomeTax
  const totalTax = exitTax + dividendsTaxPaid
  return {
    grossGains: roundCent(grossGains),
    taxableGains: roundCent(taxableGains),
    socialCharges: roundCent(socialCharges),
    incomeTax: roundCent(incomeTax),
    dividendTax: roundCent(dividendsTaxPaid),
    flatTax: roundCent(flatTax),
    netGains: roundCent(Math.max(0, grossGains - exitTax)),
    totalTax: roundCent(totalTax),
    effectiveRate: grossGains > 0 ? totalTax / grossGains : 0,
    notes,
  }
}

export function dividendTaxRate(envelope: EnvelopeType): number {
  return envelope === "cto" ? PFU_RATE : envelope === "none" ? 0 : SOCIAL_TAX_RATE
}

export function calcXIRR(cashFlows: number[], months: number[]): number {
  if (cashFlows.length < 2) return 0
  let rate = 0.05
  for (let iter = 0; iter < 100; iter++) {
    let f = 0
    let fPrime = 0
    const tMax = months[months.length - 1]
    for (let i = 0; i < cashFlows.length; i++) {
      const t = tMax - months[i]
      const disc = Math.pow(1 + rate, t / 12)
      f += cashFlows[i] / disc
      if (t !== 0) fPrime -= ((t / 12) * cashFlows[i]) / (disc * (1 + rate))
    }
    if (Math.abs(f) < 1e-8) break
    const newRate = rate - f / fPrime
    if (newRate <= -0.999) break
    rate = newRate
  }
  return rate
}
