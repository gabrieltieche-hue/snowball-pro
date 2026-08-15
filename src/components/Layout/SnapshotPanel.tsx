import { useRef, useState } from "react"
import { Camera, RotateCcw, Trash2 } from "lucide-react"
import { useLang } from "../../i18n"
import type { SavedSnapshot } from "../../types"

interface SnapshotPanelProps {
  snapshots: SavedSnapshot[]
  onSave: () => void
  onLoad: (id: string) => void
  onRemove: (id: string) => void
}

export function SnapshotPanel({ snapshots, onSave, onLoad, onRemove }: SnapshotPanelProps) {
  const { tr, fmtCurrency } = useLang()
  // M2 — suppression en deux temps : un premier clic arme la confirmation,
  // le second exécute. Évite de détruire un scénario d'un simple tap (pas
  // d'undo sur les snapshots).
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const confirmTimerRef = useRef<number | null>(null)

  const requestRemove = (snap: SavedSnapshot) => {
    if (confirmingId === snap.id) {
      onRemove(snap.id)
      setConfirmingId(null)
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
      return
    }
    setConfirmingId(snap.id)
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
    confirmTimerRef.current = window.setTimeout(() => setConfirmingId(c => (c === snap.id ? null : c)), 3500)
  }
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
          <span className="w-1 h-3.5 rounded-full bg-primary shrink-0" aria-hidden />
          <Camera size={12} className="text-primary" aria-hidden /> {tr("Snapshots")}
        </div>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Camera size={11} /> {tr("Sauvegarder")}
        </button>
      </div>

      {snapshots.length === 0 ? (
        <p className="text-[10px] text-text-dim leading-relaxed">
          {tr("Aucun état sauvegardé. Figez un scénario pour le retrouver plus tard.")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {snapshots.map(snap => (
            <li key={snap.id} className="flex items-center justify-between gap-2 glass rounded-xl px-3 py-2">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-text truncate">{snap.name}</div>
                <div className="text-[10px] text-text-dim mono truncate">{fmtCurrency(snap.finalCapital)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onLoad(snap.id)}
                  title={tr("Charger ce scénario")}
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => requestRemove(snap)}
                  title={confirmingId === snap.id ? tr("Confirmer la suppression") : tr("Supprimer ce snapshot")}
                  aria-label={
                    confirmingId === snap.id
                      ? tr("Confirmer la suppression de {name}", { name: snap.name })
                      : tr("Supprimer ce snapshot")
                  }
                  className={`p-1.5 rounded-lg transition-colors ${
                    confirmingId === snap.id
                      ? "bg-danger/20 text-danger animate-pulse"
                      : "text-text-muted hover:text-danger hover:bg-danger/10"
                  }`}
                >
                  {confirmingId === snap.id ? (
                    <span className="text-[10px] font-bold px-0.5">{tr("Confirmer ?")}</span>
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
