import { useMemo, useRef, useState } from "react"
import { Check, FolderOpen, Pencil, Play, Plus, Trash2, Wallet } from "lucide-react"
import { ENVELOPE_CONFIGS, runSimulation } from "../../engine"
import type { SavedSnapshot, SimulationInputs, YearRow } from "../../types"
import { useLang } from "../../i18n"

interface SimulationsTabProps {
  inputs: SimulationInputs
  rows: YearRow[]
  snapshots: SavedSnapshot[]
  onNewSimulation: () => void
  onLoad: (id: string) => void
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
}

/**
 * Bibliothèque « Mes simulations » (v7) : la simulation en cours (éditable,
 * badge « En cours ») + les simulations sauvegardées par le questionnaire ou
 * manuellement. Ouvrir / renommer / supprimer — suppression en deux temps.
 */
export function SimulationsTab({
  inputs,
  rows,
  snapshots,
  onNewSimulation,
  onLoad,
  onRename,
  onRemove,
}: SimulationsTabProps) {
  const { tr, fmtCurrency, locale } = useLang()
  const lastRow = rows[rows.length - 1]
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const confirmTimerRef = useRef<number | null>(null)

  // Capital réel des simulations sauvegardées — calculé par le vrai moteur,
  // jamais en dur (philosophie produit).
  const computed = useMemo(
    () =>
      snapshots.map(snap => {
        const snapRows = runSimulation(snap.inputs)
        const last = snapRows[snapRows.length - 1]
        return { id: snap.id, nominal: last?.nominal ?? 0, real: last?.real ?? 0 }
      }),
    [snapshots],
  )

  const requestRemove = (id: string) => {
    if (confirmingId === id) {
      onRemove(id)
      setConfirmingId(null)
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
      return
    }
    setConfirmingId(id)
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
    confirmTimerRef.current = window.setTimeout(() => setConfirmingId(c => (c === id ? null : c)), 3500)
  }

  const startRename = (snap: SavedSnapshot) => {
    setRenamingId(snap.id)
    setDraftName(snap.name)
  }

  const commitRename = (id: string) => {
    if (draftName.trim() !== "") onRename(id, draftName)
    setRenamingId(null)
  }

  const metaFor = (i: SimulationInputs): string => {
    const env = ENVELOPE_CONFIGS.find(c => c.id === i.envelope)
    return `${env ? tr(env.name) : i.envelope} · ${i.duration} ${tr("ans")} · ${fmtCurrency(i.monthlyPayment)}/${tr("mois")}`
  }

  return (
    <div className="space-y-5">
      {/* En-tête : titre + action principale. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
          <span className="w-1 h-3.5 rounded-full bg-primary shrink-0" aria-hidden />
          <FolderOpen size={12} className="text-primary" aria-hidden /> {tr("Mes simulations")}
        </div>
        <button
          type="button"
          onClick={onNewSimulation}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text text-[11px] font-extrabold shadow-gold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          <Plus size={13} aria-hidden /> {tr("Nouvelle simulation")}
        </button>
      </div>

      {/* Simulation en cours — éditable, c'est celle qu'on voit dans les onglets. */}
      <section aria-label={tr("Simulation en cours")} className="glass rounded-3xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-extrabold text-text flex items-center gap-2">
              <Wallet size={13} className="text-primary shrink-0" aria-hidden />
              {tr("Simulation en cours")}
              <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-md">
                {tr("En cours")}
              </span>
            </p>
            <p className="text-[11px] text-text-dim mt-1">{metaFor(inputs)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] text-text-muted">{tr("Capital final")}</p>
            <p className="mono text-lg font-extrabold text-text">{fmtCurrency(lastRow?.nominal ?? 0)}</p>
            <p className="mono text-[11px] font-bold text-text-muted mt-0.5">
              {tr("En € d'aujourd'hui")} {fmtCurrency(lastRow?.real ?? 0)}
            </p>
          </div>
        </div>
      </section>

      {/* Simulations sauvegardées. */}
      <section aria-label={tr("Simulations sauvegardées")} className="space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
          {tr("Simulations sauvegardées")}
        </p>
        {snapshots.length === 0 ? (
          <div className="glass rounded-3xl p-6 text-center">
            <p className="text-[12px] font-bold text-text">{tr("Aucune simulation sauvegardée")}</p>
            <p className="text-[11px] text-text-muted mt-1 max-w-sm mx-auto leading-relaxed">
              {tr("Lancez une nouvelle simulation : le questionnaire la construira et l'ajoutera ici automatiquement.")}
            </p>
            <button
              type="button"
              onClick={onNewSimulation}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/30 text-[11px] font-extrabold transition-all duration-150 hover:bg-primary/20 active:scale-[0.98]"
            >
              <Plus size={13} aria-hidden /> {tr("Lancer une nouvelle simulation")}
            </button>
          </div>
        ) : (
          snapshots.map(snap => {
            const cap = computed.find(c => c.id === snap.id)
            const renaming = renamingId === snap.id
            const confirming = confirmingId === snap.id
            return (
              <div
                key={snap.id}
                className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0">
                  {renaming ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") commitRename(snap.id)
                          if (e.key === "Escape") setRenamingId(null)
                        }}
                        aria-label={tr("Nom de la simulation")}
                        className="w-48 rounded-lg border border-primary/50 bg-surface-50/60 px-2 py-1 text-[12px] font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => commitRename(snap.id)}
                        aria-label={tr("Enregistrer le nom")}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[12px] font-extrabold text-text truncate">{snap.name}</p>
                  )}
                  <p className="text-[10.5px] text-text-dim mt-0.5 truncate">
                    {metaFor(snap.inputs)} ·{" "}
                    {new Date(snap.createdAt).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <span className="mono text-[12px] font-extrabold text-primary">
                      {fmtCurrency(cap?.nominal ?? 0)}
                    </span>
                    <span className="mono text-[10px] text-text-muted">
                      {tr("En € d'aujourd'hui")} {fmtCurrency(cap?.real ?? 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoad(snap.id)}
                    title={tr("Ouvrir cette simulation")}
                    aria-label={tr("Ouvrir {name}", { name: snap.name })}
                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Play size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(snap)}
                    title={tr("Renommer")}
                    aria-label={tr("Renommer {name}", { name: snap.name })}
                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestRemove(snap.id)}
                    title={confirming ? tr("Confirmer la suppression") : tr("Supprimer")}
                    aria-label={
                      confirming
                        ? tr("Confirmer la suppression de {name}", { name: snap.name })
                        : tr("Supprimer {name}", { name: snap.name })
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      confirming
                        ? "bg-danger/20 text-danger animate-pulse"
                        : "text-text-muted hover:text-danger hover:bg-danger/10"
                    }`}
                  >
                    {confirming ? (
                      <span className="text-[10px] font-bold px-0.5">{tr("Confirmer ?")}</span>
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
