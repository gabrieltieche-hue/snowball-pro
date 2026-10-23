import { Wallet } from "lucide-react"
import { useLang } from "../../i18n"

/** Marque SNOWBALL PRO — même emblème or que l'en-tête de l'app.
 *  Compacte sur mobile (v6.23) : logo 32 px et sous-titre masqué, pour que
 *  l'en-tête tienne sur une seule ligne au lieu de manger l'écran. */
export function Brand() {
  const { tr } = useLang()
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center shadow-gold shrink-0">
        <Wallet size={15} className="btn-gold-text sm:hidden" aria-hidden />
        <Wallet size={18} className="btn-gold-text hidden sm:block" aria-hidden />
        <span className="absolute -inset-px rounded-xl ring-1 ring-primary/50" aria-hidden />
      </div>
      <div className="leading-tight min-w-0">
        <div className="font-display text-[15px] sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
          SNOWBALL <span className="text-primary">PRO</span>
        </div>
        <div className="hidden sm:block text-[9px] sm:text-[10px] text-text-dim uppercase tracking-[0.22em]">
          {tr("Simulateur patrimonial")}
        </div>
      </div>
    </div>
  )
}
