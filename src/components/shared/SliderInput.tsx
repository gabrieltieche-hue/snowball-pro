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
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={id}
          className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted"
          style={color ? { color } : undefined}
        >
          {label}
        </label>
        <div className="flex items-center gap-1 min-w-0">
          {prefix && <span className="text-[10px] text-text-dim">{prefix}</span>}
          <SmartInput value={value} onChange={onChange} />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
        aria-label={label}
        style={color ? { accentColor: color } : undefined}
      />
      {suffix && <div className="text-[10px] text-text-dim mt-1 text-right">{suffix}</div>}
      {error && (
        <p role="alert" className="text-[10px] font-semibold text-danger mt-1 flex items-start gap-1">
          <span aria-hidden>⚠️</span> {error}
        </p>
      )}
      {!error && warning && (
        <p className="text-[10px] font-semibold text-warning mt-1 flex items-start gap-1">
          <span aria-hidden>⚠️</span> {warning}
        </p>
      )}
    </div>
  )
}
