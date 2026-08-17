import { Download, FileJson, Printer } from "lucide-react"
import { useLang } from "../../i18n"

interface ExportPanelProps {
  onExportCSV: () => void
  onExportJSON: () => void
  onPrint: () => void
  /** Appelé après chaque action — ferme le menu « ⋯ » qui héberge le panneau. */
  onDone: () => void
}

/**
 * Panneau d'export (refonte header) : les trois formats (CSV, JSON, Rapport
 * PDF) vivent désormais dans un sous-panneau du menu « ⋯ », sans trigger ni
 * logique de fermeture — `onDone` laisse le menu parent refermer.
 */
export function ExportPanel({ onExportCSV, onExportJSON, onPrint, onDone }: ExportPanelProps) {
  const { tr } = useLang()

  const actions = [
    { label: tr("Export CSV"), desc: tr("Tableau année par année"), icon: Download, onClick: onExportCSV },
    { label: tr("Export JSON"), desc: tr("Paramètres + résultats bruts"), icon: FileJson, onClick: onExportJSON },
    {
      label: tr("Rapport PDF"),
      desc: tr("Rapport patrimonial de synthèse — imprimer ou enregistrer en PDF"),
      icon: Printer,
      onClick: onPrint,
    },
  ]

  return (
    <div className="space-y-1">
      {actions.map(a => (
        <button
          key={a.label}
          type="button"
          role="menuitem"
          onClick={() => {
            onDone()
            a.onClick()
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-glass-hover transition-colors"
        >
          <span className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <a.icon size={14} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold">{a.label}</span>
            <span className="block text-[10px] text-text-dim truncate">{a.desc}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
