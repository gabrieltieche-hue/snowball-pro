/**
 * Contexte React de langue (v6.12.0) — fournit `tr` et les formatters liés à
 * la langue courante à toute l'arborescence (app, landing, auth, rapport).
 *
 * Sans <LangProvider> (tests qui montent un composant isolé), `useLang`
 * retombe sur le français : aucun test existant ne change.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { fmtCompact, fmtCurrency, fmtDecimal, fmtPercent, LANG_LOCALE, langCode, tr } from "./engine"
import { fmtTaxPercent } from "./engine/taxRules"
import type { Lang } from "./engine"

export const LANG_KEY = "snowball_v5_lang"

export function loadInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === "fr" || stored === "en") return stored
    // Premier passage : la langue du navigateur sert de préférence initiale.
    if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) return "en"
  } catch {
    /* localStorage indisponible */
  }
  return "fr"
}

function applyLangToDocument(lang: Lang): void {
  try {
    document.documentElement.lang = lang
    document.title =
      lang === "en"
        ? "Snowball Pro — French wealth simulator (savings, tax, retirement)"
        : "Snowball Pro — Simulateur patrimonial français gratuit"
  } catch {
    /* jsdom / document indisponible */
  }
}

export interface LangContextValue {
  lang: Lang
  /** Passe à l'autre langue (fr ⇄ en). */
  setLang: (lang: Lang) => void
  toggleLang: () => void
  /** Traduit un libellé français ({x} placeholders). */
  tr: (text: string, params?: Record<string, string | number>) => string
  /** Locale Intl de la langue courante ("fr-FR" / "en-US"). */
  locale: string
  // Formatters liés à la langue courante — mêmes signatures qu'avant l'i18n
  // (sans paramètre langue) : les composants gardent leurs appels.
  fmtCurrency: (value: number) => string
  fmtCompact: (value: number) => string
  fmtPercent: (value: number, digits?: number) => string
  fmtDecimal: (value: number, digits?: number) => string
  /** Taux fiscal (0.186 → « 18,6 % » en fr, « 18.6% » en en). */
  fmtTaxPercent: (rate: number) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadInitialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      /* localStorage indisponible */
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLangState(prev => {
      const next: Lang = prev === "fr" ? "en" : "fr"
      try {
        localStorage.setItem(LANG_KEY, next)
      } catch {
        /* localStorage indisponible */
      }
      return next
    })
  }, [])

  useEffect(() => {
    applyLangToDocument(lang)
  }, [lang])

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      tr: (text, params) => tr(lang, text, params),
      locale: LANG_LOCALE[lang],
      fmtCurrency: v => fmtCurrency(v, lang),
      fmtCompact: v => fmtCompact(v, lang),
      fmtPercent: (v, digits) => fmtPercent(v, digits, lang),
      fmtDecimal: (v, digits) => fmtDecimal(v, digits, lang),
      fmtTaxPercent: v => fmtTaxPercent(v, lang),
    }),
    [lang, setLang, toggleLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

/** Langue courante + helpers liés. Sans provider : français (rétrocompatible). */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (ctx) return ctx
  return {
    lang: "fr",
    setLang: () => {},
    toggleLang: () => {},
    tr: (text, params) => tr("fr", text, params),
    locale: LANG_LOCALE.fr,
    fmtCurrency: v => fmtCurrency(v),
    fmtCompact: v => fmtCompact(v),
    fmtPercent: (v, digits) => fmtPercent(v, digits),
    fmtDecimal: (v, digits) => fmtDecimal(v, digits),
    fmtTaxPercent: v => fmtTaxPercent(v),
  }
}

/** Court code de langue (« FR » / « EN »). */
export function useLangCode(): string {
  return langCode(useLang().lang)
}
