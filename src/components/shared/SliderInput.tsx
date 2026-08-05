import { AlertTriangle } from "lucide-react"
import { SmartInput } from "./SmartInput"
import { HelpTip } from "./HelpTip"

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
  /** Texte d'aide affiché via une infobulle « ? » à côté du libellé. */
  help?: string
  error?: string
  warning?: string
  /** Bornes réelles du calcul appliquées à la saisie directe (clamp + message). */
  hardMin?: number
  hardMax?: number
  /** Autorise les valeurs négatives dans la saisie directe. */
  allowNegative?: boolean
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
  help,
  error,
  warning,
  hardMin,
  hardMax,
  allowNegative,
}: SliderInputProps) {
  // Rail « rempli » : la partie déjà parcourue est teintée (or, ou la couleur
  // de l'option quand elle en a une) — le curseur donne un retour immédiat.
  const span = max - min || 1
  const pct = Math.min(100, Math.max(0, ((value - min) / span) * 100))
  const fillColor = color ?? "var(--color-primary)"
  const trackStyle = {
    background: `linear-gradient(to right, ${fillColor} ${pct}%, color-mix(in srgb, ${fillColor} 10%, transparent) ${pct}%)`,
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted min-w-0 leading-snug flex items-center gap-1.5"
          style={color ? { color } : undefined}
        >
          {label}
          {help && <HelpTip text={help} className="shrink-0" />}
        </label>
        <div className="flex items-center gap-1 min-w-0">
          {prefix && <span className="text-[11px] text-text-dim">{prefix}</span>}
          {/* C2 — la saisie directe doit avoir un nom accessible (le label
              htmlFor pointe sur le slider, pas sur cette textbox) */}
          <SmartInput
            value={value}
            onChange={onChange}
            min={hardMin}
            max={hardMax}
            allowNegative={allowNegative}
            aria-label={`${label} (saisie directe)`}
          />
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
        style={trackStyle}
        aria-label={label}
      />
      {/* Bornes min/max affichées (cohérence avec l'onglet Rente « 5 ans / 60 ans ») */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-text-dim mt-1">
        <span className="shrink-0">{min}</span>
        {suffix ? <span className="truncate text-right">{suffix}</span> : <span />}
        <span className="shrink-0">{max}</span>
      </div>
      {error && (
        <p role="alert" className="text-[11px] font-semibold text-danger mt-1 flex items-start gap-1">
          <AlertTriangle size={11} className="shrink-0 mt-px" aria-hidden /> {error}
        </p>
      )}
      {!error && warning && (
        <p className="text-[11px] font-semibold text-warning mt-1 flex items-start gap-1">
          <AlertTriangle size={11} className="shrink-0 mt-px" aria-hidden /> {warning}
        </p>
      )}
    </div>
  )
}
