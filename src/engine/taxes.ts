import type { EnvelopeType, TaxBreakdown, EnvelopeConfig, TaxBreakdownOptions } from "../types"
import { getTaxRules, pfuRate, fmtTaxPercent } from "./taxRules"

// Libellés des enveloppes DÉRIVÉS des règles de l'année courante : les taux
// affichés ne peuvent pas diverger de taxRules.ts (aucun chiffre en dur).
// NOTE (revue v6) : évalués au chargement du module → figés sur l'année
// courante. Tant qu'il n'y a pas de sélecteur d'année fiscale dans l'UI c'est
// exact ; quand le sélecteur arrivera (P1), ces descs devront être dérivés par
// composant pour suivre l'année choisie.
const currentRules = getTaxRules()

export const ENVELOPE_CONFIGS: EnvelopeConfig[] = [
  {
    id: "cto",
    name: "Compte-titres ordinaire",
    shortLabel: "CTO",
    desc: `Impôt unique de ${fmtTaxPercent(pfuRate(currentRules))} sur vos gains`,
    color: "var(--color-value-gold)",
  },
  {
    id: "pea",
    name: "Plan d'épargne en actions",
    shortLabel: "PEA",
    desc: `Après 5 ans : ${fmtTaxPercent(currentRules.socialRate)} de cotisations sociales seulement`,
    color: "var(--color-warning)",
  },
  {
    id: "av",
    name: "Assurance-vie",
    shortLabel: "AV",
    desc: `Après 8 ans : abattement, puis ${fmtTaxPercent(currentRules.avReducedIRRate)} + cotisations sociales`,
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
  // Règles de l'année fiscale demandée (défaut : année courante, jamais un
  // taux périmé) — toute la fiscalité découle de taxRules.ts (v6).
  const rules = getTaxRules(opts.taxYear)
  const pfu = pfuRate(rules)
  // Langue des libellés explicatifs (v6.12) — défaut français.
  const isEn = opts.lang === "en"
  // Taux « TMI 30 % » (fr) / « 30% » (en) — espace avant % propre au français.
  const tmiPct = (v: number) => `${(v * 100).toFixed(0)}${isEn ? "%" : " %"}`
  // Montant compact « 150 k€ » (fr) / « €150k » (en).
  const kAmount = (v: number) => (isEn ? `€${(v / 1000).toFixed(0)}k` : `${(v / 1000).toFixed(0)} k€`)
  const notes: string[] = []
  // Boucle chaude (décaissement) : les notes ne sont jamais lues → on ne les
  // construit pas (perf : 10 k runs × 60 ans × 12 mois = 7,2 M d'appels).
  const note = (s: string) => {
    if (!opts.noNotes) notes.push(s)
  }
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
      notes:
        envelope === "none"
          ? [
              isEn
                ? "Simulation without taxes (no investment account chosen)."
                : "Simulation sans impôts (aucun compte d'investissement choisi).",
            ]
          : notes,
    }
  }

  if (envelope === "cto") {
    socialCharges = grossGains * rules.socialRate
    if (ctoTaxMode === "bareme") {
      taxableGains = grossGains
      incomeTax = taxableGains * tmi
      note(
        isEn
          ? `CTO on progressive scale: ${fmtTaxPercent(rules.socialRate, "en")} social contributions + income tax at your marginal rate of ${tmiPct(tmi)}.`
          : `CTO en barème progressif : ${fmtTaxPercent(rules.socialRate)} de cotisations sociales + impôt sur le revenu à votre TMI de ${(
              tmi * 100
            ).toFixed(0)} %.`,
      )
    } else {
      incomeTax = grossGains * rules.pfuIncomeRate
      flatTax = grossGains * pfu
      note(
        isEn
          ? `CTO (ordinary securities account): single flat tax of ${fmtTaxPercent(pfu, "en")} = ${fmtTaxPercent(
              rules.socialRate,
              "en",
            )} social contributions + ${fmtTaxPercent(rules.pfuIncomeRate, "en")} income tax.`
          : `CTO (compte-titres ordinaire) : impôt unique de ${fmtTaxPercent(
              pfu,
            )} = ${fmtTaxPercent(rules.socialRate)} de cotisations sociales + ${fmtTaxPercent(
              rules.pfuIncomeRate,
            )} d'impôt sur le revenu.`,
      )
    }
  }

  if (envelope === "pea") {
    if (yearsHeld >= 5) {
      socialCharges = grossGains * rules.socialRate
      incomeTax = 0
      flatTax = 0
      note(
        isEn
          ? `PEA held for more than 5 years: no income tax, only ${fmtTaxPercent(
              rules.socialRate,
              "en",
            )} social contributions on gains.`
          : `PEA détenu plus de 5 ans : pas d'impôt sur le revenu, uniquement ${fmtTaxPercent(
              rules.socialRate,
            )} de cotisations sociales sur les gains.`,
      )
    } else {
      socialCharges = grossGains * rules.socialRate
      incomeTax = grossGains * rules.pfuIncomeRate
      flatTax = grossGains * pfu
      note(
        isEn
          ? `PEA held for less than 5 years: single flat tax of ${fmtTaxPercent(pfu, "en")} on gains.`
          : `PEA détenu moins de 5 ans : impôt unique de ${fmtTaxPercent(pfu)} sur les gains.`,
      )
    }
    const cap = couple ? rules.peaCapCouple : rules.peaCapSingle
    if (contributionBase > cap)
      note(
        isEn
          ? `PEA cap exceeded: this account is capped at ${kAmount(cap)} of total contributions.`
          : `Plafond PEA dépassé : ce compte est plafonné à ${(cap / 1000).toFixed(0)} k€ de versements au total.`,
      )
  }

  if (envelope === "av") {
    socialCharges = grossGains * rules.avSocialRate
    if (yearsHeld >= 8) {
      const allowance = couple ? rules.avAllowanceCouple : rules.avAllowanceSingle
      const cap = couple ? rules.avPremiumCapCouple : rules.avPremiumCapSingle
      taxableGains = Math.max(0, grossGains - allowance)
      // Les gains sont répartis au prorata des primes : jusqu'au plafond de
      // primes (150 k€ célibataire / 300 k€ couple), le taux réduit de 7,5 %
      // s'applique ; au-delà, les gains sont taxés au taux plein (taxRules).
      const withinFraction = contributionBase > 0 ? Math.min(1, cap / contributionBase) : 1
      incomeTax =
        taxableGains * withinFraction * rules.avReducedIRRate +
        taxableGains * (1 - withinFraction) * rules.avExcessIRRate
      note(
        isEn
          ? `Life insurance held for more than 8 years: social contributions on all gains + allowance of ${kAmount(
              allowance,
            )}/year. Gains on premiums up to ${kAmount(cap)} are taxed at ${fmtTaxPercent(
              rules.avReducedIRRate,
              "en",
            )}, beyond at ${fmtTaxPercent(rules.avExcessIRRate, "en")}.`
          : `Assurance-vie détenue plus de 8 ans : cotisations sociales sur tous les gains + abattement de ${(
              allowance / 1000
            ).toFixed(0)} k€/an. Les gains sur les primes jusqu'à ${(cap / 1000).toFixed(
              0,
            )} k€ sont taxés à ${fmtTaxPercent(rules.avReducedIRRate)}, au-delà à ${fmtTaxPercent(
              rules.avExcessIRRate,
            )}.`,
      )
    } else {
      incomeTax = grossGains * rules.pfuIncomeRate
      flatTax = grossGains * pfu
      note(
        isEn
          ? `Life insurance held for less than 8 years: single flat tax of ${fmtTaxPercent(pfu, "en")}.`
          : `Assurance-vie détenue moins de 8 ans : impôt unique de ${fmtTaxPercent(pfu)}.`,
      )
    }
  }

  if (envelope === "per") {
    // Le moteur passe la base de versements personnels dans contributionBase.
    // Les versements PER déduits à l'entrée sont taxés séparément à la TMI,
    // sans abattement de 10 % et sans cotisations sociales. Les gains sont
    // soumis au PFU dans cette projection (part IR + prélèvements sociaux,
    // taux de l'année fiscale dans taxRules).
    taxableContributions = Math.max(0, contributionBase)
    contributionsTax = taxableContributions * tmi
    socialCharges = grossGains * rules.perSocialRate
    incomeTax = grossGains * rules.pfuIncomeRate
    flatTax = grossGains * (rules.perSocialRate + rules.pfuIncomeRate)
    note(
      isEn
        ? `PER: contributions deducted on entry (${tmiPct(
            tmi,
          )} marginal rate) are taxed at exit on 100% of the corresponding capital, with no 10% allowance. Gains are modeled at the flat tax (${fmtTaxPercent(
            rules.pfuIncomeRate,
            "en",
          )} + ${fmtTaxPercent(rules.perSocialRate, "en")}).`
        : `PER : les versements déduits à l'entrée (${(tmi * 100).toFixed(
            0,
          )} % de TMI) sont imposés à la sortie sur 100 % du capital correspondant, sans abattement de 10 %. Les gains sont modélisés au PFU (${fmtTaxPercent(
            rules.pfuIncomeRate,
          )} + ${fmtTaxPercent(rules.perSocialRate)}).`,
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
