export function fmtCurrency(value: number): string {
  const n = Math.abs(value) < 0.005 ? 0 : value
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)} Md€`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)} M€`
  if (abs >= 10_000) return `${sign}${Math.round(abs).toLocaleString("fr-FR")} €`
  return `${sign}${abs.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

export function fmtCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}Md`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`
  return `${sign}${Math.round(abs)}`
}

export function fmtPercent(value: number, digits = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`
}

export function parseCurrencyInput(raw: string): number {
  const compact = raw.trim().toLowerCase().replace(/\s/g, "").replace("€", "").replace(",", ".")
  const match = compact.match(/^(-?\d+(?:\.\d+)?)(k|m|md|b)?$/)
  if (!match) return Number.parseFloat(compact) || 0
  const v = Number.parseFloat(match[1] ?? "0")
  const s = match[2]
  if (s === "k") return v * 1_000
  if (s === "m") return v * 1_000_000
  if (s === "md" || s === "b") return v * 1_000_000_000
  return v
}
