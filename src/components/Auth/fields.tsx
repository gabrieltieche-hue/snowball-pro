import { useState } from "react"
import type { ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "../../utils/cn"

interface TextFieldProps {
  id: string
  label: string
  type?: "text" | "email" | "password"
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: ReactNode
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  maxLength?: number
}

const inputBase =
  "w-full rounded-xl border bg-surface-50 px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim/50 outline-none transition-all duration-150"

/**
 * Champ de formulaire des écrans auth — même langage visuel que SmartInput
 * (fond surface-50, bordure, focus or), avec erreur inline et message d'aide.
 */
export function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  hint,
  placeholder,
  autoComplete,
  autoFocus,
  maxLength,
}: TextFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword && revealed ? "text" : type

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputBase,
            isPassword && "pr-10",
            error
              ? "border-danger/50 focus:border-danger/70 focus:ring-2 focus:ring-danger/15"
              : "border-border-light focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed(r => !r)}
            aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors p-1"
          >
            {revealed ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-[11px] font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-text-dim">{hint}</p>
      ) : null}
    </div>
  )
}
