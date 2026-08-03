export type EnvelopeType = "cto" | "pea" | "av" | "per" | "none"
export type ScenarioId = "A" | "B"
export type HistoricalIndex = "msci-world" | "sp500" | "nasdaq" | "cac40" | "bitcoin" | "gold"
export type WithdrawalModel = "rule-4" | "ultra-safe" | "optimistic" | "custom"
export type InflationMode = "custom" | "historical" | "dynamic"
export type GoalDifficulty = "easy" | "moderate" | "ambitious" | "impossible"
export type CtoTaxMode = "pfu" | "bareme"

/** Options de calcul fiscal transmises à computeTaxBreakdown. */
export interface TaxBreakdownOptions {
  tmi?: number
  ctoTaxMode?: CtoTaxMode
}

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
  taxNet: number
  fees: number
  feesLost: number
  annualContribution: number
  yearlyReturn: number
  netYield: number
  /** % NÉGATIF par rapport au pic (ex : -94 = -94 %), convention du graphique (courbe sous zéro). */
  drawdownPct: number
}

export interface ConfidenceInterval {
  low: number
  high: number
}

export interface TerminalBin {
  index: number
  low: number
  high: number
  /** Centre de la classe (pour le libellé d'axe). */
  value: number
  count: number
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
  /** Moyenne arithmétique des capitaux terminaux (tirée par la queue droite). */
  mean: number
  /** Histogramme des capitaux terminaux : rend la « fat tail » visible. */
  terminalDistribution: TerminalBin[]
  /** Intervalle de confiance à 95 % (Wilson) du taux de succès. */
  successRateCI: ConfidenceInterval
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
  /** Intervalle de confiance à 95 % (Wilson) du taux de survie. */
  survivalRateCI: ConfidenceInterval
  /** Moyenne arithmétique des capitaux terminaux. */
  mean: number
  /** Histogramme des capitaux terminaux (pic à 0 € = cas de ruine). */
  terminalDistribution: TerminalBin[]
  ruinYearMedian: number | null
  initialWithdrawal: number
  runs: number
  capital: number[]
  success: boolean
  withdrawal: number[]
}

export interface KPIs {
  cagr: number
  xirr: number
  sharpe: number
  maxDrawdown: number
  /** % POSITIF (ex : 94 = 94 %) — signe OPPOSÉ à YearRow.drawdownPct, ne pas comparer sans inverser. */
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
  flatTax: number
  netGains: number
  totalTax: number
  effectiveRate: number
  notes: string[]
}

export interface SimulationInputs {
  capitalInitial: number
  monthlyPayment: number
  duration: number
  indexation: number
  inflation: number
  inflationMode: InflationMode
  envelope: EnvelopeType
  taxCouple: boolean
  peaYearsHeld: number
  avYearsHeld: number
  historicalIndex: HistoricalIndex
  etfFees: number
  brokerageFees: number
  insuranceFees: number
  managementFees: number
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
  tmi: number
  ctoTaxMode: CtoTaxMode
  // Fiabilité du modèle (v5.5.0) — toutes activées par défaut : l'honnêteté
  // des estimations prime, chaque option reste désactivable dans l'UI.
  /** Incertitude des paramètres : moyenne et volatilité tirées autour de leur
   * estimation historique à chaque scénario (Pástor–Stambaugh, Merton) au lieu
   * d'être traitées comme des vérités connues. Élargit honnêtement P10/P90. */
  parameterUncertainty: boolean
  /** Historique étendu : 100 ans de rendements réels (S&P 500 1926-1969 +
   * MSCI World 1970-2025) au lieu des 56 dernières années — plus de blocs,
   * plus de krachs et de bull markets rejoués (Simulateur inchangé). */
  extendedHistory: boolean
  /** Inflation stochastique : l'indexation de la rente rejoue l'inflation
   * française réelle 1970-2025 (pics des années 70) au lieu d'un taux fixe. */
  stochasticInflation: boolean
  /** Garde-fous dynamiques (Guyton–Klinger) : année boursière négative → la
   * rente de l'année suivante est réduite de 10 % (et non indexée). */
  dynamicGuardrails: boolean
}

export interface HistoricalDataset {
  id: HistoricalIndex
  name: string
  avgReturn: number
  /** Rendement moyen net d'inflation (affiché en complément du brut). */
  netReturn: number
  volatility: number
  years: { year: number; return: number; inflation: number }[]
}

/** Vivier de rendements réels utilisé par le rééchantillonnage MC / Rente. */
export interface HistoricalPool {
  returns: number[]
  avgReturn: number
  volatility: number
  startYear: number
  label: string
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

export interface StressTestScenario {
  id: string
  startYear: number
  label: string
  desc: string
  color: string
}

export interface StressTestResult {
  scenario: StressTestScenario
  /** Capital en fin de fenêtre (0 si échec). */
  finalCapital: number
  survived: boolean
  /** Année de ruine (null si survie). */
  ruinYear: number | null
  minCapital: number
  /** Perte maximale pic→creux en % POSITIF (0,37 = 37 %). */
  worstDrawdown: number
  totalWithdrawn: number
  /** Capital année après année (chemin déterministe). */
  yearsPath: number[]
  /** Rendements réels rejoués (affichés pour la transparence). */
  windowReturns: { year: number; return: number }[]
}
