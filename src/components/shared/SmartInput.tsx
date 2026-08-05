import { useState, useEffect, useRef } from "react"
import { AlertTriangle } from "lucide-react"
import { parseCurrencyInput } from "../../engine"
import { cn } from "../../utils/cn"

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number
  onChange: (v: number) => void
  /** Borne basse appliquée à la saisie directe (clamp + message). */
  min?: number
  /** Borne haute appliquée à la saisie directe (clamp + message). */
  max?: number
  /** Autorise les valeurs négatives (ex. inflation déflationniste). */
  allowNegative?: boolean
}

/**
 * Saisie directe avec retour visible (audit v5.6.3) :
 * - une valeur négative n'est plus rejetée en silence : message + bordure
 *   rouge (auparavant la saisie « disparaissait » sans explication) ;
 * - une valeur hors bornes (`min`/`max`) est clampée AU MÊME MONTANT que le
 *   calcul réel avec un message explicite — plus de divergence silencieuse
 *   entre le champ affiché et la simulation (ex. 999 999 999 € calculé sur
 *   100 M€).
 */
export function SmartInput({
  value,
  onChange,
  className,
  min,
  max,
  allowNegative = false,
  ...props
}: SmartInputProps) {
  const [text, setText] = useState(() => value.toLocaleString("fr-FR"))
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setText(value.toLocaleString("fr-FR"))
  }, [value])

  // Le message disparaît tout seul après ~3 s (sans bloquer la saisie suivante).
  useEffect(() => {
    if (!error) return
    if (errorTimer.current) clearTimeout(errorTimer.current)
    errorTimer.current = setTimeout(() => setError(null), 3000)
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current)
    }
  }, [error])

  const handleBlur = () => {
    const trimmed = text.trim()
    // Champ vidé → on conserve la valeur précédente au lieu d'écraser
    // silencieusement la simulation par 0.
    if (trimmed === "") {
      setText(value.toLocaleString("fr-FR"))
      setError(null)
      return
    }
    const parsed = parseCurrencyInput(trimmed)
    if (!Number.isFinite(parsed)) {
      setText(value.toLocaleString("fr-FR"))
      setError("Valeur invalide")
      return
    }
    if (!allowNegative && parsed < 0) {
      setText(value.toLocaleString("fr-FR"))
      setError("Valeur négative non acceptée")
      return
    }
    // Clamp sur les bornes réelles du calcul : le champ affiche le MÊME
    // montant que celui utilisé par la simulation, avec un message clair.
    if (max !== undefined && parsed > max) {
      onChange(max)
      setText(max.toLocaleString("fr-FR"))
      setError(`Limité au maximum (${max.toLocaleString("fr-FR")})`)
      return
    }
    if (min !== undefined && parsed < min) {
      onChange(min)
      setText(min.toLocaleString("fr-FR"))
      setError(`Limité au minimum (${min.toLocaleString("fr-FR")})`)
      return
    }
    onChange(parsed)
    setError(null)
  }

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={text}
        aria-invalid={error ? true : undefined}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
            return
          }
          // Impossible de taper ce que le parseur refusera de toute façon :
          // moins de bruit, plus de confusion (le `-` était avalé en silence).
          if (!allowNegative && (e.key === "-" || e.key === "+")) e.preventDefault()
          if (e.key === "e" || e.key === "E") e.preventDefault()
        }}
        className={cn(
          "mono text-right text-xs font-bold bg-glass border rounded-lg px-2.5 py-1.5 outline-none transition-colors min-w-0",
          error ? "border-danger/70 ring-1 ring-danger/40" : "border-border focus:border-primary/50",
          className,
        )}
        {...props}
      />
      {error && (
        <span
          role="alert"
          className="absolute right-0 top-full mt-1 z-50 whitespace-nowrap text-[10px] font-bold text-danger bg-glass-strong border border-danger/40 rounded-lg px-2 py-1 shadow-premium animate-fade-in"
        >
          <AlertTriangle size={11} className="shrink-0" aria-hidden /> {error}
        </span>
      )}
    </div>
  )
}
