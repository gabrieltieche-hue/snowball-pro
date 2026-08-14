import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Download, FileJson, Printer } from "lucide-react"

interface ExportMenuProps {
  onExportCSV: () => void
  onExportJSON: () => void
  onPrint: () => void
}

/**
 * Toutes les fonctionnalités d'export regroupées derrière UN seul bouton :
 * le menu déroulant propose le format, l'utilisateur choisit ce qu'il veut.
 * Se ferme au clic extérieur ou à Échap (aucun comportement piégé).
 */
export function ExportMenu({ onExportCSV, onExportJSON, onPrint }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus()
  }, [open])

  const actions = [
    { label: "Export CSV", desc: "Tableau année par année", icon: Download, onClick: onExportCSV },
    { label: "Export JSON", desc: "Paramètres + résultats bruts", icon: FileJson, onClick: onExportJSON },
    {
      label: "Rapport PDF",
      desc: "Rapport patrimonial de synthèse — imprimer ou enregistrer en PDF",
      icon: Printer,
      onClick: onPrint,
    },
  ]

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Exporter la simulation"
        className="btn-shine inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-gradient-to-r from-primary to-primary-light btn-gold-text shadow-gold hover:from-primary-light hover:to-primary transition-all"
      >
        <Download size={12} /> Exporter
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label="Options d'export"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl glass p-2 space-y-1 shadow-xl border border-border-light"
          >
            {actions.map(a => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  triggerRef.current?.focus()
                  a.onClick()
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-glass-hover transition-colors"
              >
                <span className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <a.icon size={14} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold">{a.label}</span>
                  <span className="block text-[10px] text-text-dim truncate">{a.desc}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
