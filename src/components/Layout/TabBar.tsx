import { useRef } from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "../../utils/cn"

export interface TabDef {
  id: string
  label: string
  icon?: LucideIcon
}

interface TabBarProps {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
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
      aria-label="Onglets de simulation"
      className="flex flex-wrap gap-1 glass rounded-2xl p-1.5 no-print"
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
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={e => handleKeyDown(e, index)}
            className={cn(
              "relative flex-1 min-w-[132px] px-3 py-2.5 rounded-xl text-xs font-bold transition-colors",
              selected ? "text-[#221b06]" : "text-text-muted hover:text-text hover:bg-glass-hover",
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
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
              {Icon && <Icon size={13} className="shrink-0" aria-hidden />}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
