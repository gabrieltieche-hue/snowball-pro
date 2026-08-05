import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Banknote, Dices, LineChart, Link2, Target, Wallet, X } from "lucide-react"
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
  runDecumulationAsync,
  runSimulation,
  v4SettingsToInputs,
  validateInputs,
} from "./engine"
import type { DecumulationResult, SavedSnapshot, SimulationInputs } from "./types"
import { useHistory } from "./hooks/useHistory"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { loadSnapshotsFromStorage, saveSnapshotsToStorage } from "./utils/snapshotsStorage"
import { buildShareUrl, copyTextToClipboard, readSharedState, writeSharedState } from "./utils/urlState"
import { ActionBar } from "./components/Layout/ActionBar"
import { ComparisonBar } from "./components/Layout/ComparisonBar"
import { DisclaimerBar } from "./components/Layout/DisclaimerBar"
import { Sidebar } from "./components/Layout/Sidebar"
import { TabBar, type TabDef } from "./components/Layout/TabBar"
import { ErrorBoundary } from "./components/shared/ErrorBoundary"
import { ComparisonTab } from "./components/Tabs/ComparisonTab"
import { GoalTab } from "./components/Tabs/GoalTab"
import { MonteCarloPanel } from "./components/Tabs/MonteCarloPanel"
import { RenteRetraiteTab } from "./components/Tabs/RenteRetraiteTab"
import { SimulatorTab } from "./components/Tabs/SimulatorTab"

// Libellés v6 orientés BESOIN utilisateur (avis 1 & 2) : on nomme ce que
// l'onglet apporte, pas sa technique interne. Les ids restent inchangés
// (persistance, tests, partage).
const TABS: TabDef[] = [
  { id: "simulator", label: "Projection", icon: LineChart },
  { id: "montecarlo", label: "Robustesse de votre plan", icon: Dices },
  { id: "rente", label: "Rente & Retraite", icon: Banknote },
  { id: "goal", label: "Combien investir ?", icon: Target },
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
  // Un lien partagé (#s=…) prime sur la sauvegarde locale : c'est l'état
  // explicitement demandé par l'utilisateur à l'ouverture.
  const shared = readSharedState()
  if (shared) return shared
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
  const [decumRunning, setDecumRunning] = useState(false)
  const [decumProgress, setDecumProgress] = useState(0)
  const decumAbortRef = useRef<AbortController | null>(null)
  const decumRunningRef = useRef(false)
  const decumMountedRef = useRef(true)
  const [snapshots, setSnapshots] = useState<SavedSnapshot[]>(loadSnapshotsFromStorage)
  const [sharedLinkLoaded, setSharedLinkLoaded] = useState<boolean>(() => readSharedState() !== null)
  const [linkCopied, setLinkCopied] = useState(false)
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
    () => (comparing && rowsA && rows ? compareScenarios(rowsA, rows, activeInputs.showReal) : null),
    [comparing, rowsA, rows, activeInputs.showReal],
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

  // Annule un décaissement en cours au démontage (jamais de setState après
  // unmount, jamais de calcul fantôme qui continue en arrière-plan).
  useEffect(() => {
    decumMountedRef.current = true
    return () => {
      decumMountedRef.current = false
      decumAbortRef.current?.abort()
    }
  }, [])

  // Persistance débouncée (500 ms) : on n'écrit pas dans localStorage à
  // chaque keystroke d'un slider — le quota reste sain sur les longues
  // sessions et l'écriture est groupée.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(inputs))
      } catch {
        /* localStorage indisponible */
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [inputs])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (inputsB) localStorage.setItem(SETTINGS_B_KEY, JSON.stringify(inputsB))
        else localStorage.removeItem(SETTINGS_B_KEY)
      } catch {
        /* localStorage indisponible */
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [inputsB])

  // Partage par URL : le hash reflète l'état actif (replaceState, pas de
  // pollution d'historique), lui aussi débouncé pour éviter un hash à chaque
  // pixel de slider.
  useEffect(() => {
    const timer = setTimeout(() => {
      writeSharedState(activeInputs)
    }, 500)
    return () => clearTimeout(timer)
  }, [activeInputs])

  const handleCopyLink = useCallback(async () => {
    const ok = await copyTextToClipboard(buildShareUrl(activeInputs))
    if (ok) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }, [activeInputs])

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
        esc(fmtExportNumber(r.taxNet)),
      ].join(";"),
    )
    const csv = `\uFEFF${header.map(esc).join(";")}\n${lines.join("\n")}`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "snowball_pro_v5_projection.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Libère l'URL objet (fuite mémoire légère à chaque export sinon)
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const exportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      inputs: activeInputs,
      results: rows,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "snowball_pro_v5_projection.json")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const validationErrors = useMemo(() => validateInputs(activeInputs), [activeInputs])

  // Détection « résultats obsolètes » pour l'onglet Rente : si un paramètre
  // qui influe sur le décaissement change après un lancement, on prévient
  // l'utilisateur (comme le fait déjà l'onglet Monte Carlo).
  const [decumComputedFor, setDecumComputedFor] = useState<string>("")
  const decumParamsHash = useMemo(
    () =>
      JSON.stringify({
        startingCapital: lastRow?.nominal ?? 0,
        withdrawalModel: activeInputs.withdrawalModel,
        withdrawalFixed: activeInputs.withdrawalFixed,
        withdrawalInflation: activeInputs.withdrawalInflation,
        retirementYears: activeInputs.retirementYears,
        historicalIndex: activeInputs.historicalIndex,
        inflation: activeInputs.inflation,
        mcRuns: activeInputs.mcRuns,
        seed: activeInputs.seed,
        // Fiabilité (v5.5.0) : ces options changent le résultat du décaissement
        // — sans elles, le bandeau « relancez » ne se déclencherait pas après
        // un basculement.
        parameterUncertainty: activeInputs.parameterUncertainty,
        extendedHistory: activeInputs.extendedHistory,
        stochasticInflation: activeInputs.stochasticInflation,
        dynamicGuardrails: activeInputs.dynamicGuardrails,
        // Scénario « partir en période difficile » (v5.6.0) : ces options
        // changent le résultat du décaissement — le bandeau « relancez » doit
        // se déclencher à leur bascule.
        crisisScenario: activeInputs.crisisScenario,
        crisisStartOffset: activeInputs.crisisStartOffset,
        crisisIntensity: activeInputs.crisisIntensity,
      }),
    [activeInputs, lastRow],
  )
  const decumStale = decumResult !== null && decumComputedFor !== decumParamsHash

  // Le décaissement est chunké et asynchrone (runDecumulationAsync) : même à
  // 10 000 runs, l'interface ne se fige plus (audit B2 — le calcul synchrone
  // gelait le thread principal ~5 s). Résultats identiques à la version
  // synchrone, avec progression et annulation propres.
  const runDecum = useCallback(async () => {
    if (!lastRow || lastRow.nominal <= 0 || decumRunningRef.current) return
    decumAbortRef.current?.abort()
    const controller = new AbortController()
    decumAbortRef.current = controller
    decumRunningRef.current = true
    setDecumRunning(true)
    setDecumProgress(0)
    try {
      const result = await runDecumulationAsync(
        activeInputs,
        lastRow.nominal,
        activeInputs.mcRuns,
        (done, total) => {
          if (decumMountedRef.current) setDecumProgress(Math.round((done / total) * 100))
        },
        controller.signal,
      )
      // Seul le run le plus récent peut écrire les résultats (un run annulé
      // par une relance ne doit pas écraser les nouveaux résultats).
      if (decumMountedRef.current && decumAbortRef.current === controller) {
        setDecumResult(result)
        // Réutilise le hash mémorisé (une seule source de vérité, pas de copie
        // dupliquée qui risquerait de dériver).
        setDecumComputedFor(decumParamsHash)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (decumMountedRef.current && decumAbortRef.current === controller) setDecumResult(null)
    } finally {
      if (decumMountedRef.current && decumAbortRef.current === controller) {
        decumRunningRef.current = false
        setDecumRunning(false)
      }
    }
  }, [activeInputs, lastRow, decumParamsHash])

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* I6 — hiérarchie de titres : h1 de page (visuellement masqué), les
          sections s'enchaînent ensuite en h2/h3 dans les onglets. */}
      <h1 className="sr-only">Snowball Pro — Simulateur patrimonial (épargne, fiscalité, retraite)</h1>

      {/* En-tête global : la marque et les actions (annuler, partager, thème,
          export…) restent accessibles pendant tout le scroll. */}
      <header className="sticky top-0 z-40 border-b border-border/70 backdrop-blur-xl bg-surface/72 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center shadow-gold shrink-0">
              <Wallet size={18} className="btn-gold-text" aria-hidden />
              <span className="absolute -inset-px rounded-xl ring-1 ring-primary/50" aria-hidden />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="font-display text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
                SNOWBALL <span className="text-primary">PRO</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-text-dim uppercase tracking-[0.22em] truncate">
                Simulateur patrimonial
              </div>
            </div>
          </div>
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
            onCopyLink={handleCopyLink}
            linkCopied={linkCopied}
          />
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          <ErrorBoundary label="les réglages">
            <Sidebar
              inputs={activeInputs}
              rows={rows}
              updateInput={updateInput}
              scenarioLabel={comparing ? "Scénario B" : undefined}
              snapshots={snapshots}
              onSaveSnapshot={handleSaveSnapshot}
              onLoadSnapshot={handleLoadSnapshot}
              onRemoveSnapshot={handleRemoveSnapshot}
            />
          </ErrorBoundary>

          <main className="space-y-5 min-w-0">
            {sharedLinkLoaded && (
              <div className="glass-gold rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-text-muted flex items-center gap-2 min-w-0">
                  <Link2 size={12} className="text-primary shrink-0" />
                  <span>
                    Scénario chargé depuis un <strong className="text-text">lien partagé</strong>. Il est aussi
                    sauvegardé sur cet appareil — partagez à nouveau le lien pour propager vos modifications.
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setSharedLinkLoaded(false)}
                  aria-label="Fermer le bandeau lien partagé"
                  className="text-text-muted hover:text-text transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {validationErrors.filter(e => e.severity === "error").length > 0 && (
              <div
                role="alert"
                className="rounded-2xl px-4 py-3 text-[11px] font-semibold border border-danger/40 bg-danger/10 text-danger flex items-center gap-2"
              >
                <AlertTriangle size={13} className="shrink-0" />
                <span>
                  Des valeurs saisies sortent des bornes acceptées (
                  {validationErrors.filter(e => e.severity === "error").length} erreur
                  {validationErrors.filter(e => e.severity === "error").length > 1 ? "s" : ""}). Corrigez-les pour une
                  simulation fiable.
                </span>
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
              {/* Garde-fou par onglet : un graphe Recharts qui explose ne fait
                  jamais tomber toute l'application (clé = onglet → re-render
                  propre après un crash dans un autre onglet). */}
              <ErrorBoundary
                key={activeTab}
                label={`l'onglet ${TABS.find(t => t.id === activeTab)?.label ?? activeTab}`}
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
                {activeTab === "montecarlo" && (
                  <MonteCarloPanel inputs={activeInputs} darkMode={darkMode} updateInput={updateInput} />
                )}
                {activeTab === "rente" && (
                  <RenteRetraiteTab
                    inputs={activeInputs}
                    decumResult={decumResult}
                    lastRow={lastRow}
                    darkMode={darkMode}
                    updateInput={updateInput}
                    updateInputs={updateInputs}
                    runDecum={runDecum}
                    isStale={decumStale}
                    running={decumRunning}
                    progress={decumProgress}
                  />
                )}
                {activeTab === "goal" && (
                  <GoalTab inputs={activeInputs} rows={rows} updateInput={updateInput} darkMode={darkMode} />
                )}
              </ErrorBoundary>
            </div>
          </main>
        </div>

        <DisclaimerBar />
      </div>
    </div>
  )
}
