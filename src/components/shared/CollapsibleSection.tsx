import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../utils/cn"

interface CollapsibleSectionProps {
  title: React.ReactNode
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

/**
 * Section pliable interne — permet de réduire la longueur de la sidebar
 * (surtout sur mobile) sans masquer toute la sidebar. Chaque section garde
 * son état local et s'ouvre par défaut.
 */
export function CollapsibleSection({ title, icon, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <span className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted group-hover:text-text transition-colors min-w-0">
          {icon && (
            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown
          size={13}
          className={cn("text-text-dim transition-transform duration-200 shrink-0 group-hover:text-text", open && "rotate-180")}
        />
      </button>
      {open && <div className="mt-3 animate-fade-in">{children}</div>}
    </div>
  )
}
