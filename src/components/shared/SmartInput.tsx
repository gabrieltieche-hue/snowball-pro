import { useState, useEffect, useRef } from "react"
import { parseCurrencyInput } from "../../engine"
import { cn } from "../../utils/cn"

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number
  onChange: (v: number) => void
}

export function SmartInput({ value, onChange, className, ...props }: SmartInputProps) {
  const [text, setText] = useState(() => value.toLocaleString("fr-FR"))
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setText(value.toLocaleString("fr-FR"))
  }, [value])

  const handleBlur = () => {
    const parsed = parseCurrencyInput(text)
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed)
    else setText(value.toLocaleString("fr-FR"))
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.currentTarget.blur()
        }
      }}
      className={cn(
        "mono text-right text-xs font-bold bg-glass border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/50 transition-colors",
        className,
      )}
      {...props}
    />
  )
}
