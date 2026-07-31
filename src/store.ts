import { create } from "zustand"
import {
  compareScenarios,
  computeKPIs,
  computeMilestones,
  runDecumulation,
  runMonteCarlo,
  runSimulation,
  solveGoal,
} from "./engine"
import { sanitizeInputs } from "./engine/validation"
import type {
  DecumulationResult,
  GoalResult,
  KPIs,
  Milestone,
  MonteCarloResult,
  SavedSnapshot,
  ScenarioComparison,
  ScenarioId,
  SimulationInputs,
  YearRow,
} from "./types"

export interface ScenarioState {
  inputs: SimulationInputs
  sanitizedInputs: SimulationInputs
  rows: YearRow[]
  kpis: KPIs
  milestones: Milestone[]
  mcResult: MonteCarloResult | null
  decumResult: DecumulationResult | null
  goalResult: GoalResult
  isCalculating: boolean
}

interface UIState {
  activeTab: string
  tableOpen: boolean
  sidebarOpen: boolean
  shareMessage: string | null
  mobileSidebar: boolean
  darkMode: boolean
}

interface ComparisonState {
  comparing: boolean
  frozenA: ScenarioState | null
  comparison: ScenarioComparison | null
}

interface HistoryEntry {
  inputs: Partial<SimulationInputs>
  timestamp: number
}

interface SimulationStore {
  current: ScenarioId
  scenarios: Record<ScenarioId, ScenarioState>
  comparison: ComparisonState
  ui: UIState
  snapshots: SavedSnapshot[]
  history: { past: HistoryEntry[]; future: HistoryEntry[] }
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K], scenario?: ScenarioId) => void
  updateInputs: (partial: Partial<SimulationInputs>, scenario?: ScenarioId) => void
  setActiveTab: (tab: string) => void
  setTableOpen: (open: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setMobileSidebar: (open: boolean) => void
  setShareMessage: (message: string | null) => void
  toggleDarkMode: () => void
  toggleComparing: () => void
  runMC: () => void
  runDecum: () => void
  saveSnapshot: () => void
  loadSnapshot: (id: string) => void
  removeSnapshot: (id: string) => void
  loadFromStorage: () => void
  saveToStorage: () => void
  randomizeSeed: () => void
  undo: () => void
  redo: () => void
}

const STORAGE_VERSION = 1

export const defaultInputs: SimulationInputs = {
  capitalInitial: 25_000,
  monthlyPayment: 1_000,
  annualReturn: 0.079,
  volatility: 0.155,
  duration: 25,
  indexation: 0.02,
  inflation: 0.022,
  inflationMode: "custom",
  startMonth: 0,
  envelope: "pea",
  taxCouple: false,
  peaYearsHeld: 5,
  avYearsHeld: 8,
  returnMode: "fixed",
  historicalIndex: "msci-world",
  crisisEnabled: false,
  crisisProfile: "bear-market",
  crisisYear: 9,
  crisisAmplitude: 38,
  crisisDuration: 2,
  etfFees: 0.0025,
  brokerageFees: 0.001,
  insuranceFees: 0.006,
  managementFees: 0,
  dividendYield: 0.018,
  showReal: true,
  withdrawalModel: "rule-4",
  withdrawalRate: 4,
  withdrawalFixed: 2_500,
  withdrawalInflation: true,
  retirementYears: 40,
  goalTarget: 1_000_000,
  goalDuration: 20,
  goalCapital: 25_000,
  goalPayment: 1_000,
  goalAnnualReturn: 0.07,
  mcRuns: 1500,
  seed: 41041,
}

function buildScenario(inputs: SimulationInputs, previous?: ScenarioState): ScenarioState {
  const safeInputs = sanitizeInputs(inputs)
  const rows = runSimulation(safeInputs)
  const sameInputs = previous && JSON.stringify(previous.sanitizedInputs) === JSON.stringify(safeInputs)
  return {
    inputs,
    sanitizedInputs: safeInputs,
    rows,
    kpis: computeKPIs(rows, safeInputs),
    milestones: computeMilestones(rows),
    mcResult: sameInputs ? (previous?.mcResult ?? null) : null,
    decumResult: sameInputs ? (previous?.decumResult ?? null) : null,
    goalResult: solveGoal(safeInputs),
    isCalculating: false,
  }
}

function cloneScenario(scenario: ScenarioState): ScenarioState {
  return {
    ...scenario,
    inputs: { ...scenario.inputs },
    sanitizedInputs: { ...scenario.sanitizedInputs },
    rows: scenario.rows.map(r => ({ ...r })),
    milestones: scenario.milestones.map(m => ({ ...m })),
    mcResult: scenario.mcResult ? { ...scenario.mcResult } : null,
    decumResult: scenario.decumResult ? { ...scenario.decumResult } : null,
    goalResult: { ...scenario.goalResult },
    kpis: { ...scenario.kpis },
  }
}

function storageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage)
  } catch {
    return false
  }
}

function applyInputs(
  get: () => SimulationStore,
  set: (fn: (s: SimulationStore) => Partial<SimulationStore>) => void,
  partial: Partial<SimulationInputs>,
  scenario?: ScenarioId,
  recordHistory = true,
) {
  const target = scenario ?? get().current
  const state = get()
  const previous = state.scenarios[target]
  const merged = { ...previous.inputs, ...partial }
  const next = buildScenario(merged, previous)
  set(s => {
    const scenarios = { ...s.scenarios, [target]: next }
    const comparison =
      s.comparison.comparing && s.comparison.frozenA && target === "B"
        ? { ...s.comparison, comparison: compareScenarios(s.comparison.frozenA.rows, scenarios.B.rows) }
        : s.comparison
    const historyUpdate = recordHistory
      ? { past: [...s.history.past.slice(-19), { inputs: partial, timestamp: Date.now() }], future: [] }
      : s.history
    return { scenarios, comparison, history: historyUpdate }
  })
  if (recordHistory) get().saveToStorage()
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  current: "A",
  scenarios: {
    A: buildScenario(defaultInputs),
    B: buildScenario({ ...defaultInputs, monthlyPayment: 1_350, annualReturn: 0.085 }),
  },
  comparison: { comparing: false, frozenA: null, comparison: null },
  ui: {
    activeTab: "simulator",
    tableOpen: false,
    sidebarOpen: false,
    shareMessage: null,
    mobileSidebar: false,
    darkMode: false,
  },
  snapshots: [],
  history: { past: [], future: [] },

  updateInput: (key, value, scenario) => get().updateInputs({ [key]: value }, scenario),

  updateInputs: (partial, scenario) => {
    applyInputs(get, set, partial, scenario, true)
  },

  setActiveTab: tab => {
    set(s => ({ ui: { ...s.ui, activeTab: tab } }))
    get().saveToStorage()
  },
  setTableOpen: open => set(s => ({ ui: { ...s.ui, tableOpen: open } })),
  setSidebarOpen: open => set(s => ({ ui: { ...s.ui, sidebarOpen: open } })),
  setMobileSidebar: open => set(s => ({ ui: { ...s.ui, mobileSidebar: open } })),
  setShareMessage: message => set(s => ({ ui: { ...s.ui, shareMessage: message } })),
  toggleDarkMode: () => {
    set(s => ({ ui: { ...s.ui, darkMode: !s.ui.darkMode } }))
    get().saveToStorage()
  },

  toggleComparing: () => {
    const state = get()
    if (state.comparison.comparing) {
      set({ current: "A", comparison: { comparing: false, frozenA: null, comparison: null } })
      return
    }
    const frozenA = cloneScenario(state.scenarios.A)
    const scenarioB = buildScenario({ ...state.scenarios.B.inputs }, state.scenarios.B)
    set({
      current: "B",
      scenarios: { ...state.scenarios, B: scenarioB },
      comparison: { comparing: true, frozenA, comparison: compareScenarios(frozenA.rows, scenarioB.rows) },
    })
  },

  runMC: () => {
    const state = get()
    const sid = state.current
    const scenario = state.scenarios[sid]
    const inputsHash = JSON.stringify(scenario.sanitizedInputs)
    set(cs => ({ scenarios: { ...cs.scenarios, [sid]: { ...cs.scenarios[sid], isCalculating: true } } }))
    window.setTimeout(() => {
      const current = get().scenarios[sid]
      const currentHash = JSON.stringify(current.sanitizedInputs)
      if (currentHash !== inputsHash) return
      const result = runMonteCarlo(
        current.sanitizedInputs,
        current.sanitizedInputs.mcRuns,
        current.sanitizedInputs.goalTarget,
      )
      set(cs => ({
        scenarios: { ...cs.scenarios, [sid]: { ...cs.scenarios[sid], mcResult: result, isCalculating: false } },
      }))
    }, 20)
  },

  runDecum: () => {
    const state = get()
    const sid = state.current
    const scenario = state.scenarios[sid]
    const safe = scenario.sanitizedInputs
    // Le capital de départ pour la décumulation est le nominal réellement détenu
    // (taxNet = après impôt sur la PV, mais on ne liquide pas la PV à chaque retrait).
    const lastRow = scenario.rows[scenario.rows.length - 1]
    const startingCapital = lastRow && lastRow.nominal > 0 ? lastRow.nominal : safe.capitalInitial
    const result = runDecumulation(safe, startingCapital, Math.min(safe.mcRuns, 2500))
    set(cs => ({ scenarios: { ...cs.scenarios, [sid]: { ...cs.scenarios[sid], decumResult: result } } }))
  },

  randomizeSeed: () => {
    const newSeed = Math.floor(Math.random() * 2147483647) + 1
    get().updateInput("seed", newSeed)
  },

  undo: () => {
    const state = get()
    if (state.history.past.length === 0) return
    const entry = state.history.past[state.history.past.length - 1]
    const target = state.current
    const currentInputs = state.scenarios[target].inputs
    const revert: Partial<SimulationInputs> = {}
    for (const key of Object.keys(entry.inputs) as (keyof SimulationInputs)[]) {
      ;(revert as Record<string, unknown>)[key] = (currentInputs as unknown as Record<string, unknown>)[key]
    }
    set(s => ({
      history: {
        past: s.history.past.slice(0, -1),
        future: [{ inputs: entry.inputs, timestamp: Date.now() }, ...s.history.future],
      },
    }))
    applyInputs(get, set, revert, target, false)
  },

  redo: () => {
    const state = get()
    if (state.history.future.length === 0) return
    const next = state.history.future[0]
    set(s => ({
      history: {
        past: [...s.history.past, { inputs: next.inputs, timestamp: Date.now() }],
        future: s.history.future.slice(1),
      },
    }))
    applyInputs(get, set, next.inputs, state.current, false)
  },

  saveSnapshot: () => {
    const state = get()
    const scenario = state.scenarios[state.current]
    const finalCapital = scenario.rows[scenario.rows.length - 1]?.taxNet ?? 0
    const snapshot: SavedSnapshot = {
      id: crypto.randomUUID(),
      name: `Snapshot ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`,
      createdAt: new Date().toISOString(),
      inputs: { ...scenario.inputs },
      finalCapital,
    }
    set(cs => ({ snapshots: [snapshot, ...cs.snapshots].slice(0, 8) }))
    get().saveToStorage()
  },

  loadSnapshot: id => {
    const snapshot = get().snapshots.find(s => s.id === id)
    if (snapshot) get().updateInputs(snapshot.inputs)
  },

  removeSnapshot: id => {
    set(s => ({ snapshots: s.snapshots.filter(sn => sn.id !== id) }))
    get().saveToStorage()
  },

  loadFromStorage: () => {
    if (!storageAvailable()) return
    try {
      const saved = window.localStorage.getItem("snowball_pro_v41_state")
      if (!saved) return
      const parsed = JSON.parse(saved) as {
        version?: number
        inputs?: Partial<SimulationInputs>
        inputsB?: Partial<SimulationInputs>
        ui?: Partial<UIState>
        snapshots?: SavedSnapshot[]
      }
      if (parsed.version !== STORAGE_VERSION) return
      const inputsA = { ...defaultInputs, ...parsed.inputs }
      const inputsB = parsed.inputsB
        ? { ...defaultInputs, ...parsed.inputsB }
        : { ...defaultInputs, monthlyPayment: 1_350, annualReturn: 0.085 }
      const darkMode = parsed.ui?.darkMode ?? false
      set(state => ({
        scenarios: {
          A: buildScenario(inputsA),
          B: buildScenario(inputsB),
        },
        ui: { ...state.ui, ...parsed.ui, shareMessage: null, darkMode },
        snapshots: parsed.snapshots ?? [],
      }))
    } catch {
      window.localStorage.removeItem("snowball_pro_v41_state")
    }
  },

  saveToStorage: () => {
    if (!storageAvailable()) return
    const state = get()
    window.localStorage.setItem(
      "snowball_pro_v41_state",
      JSON.stringify({
        version: STORAGE_VERSION,
        inputs: state.scenarios.A.inputs,
        inputsB: state.scenarios.B.inputs,
        ui: { activeTab: state.ui.activeTab, tableOpen: state.ui.tableOpen, darkMode: state.ui.darkMode },
        snapshots: state.snapshots,
      }),
    )
  },
}))
