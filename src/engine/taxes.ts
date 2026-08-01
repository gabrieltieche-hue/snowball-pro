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
    desc: "Impôt unique de 30 % sur vos gains",
    color: "var(--color-value-gold)",
  },
  {
    id: "pea",
    name: "Plan d'épargne en actions",
    shortLabel: "PEA",
    desc: "Après 5 ans : 17,2 % de cotisations sociales seulement",
    color: "var(--color-warning)",
  },
  {
    id: "av",
    name: "Assurance-vie",
    shortLabel: "AV",
    desc: "Après 8 ans : abattement, puis 7,5 % + cotisations sociales",
    color: "var(--color-primary-light)",
  },
  {
    id: "per",
    name: "PER / PERIN",
    shortLabel: "PER",
    desc: "Impôts simplifiés à la sortie",
    color: "var(--color-text-muted)",
  },
  {
    id: "none",
    name: "Sans fiscalité",
    shortLabel: "BRUT",
    desc: "Projection avant impôts",
    color: "var(--color-text)",
  },
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
      notes: envelope === "none" ? ["Simulation sans impôts (aucun compte d'investissement choisi)."] : notes,
    }
  }

  if (envelope === "cto") {
    socialCharges = grossGains * SOCIAL_TAX_RATE
    incomeTax = grossGains * PFU_INCOME_RATE
    flatTax = grossGains * PFU_RATE
    notes.push(
      "CTO (compte-titres ordinaire) : impôt unique de 30 % = 17,2 % de cotisations sociales + 12,8 % d'impôt sur le revenu.",
    )
  }

  if (envelope === "pea") {
    if (yearsHeld >= 5) {
      socialCharges = grossGains * SOCIAL_TAX_RATE
      incomeTax = 0
      flatTax = 0
      notes.push(
        "PEA détenu plus de 5 ans : pas d'impôt sur le revenu, uniquement 17,2 % de cotisations sociales sur les gains.",
      )
    } else {
      socialCharges = grossGains * SOCIAL_TAX_RATE
      incomeTax = grossGains * PFU_INCOME_RATE
      flatTax = grossGains * PFU_RATE
      notes.push("PEA détenu moins de 5 ans : impôt unique de 30 % sur les gains.")
    }
    const cap = couple ? 300_000 : 150_000
    if (contributionBase > cap)
      notes.push(`Plafond PEA dépassé : ce compte est plafonné à ${(cap / 1000).toFixed(0)} k€ de versements au total.`)
  }

  if (envelope === "av") {
    socialCharges = grossGains * SOCIAL_TAX_RATE
    if (yearsHeld >= 8) {
      const allowance = couple ? AV_IR_ALLOWANCE_COUPLE : AV_IR_ALLOWANCE_SINGLE
      taxableGains = Math.max(0, grossGains - allowance)
      incomeTax = taxableGains * AV_REDUCED_IR_RATE
      notes.push(
        `Assurance-vie détenue plus de 8 ans : cotisations sociales sur tous les gains + abattement de ${(
          allowance / 1000
        ).toFixed(0)} k€/an sur les gains imposés.`,
      )
    } else {
      incomeTax = grossGains * PFU_INCOME_RATE
      flatTax = grossGains * PFU_RATE
      notes.push("Assurance-vie détenue moins de 8 ans : impôt unique de 30 %.")
    }
  }

  if (envelope === "per") {
    socialCharges = grossGains * SOCIAL_TAX_RATE
    incomeTax = grossGains * (couple ? 0.11 : 0.14)
    notes.push("PER : sortie en capital modélisée simplement (l'avantage fiscal à l'entrée n'est pas simulé ici).")
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
  // Convention standard : actualise les flux vers la DATE DU PREMIER flux
  // (t0). La valeur finale positive compense les sorties → taux positif.
  const t0 = months[0]
  let rate = 0.05
  for (let iter = 0; iter < 100; iter++) {
    let f = 0
    let fPrime = 0
    for (let i = 0; i < cashFlows.length; i++) {
      const t = (months[i] - t0) / 12
      const disc = Math.pow(1 + rate, t)
      f += cashFlows[i] / disc
      fPrime -= (t * cashFlows[i]) / (disc * (1 + rate))
    }
    if (Math.abs(f) < 1e-8) break
    if (Math.abs(fPrime) < 1e-12) break // dérivée nulle : pas de racine unique exploitable
    const newRate = rate - f / fPrime
    // Gardes symétriques : un taux < -99,9 % ou > 10 000 %/an indique un cas dégénéré.
    // La borne haute reste large pour laisser converger des rendements légitimes
    // élevés (crypto, fenêtres courtes) tout en bornant la divergence de Newton.
    if (!Number.isFinite(newRate) || newRate <= -0.999 || newRate >= 100) break
    rate = newRate
  }
  return rate
}
