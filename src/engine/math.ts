export function monthlyRate(annualRate: number): number {
  const safeRate = Math.max(annualRate, -0.95)
  return Math.pow(1 + safeRate, 1 / 12) - 1
}

export function annualFromMonthly(monthRate: number): number {
  return Math.pow(1 + monthRate, 12) - 1
}

export function futureValue(presentValue: number, payment: number, rate: number, periods: number): number {
  if (periods <= 0) return presentValue
  if (Math.abs(rate) < 1e-10) return presentValue + payment * periods
  const factor = Math.pow(1 + rate, periods)
  return presentValue * factor + payment * ((factor - 1) / rate)
}

export function PMTfromFV(futureTarget: number, presentValue: number, rate: number, periods: number): number {
  if (periods <= 0) return 0
  if (Math.abs(rate) < 1e-10) return (futureTarget - presentValue) / periods
  const factor = Math.pow(1 + rate, periods)
  return ((futureTarget - presentValue * factor) * rate) / (factor - 1)
}

export function average(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const avg = average(values)
  return Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1))
}

export function percentile(sortedValues: number[], pct: number): number {
  if (sortedValues.length === 0) return 0
  const index = (sortedValues.length - 1) * pct
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedValues[lower] ?? 0
  const weight = index - lower
  return (sortedValues[lower] ?? 0) * (1 - weight) + (sortedValues[upper] ?? 0) * weight
}

export function calcMaxDrawdown(values: number[]): { maxDrawdown: number; maxDrawdownPct: number } {
  let peak = values[0] ?? 0
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  for (const value of values) {
    peak = Math.max(peak, value)
    const dd = peak - value
    const ddp = peak > 0 ? dd / peak : 0
    if (dd > maxDrawdown) maxDrawdown = dd
    if (ddp > maxDrawdownPct) maxDrawdownPct = ddp
  }
  return { maxDrawdown, maxDrawdownPct }
}
