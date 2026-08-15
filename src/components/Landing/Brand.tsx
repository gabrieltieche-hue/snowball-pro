import { Wallet } from "lucide-react"
import { useLang } from "../../i18n"

/** Marque SNOWBALL PRO — même emblème or que l'en-tête de l'app. */
export function Brand() {
  const { tr } = useLang()
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center shadow-gold shrink-0">
        <Wallet size={18} className="btn-gold-text" aria-hidden />
        <span className="absolute -inset-px rounded-xl ring-1 ring-primary/50" aria-hidden />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg sm:text-xl font-extrabold tracking-tight">
          SNOWBALL <span className="text-primary">PRO</span>
        </div>
        <div className="text-[9px] sm:text-[10px] text-text-dim uppercase tracking-[0.22em]">
          {tr("Simulateur patrimonial")}
        </div>
      </div>
    </div>
  )
}
