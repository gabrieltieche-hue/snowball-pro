export { mulberry32, gaussian } from "./rng"
export { v4SettingsToInputs, parseStoredInputs, DEFAULT_INPUTS, V4_SETTINGS_KEY, SETTINGS_KEY } from "./migration"
export type { V4Settings } from "./migration"
export { fmtCurrency, fmtCompact, fmtPercent, parseCurrencyInput, escapeCsvCell } from "./formatting"
export { roundCent, clamp, ENVELOPE_CONFIGS, computeTaxBreakdown, dividendTaxRate, calcXIRR } from "./taxes"
export type { CtoTaxMode, TaxBreakdownOptions } from "../types"
export { buildCashFlows, computeXIRR } from "./kpis"
export { applyScenarioPatch, enterComparison, exitComparison, resolveScenarioTarget } from "./scenarios"
export type { ScenarioState, ScenarioPatchResult } from "./scenarios"
export {
  monthlyRate,
  annualFromMonthly,
  futureValue,
  PMTfromFV,
  average,
  standardDeviation,
  percentile,
  calcMaxDrawdown,
} from "./math"
export { runSimulation } from "./simulation"
export { runMonteCarlo, runMonteCarloAsync, sampleHistoricalReturns } from "./montecarlo"
export { runDecumulation } from "./decumulation"
export { computeKPIs, computeMilestones, solveGoal, compareScenarios } from "./kpis"
export { validateInputs, sanitizeInputs } from "./validation"
export type { ValidationError } from "./validation"
export { createHistory, pushHistory, undoHistory, redoHistory, HISTORY_LIMIT } from "./history"
export type { HistoryStack, HistoryScenario } from "./history"
export {
  createSnapshot,
  addSnapshot,
  removeSnapshot,
  SNAPSHOT_LIMIT,
  SNAPSHOT_STORAGE_KEY,
  V41_STATE_KEY,
} from "./snapshots"
export { mergeComparisonSeries } from "./comparison"
export type { ComparisonSeriesRow } from "./comparison"
export { getHistoricalDataset } from "./historical"
export { getCrisisProfile, crisisAdjustment } from "./crisis"
