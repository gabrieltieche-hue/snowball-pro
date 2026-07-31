export type EnvelopeType = "cto" | "pea" | "av" | "per" | "none"
export type ScenarioId = "A" | "B"
export type ReturnMode = "fixed" | "random" | "historical"
export type HistoricalIndex = "msci-world" | "sp500" | "nasdaq" | "cac40" | "bitcoin" | "gold"
export type CrisisProfile = "none" | "flash-crash" | "bear-market" | "long-depression" | "stagflation"
export type WithdrawalModel = "rule-4" | "ultra-safe" | "optimistic" | "custom"
export type InflationMode = "custom" | "historical" | "dynamic"
export type GoalDifficulty = "easy" | "moderate" | "ambitious" | "impossible"

export interface YearRow {
  year: number
  month: number
  date: string
  nominal: number
  real: number
  investedNom: number
  investedReal: number
  interestsNom: number
  interestsReal: number
  grossGains: number
  netGains: number
  tax: number
  socialCharges: number
  incomeTax: number
  dividendTax: number
  taxNet: number
  fees: number
  feesLost: number
  dividendsGross: number
  dividendsNet: number
  annualContribution: number
  yearlyReturn: number
  netYield: number
  drawdownPct: number
}

export interface MonteCarloResult {
  years: number[]
  p5: number[]
  p10: number[]
  p25: number[]
  p50: number[]
  p75: number[]
  p90: number[]
  p95: number[]
  successRate: number
  bestCase: number
  worstCase: number
  goalTarget: number
  runs: number
}

export interface DecumulationResult {
  years: number[]
  p10: number[]
  p50: number[]
  p90: number[]
  withdrawals: number[]
  ruinProbability: number
  survivalProbability: number
  ruinYearMedian: number | null
  initialWithdrawal: number
  runs: number
  capital: number[]
  success: boolean
  ruinAge: number | null
  withdrawal: number[]
}

export interface KPIs {
  cagr: number
  sharpe: number
  maxDrawdown: number
  maxDrawdownPct: number
  capitalMultiple: number
  doublingTime: number | null
  contributionPct: number
  gainsPct: number
  realReturn: number
  feeImpactPct: number
  totalFees: number
  totalTax: number
  netCapital: number
  powerPurchaseRatio: number
}

export interface Milestone {
  id: string
  year: number
  value: number
  label: string
  reached: boolean
}

export interface GoalResult {
  pmtPerMonth: number | null
  requiredRate: number | null
  requiredYears: number | null
  totalInvested: number | null
  totalGains: number | null
  achievable: boolean
  difficulty: GoalDifficulty
}

export interface ScenarioComparison {
  diffAbsolute: number
  diffPercent: number
  betterScenario: ScenarioId | "equal"
  finalA: number
  finalB: number
}

export interface TaxBreakdown {
  grossGains: number
  taxableGains: number
  socialCharges: number
  incomeTax: number
  dividendTax: number
  flatTax: number
  netGains: number
  totalTax: number
  effectiveRate: number
  notes: string[]
}

export interface SimulationInputs {
  capitalInitial: number
  monthlyPayment: number
  annualReturn: number
  volatility: number
  duration: number
  indexation: number
  inflation: number
  inflationMode: InflationMode
  startMonth: number
  envelope: EnvelopeType
  taxCouple: boolean
  peaYearsHeld: number
  avYearsHeld: number
  returnMode: ReturnMode
  historicalIndex: HistoricalIndex
  crisisEnabled: boolean
  crisisProfile: CrisisProfile
  crisisYear: number
  crisisAmplitude: number
  crisisDuration: number
  etfFees: number
  brokerageFees: number
  insuranceFees: number
  managementFees: number
  dividendYield: number
  showReal: boolean
  withdrawalModel: WithdrawalModel
  withdrawalRate: number
  withdrawalFixed: number
  withdrawalInflation: boolean
  retirementYears: number
  goalTarget: number
  goalDuration: number
  goalCapital: number
  goalPayment: number
  goalAnnualReturn: number
  mcRuns: number
  seed: number
}

export interface HistoricalDataset {
  id: HistoricalIndex
  name: string
  avgReturn: number
  volatility: number
  years: { year: number; return: number; inflation: number }[]
}

export interface EnvelopeConfig {
  id: EnvelopeType
  name: string
  shortLabel: string
  desc: string
  color: string
  cap?: number
}

export interface SavedSnapshot {
  id: string
  name: string
  createdAt: string
  inputs: SimulationInputs
  finalCapital: number
}
