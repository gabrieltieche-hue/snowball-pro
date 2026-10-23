import { useRef } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { useLang } from "../../i18n"
import { cn } from "../../utils/cn"

export interface TabDef {
  id: string
  label: string
  /** Libellé court affiché sous `sm` — évite trois rangées d'onglets sur téléphone. */
  shortLabel?: string
  icon?: LucideIcon
}

interface TabBarProps {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  const { tr } = useLang()
  const listRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const count = tabs.length
    let next = -1
    if (e.key === "ArrowRight") next = (index + 1) % count
    else if (e.key === "ArrowLeft") next = (index - 1 + count) % count
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = count - 1
    if (next >= 0) {
      e.preventDefault()
      onChange(tabs[next].id)
      listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${tabs[next].id}"]`)?.focus()
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={tr("Onglets de simulation")}
      className="flex flex-nowrap sm:flex-wrap gap-1 glass rounded-2xl p-1 sm:p-1.5 no-print overflow-x-auto"
    >
      {tabs.map((tab, index) => {
        const selected = active === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-label={tr(tab.label)}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={e => handleKeyDown(e, index)}
            className={cn(
              "relative flex-1 min-w-0 sm:min-w-[132px] px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors",
              selected ? "btn-gold-text" : "text-text-muted hover:text-text hover:bg-glass-hover",
            )}
          >
            {/* Pastille or animée : glisse d'un onglet à l'autre (layoutId). */}
            {selected && (
              <motion.span
                layoutId="tab-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark shadow-gold"
                aria-hidden
              />
            )}
            {/* Sans whitespace-nowrap : sur mobile étroit, le libellé passe à
                la ligne au lieu de déborder (bug préexistant v6.11.2 — le bouton
                flex-1 n'était pas assez large pour « Robustesse de votre plan »). */}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
              {Icon && <Icon size={13} className="shrink-0 hidden sm:block" aria-hidden />}
              <span className="sm:hidden truncate">{tr(tab.shortLabel ?? tab.label)}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
