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
  onChange: (v: number) => void
}

export function SliderInput({ label, id, value, min, max, step, suffix, onChange, color, prefix }: SliderInputProps) {
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
        <div className="flex items-center gap-1">
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
    </div>
  )
}
