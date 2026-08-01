import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  V4_SETTINGS_KEY,
  SETTINGS_KEY,
  addSnapshot,
  applyScenarioPatch,
  compareScenarios,
  createSnapshot,
  enterComparison,
  escapeCsvCell,
  exitComparison,
  parseStoredInputs,
  removeSnapshot,
  runDecumulation,
  runSimulation,
  v4SettingsToInputs,
  validateInputs,
} from "./engine"
import type { DecumulationResult, SavedSnapshot, SimulationInputs } from "./types"
import { useHistory } from "./hooks/useHistory"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { loadSnapshotsFromStorage, saveSnapshotsToStorage } from "./utils/snapshotsStorage"
import { ActionBar } from "./components/Layout/ActionBar"
import { ComparisonBar } from "./components/Layout/ComparisonBar"
import { DisclaimerBar } from "./components/Layout/DisclaimerBar"
import { Sidebar } from "./components/Layout/Sidebar"
import { TabBar } from "./components/Layout/TabBar"
import { SummaryStats } from "./components/Simulation/SummaryStats"
import { ComparisonTab } from "./components/Tabs/ComparisonTab"
import { GoalTab } from "./components/Tabs/GoalTab"
import { MonteCarloPanel } from "./components/Tabs/MonteCarloPanel"
import { RenteRetraiteTab } from "./components/Tabs/RenteRetraiteTab"
import { SimulatorTab } from "./components/Tabs/SimulatorTab"

const TABS = [
  { id: "simulator", label: "📈 Simulateur" },
  { id: "montecarlo", label: "🎲 Monte Carlo" },
  { id: "rente", label: "💸 Rente & Retraite" },
  { id: "goal", label: "🎯 Objectif Inversé" },
]

const THEME_KEY = "snowball_v5_theme"
const LEGACY_SIDEBAR_KEY = "snowball_v5_sidebar"
const SETTINGS_B_KEY = "snowball_v5_settings_b"

function loadInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored) return stored === "dark"
  } catch {
    /* localStorage indisponible */
  }
  return false
}

function applyThemeClass(darkMode: boolean) {
  document.documentElement.classList.toggle("light-mode", !darkMode)
}

function loadInitialInputs(): SimulationInputs {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return parseStoredInputs(stored)
    const v4 = localStorage.getItem(V4_SETTINGS_KEY)
    if (v4) return v4SettingsToInputs(JSON.parse(v4))
  } catch {
    /* localStorage indisponible */
  }
  return parseStoredInputs(null)
}

function loadInitialInputsB(): SimulationInputs | null {
  try {
    const stored = localStorage.getItem(SETTINGS_B_KEY)
    if (stored) return parseStoredInputs(stored)
  } catch {
    /* localStorage indisponible */
  }
  return null
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const initial = loadInitialDarkMode()
    applyThemeClass(initial)
    return initial
  })
  const [inputs, setInputs] = useState<SimulationInputs>(loadInitialInputs)
  const [inputsB, setInputsB] = useState<SimulationInputs | null>(loadInitialInputsB)
  const [comparing, setComparing] = useState(false)
  const [frozenA, setFrozenA] = useState<SimulationInputs | null>(null)
  const [activeTab, setActiveTab] = useState("simulator")
  const [decumResult, setDecumResult] = useState<DecumulationResult | null>(null)
  const [snapshots, setSnapshots] = useState<SavedSnapshot[]>(loadSnapshotsFromStorage)
  const history = useHistory()

  const inputsRef = useRef(inputs)
  const inputsBRef = useRef(inputsB)
  const comparingRef = useRef(comparing)
  inputsRef.current = inputs
  inputsBRef.current = inputsB
  comparingRef.current = comparing

  const activeInputs = comparing && inputsB ? inputsB : inputs
  const rows = useMemo(() => runSimulation(activeInputs), [activeInputs])
  const lastRow = rows[rows.length - 1]

  const rowsA = useMemo(() => (comparing && frozenA ? runSimulation(frozenA) : null), [comparing, frozenA])
  const comparison = useMemo(
    () => (comparing && rowsA && rows ? compareScenarios(rowsA, rows) : null),
    [comparing, rowsA, rows],
  )

  /**
   * Applique un patch au bon scénario SANS jamais écraser l'autre :
   * en mode comparaison → B, sinon → A (voir engine/scenarios.ts).
   */
  const applyPatch = useCallback(
    (patch: Partial<SimulationInputs>, record = true, scenario: "A" | "B" | null = null) => {
      const state = { A: inputsRef.current, B: inputsBRef.current }
      const { state: nextState, target } = applyScenarioPatch(state, patch, comparingRef.current, scenario)
      if (record) {
        const current = target === "B" ? inputsBRef.current : inputsRef.current
        if (current) history.record(current, patch, target)
      }
      inputsRef.current = nextState.A
      inputsBRef.current = nextState.B
      setInputs(nextState.A)
      setInputsB(nextState.B)
    },
    [history],
  )

  const updateInput = useCallback(
    <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => {
      applyPatch({ [key]: value } as Partial<SimulationInputs>)
    },
    [applyPatch],
  )

  const updateInputs = useCallback(
    (partial: Partial<SimulationInputs>) => {
      applyPatch(partial)
    },
    [applyPatch],
  )

  const handleUndo = useCallback(() => {
    const result = history.undo()
    if (result) applyPatch(result.patch, false, result.scenario)
  }, [history, applyPatch])

  const handleRedo = useCallback(() => {
    const result = history.redo()
    if (result) applyPatch(result.patch, false, result.scenario)
  }, [history, applyPatch])

  const toggleComparing = useCallback(() => {
    if (comparingRef.current) {
      const nextState = exitComparison({ A: inputsRef.current, B: inputsBRef.current })
      inputsRef.current = nextState.A
      inputsBRef.current = nextState.B
      setInputs(nextState.A)
      setInputsB(nextState.B)
      setComparing(false)
      setFrozenA(null)
      return
    }
    const nextState = enterComparison({ A: inputsRef.current, B: inputsBRef.current })
    inputsRef.current = nextState.A
    inputsBRef.current = nextState.B
    setFrozenA({ ...nextState.A })
    setInputsB(nextState.B)
    setComparing(true)
  }, [])

  const handleSaveSnapshot = useCallback(() => {
    const snapshot = createSnapshot(activeInputs, rows)
    setSnapshots(prev => {
      const next = addSnapshot(prev, snapshot)
      saveSnapshotsToStorage(next)
      return next
    })
  }, [activeInputs, rows])

  const handleLoadSnapshot = useCallback(
    (id: string) => {
      const snapshot = snapshots.find(s => s.id === id)
      if (snapshot) applyPatch(snapshot.inputs)
    },
    [snapshots, applyPatch],
  )

  const handleRemoveSnapshot = useCallback((id: string) => {
    setSnapshots(prev => {
      const next = removeSnapshot(prev, id)
      saveSnapshotsToStorage(next)
      return next
    })
  }, [])

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onToggleDarkMode: () => setDarkMode(d => !d),
  })

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(inputs))
    } catch {
      /* localStorage indisponible */
    }
  }, [inputs])

  useEffect(() => {
    try {
      if (inputsB) localStorage.setItem(SETTINGS_B_KEY, JSON.stringify(inputsB))
      else localStorage.removeItem(SETTINGS_B_KEY)
    } catch {
      /* localStorage indisponible */
    }
  }, [inputsB])

  useEffect(() => {
    applyThemeClass(darkMode)
    try {
      localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light")
      localStorage.removeItem(LEGACY_SIDEBAR_KEY)
    } catch {
      /* localStorage indisponible */
    }
  }, [darkMode])

  const fmtExportNumber = (v: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

  const exportCSV = () => {
    const header = [
      "Annee",
      "Date",
      "Total Verse",
      "Interets",
      "Valeur Nominale",
      "Valeur Reelle",
      "Frais",
      "Impot Dividendes",
      "Net Fiscal",
    ]
    // Échappement anti-injection de formule (OWASP CSV Injection)
    const esc = escapeCsvCell
    const lines = rows.map(r =>
      [
        esc(String(r.year)),
        esc(r.date),
        esc(fmtExportNumber(r.investedNom)),
        esc(fmtExportNumber(r.interestsNom)),
        esc(fmtExportNumber(r.nominal)),
        esc(fmtExportNumber(r.real)),
        esc(fmtExportNumber(r.fees)),
        esc(fmtExportNumber(r.dividendTax)),
        esc(fmtExportNumber(r.taxNet)),
      ].join(";"),
    )
    const csv = `\uFEFF${header.map(esc).join(";")}\n${lines.join("\n")}`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "snowball_pro_v5_projection.csv")
    link.click()
  }

  const exportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      inputs: activeInputs,
      results: rows,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "snowball_pro_v5_projection.json")
    link.click()
  }

  const validationErrors = useMemo(() => validateInputs(activeInputs), [activeInputs])

  const runDecum = useCallback(() => {
    if (!lastRow || lastRow.nominal <= 0) return
    setDecumResult(runDecumulation(activeInputs, lastRow.nominal))
  }, [activeInputs, lastRow])

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="max-w-[1440px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          <Sidebar
            inputs={activeInputs}
            rows={rows}
            updateInput={updateInput}
            updateInputs={updateInputs}
            scenarioLabel={comparing ? "Scénario B" : undefined}
            snapshots={snapshots}
            onSaveSnapshot={handleSaveSnapshot}
            onLoadSnapshot={handleLoadSnapshot}
            onRemoveSnapshot={handleRemoveSnapshot}
          />

          <main className="space-y-5 min-w-0">
            <ActionBar
              onExportCSV={exportCSV}
              onExportJSON={exportJSON}
              onPrint={() => window.print()}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(d => !d)}
              comparing={comparing}
              onToggleCompare={toggleComparing}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              validationErrors={validationErrors}
            />
            <SummaryStats rows={rows} inputs={activeInputs} />
            {validationErrors.filter(e => e.severity === "error").length > 0 && (
              <div
                role="alert"
                className="rounded-2xl px-4 py-3 text-[11px] font-semibold border border-danger/40 bg-danger/10 text-danger"
              >
                ⚠️ Des valeurs saisies sortent des bornes acceptées ({validationErrors.filter(e => e.severity === "error").length}{" "}
                erreur{validationErrors.filter(e => e.severity === "error").length > 1 ? "s" : ""}). Corrigez-les pour une
                simulation fiable.
              </div>
            )}
            {comparing && <ComparisonBar onExit={toggleComparing} />}
            <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="focus:outline-none"
            >
              {activeTab === "simulator" &&
                (comparing && comparison && rowsA ? (
                  <ComparisonTab
                    rowsA={rowsA}
                    rowsB={rows}
                    inputs={activeInputs}
                    darkMode={darkMode}
                    comparison={comparison}
                  />
                ) : (
                  <SimulatorTab rows={rows} inputs={activeInputs} darkMode={darkMode} />
                ))}
              {activeTab === "montecarlo" && <MonteCarloPanel inputs={activeInputs} darkMode={darkMode} />}
              {activeTab === "rente" && (
                <RenteRetraiteTab
                  inputs={activeInputs}
                  decumResult={decumResult}
                  lastRow={lastRow}
                  darkMode={darkMode}
                  updateInput={updateInput}
                  updateInputs={updateInputs}
                  runDecum={runDecum}
                />
              )}
              {activeTab === "goal" && (
                <GoalTab inputs={activeInputs} rows={rows} updateInput={updateInput} darkMode={darkMode} />
              )}
            </div>
          </main>
        </div>

        <DisclaimerBar fiscalYear={activeInputs.fiscalYear} />
      </div>
    </div>
  )
}
