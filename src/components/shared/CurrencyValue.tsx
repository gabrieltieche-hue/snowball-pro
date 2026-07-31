import { fmtCurrency } from "../../engine"
import { cn } from "../../utils/cn"

interface CurrencyValueProps {
  value: number
  className?: string
  color?: string
}

export function CurrencyValue({ value, className, color }: CurrencyValueProps) {
  return (
    <span className={cn("mono tracking-tight", className)} style={color ? { color } : undefined}>
      {fmtCurrency(value)}
    </span>
  )
}
