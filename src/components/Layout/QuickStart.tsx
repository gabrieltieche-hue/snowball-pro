import { useMemo } from "react"
import { Rocket, X } from "lucide-react"
import { DEFAULT_INPUTS, runSimulation } from "../../engine"
import { useLang } from "../../i18n"
import type { SimulationInputs } from "../../types"
import { QUICKSTART_PROFILES } from "../../utils/quickStart"

interface QuickStartProps {
  onApply: (patch: Partial<SimulationInputs>) => void
  onDismiss: () => void
}

/**
 * Bandeau d'activation « Commencez ici » (v6.8) : trois profils prêts à
 * l'emploi pour un nouvel utilisateur. Résultat d'abord — chaque carte affiche
 * le capital final CALCULÉ par le vrai moteur (jamais un chiffre en dur), un
 * clic applique le profil (réglages + fiscalité + courbe se mettent à jour).
 * Même langage visuel que le bandeau « lien partagé » (glass-gold).
 */
export function QuickStart({ onApply, onDismiss }: QuickStartProps) {
  const { tr, fmtCurrency } = useLang()
  // Une seule passe de calcul pour les trois profils, au montage.
  const capitals = useMemo(
    () =>
      QUICKSTART_PROFILES.map(p => {
        const rows = runSimulation({ ...DEFAULT_INPUTS, ...p.patch })
        const last = rows[rows.length - 1]
        return { id: p.id, nominal: last.nominal, real: last.real }
      }),
    [],
  )

  return (
    <section aria-label={tr("Commencez ici — profils de départ")} className="glass-gold rounded-2xl px-4 py-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Rocket size={14} className="text-primary shrink-0" aria-hidden />
          <p className="text-[11px] sm:text-xs font-bold text-text">
            {tr("Commencez ici — choisissez un profil de départ")}
          </p>
        </div>
        {/* Cible tactile confortable : padding autour de la croix 14 px
            (la marge négative garde l'alignement visuel). */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={tr("Fermer les profils de départ")}
          className="text-text-muted hover:text-text transition-colors shrink-0 p-2.5 -m-1"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      <p className="text-[10.5px] text-text-muted mt-1 leading-relaxed max-w-2xl">
        {tr(
          "Les réglages par défaut sont une situation type. Un profil ajuste tout en un clic — capital, versement, durée et enveloppe fiscale.",
        )}
      </p>
      {/* Mobile : cartes en ligne défilante (snap) — un bandeau de 3 cartes
          empilées ferait ~700 px de haut et repousserait le résultat. Sur
          sm+ : vraie grille 3 colonnes comme avant. */}
      <div className="mt-3 grid grid-flow-col auto-cols-[74%] gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {QUICKSTART_PROFILES.map(p => {
          const cap = capitals.find(c => c.id === p.id)
          return (
            <div key={p.id} className="rounded-xl border border-border/70 bg-surface-50/40 p-3 snap-start sm:snap-none">
              <p className="text-[11px] font-bold text-text leading-tight">{tr(p.name)}</p>
              <p className="text-[9px] text-text-dim uppercase tracking-[0.1em] mt-1">{tr(p.meta)}</p>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-[9.5px] text-text-muted">{tr("Capital final")}</span>
                <span className="mono text-[13px] font-extrabold text-primary">{fmtCurrency(cap?.nominal ?? 0)}</span>
              </div>
              {/* Double échelle (philosophie app) : le pouvoir d'achat reste
                  visible, la valeur sur le compte est le chiffre principal. */}
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <span className="text-[9px] text-text-dim">{tr("En € d'aujourd'hui")}</span>
                <span className="mono text-[10.5px] font-bold text-text-muted">{fmtCurrency(cap?.real ?? 0)}</span>
              </div>
              <button
                type="button"
                onClick={() => onApply(p.patch)}
                className="mt-2.5 w-full rounded-lg bg-primary btn-gold-text font-extrabold text-[10.5px] py-2.5 sm:py-1.5 shadow-gold transition-all duration-150 active:scale-[0.98] hover:brightness-110"
              >
                {tr("Utiliser ce profil")}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
