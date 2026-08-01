import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  V4_SETTINGS_KEY,
  SETTINGS_KEY,
  addSnapshot,
  compareScenarios,
  createSnapshot,
  parseStoredInputs,
  removeSnapshot,
  runDecumulation,
  runSimulation,
  v4SettingsToInputs,
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
const SIDEBAR_KEY = "snowball_v5_sidebar"
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

function loadInitialSidebar(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "collapsed"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(loadInitialSidebar)
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

  const applyPatch = useCallback(
    (patch: Partial<SimulationInputs>, record = true, scenario: "A" | "B" | null = null) => {
      const target = scenario ?? (comparingRef.current ? "B" : "A")
      const current = target === "B" ? inputsBRef.current : inputsRef.current
      if (!current) return
      if (record) history.record(current, patch, target)
      const next = { ...current, ...patch }
      if (target === "B") {
        inputsBRef.current = next
        setInputsB(next)
      } else {
        inputsRef.current = next
        setInputs(next)
      }
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
      setComparing(false)
      setFrozenA(null)
      return
    }
    setFrozenA({ ...inputsRef.current })
    setInputsB(current => current ?? { ...inputsRef.current })
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
    } catch {
      /* localStorage indisponible */
    }
  }, [darkMode])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "collapsed" : "open")
    } catch {
      /* localStorage indisponible */
    }
  }, [sidebarCollapsed])

  const exportCSV = () => {
    let csv = "Annee;Date;Total Verse;Interets;Valeur Nominale;Valeur Reelle;Net Fiscal\n"
    rows.forEach(r => {
      csv += `${r.year};${r.date};${r.investedNom};${r.interestsNom};${r.nominal};${r.real};${r.taxNet}\n`
    })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", "snowball_pro_v5_projection.csv")
    link.click()
  }

  const runDecum = useCallback(() => {
    if (!lastRow || lastRow.nominal <= 0) return
    setDecumResult(runDecumulation(activeInputs, lastRow.nominal))
  }, [activeInputs, lastRow])

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="max-w-[1440px] mx-auto p-4 sm:p-6">
        <div
          className={`grid grid-cols-1 gap-6 items-start ${
            sidebarCollapsed ? "lg:grid-cols-[72px_1fr]" : "lg:grid-cols-[380px_1fr]"
          }`}
        >
          <Sidebar
            inputs={activeInputs}
            rows={rows}
            updateInput={updateInput}
            updateInputs={updateInputs}
            collapsed={sidebarCollapsed}
            scenarioLabel={comparing ? "Scénario B" : undefined}
            snapshots={snapshots}
            onSaveSnapshot={handleSaveSnapshot}
            onLoadSnapshot={handleLoadSnapshot}
            onRemoveSnapshot={handleRemoveSnapshot}
            onToggleCollapse={() => setSidebarCollapsed(c => !c)}
          />

          <main className="space-y-5 min-w-0">
            <ActionBar
              onExportCSV={exportCSV}
              onPrint={() => window.print()}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(d => !d)}
              comparing={comparing}
              onToggleCompare={toggleComparing}
              canUndo={history.canUndo}
              canRedo={history.canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
            <SummaryStats rows={rows} inputs={activeInputs} />
            {comparing && <ComparisonBar onExit={toggleComparing} />}
            <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === "simulator" &&
              (comparing && comparison && rowsA ? (
                <ComparisonTab rowsA={rowsA} rowsB={rows} inputs={activeInputs} darkMode={darkMode} comparison={comparison} />
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
            {activeTab === "goal" && <GoalTab inputs={activeInputs} rows={rows} updateInput={updateInput} darkMode={darkMode} />}
          </main>
        </div>

        <DisclaimerBar />
      </div>
    </div>
  )
}
