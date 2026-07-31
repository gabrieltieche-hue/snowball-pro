import { cn } from "../../utils/cn"

export interface TabDef {
  id: string
  label: string
}

interface TabBarProps {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex flex-wrap gap-1 glass rounded-2xl p-1.5 no-print">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 min-w-[110px] px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
            active === tab.id
              ? "bg-primary text-white shadow-gold"
              : "text-text-muted hover:bg-glass-hover hover:text-text",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
