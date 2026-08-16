import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  Eraser,
  GitCompareArrows,
  GraduationCap,
  MoreHorizontal,
  Moon,
  Redo2,
  Sun,
  Undo2,
} from "lucide-react"
import type { ValidationError } from "../../engine"
import { cn } from "../../utils/cn"
import type { UiMode } from "../../utils/uiMode"
import { useLang } from "../../i18n"
import type { SimulationInputs } from "../../types"
import { ExportMenu } from "./ExportMenu"
import { ShareMenu } from "./ShareMenu"
import { LanguageToggle } from "../shared/LanguageToggle"

interface ActionBarProps {
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
}

const baseBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-150 active:scale-[0.97]"

/**
 * Barre d'actions de l'en-tête (audit) : seules les actions fréquentes
 * restent au premier niveau (Annuler/Rétablir, thème) ; les actions
 * secondaires (Comparer, Partager, Exporter, mode Débutant/Avancé,
 * réinitialiser) vivent dans le menu « ⋯ » — le header ne sature plus.
 */
export function ActionBar({
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
}: ActionBarProps) {
  const { tr } = useLang()
  const errorCount = validationErrors.filter(e => e.severity === "error").length
  const warningCount = validationErrors.filter(e => e.severity === "warning").length
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    setConfirmReset(false)
  }

  const itemClass =
    "w-full text-left inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors hover:bg-glass-hover"

  return (
    <div className="flex gap-2 sm:gap-2.5 justify-end flex-wrap no-print items-center max-sm:justify-start">
      {(errorCount > 0 || warningCount > 0) && (
        <span
          title={validationErrors.map(e => tr(e.message)).join(" · ")}
          className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[10px] font-bold ${
            errorCount > 0 ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
          }`}
        >
          <AlertTriangle size={11} aria-hidden />
          {errorCount > 0
            ? tr(errorCount > 1 ? "{n} erreurs" : "{n} erreur", { n: errorCount })
            : tr(warningCount > 1 ? "{n} avertissements" : "{n} avertissement", { n: warningCount })}
        </span>
      )}

      {/* Annuler / Rétablir : paire segmentée — ils vont toujours ensemble. */}
      <div className="inline-flex items-center glass rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={tr("Annuler (⌘Z)")}
          aria-label={tr("Annuler la dernière modification")}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold hover:bg-glass-hover transition-colors disabled:opacity-35 disabled:cursor-not-allowed border-r border-border"
        >
          <Undo2 size={12} aria-hidden /> {tr("Annuler")}
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={tr("Rétablir (⌘⇧Z)")}
          aria-label={tr("Rétablir la modification annulée")}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold hover:bg-glass-hover transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
        >
          <Redo2 size={12} aria-hidden /> {tr("Rétablir")}
        </button>
      </div>

      <ExportMenu onExportCSV={onExportCSV} onExportJSON={onExportJSON} onPrint={onPrint} />

      <ShareMenu inputs={inputs} />

      <LanguageToggle />

      <button
        type="button"
        onClick={onToggleDarkMode}
        title={darkMode ? tr("Passer en mode clair") : tr("Passer en mode sombre")}
        aria-label={darkMode ? tr("Passer en mode clair") : tr("Passer en mode sombre")}
        className={cn(baseBtn, "glass hover:bg-glass-hover")}
      >
        {darkMode ? <Sun size={12} aria-hidden /> : <Moon size={12} aria-hidden />}{" "}
        {darkMode ? tr("Clair") : tr("Sombre")}
      </button>

      {/* Menu « ⋯ » : les actions secondaires regroupées (audit) */}
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
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
            role="menu"
            aria-label="Autres actions"
            className="absolute right-0 top-[calc(100%+8px)] w-64 glass-strong rounded-2xl shadow-premium-lg p-2 z-50 animate-scale-in"
          >
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
            {confirmReset ? (
              <div className="px-3 py-2 space-y-1.5">
                <p className="text-[10px] text-danger leading-snug">
                  {tr("Revenir aux réglages par défaut ? Vos simulations et snapshots de cet espace seront effacés.")}
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
          </div>
        )}
      </div>
    </div>
  )
}
