import type { YearRow, TerminalBin } from "../types"

/**
 * Facteur de conversion euros courants → euros d'aujourd'hui (real/nominal).
 * Source unique de déflation pour les cartes, le panneau fiscal et les
 * graphiques : sans lui, chaque écran recalculait son propre facteur et les
 * montants dérivaient (303 k€ d'impôts nominaux à côté d'une carte à 176 k€).
 */
export function deflationFactor(row: YearRow): number {
  return row.nominal > 0 ? row.real / row.nominal : 1
}

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

/**
 * Loi normale (Box-Muller) alimentée par un générateur uniforme injecté :
 * reste déterministe à graine fixe et ne dépend d'aucun état global.
 */
export function sampleNormal(mean: number, std: number, rng: () => number): number {
  let u1 = 0
  let u2 = 0
  while (u1 === 0) u1 = rng()
  while (u2 === 0) u2 = rng()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + std * z
}

const r100 = (x: number): number => Math.round(x * 100) / 100

/**
 * Intervalle de confiance à 95 % d'une proportion (score de Wilson — précis
 * même près de 0 % / 100 %, contrairement à Wald). Le « 95,8 % » d'un taux de
 * survie n'est pas un point exact : c'est une fourchette qui dépend du nombre
 * de simulations. 10 000 runs → ± ~0,4 point ; 100 runs → ± ~4 points.
 */
export function wilsonScoreCI(successes: number, total: number, z = 1.96): { low: number; high: number } {
  if (total <= 0) return { low: 0, high: 0 }
  const p = Math.min(1, Math.max(0, successes / total))
  const z2 = z * z
  const denom = 1 + z2 / total
  const center = (p + z2 / (2 * total)) / denom
  const margin = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denom
  return {
    low: r100(Math.max(0, center - margin) * 100),
    high: r100(Math.min(1, center + margin) * 100),
  }
}

/**
 * Histogramme des issues terminales (30 classes par défaut). Deux corrections
 * v5.6.0 pour le rendre LISIBLE (avant : « des barres écrasées à gauche, on ne
 * comprend rien ») :
 *  1. Axe adaptatif sur les cas NON NULS : max(p95, 3 × médiane) au lieu du
 *     p99 — l'outlier de la fat tail n'écrase plus tout, et une majorité de
 *     faillites (0 €) ne réduit plus l'échelle à 1 €.
 *  2. Bornes NON LINÉAIRES (échelle √, bornes en (i/n)² × hi) : une
 *     distribution de capitaux finaux est très asymétrique — des classes
 *     linéaires concentrent toute la masse dans les 10 % gauche du graphe.
 *     L'échelle √ étale la masse sur toute la largeur tout en gardant la queue
 *     droite visible (le composant positionne médiane/moyenne sur la même
 *     échelle √). La dernière classe absorbe toujours ce qui dépasse.
 */
export function buildTerminalHistogram(values: number[], binCount = 30): TerminalBin[] {
  if (values.length === 0) return []
  const sorted = [...values].sort((a, b) => a - b)
  const nonZero = sorted.filter(v => v > 0)
  const hi = nonZero.length > 0 ? Math.max(percentile(nonZero, 0.95), 3 * percentile(nonZero, 0.5), 1) : 1
  if (hi <= 0) return [{ index: 0, low: 0, high: hi, value: hi, count: values.length }]
  const bins: TerminalBin[] = []
  let idx = 0
  for (let b = 0; b < binCount; b += 1) {
    const low = hi * (b / binCount) ** 2
    const high = b === binCount - 1 ? Number.POSITIVE_INFINITY : hi * ((b + 1) / binCount) ** 2
    let count = 0
    while (idx < sorted.length && (sorted[idx] ?? 0) < high) {
      count += 1
      idx += 1
    }
    bins.push({
      index: b,
      low,
      high: b === binCount - 1 ? hi : high,
      value: b === binCount - 1 ? (low + hi) / 2 : (low + high) / 2,
      count,
    })
  }
  return bins
}
