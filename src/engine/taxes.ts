import type { EnvelopeType, TaxBreakdown, EnvelopeConfig, TaxBreakdownOptions } from "../types"

const SOCIAL_TAX_RATE = 0.172
const PFU_INCOME_RATE = 0.128
const PFU_RATE = SOCIAL_TAX_RATE + PFU_INCOME_RATE
const AV_REDUCED_IR_RATE = 0.075
const AV_EXCESS_IR_RATE = 0.128
const AV_IR_ALLOWANCE_SINGLE = 4_600
const AV_IR_ALLOWANCE_COUPLE = 9_200
const AV_PREMIUM_CAP_SINGLE = 150_000
const AV_PREMIUM_CAP_COUPLE = 300_000

// PER individuel : à la sortie en capital, les versements volontaires
// déduits sont imposés au barème sur 100 % de leur montant, sans abattement
// de 10 %. Les gains relèvent du PFU (règles simplifiées de projection).
const PER_SOCIAL_RATE = 0.172

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
    desc: "Versements déductibles (TMI) à l'entrée, sortie allégée",
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
  contributionBase = 0,
  opts: TaxBreakdownOptions = {},
): TaxBreakdown {
  const grossGains = Math.max(0, grossGainsInput)
  const tmi = opts.tmi ?? 0.3
  const ctoTaxMode = opts.ctoTaxMode ?? "pfu"
  const notes: string[] = []
  let taxableGains = grossGains
  let taxableContributions = 0
  let contributionsTax = 0
  let socialCharges = 0
  let incomeTax = 0
  let flatTax = 0

  if ((grossGains <= 0 && envelope !== "per") || envelope === "none") {
    return {
      grossGains,
      taxableGains: 0,
      taxableContributions: 0,
      contributionsTax: 0,
      socialCharges: 0,
      incomeTax: 0,
      flatTax: 0,
      netGains: grossGains,
      totalTax: 0,
      effectiveRate: 0,
      notes: envelope === "none" ? ["Simulation sans impôts (aucun compte d'investissement choisi)."] : notes,
    }
  }

  if (envelope === "cto") {
    socialCharges = grossGains * SOCIAL_TAX_RATE
    if (ctoTaxMode === "bareme") {
      taxableGains = grossGains
      incomeTax = taxableGains * tmi
      notes.push(
        `CTO en barème progressif : 17,2 % de cotisations sociales + impôt sur le revenu à votre TMI de ${(
          tmi * 100
        ).toFixed(0)} %.`,
      )
    } else {
      incomeTax = grossGains * PFU_INCOME_RATE
      flatTax = grossGains * PFU_RATE
      notes.push(
        "CTO (compte-titres ordinaire) : impôt unique de 30 % = 17,2 % de cotisations sociales + 12,8 % d'impôt sur le revenu.",
      )
    }
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
      const cap = couple ? AV_PREMIUM_CAP_COUPLE : AV_PREMIUM_CAP_SINGLE
      taxableGains = Math.max(0, grossGains - allowance)
      // Les gains sont répartis au prorata des primes : jusqu'au plafond de
      // primes (150 k€ célibataire / 300 k€ couple), le taux réduit de 7,5 %
      // s'applique ; au-delà, les gains sont taxés à 12,8 %.
      const withinFraction = contributionBase > 0 ? Math.min(1, cap / contributionBase) : 1
      incomeTax =
        taxableGains * withinFraction * AV_REDUCED_IR_RATE + taxableGains * (1 - withinFraction) * AV_EXCESS_IR_RATE
      notes.push(
        `Assurance-vie détenue plus de 8 ans : cotisations sociales sur tous les gains + abattement de ${(
          allowance / 1000
        ).toFixed(0)} k€/an. Les gains sur les primes jusqu'à ${(cap / 1000).toFixed(
          0,
        )} k€ sont taxés à 7,5 %, au-delà à 12,8 %.`,
      )
    } else {
      incomeTax = grossGains * PFU_INCOME_RATE
      flatTax = grossGains * PFU_RATE
      notes.push("Assurance-vie détenue moins de 8 ans : impôt unique de 30 %.")
    }
  }

  if (envelope === "per") {
    // Le moteur passe la base de versements personnels dans contributionBase.
    // Les versements PER déduits à l'entrée sont taxés séparément à la TMI,
    // sans abattement de 10 % et sans cotisations sociales. Les gains sont
    // soumis au PFU dans cette projection (12,8 % IR + 17,2 % sociaux).
    taxableContributions = Math.max(0, contributionBase)
    contributionsTax = taxableContributions * tmi
    socialCharges = grossGains * PER_SOCIAL_RATE
    incomeTax = grossGains * PFU_INCOME_RATE
    flatTax = grossGains * (PER_SOCIAL_RATE + PFU_INCOME_RATE)
    notes.push(
      `PER : les versements déduits à l'entrée (${(tmi * 100).toFixed(
        0,
      )} % de TMI) sont imposés à la sortie sur 100 % du capital correspondant, sans abattement de 10 %. Les gains sont modélisés au PFU (12,8 % + 17,2 %).`,
    )
  }

  const exitTax = socialCharges + incomeTax + contributionsTax
  return {
    grossGains: roundCent(grossGains),
    taxableGains: roundCent(taxableGains),
    taxableContributions: roundCent(taxableContributions),
    contributionsTax: roundCent(contributionsTax),
    socialCharges: roundCent(socialCharges),
    incomeTax: roundCent(incomeTax),
    flatTax: roundCent(flatTax),
    netGains: roundCent(Math.max(0, grossGains - socialCharges - incomeTax)),
    totalTax: roundCent(exitTax),
    effectiveRate: grossGains + taxableContributions > 0 ? exitTax / (grossGains + taxableContributions) : 0,
    notes,
  }
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
