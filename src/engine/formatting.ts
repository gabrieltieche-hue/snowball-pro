import type { Lang } from "./i18n"

/**
 * Formate un montant en euros. Français : « 1 234 567,89 € » (espace fine,
 * virgule décimale, M€/Md€). Anglais : « €1,234,567.89 » (Intl en-US, M/B).
 * Le param `lang` est optionnel (défaut fr) : toute l'app pré-i18n et les
 * tests moteur restent identiques.
 */
export function fmtCurrency(value: number, lang: Lang = "fr"): string {
  const n = Math.abs(value) < 0.005 ? 0 : value
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (lang === "en") {
    if (abs >= 1_000_000_000) return `${sign}€${(abs / 1_000_000_000).toFixed(2)}B`
    if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 10_000) return `${sign}€${Math.round(abs).toLocaleString("en-US")}`
    return `${sign}€${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  // Séparateur décimal français (virgule) partout, y compris M€/Md€ : avant
  // l'audit v5.6.2, « 1.00 M€ » (point) côtoyait « 1 000 000 € » et « 10,1 % »
  // à virgule — incohérent dans une app en français.
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2).replace(".", ",")} Md€`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2).replace(".", ",")} M€`
  if (abs >= 10_000) return `${sign}${Math.round(abs).toLocaleString("fr-FR")} €`
  return `${sign}${abs.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

/** Idem fmtCurrency, en compact (« 1,2M » en fr, « 1.2M » en en). */
export function fmtCompact(value: number, lang: Lang = "fr"): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (lang === "en") {
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K`
    return `${sign}${Math.round(abs)}`
  }
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(".", ",")}Md`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`
  return `${sign}${Math.round(abs)}`
}

export function fmtPercent(value: number, digits = 1, lang: Lang = "fr"): string {
  const d = value.toFixed(digits)
  const formatted = lang === "en" ? d : d.replace(".", ",")
  return `${value >= 0 ? "+" : ""}${formatted}%`
}

/**
 * Formate un nombre avec la virgule décimale française (12.5 → « 12,5 »).
 * Audit v5.6.3 : les derniers affichages utilisaient encore toFixed() brut
 * (« 43.3 % », « 0.00%/an », « TAUX 2.5 % ») — helper unique pour ne plus
 * jamais laisser un point décimal anglais dans l'interface.
 */
export function fmtDecimal(value: number, digits = 1, lang: Lang = "fr"): string {
  const d = value.toFixed(digits)
  return lang === "en" ? d : d.replace(".", ",")
}

/**
 * Échappe une cellule CSV contre l'injection de formule (OWASP CSV Injection) :
 * - préfixe `'` si la valeur commence par `=`, `+`, `-` ou `@` ;
 * - quote la cellule (en doublant les guillemets) si elle contient `;`, `"`
 *   ou un saut de ligne.
 * Aujourd'hui toutes les cellules sont générées par le moteur, mais c'est une
 * défense en profondeur si une saisie utilisateur libre y arrivait un jour.
 */
export function escapeCsvCell(value: string): string {
  let out = value
  if (/^[=+\-@]/.test(out)) out = `'${out}`
  if (/[;"\n\r]/.test(out)) out = `"${out.replace(/"/g, '""')}"`
  return out
}

export function parseCurrencyInput(raw: string): number {
  const compact = raw.trim().toLowerCase().replace(/\s/g, "").replace("€", "").replace(",", ".")
  const match = compact.match(/^(-?\d+(?:\.\d+)?)(k|m|md|b)?$/)
  // Entrée malformée (ou vide) : on retourne NaN au lieu d'un 0 sournois —
  // l'appelant (SmartInput) peut alors conserver la valeur précédente.
  if (!match) return Number.NaN
  const v = Number.parseFloat(match[1] ?? "0")
  const s = match[2]
  if (s === "k") return v * 1_000
  if (s === "m") return v * 1_000_000
  if (s === "md" || s === "b") return v * 1_000_000_000
  return v
}
