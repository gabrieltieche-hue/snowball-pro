import type { KeyboardEvent } from "react"
import { cn } from "../../utils/cn"

interface SegmentOption<T extends string> {
  id: T
  label: string
  sub?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: SegmentOption<T>[]
  ariaLabel?: string
}

export function SegmentedControl<T extends string>({ value, onChange, options, ariaLabel }: SegmentedControlProps<T>) {
  // Navigation clavier (roving radiogroup) : ←/→ changent d'option.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const idx = options.findIndex(o => o.id === value)
    const delta = e.key === "ArrowRight" ? 1 : -1
    const next = options[(idx + delta + options.length) % options.length]
    if (next) onChange(next.id)
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(opt => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-xl border px-2 py-2 text-left transition-all",
              active
                ? "border-primary/60 bg-primary/10 text-text"
                : "glass border-border hover:bg-glass-hover text-text-muted",
            )}
          >
            <div className="text-[10px] font-bold leading-tight">{opt.label}</div>
            {opt.sub && <div className="text-[9px] text-text-dim mt-0.5 leading-snug">{opt.sub}</div>}
          </button>
        )
      })}
    </div>
  )
}
