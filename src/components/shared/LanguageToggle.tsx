import { Languages } from "lucide-react"
import { useLang } from "../../i18n"

/**
 * Bouton de langue (v6.12) : affiche le code de la langue courante (« FR » /
 * « EN ») et bascule au clic. La préférence est persistée par LangProvider.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, toggleLang } = useLang()
  const label = lang === "fr" ? "Passer en anglais" : "Switch to French"
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-[11px] font-bold transition-all duration-150 active:scale-[0.97] glass hover:bg-glass-hover ${className}`}
    >
      <Languages size={12} aria-hidden />
      <span className="uppercase tracking-wide">{lang === "fr" ? "FR" : "EN"}</span>
    </button>
  )
}
