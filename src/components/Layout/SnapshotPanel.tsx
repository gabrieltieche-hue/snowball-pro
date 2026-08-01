import { Camera, RotateCcw, Trash2 } from "lucide-react"
import { fmtCurrency } from "../../engine"
import type { SavedSnapshot } from "../../types"

interface SnapshotPanelProps {
  snapshots: SavedSnapshot[]
  onSave: () => void
  onLoad: (id: string) => void
  onRemove: (id: string) => void
}

export function SnapshotPanel({ snapshots, onSave, onLoad, onRemove }: SnapshotPanelProps) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">💾 Snapshots</div>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Camera size={11} /> Sauvegarder
        </button>
      </div>

      {snapshots.length === 0 ? (
        <p className="text-[10px] text-text-dim leading-relaxed">
          Aucun état sauvegardé. Figez un scénario pour le retrouver plus tard.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {snapshots.map(snap => (
            <li key={snap.id} className="flex items-center justify-between gap-2 glass rounded-xl px-3 py-2">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-text truncate">{snap.name}</div>
                <div className="text-[9px] text-text-dim mono truncate">{fmtCurrency(snap.finalCapital)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onLoad(snap.id)}
                  title="Charger ce scénario"
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(snap.id)}
                  title="Supprimer ce snapshot"
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
