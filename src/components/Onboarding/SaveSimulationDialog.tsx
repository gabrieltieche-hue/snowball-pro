import { AlertTriangle, Save, X } from "lucide-react"
import { useLang } from "../../i18n"

interface SaveSimulationDialogProps {
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

/**
 * Dialogue v7 — avant de créer une nouvelle simulation alors que la simulation
 * en cours a des changements non sauvegardés : proposer de la figer (snapshot)
 * plutôt que de la perdre silencieusement. Trois issues, aucune piégée.
 */
export function SaveSimulationDialog({ onSave, onDiscard, onCancel }: SaveSimulationDialogProps) {
  const { tr } = useLang()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr("Sauvegarder la simulation en cours ?")}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-surface/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm glass rounded-3xl shadow-premium-lg p-6">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <AlertTriangle size={20} aria-hidden />
        </div>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-text mt-4">
          {tr("Votre simulation a été modifiée")}
        </h2>
        <p className="text-[12px] text-text-muted leading-relaxed mt-2">
          {tr("La sauvegarder avant d'en créer une nouvelle ? Elle restera dans « Mes simulations ».")}
        </p>
        <div className="grid grid-cols-1 gap-2 mt-5">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text text-[12px] font-extrabold shadow-gold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            <Save size={13} aria-hidden /> {tr("Sauvegarder et créer")}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-bold border border-border hover:bg-glass-hover transition-colors"
          >
            <X size={13} aria-hidden /> {tr("Créer sans sauvegarder")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-[11px] font-bold text-text-muted hover:text-text transition-colors"
          >
            {tr("Annuler")}
          </button>
        </div>
      </div>
    </div>
  )
}
