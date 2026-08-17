import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  ChevronRight,
  Download,
  Eraser,
  GitCompareArrows,
  GraduationCap,
  Languages,
  Moon,
  MoreHorizontal,
  Plus,
  Redo2,
  Share2,
  Sun,
  Undo2,
} from "lucide-react"
import type { ValidationError } from "../../engine"
import { cn } from "../../utils/cn"
import type { UiMode } from "../../utils/uiMode"
import { useLang } from "../../i18n"
import type { SimulationInputs } from "../../types"
import { ExportPanel } from "./ExportMenu"
import { SharePanel } from "./ShareMenu"

interface ActionBarProps {
  /** v7 : l'action principale — le questionnaire remplace la prééminence des réglages. */
  onNewSimulation: () => void
  onExportCSV: () => void
  onExportJSON: () => void
  onPrint: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  comparing: boolean
  onToggleCompare: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  validationErrors: ValidationError[]
  inputs: SimulationInputs
  uiMode: UiMode
  onToggleUiMode: () => void
  onReset: () => void
  /** « Corriger l'erreur » (ligne d'un problème) : amène au champ fautif (onglet ou sidebar). */
  onFixError: (field: ValidationError["field"]) => void
  /** « Corriger automatiquement » : corrige toutes les anomalies sans que l'utilisateur intervienne. */
  onAutoFix: () => void
}

// Cible tactile confortable sur mobile (py-2.5 ≈ 37 px) — densité desktop
// conservée sur sm+ (py-2).
const baseBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] font-bold transition-all duration-150 active:scale-[0.97]"

// Bouton icône seule du header (⚠, thème, Annuler/Rétablir) : carré 36 px,
// la cible tactile reste confortable sans le bruit d'un libellé.
const iconBtn =
  "inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 active:scale-[0.97]"

/**
 * Barre d'actions de l'en-tête (refonte) : 3 niveaux hiérarchiques.
 *  - Niveau 0 : « Nouvelle simulation », l'UNIQUE bouton doré du header.
 *  - Niveau 1 (discrets, icônes seules) : avertissement ⚠ (conditionnel),
 *    Annuler/Rétablir, thème Sombre/Clair.
 *  - Niveau 2 : menu « ⋯ » en panneaux (Exporter, Partager, Langue, Comparer,
 *    Mode, Réinitialiser) — l'en-tête ne sature plus.
 */
export function ActionBar({
  onNewSimulation,
  onExportCSV,
  onExportJSON,
  onPrint,
  darkMode,
  onToggleDarkMode,
  comparing,
  onToggleCompare,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  validationErrors,
  inputs,
  uiMode,
  onToggleUiMode,
  onReset,
  onFixError,
  onAutoFix,
}: ActionBarProps) {
  const { tr, lang, toggleLang } = useLang()
  const errorCount = validationErrors.filter(e => e.severity === "error").length
  const warningCount = validationErrors.filter(e => e.severity === "warning").length
  // Première chose à corriger : une erreur passe avant un simple avertissement.
  const firstIssue = validationErrors.find(e => e.severity === "error") ?? validationErrors[0]
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<"menu" | "export" | "share">("menu")
  const [confirmReset, setConfirmReset] = useState(false)
  const [warnOpen, setWarnOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const warnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open && !warnOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
      if (warnRef.current && !warnRef.current.contains(event.target as Node)) setWarnOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setWarnOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, warnOpen])

  const close = () => {
    setOpen(false)
    setPanel("menu")
    setConfirmReset(false)
  }

  const itemClass =
    "w-full text-left inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors hover:bg-glass-hover"

  return (
    <div className="flex gap-2 sm:gap-2.5 justify-end flex-wrap no-print items-center max-sm:justify-start">
      {/* v7 — l'action principale de l'app : « Nouvelle simulation » ouvre le
          questionnaire guidé (avec sauvegarde proposée si la simulation en
          cours a été modifiée). Seul bouton doré du header (refonte). */}
      <button
        type="button"
        onClick={onNewSimulation}
        className={cn(
          "inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2.5 rounded-xl text-[11.5px] font-bold transition-all duration-150 active:scale-[0.97]",
          "bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text shadow-gold hover:brightness-110",
        )}
      >
        <Plus size={14} aria-hidden /> {tr("Nouvelle simulation")}
      </button>

      {/* Avertissement ⚠ — icône seule (refonte) : on ne sait pas où est le
          problème, alors le libellé ne sert à rien. Au clic, un popover liste
          chaque problème et propose « Corriger l'erreur » qui amène au champ. */}
      {errorCount > 0 || warningCount > 0 ? (
        <div ref={warnRef} className="relative">
          <button
            type="button"
            onClick={() => setWarnOpen(o => !o)}
            aria-haspopup="dialog"
            aria-expanded={warnOpen}
            aria-label={
              errorCount > 0
                ? tr(errorCount > 1 ? "{n} erreurs à corriger" : "{n} erreur à corriger", { n: errorCount })
                : tr(warningCount > 1 ? "{n} avertissements à corriger" : "{n} avertissement à corriger", {
                    n: warningCount,
                  })
            }
            title={validationErrors.map(e => tr(e.message)).join(" · ")}
            className={cn(
              iconBtn,
              errorCount > 0
                ? "text-danger bg-danger/15 hover:bg-danger/25"
                : "text-warning bg-warning/15 hover:bg-warning/25",
            )}
          >
            <AlertTriangle size={14} aria-hidden />
          </button>
          {warnOpen && (
            <div
              role="dialog"
              aria-label={tr("Problèmes à corriger")}
              className="absolute top-[calc(100%+8px)] w-80 max-w-[calc(100vw-2rem)] glass-strong rounded-2xl shadow-premium-lg p-2 z-50 animate-scale-in right-0 max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:right-auto"
            >
              <p className="px-3 pt-1.5 pb-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-text">
                {errorCount > 0
                  ? tr(errorCount > 1 ? "{n} erreurs à corriger" : "{n} erreur à corriger", { n: errorCount })
                  : tr(warningCount > 1 ? "{n} avertissements à corriger" : "{n} avertissement à corriger", {
                      n: warningCount,
                    })}
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {validationErrors.map((e, i) => (
                  <button
                    key={`${e.field}-${i}`}
                    type="button"
                    onClick={() => {
                      setWarnOpen(false)
                      onFixError(e.field)
                    }}
                    className="w-full text-left inline-flex items-start gap-2 px-3 py-2 rounded-lg text-[10.5px] font-semibold leading-snug hover:bg-glass-hover transition-colors"
                  >
                    <AlertTriangle
                      size={12}
                      className={`shrink-0 mt-px ${e.severity === "error" ? "text-danger" : "text-warning"}`}
                      aria-hidden
                    />
                    {tr(e.message)}
                  </button>
                ))}
              </div>
              {firstIssue && (
                <button
                  type="button"
                  onClick={() => {
                    setWarnOpen(false)
                    onAutoFix()
                  }}
                  className="mt-2 w-full rounded-xl px-3 py-2.5 text-[11px] font-extrabold transition-all active:scale-[0.98] text-white bg-danger hover:brightness-110"
                >
                  {tr("Corriger automatiquement")}
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Annuler / Rétablir : paire segmentée en icônes seules (refonte) —
          ils vont toujours ensemble, l'aria-label garde le nom accessible. */}
      <div className="inline-flex items-center glass rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={tr("Annuler (⌘Z)")}
          aria-label={tr("Annuler la dernière modification")}
          className="inline-flex items-center justify-center w-9 h-9 hover:bg-glass-hover transition-colors disabled:opacity-35 disabled:cursor-not-allowed border-r border-border"
        >
          <Undo2 size={13} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={tr("Rétablir (⌘⇧Z)")}
          aria-label={tr("Rétablir la modification annulée")}
          className="inline-flex items-center justify-center w-9 h-9 hover:bg-glass-hover transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <Redo2 size={13} aria-hidden />
        </button>
      </div>

      {/* Thème — reste visible dans le header (demande utilisateur), en icône
          seule pour préserver la densité. */}
      <button
        type="button"
        onClick={onToggleDarkMode}
        title={darkMode ? tr("Passer en mode clair") : tr("Passer en mode sombre")}
        aria-label={darkMode ? tr("Passer en mode clair") : tr("Passer en mode sombre")}
        className={cn(iconBtn, "glass hover:bg-glass-hover")}
      >
        {darkMode ? <Sun size={13} aria-hidden /> : <Moon size={13} aria-hidden />}
      </button>

      {/* Menu « ⋯ » : toutes les actions secondaires, en panneaux (pattern
          AccountMenu) — Exporter et Partager ouvrent leur sous-panneau. */}
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(o => !o)
            setPanel("menu")
          }}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={tr("Autres actions")}
          title={tr("Autres actions")}
          className={cn(baseBtn, open ? "glass-gold border border-primary/40" : "glass hover:bg-glass-hover")}
        >
          <MoreHorizontal size={13} aria-hidden />
        </button>
        {open && (
          <div
            role={panel === "menu" ? "menu" : undefined}
            aria-label={panel === "menu" ? tr("Autres actions") : undefined}
            className="absolute right-0 top-[calc(100%+8px)] w-72 glass-strong rounded-2xl shadow-premium-lg p-2 z-50 animate-scale-in"
          >
            {panel === "menu" && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close()
                    onToggleCompare()
                  }}
                  className={cn(itemClass, comparing && "text-primary")}
                >
                  <GitCompareArrows size={13} className="text-primary" aria-hidden />
                  {comparing ? tr("Quitter la comparaison") : tr("Comparer deux scénarios")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={onToggleUiMode}
                  className={itemClass}
                  aria-pressed={uiMode === "avance"}
                >
                  <GraduationCap size={13} className="text-primary" aria-hidden />
                  {tr(uiMode === "debutant" ? "Mode Avancé" : "Mode Débutant")}
                  <span className="ml-auto text-[9px] font-semibold text-text-dim">
                    {tr(uiMode === "debutant" ? "notions techniques visibles" : "notions techniques masquées")}
                  </span>
                </button>
                <div className="border-t border-border/70 my-1" />
                <button type="button" role="menuitem" onClick={() => setPanel("export")} className={itemClass}>
                  <Download size={13} className="text-primary" aria-hidden />
                  {tr("Exporter")}
                  <ChevronRight size={13} className="ml-auto text-text-dim" aria-hidden />
                </button>
                <button type="button" role="menuitem" onClick={() => setPanel("share")} className={itemClass}>
                  <Share2 size={13} className="text-primary" aria-hidden />
                  {tr("Partager")}
                  <ChevronRight size={13} className="ml-auto text-text-dim" aria-hidden />
                </button>
                <div className="border-t border-border/70 my-1" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={toggleLang}
                  aria-label={lang === "fr" ? "Passer en anglais" : "Switch to French"}
                  className={itemClass}
                >
                  <Languages size={13} className="text-primary" aria-hidden />
                  <span className="uppercase tracking-wide text-[10px] font-bold">{lang === "fr" ? "FR" : "EN"}</span>
                  <span className="ml-auto text-[9px] font-semibold text-text-dim">
                    {lang === "fr" ? tr("Passer en anglais") : "Switch to French"}
                  </span>
                </button>
                <div className="border-t border-border/70 my-1" />
                {confirmReset ? (
                  <div className="px-3 py-2 space-y-1.5">
                    <p className="text-[10px] text-danger leading-snug">
                      {tr(
                        "Revenir aux réglages par défaut ? Vos simulations et snapshots de cet espace seront effacés.",
                      )}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold border border-border hover:bg-glass-hover transition-colors"
                      >
                        {tr("Annuler")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          close()
                          onReset()
                        }}
                        className="flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold bg-danger/15 border border-danger/40 text-danger hover:bg-danger/25 transition-colors"
                      >
                        {tr("Réinitialiser")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setConfirmReset(true)}
                    className={cn(itemClass, "text-danger hover:bg-danger/10")}
                  >
                    <Eraser size={13} aria-hidden /> {tr("Tout réinitialiser")}
                  </button>
                )}
              </>
            )}
            {panel === "export" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setPanel("menu")}
                  className="text-[10px] font-bold text-text-muted hover:text-text transition-colors px-1 py-1"
                >
                  ← {tr("Retour")}
                </button>
                <ExportPanel onExportCSV={onExportCSV} onExportJSON={onExportJSON} onPrint={onPrint} onDone={close} />
              </div>
            )}
            {panel === "share" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setPanel("menu")}
                  className="text-[10px] font-bold text-text-muted hover:text-text transition-colors px-1 py-1"
                >
                  ← {tr("Retour")}
                </button>
                <SharePanel inputs={inputs} onDone={close} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
