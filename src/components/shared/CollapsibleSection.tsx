import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../utils/cn"

interface CollapsibleSectionProps {
  title: React.ReactNode
  icon?: React.ReactNode
  defaultOpen?: boolean
  /**
   * Mode contrôlé (rail replié) : quand fourni, l'état ouvert est piloté par
   * le parent — utile pour ouvrir une section « à distance » depuis le rail
   * d'icônes, puis rendre la main au clic de l'utilisateur.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/**
 * Section pliable interne — permet de réduire la longueur de la sidebar
 * (surtout sur mobile) sans masquer toute la sidebar. Chaque section garde
 * son état local et s'ouvre par défaut ; le parent peut prendre le contrôle
 * (open/onOpenChange) pour piloter l'ouverture depuis un autre endroit.
 */
export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const handleToggle = () => {
    if (onOpenChange) onOpenChange(!isOpen)
    else setInternalOpen(!isOpen)
  }

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
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
          className={cn("text-text-dim transition-transform duration-200 shrink-0 group-hover:text-text", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && <div className="mt-3 animate-fade-in">{children}</div>}
    </div>
  )
}
