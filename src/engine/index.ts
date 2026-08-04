export { mulberry32 } from "./rng"
export { v4SettingsToInputs, parseStoredInputs, DEFAULT_INPUTS, V4_SETTINGS_KEY, SETTINGS_KEY } from "./migration"
export type { V4Settings } from "./migration"
export { fmtCurrency, fmtCompact, fmtPercent, fmtDecimal, parseCurrencyInput, escapeCsvCell } from "./formatting"
export { roundCent, clamp, ENVELOPE_CONFIGS, computeTaxBreakdown, calcXIRR } from "./taxes"
export type { CtoTaxMode, TaxBreakdownOptions } from "../types"
export { buildCashFlows, computeXIRR } from "./kpis"
export { applyScenarioPatch, enterComparison, exitComparison, resolveScenarioTarget } from "./scenarios"
export type { ScenarioState, ScenarioPatchResult } from "./scenarios"
export {
  deflationFactor,
  monthlyRate,
  annualFromMonthly,
  futureValue,
  PMTfromFV,
  average,
  standardDeviation,
  percentile,
  calcMaxDrawdown,
  sampleNormal,
  wilsonScoreCI,
  buildTerminalHistogram,
} from "./math"
export { runSimulation } from "./simulation"
export { runMonteCarlo, runMonteCarloAsync, sampleHistoricalReturns } from "./montecarlo"
export { runDecumulation, runDecumulationAsync, runStressTest, STRESS_TEST_SCENARIOS } from "./decumulation"
export { computeKPIs, computeMilestones, solveGoal, compareScenarios } from "./kpis"
export { validateInputs, sanitizeInputs, RECOMMENDED_RETURN_MIN, RECOMMENDED_RETURN_MAX } from "./validation"
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
export {
  getHistoricalDataset,
  getHistoricalPool,
  sampleBlocks,
  MSCI_WORLD_AVG_RETURN,
  BLOCK_LENGTH,
  FRENCH_INFLATION_1970_2025,
  EXTENDED_WORLD_RETURNS,
  EXTENDED_WORLD_START_YEAR,
} from "./historical"
export { sampleRegime, applyRegime, effectiveSampleSize } from "./reliability"
export type { RegimeParams } from "./reliability"
