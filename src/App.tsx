import { useCallback, useEffect, useMemo, useState } from "react"
import { V4_SETTINGS_KEY, SETTINGS_KEY, parseStoredInputs, runDecumulation, runSimulation, v4SettingsToInputs } from "./engine"
import type { DecumulationResult, SimulationInputs } from "./types"
import { ActionBar } from "./components/Layout/ActionBar"
import { DisclaimerBar } from "./components/Layout/DisclaimerBar"
import { Sidebar } from "./components/Layout/Sidebar"
import { TabBar } from "./components/Layout/TabBar"
import { SummaryStats } from "./components/Simulation/SummaryStats"
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

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const initial = loadInitialDarkMode()
    applyThemeClass(initial)
    return initial
  })
  const [inputs, setInputs] = useState<SimulationInputs>(loadInitialInputs)
  const [activeTab, setActiveTab] = useState("simulator")
  const [decumResult, setDecumResult] = useState<DecumulationResult | null>(null)

  const rows = useMemo(() => runSimulation(inputs), [inputs])
  const lastRow = rows[rows.length - 1]

  const updateInput = useCallback(<K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateInputs = useCallback((partial: Partial<SimulationInputs>) => {
    setInputs(prev => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(inputs))
    } catch {
      /* localStorage indisponible */
    }
  }, [inputs])

  useEffect(() => {
    applyThemeClass(darkMode)
    try {
      localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light")
    } catch {
      /* localStorage indisponible */
    }
  }, [darkMode])

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
    setDecumResult(runDecumulation(inputs, lastRow.nominal))
  }, [inputs, lastRow])

  return (
    <div className="min-h-screen bg-surface text-text">
      <div className="max-w-[1440px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          <Sidebar inputs={inputs} rows={rows} updateInput={updateInput} updateInputs={updateInputs} />

          <main className="space-y-5 min-w-0">
            <ActionBar onExportCSV={exportCSV} onPrint={() => window.print()} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(d => !d)} />
            <SummaryStats rows={rows} inputs={inputs} />
            <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === "simulator" && <SimulatorTab rows={rows} inputs={inputs} darkMode={darkMode} />}
            {activeTab === "montecarlo" && <MonteCarloPanel inputs={inputs} darkMode={darkMode} />}
            {activeTab === "rente" && (
              <RenteRetraiteTab
                inputs={inputs}
                decumResult={decumResult}
                lastRow={lastRow}
                darkMode={darkMode}
                updateInput={updateInput}
                updateInputs={updateInputs}
                runDecum={runDecum}
              />
            )}
            {activeTab === "goal" && <GoalTab inputs={inputs} rows={rows} updateInput={updateInput} darkMode={darkMode} />}
          </main>
        </div>

        <DisclaimerBar />
      </div>
    </div>
  )
}
