import { SmartInput } from "./SmartInput"

interface SliderInputProps {
  label: string
  id: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  prefix?: string
  color?: string
  error?: string
  warning?: string
  onChange: (v: number) => void
}

export function SliderInput({
  label,
  id,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  color,
  prefix,
  error,
  warning,
}: SliderInputProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted min-w-0 leading-snug"
          style={color ? { color } : undefined}
        >
          {label}
        </label>
        <div className="flex items-center gap-1 min-w-0">
          {prefix && <span className="text-[11px] text-text-dim">{prefix}</span>}
          {/* C2 — la saisie directe doit avoir un nom accessible (le label
              htmlFor pointe sur le slider, pas sur cette textbox) */}
          <SmartInput value={value} onChange={onChange} aria-label={`${label} (saisie directe)`} />
        </div>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
        aria-label={label}
        style={color ? { accentColor: color } : undefined}
      />
      {/* Bornes min/max affichées (cohérence avec l'onglet Rente « 5 ans / 60 ans ») */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-text-dim mt-1">
        <span className="shrink-0">{min}</span>
        {suffix ? <span className="truncate text-right">{suffix}</span> : <span />}
        <span className="shrink-0">{max}</span>
      </div>
      {error && (
        <p role="alert" className="text-[11px] font-semibold text-danger mt-1 flex items-start gap-1">
          <span aria-hidden>⚠️</span> {error}
        </p>
      )}
      {!error && warning && (
        <p className="text-[11px] font-semibold text-warning mt-1 flex items-start gap-1">
          <span aria-hidden>⚠️</span> {warning}
        </p>
      )}
    </div>
  )
}
