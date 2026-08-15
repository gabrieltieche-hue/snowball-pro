import { useRef } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)

  // Roving tabindex : seul l'option active est dans l'ordre de tabulation, et
  // ←/→/Home/End déplacent la sélection ET le focus (pattern radiogroup ARIA).
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return
    e.preventDefault()
    const buttons = Array.from(containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])
    const idx = buttons.findIndex(b => b.getAttribute("aria-checked") === "true")
    let next: HTMLButtonElement | undefined
    if (e.key === "Home") next = buttons[0]
    else if (e.key === "End") next = buttons[buttons.length - 1]
    else {
      const delta = e.key === "ArrowRight" ? 1 : -1
      next = buttons[(idx + delta + buttons.length) % buttons.length]
    }
    if (next) {
      next.click()
      next.focus()
    }
  }

  return (
    <div
      ref={containerRef}
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
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-xl border px-2 py-2 text-left transition-all",
              active
                ? "border-primary/60 bg-primary/10 text-text"
                : "glass border-border hover:bg-glass-hover text-text-muted",
            )}
          >
            <div className="text-[10px] font-bold leading-tight">{opt.label}</div>
            {opt.sub && <div className="text-[10px] text-text-dim mt-0.5 leading-snug">{opt.sub}</div>}
          </button>
        )
      })}
    </div>
  )
}
