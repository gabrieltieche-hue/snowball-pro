export type EnvelopeType = "cto" | "pea" | "av" | "per" | "none"
export type ScenarioId = "A" | "B"
export type HistoricalIndex = "msci-world" | "sp500" | "nasdaq" | "cac40" | "bitcoin" | "gold"
export type WithdrawalModel = "rule-4" | "ultra-safe" | "optimistic" | "custom"
export type InflationMode = "custom" | "historical" | "dynamic"
export type GoalDifficulty = "easy" | "moderate" | "ambitious" | "impossible"
export type CtoTaxMode = "pfu" | "bareme"
/** Scénario de rendement de la projection principale (courbe lissée du Simulateur) :
 * prudent = rendement réel composé, central = rendement géométrique composé,
 * optimiste = moyenne arithmétique. Les 3 étages de l'échelle historique. */
export type ReturnScenario = "prudent" | "central" | "optimiste"
export type RiskTolerance = "prudent" | "equilibre" | "audacieux"

/** Options de calcul fiscal transmises à computeTaxBreakdown. */
export interface TaxBreakdownOptions {
  tmi?: number
  ctoTaxMode?: CtoTaxMode
  /** Année fiscale des règles à appliquer (2025 ou 2026). Défaut : année courante. */
  taxYear?: number
  /** Saute la construction des libellés explicatifs (notes) : réservé aux
   * boucles chaudes (fiscalité mensuelle du décaissement) où les notes ne
   * sont jamais lues — évite 7,2 M d'allocations de chaînes à 10 k runs. */
  noNotes?: boolean
  /** Langue des libellés explicatifs (notes) — défaut français (v6.12). */
  lang?: "fr" | "en"
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
  /** Bandes P10/P50/P90 en EUROS D'AUJOURD'HUI (nets d'impôts et déflatés
   * de l'inflation réellement appliquée par chaque scénario). */
  p10r: number[]
  p50r: number[]
  p90r: number[]
  /** Probabilité d'atteindre l'objectif en euros réels (valeur terminale
   * déflatée ≥ objectif) : plus honnête que le taux nominal. */
  successRateReal: number
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
  /** Retraits NETS moyens par année (après fiscalité des retraits). */
  withdrawalsNet: number[]
  /** Retraits nets moyens par année, déflatés en euros du DÉPART retraite
   * (pouvoir d'achat) — l'échelle honnête pour comparer à des dépenses
   * exprimées en euros d'aujourd'hui. */
  withdrawalsNetReal: number[]
  /** Total des impôts payés sur les retraits, moyenné sur toutes les sims. */
  totalTaxPaid: number
  /** Total des frais de gestion prélevés pendant le décaissement, moyenné. */
  totalFeesPaid: number
  /** Rente nette mensuelle initiale (après impôt du premier mois). */
  netInitialWithdrawal: number
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
  /** Versements PER déductibles taxés à la sortie (hors cotisations sociales). */
  taxableContributions: number
  contributionsTax: number
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
  /** Scénario de rendement de la projection principale (Simulateur) :
   * prudent / central / optimiste (défaut : central = géométrique composé). */
  returnScenario: ReturnScenario
  /** Objectif inversé synchronisé avec le scénario principal (capital, durée
   * et rendement liés au Simulateur au lieu de réglages séparés). */
  goalSync: boolean
  // Profil de l'utilisateur (paquet 3) — utilisé pour la retraite et le risque.
  ageNow: number
  ageRetirement: number
  /** Dépenses mensuelles prévues à la retraite (euros courants). */
  retirementExpenses: number
  /** Autres revenus mensuels à la retraite (pensions, immobilier…). */
  otherPensions: number
  riskTolerance: RiskTolerance
  /** Perte maximale acceptée en % POSITIF (0,35 = 35 %). */
  maxDrawdownTolerance: number
  /** Année fiscale des règles d'imposition (source : taxRules.ts).
   * Optionnel pour la rétrocompatibilité des états stockés/partagés v5 :
   * résolu vers une année supportée par resolveTaxYear (défaut : 2026). */
  taxYear?: number
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
  // Scénario de crise paramétrable (v5.6.0) : « partir en période difficile ».
  // Remplace l'affichage permanent des stress tests historiques par un krach
  // DÉTERMINISTE choisi par l'utilisateur, appliqué à CHAQUE scénario MC.
  /** Un krach survient à une date et une intensité choisies (OFF par défaut). */
  crisisScenario: boolean
  /** Année de la retraite où le krach frappe (0 = dès la 1re année). */
  crisisStartOffset: number
  /** Intensité du krach en % POSITIF (0,3 = −30 % sur l'année du krach). */
  crisisIntensity: number
}

export interface HistoricalDataset {
  id: HistoricalIndex
  name: string
  /** Moyenne ARITHMÉTIQUE des rendements annuels (10,07 % pour le MSCI World) :
   * le taux moyen d'une année, pas le gain composé. C'est elle que la courbe
   * lissée du Simulateur applique chaque année. */
  avgReturn: number
  /** Rendement GÉOMÉTRIQUE (composé) nominal de la série, krachs inclus : ce
   * que la bourse a réellement fait en moyenne sur toute la période (~8,22 %).
   * En pratique inférieur à avgReturn (le « volatility drag ») pour tout
   * indice volatil — égal seulement si toutes les années sont identiques. */
  compoundedReturn: number
  /** Rendement réel composé : compoundedReturn corrigé de l'inflation (~5,99 %). */
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
