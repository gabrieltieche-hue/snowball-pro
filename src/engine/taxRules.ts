/**
 * RÈGLES FISCALES FRANÇAISES PAR ANNÉE — source de vérité unique (v6).
 *
 * Tous les taux d'imposition vivent ici, datés et sourcés. `computeTaxBreakdown`
 * (taxes.ts) ne lit plus de constantes en dur : il résout l'année demandée et
 * consomme cette table. Aucun chiffre fiscal ne doit exister ailleurs
 * (hors tests et libellés dérivés de cette table).
 *
 * Convention : une entrée COMPLÈTE par année (pas d'héritage implicite) —
 * quand un taux change, on ajoute une nouvelle année et on laisse l'ancienne
 * intacte : traçabilité (git blame + sources[]) et tests de rétrocompatibilité
 * (les ancrages 2025 restent valides).
 *
 * Trouver les taux d'une année : `getTaxRules(année)` (repli sûr sur l'année
 * courante si l'année n'est pas supportée).
 */
export interface TaxYearRules {
  /** Année fiscale d'application (ex. 2025). */
  year: number
  country: "FR"
  /** Prélèvements sociaux de droit commun (CTO, PEA, PER). 2025 : 17,2 % — 2026 : 18,6 %. */
  socialRate: number
  /** PFU : part impôt sur le revenu (stable à 12,8 %). */
  pfuIncomeRate: number
  /** Assurance-vie : prélèvements sociaux — EXCLUE des hausses de CSG (17,2 % inchangé en 2026). */
  avSocialRate: number
  /** AV ≥ 8 ans : taux réduit sur les gains (primes ≤ plafond par personne). */
  avReducedIRRate: number
  /** AV ≥ 8 ans : taux plein au-delà du plafond de primes. */
  avExcessIRRate: number
  /** AV : abattement annuel (célibataire / couple). */
  avAllowanceSingle: number
  avAllowanceCouple: number
  /** AV : plafond de primes bénéficiant du taux réduit — PAR PERSONNE (300 k€ cumulés pour un couple). */
  avPremiumCapSingle: number
  avPremiumCapCouple: number
  /** PER : prélèvements sociaux sur les gains à la sortie en capital. */
  perSocialRate: number
  /** PEA : plafond de versements. */
  peaCapSingle: number
  peaCapCouple: number
  /** Sources réglementaires de l'année (pour la traçabilité). */
  sources: string[]
}

export const TAX_YEARS = [2025, 2026] as const
export type SupportedTaxYear = (typeof TAX_YEARS)[number]

/**
 * Année fiscale courante par défaut.
 *
 * Volontairement une CONSTANTE, pas `new Date().getFullYear()` : le calcul et
 * les tests doivent être déterministes. Quand les taux changent, on ajoute une
 * entrée dans TAX_RULES ET on avance cette constante (une seule ligne à
 * penser, sourcée par les tests).
 */
export const CURRENT_TAX_YEAR: SupportedTaxYear = 2026

export const TAX_RULES: Record<number, TaxYearRules> = {
  2025: {
    year: 2025,
    country: "FR",
    socialRate: 0.172,
    pfuIncomeRate: 0.128,
    avSocialRate: 0.172,
    avReducedIRRate: 0.075,
    avExcessIRRate: 0.128,
    avAllowanceSingle: 4_600,
    avAllowanceCouple: 9_200,
    avPremiumCapSingle: 150_000,
    avPremiumCapCouple: 300_000,
    perSocialRate: 0.172,
    peaCapSingle: 150_000,
    peaCapCouple: 300_000,
    sources: [
      "CGI art. 200 A, 150-0 A ; CSS art. L136-7 / L136-8 (taux 2025)",
      "PFU = 12,8 % IR + 17,2 % prélèvements sociaux = 30 %",
    ],
  },
  2026: {
    year: 2026,
    country: "FR",
    // LFSS 2026 : la CSG passe de 9,2 % à 10,6 % → prélèvements sociaux 18,6 %
    // et PFU 31,4 % (12,8 % + 18,6 %) sur les revenus du capital. L'assurance-
    // vie est EXCLUE de la hausse (prélèvements sociaux inchangés à 17,2 %).
    socialRate: 0.186,
    pfuIncomeRate: 0.128,
    avSocialRate: 0.172,
    avReducedIRRate: 0.075,
    avExcessIRRate: 0.128,
    avAllowanceSingle: 4_600,
    avAllowanceCouple: 9_200,
    avPremiumCapSingle: 150_000,
    avPremiumCapCouple: 300_000,
    perSocialRate: 0.186,
    peaCapSingle: 150_000,
    peaCapCouple: 300_000,
    sources: [
      "LFSS 2026 — hausse de la CSG de 1,4 pt (CSS art. L136-8) : prélèvements sociaux 18,6 %",
      "service-public.fr (10/02/2026) : PFU = 12,8 % + 18,6 % = 31,4 %",
      "AV exclue : prélèvements sociaux maintenus à 17,2 %",
    ],
  },
}

/** Résout une année demandée vers une année supportée (repli sûr : année courante). */
export function resolveTaxYear(year: number | undefined): SupportedTaxYear {
  if (typeof year === "number" && TAX_RULES[year]) return year as SupportedTaxYear
  return CURRENT_TAX_YEAR
}

/** Règles d'une année fiscale (défaut : année courante). */
export function getTaxRules(year?: number): TaxYearRules {
  return TAX_RULES[resolveTaxYear(year)]
}

/** PFU total (impôt sur le revenu + prélèvements sociaux de droit commun). */
export function pfuRate(rules: TaxYearRules): number {
  return rules.pfuIncomeRate + rules.socialRate
}

/**
 * Formate un taux en français (0.186 → « 18,6 % » ; 0.3 → « 30 % ») ou en
 * anglais (0.186 → « 18.6% » ; 0.3 → « 30% »). Utilisé par les libellés UI
 * DÉRIVÉS de cette table — jamais de taux codé en dur dans les composants.
 * Le param `lang` est optionnel (défaut fr, rétrocompatible).
 */
export function fmtTaxPercent(rate: number, lang: "fr" | "en" = "fr"): string {
  const s = `${(rate * 100).toFixed(1)}`
  const trimmed = s.replace(/\.0$/, "").replace(/,0$/, "")
  return lang === "en" ? `${trimmed}%` : `${trimmed.replace(".", ",")} %`
}
