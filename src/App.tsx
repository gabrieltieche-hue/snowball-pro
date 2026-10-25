import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Banknote,
  Dices,
  FolderOpen,
  LineChart,
  Link2,
  SlidersHorizontal,
  Target,
  Wallet,
  X,
} from "lucide-react"
import {
  V4_SETTINGS_KEY,
  SETTINGS_KEY,
  addSnapshot,
  applyScenarioPatch,
  compareScenarios,
  createSnapshot,
  buildSimulationFromAnswers,
  enterComparison,
  escapeCsvCell,
  exitComparison,
  parseStoredInputs,
  removeSnapshot,
  renameSnapshot,
  DEFAULT_INPUTS,
  runDecumulationAsync,
  runSimulation,
  serializeInputs,
  v4SettingsToInputs,
  validateInputs,
  autoFixValidationErrors,
  type ValidationError,
} from "./engine"
import type { DecumulationResult, SavedSnapshot, SimulationInputs } from "./types"
import type { WizardAnswers } from "./engine"
import { useHistory } from "./hooks/useHistory"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import { useLang } from "./i18n"
import { useSession } from "./auth/store"
import { SETTINGS_B_KEY, scopeKey } from "./auth/storage"
import { THEME_KEY, applyThemeClass, loadInitialDarkMode } from "./utils/theme"
import { loadUiMode, saveUiMode, type UiMode } from "./utils/uiMode"
import { loadSidebarCollapsed, saveSidebarCollapsed } from "./utils/sidebar"
import { loadOnboardingVisible, saveOnboardingDone } from "./utils/onboarding"
import { loadSnapshotsFromStorage, saveSnapshotsToStorage } from "./utils/snapshotsStorage"
import { readSharedState, writeSharedState } from "./utils/urlState"
import { TAB_FIELD } from "./utils/validationTargets"
import { AccountMenu } from "./components/Auth/AccountMenu"
import { SaveSimulationDialog } from "./components/Onboarding/SaveSimulationDialog"
import { ActionBar } from "./components/Layout/ActionBar"
import { ComparisonBar } from "./components/Layout/ComparisonBar"
import { DisclaimerBar } from "./components/Layout/DisclaimerBar"
import { SimulationWizard } from "./components/Onboarding/SimulationWizard"
import { SpotlightTour } from "./components/Onboarding/SpotlightTour"
import { Sidebar } from "./components/Layout/Sidebar"
import { TabBar, type TabDef } from "./components/Layout/TabBar"
import { ErrorBoundary } from "./components/shared/ErrorBoundary"
import { PatrimonialReport } from "./components/Report/PatrimonialReport"
import { ComparisonTab } from "./components/Tabs/ComparisonTab"
import { GoalTab } from "./components/Tabs/GoalTab"
import { MonteCarloPanel } from "./components/Tabs/MonteCarloPanel"
import { RenteRetraiteTab } from "./components/Tabs/RenteRetraiteTab"
import { SimulatorTab } from "./components/Tabs/SimulatorTab"
import { SimulationsTab } from "./components/Tabs/SimulationsTab"

// Libellés v6 orientés BESOIN utilisateur (avis 1 & 2) : on nomme ce que
// l'onglet apporte, pas sa technique interne. Les ids restent inchangés
// (persistance, tests, partage). Les libellés français servent de clés i18n
// (v6.12) — traduits au rendu via useLang().tr.
// `shortLabel` : libellés mobiles (v6.23) — les 5 onglets tiennent sur UNE
// rangée au lieu de trois, sans jamais tronquer le libellé desktop.
const TABS: TabDef[] = [
  { id: "simulator", label: "Projection", shortLabel: "Projection", icon: LineChart },
  { id: "montecarlo", label: "Robustesse de votre plan", shortLabel: "Robustesse", icon: Dices },
  { id: "rente", label: "Rente & Retraite", shortLabel: "Rente", icon: Banknote },
  { id: "goal", label: "Combien investir ?", shortLabel: "Objectif", icon: Target },
  { id: "simulations", label: "Mes simulations", shortLabel: "Simulations", icon: FolderOpen },
]

const LEGACY_SIDEBAR_KEY = "snowball_v5_sidebar"

function loadInitialInputs(scope: string | null): SimulationInputs {
  // Un lien partagé (#s=…) prime sur la sauvegarde locale : c'est l'état
  // explicitement demandé par l'utilisateur à l'ouverture.
  const shared = readSharedState()
  if (shared) return shared
  try {
    const stored = localStorage.getItem(scopeKey(scope, SETTINGS_KEY))
    if (stored) return parseStoredInputs(stored)
    // Migration v4 : uniquement pour l'invité — un compte démarre vierge.
    if (scope === null) {
      const v4 = localStorage.getItem(V4_SETTINGS_KEY)
      if (v4) return v4SettingsToInputs(JSON.parse(v4))
    }
  } catch {
    /* localStorage indisponible */
  }
  return parseStoredInputs(null)
}

function loadInitialInputsB(scope: string | null): SimulationInputs | null {
  try {
    const stored = localStorage.getItem(scopeKey(scope, SETTINGS_B_KEY))
    if (stored) return parseStoredInputs(stored)
  } catch {
    /* localStorage indisponible */
  }
  return null
}

export default function App() {
  // La session pilote le scope de stockage : AppShell est remonté (key) à
  // chaque connexion/déconnexion pour recharger les données du bon compte.
  const session = useSession()
  const scope = session?.userId ?? null
  return <AppShell key={scope ?? "guest"} scope={scope} />
}

function AppShell({ scope }: { scope: string | null }) {
  const { tr, locale } = useLang()
  const session = useSession()
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const initial = loadInitialDarkMode()
    applyThemeClass(initial)
    return initial
  })
  // Mode Débutant / Avancé (audit) : en Débutant, les notions techniques
  // (XIRR, PFU, TMI, Fisher, Pástor–Stambaugh, Guyton–Klinger) sont masquées.
  // Préférence locale persistée — hors de SimulationInputs pour ne pas
  // polluer les liens partagés ni la persistance des scénarios.
  const [uiMode, setUiMode] = useState<UiMode>(loadUiMode)
  // Repli de la sidebar (v6.2) : l'état vit ICI car la grille de la page doit
  // rétrécir (380 px → rail 72 px) quand on replie — c'est App qui rend la
  // largeur au contenu, la Sidebar n'est que le miroir. Persisté en
  // localStorage (préférence d'affichage, comme le thème).
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(loadSidebarCollapsed)
  // Réglages mobiles (v6.23) : sur téléphone la sidebar n'est plus reléguée
  // 2 200 px plus bas — un tiroir plein écran s'ouvre depuis le header.
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      saveSidebarCollapsed(next)
      return next
    })
  }, [])
  const toggleUiMode = useCallback(() => {
    setUiMode(prev => {
      const next = prev === "debutant" ? "avance" : "debutant"
      saveUiMode(next)
      return next
    })
  }, [])
  // Onboarding v8 « Le chiffre d'abord » : le questionnaire s'ouvre en direct
  // chez le vrai nouveau visiteur (voir utils/onboarding.ts) — chaque réponse
  // met à jour une projection en direct, puis la révélation met en scène le
  // résultat. Terminé une fois, il ne revient plus jamais.
  const [firstRun, setFirstRun] = useState<boolean>(() => loadOnboardingVisible(scope))
  // Questionnaire « Nouvelle simulation » : ouvert par le bouton du même nom
  // (ou automatiquement au premier run). Réponses vierges à chaque ouverture —
  // on peut très bien vouloir tester d'autres chiffres.
  const [showWizard, setShowWizard] = useState(firstRun)
  // Visite guidée 3 bulles (premier run uniquement) : après la révélation, sur
  // la vraie simulation que l'utilisateur vient de créer.
  const [showTour, setShowTour] = useState(false)
  // Dialogue « sauvegarder avant de créer » : la simulation en cours a des
  // changements non sauvegardés (dirty) → on propose de la figer (snapshot).
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [inputs, setInputs] = useState<SimulationInputs>(() => loadInitialInputs(scope))
  const [inputsB, setInputsB] = useState<SimulationInputs | null>(() => loadInitialInputsB(scope))
  const [comparing, setComparing] = useState(false)
  const [frozenA, setFrozenA] = useState<SimulationInputs | null>(null)
  const [activeTab, setActiveTab] = useState("simulator")
  const [decumResult, setDecumResult] = useState<DecumulationResult | null>(null)
  const [decumRunning, setDecumRunning] = useState(false)
  const [decumProgress, setDecumProgress] = useState(0)
  const decumAbortRef = useRef<AbortController | null>(null)
  const decumRunningRef = useRef(false)
  const decumMountedRef = useRef(true)
  const [snapshots, setSnapshots] = useState<SavedSnapshot[]>(() => loadSnapshotsFromStorage(scope))
  // Rapport PDF (PISTES V6.1 — idée 2) : monté à la DEMANDE au premier clic
  // « Rapport PDF » (un rapport Recharts toujours monté coûterait un render
  // complet de graphe à chaque changement de réglage), puis conservé.
  const [reportOpen, setReportOpen] = useState(false)
  const [sharedLinkLoaded, setSharedLinkLoaded] = useState<boolean>(() => readSharedState() !== null)
  const history = useHistory()

  // « Corriger l'erreur » (refonte header) : le header (icône ⚠) ou le bandeau
  // demandent d'amener l'utilisateur au champ fautif. Pour un champ d'onglet
  // (objectif, rente) on change d'onglet ; sinon on relaie le focus à la
  // sidebar (révéler la section + focus l'input) via focusRequest.
  const [focusRequest, setFocusRequest] = useState<{ field: keyof SimulationInputs; nonce: number } | null>(null)
  // ⚠ « Corriger l'erreur » sur mobile : les réglages vivent dans un tiroir —
  // on l'ouvre pour que le champ fautif soit réellement visible au focus.
  useEffect(() => {
    if (!focusRequest) return
    try {
      if (window.matchMedia?.("(max-width: 1023px)").matches) setMobileSettingsOpen(true)
    } catch {
      /* jsdom sans matchMedia */
    }
  }, [focusRequest])
  const handleFixError = useCallback((field: ValidationError["field"]) => {
    const tab = TAB_FIELD[field]
    if (tab) {
      setActiveTab(tab)
      return
    }
    setFocusRequest({ field, nonce: Date.now() })
  }, [])
  const inputsRef = useRef(inputs)
  const inputsBRef = useRef(inputsB)
  const comparingRef = useRef(comparing)
  inputsRef.current = inputs
  inputsBRef.current = inputsB
  comparingRef.current = comparing

  // Référence « engagée » des inputs (montage, chargement d'un snapshot, fin
  // du wizard, sauvegarde, réinitialisation) : tant que les inputs en
  // différent, la simulation en cours a des changements non sauvegardés.
  const baselineRef = useRef<SimulationInputs | null>(null)
  useEffect(() => {
    if (baselineRef.current === null) baselineRef.current = inputs
  }, [inputs])
  // En mode comparaison, le scénario affiché (B) est un état temporaire :
  // « Nouvelle simulation » demande TOUJOURS la sauvegarde pour ne jamais
  // jeter silencieusement un scénario B édité.
  const dirty = useMemo(
    () => comparing || (baselineRef.current !== null && JSON.stringify(inputs) !== JSON.stringify(baselineRef.current)),
    [inputs, comparing],
  )

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

  // « Corriger automatiquement » (refonte header) : corrige TOUTES les
  // anomalies de validation d'un coup (bornes + cohérence âge/durée/
  // retraite) — l'utilisateur n'a rien à toucher. Le patch passe par
  // updateInputs : annulable (⌘Z) et appliqué au scénario actif (A ou B).
  const handleAutoFix = useCallback(() => {
    const patch = autoFixValidationErrors(activeInputs)
    if (Object.keys(patch).length > 0) updateInputs(patch)
  }, [activeInputs, updateInputs])

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
      saveSnapshotsToStorage(next, scope)
      return next
    })
    // L'état courant vient d'être figé : les changements sont désormais
    // « engagés » (référence du scénario A — en comparaison, le dirty est
    // déjà forcé par `comparing`).
    baselineRef.current = inputsRef.current
  }, [activeInputs, rows, scope])

  const handleLoadSnapshot = useCallback(
    (id: string) => {
      const snapshot = snapshots.find(s => s.id === id)
      if (snapshot) {
        applyPatch(snapshot.inputs)
        baselineRef.current = snapshot.inputs
      }
    },
    [snapshots, applyPatch],
  )

  const handleRenameSnapshot = useCallback(
    (id: string, name: string) => {
      setSnapshots(prev => {
        const next = renameSnapshot(prev, id, name)
        saveSnapshotsToStorage(next, scope)
        return next
      })
    },
    [scope],
  )

  const handleRemoveSnapshot = useCallback(
    (id: string) => {
      setSnapshots(prev => {
        const next = removeSnapshot(prev, id)
        saveSnapshotsToStorage(next, scope)
        return next
      })
    },
    [scope],
  )

  // « Tout réinitialiser » (audit) : repart des réglages par défaut et purge
  // les données locales du scénario (réglages A, scénario B, snapshots). Les
  // comptes ne sont pas touchés — c'est une remise à zéro des simulations.
  const handleResetSettings = useCallback(() => {
    try {
      localStorage.removeItem(scopeKey(scope, SETTINGS_KEY))
      localStorage.removeItem(scopeKey(scope, SETTINGS_B_KEY))
      saveSnapshotsToStorage([], scope)
    } catch {
      /* localStorage indisponible */
    }
    inputsRef.current = { ...DEFAULT_INPUTS }
    inputsBRef.current = null
    baselineRef.current = { ...DEFAULT_INPUTS }
    setInputs({ ...DEFAULT_INPUTS })
    setInputsB(null)
    setComparing(false)
    setFrozenA(null)
    setSnapshots([])
    setDecumResult(null)
    setDecumComputedFor("")
  }, [scope])

  // « Nouvelle simulation » : dirty → proposer de figer l'état courant ; sinon
  // le questionnaire s'ouvre directement (réponses vierges).
  const openNewSimulation = useCallback(() => {
    if (dirty) setSaveDialogOpen(true)
    else setShowWizard(true)
  }, [dirty])

  const handleSaveAndCreate = useCallback(() => {
    const snapshot = createSnapshot(activeInputs, rows)
    setSnapshots(prev => {
      const next = addSnapshot(prev, snapshot)
      saveSnapshotsToStorage(next, scope)
      return next
    })
    baselineRef.current = inputsRef.current
    setSaveDialogOpen(false)
    setShowWizard(true)
  }, [activeInputs, rows, scope])

  const handleDiscardAndCreate = useCallback(() => {
    setSaveDialogOpen(false)
    setShowWizard(true)
  }, [])

  // Fin du questionnaire : les réponses deviennent la simulation active ET une
  // entrée de la bibliothèque « Mes simulations » (nom choisi par l'utilisateur).
  // Premier run : l'onboarding est marqué définitivement et la visite guidée
  // s'ouvre sur cette vraie simulation.
  const handleWizardComplete = useCallback(
    (answers: WizardAnswers, name: string) => {
      const nextInputs = buildSimulationFromAnswers(answers)
      const snapshot = createSnapshot(nextInputs, runSimulation(nextInputs), name)
      inputsRef.current = nextInputs
      baselineRef.current = nextInputs
      setInputs(nextInputs)
      setSnapshots(prev => {
        const next = addSnapshot(prev, snapshot)
        saveSnapshotsToStorage(next, scope)
        return next
      })
      if (comparingRef.current) {
        const nextState = exitComparison({ A: nextInputs, B: inputsBRef.current })
        inputsBRef.current = nextState.B
        setInputsB(nextState.B)
        setComparing(false)
        setFrozenA(null)
      }
      setShowWizard(false)
      setActiveTab("simulator")
      if (firstRun) {
        saveOnboardingDone()
        setFirstRun(false)
        setShowTour(true)
      }
    },
    [scope, firstRun],
  )

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
  // sessions et l'écriture est groupée. Clé scopée par compte.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(scopeKey(scope, SETTINGS_KEY), serializeInputs(inputs))
      } catch {
        /* localStorage indisponible */
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [inputs, scope])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (inputsB) localStorage.setItem(scopeKey(scope, SETTINGS_B_KEY), serializeInputs(inputsB))
        else localStorage.removeItem(scopeKey(scope, SETTINGS_B_KEY))
      } catch {
        /* localStorage indisponible */
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [inputsB, scope])

  // Partage par URL : le hash reflète l'état actif (replaceState, pas de
  // pollution d'historique), lui aussi débouncé pour éviter un hash à chaque
  // pixel de slider.
  useEffect(() => {
    const timer = setTimeout(() => {
      writeSharedState(activeInputs)
    }, 500)
    return () => clearTimeout(timer)
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
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

  const exportCSV = () => {
    // En-têtes ASCII (sans accents) : compatibles avec tous les tableurs
    // (Excel/LibreOffice) — clés i18n pour la version anglaise (v6.12).
    const header = [
      tr("Annee"),
      tr("Date"),
      tr("Total Verse"),
      tr("Interets"),
      tr("Valeur Nominale"),
      tr("Valeur Reelle"),
      tr("Frais"),
      tr("Net Fiscal"),
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

  // « Rapport PDF » = le VRAI rapport patrimonial (page de garde, héro,
  // graphique, fiscalité, tableau annuel, méthodologie) rendu hors-écran puis
  // imprimé via le dialogue du navigateur. Le rapport doit être rendu (Recharts
  // mesure son conteneur) avant d'ouvrir le dialogue : on attend la fin du
  // paint (double requestAnimationFrame, repli setTimeout si absent — jsdom).
  const handlePrint = useCallback(() => {
    setReportOpen(true)
    const fire = () => {
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()))
      } else {
        setTimeout(() => window.print(), 50)
      }
    }
    fire()
  }, [])

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
        // Paquet 2 — base fiscale du capital : le COÛT (versements investis),
        // pas le nominal — sinon les gains latents de l'accumulation ne seraient
        // jamais taxés pendant le décaissement.
        lastRow.investedNom,
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
    <>
      {/* Le shell de l'app est masqué à l'impression (.app-shell) — seul le
          rapport patrimonial (render hors-écran, .report-print-only) s'imprime. */}
      <div className="app-shell min-h-screen bg-surface text-text">
        {/* I6 — hiérarchie de titres : h1 de page (visuellement masqué), les
          sections s'enchaînent ensuite en h2/h3 dans les onglets. */}
        <h1 className="sr-only">{tr("Snowball Pro — Simulateur patrimonial (épargne, fiscalité, retraite)")}</h1>

        {/* En-tête global : la marque et les actions (annuler, partager, thème,
          export…) restent accessibles pendant tout le scroll. */}
        <header className="sticky-header sticky top-0 z-40 border-b border-border/70 backdrop-blur-xl bg-surface/72 no-print">
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center shadow-gold shrink-0">
                <Wallet size={15} className="btn-gold-text sm:hidden" aria-hidden />
                <Wallet size={18} className="btn-gold-text hidden sm:block" aria-hidden />
                <span className="absolute -inset-px rounded-xl ring-1 ring-primary/50" aria-hidden />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="font-display text-[15px] sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
                  SNOWBALL <span className="text-primary">PRO</span>
                </div>
                <div className="hidden sm:block text-[9px] sm:text-[10px] text-text-dim uppercase tracking-[0.22em] truncate">
                  {tr("Simulateur patrimonial")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2.5 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setMobileSettingsOpen(true)}
                aria-label={tr("Ouvrir les réglages")}
                title={tr("Ouvrir les réglages")}
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl glass text-text-muted hover:text-text transition-colors"
              >
                <SlidersHorizontal size={14} aria-hidden />
              </button>
              {/* Invité sur mobile : l'icône compte disparaît du header (elle
                  encombre pour rien) — « Se connecter » vit dans le menu ⋯. */}
              <div className={session ? "contents" : "hidden sm:block"}>
                <AccountMenu />
              </div>
              <ActionBar
                onNewSimulation={openNewSimulation}
                onExportCSV={exportCSV}
                onExportJSON={exportJSON}
                onPrint={handlePrint}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(d => !d)}
                comparing={comparing}
                onToggleCompare={toggleComparing}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                validationErrors={validationErrors}
                inputs={activeInputs}
                uiMode={uiMode}
                onToggleUiMode={toggleUiMode}
                onReset={handleResetSettings}
                onFixError={handleFixError}
                onAutoFix={handleAutoFix}
              />
            </div>
          </div>
        </header>

        <div className="max-w-[1440px] mx-auto p-3 sm:p-6">
          {/* La colonne réglages s'anime entre 380 px (déplié) et 72 px (rail
              d'icônes replié, style ChatGPT) — grid-template-columns est
              interpolable par le navigateur (Chrome/FF/Safari 16+). */}
          <div
            className={`grid grid-cols-1 gap-4 sm:gap-6 items-start transition-[grid-template-columns] duration-300 ease-out ${
              sidebarCollapsed ? "lg:grid-cols-[76px_1fr]" : "lg:grid-cols-[380px_1fr]"
            }`}
          >
            {/* Mobile : RÉSULTAT D'ABORD (promesse produit) — les onglets et le
                héro passent avant les réglages (order), la sidebar suit. Sur
                desktop la grille conserve l'ordre source : réglages à gauche,
                résultats à droite, visibles côte à côte. */}
            {/* Mobile : voile du tiroir réglages (le panneau vit au-dessus). */}
            {mobileSettingsOpen && (
              <button
                type="button"
                aria-label={tr("Fermer les réglages")}
                onClick={() => setMobileSettingsOpen(false)}
                className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              />
            )}
            {/* Un seul Sidebar monté : colonne sur desktop, tiroir plein écran
                sur mobile (plus de réglages enterrés 2 000 px plus bas). */}
            <div
              className={
                mobileSettingsOpen
                  ? "order-2 lg:order-1 min-w-0 max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:overflow-y-auto max-lg:bg-surface max-lg:p-3 lg:static lg:z-auto lg:overflow-visible lg:bg-transparent lg:p-0"
                  : "order-2 lg:order-1 min-w-0 max-lg:hidden"
              }
            >
              {mobileSettingsOpen && (
                <div className="lg:hidden sticky top-0 z-10 mb-2 flex items-center justify-between gap-2 bg-surface/95 py-1 backdrop-blur">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
                      {tr("Réglages")}
                    </p>
                    <p className="text-[10px] text-text-dim leading-snug">
                      {tr("Modifiez vos chiffres : le résultat se met à jour instantanément.")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSettingsOpen(false)}
                    className="inline-flex items-center gap-1 rounded-xl glass px-3 py-2 text-[11px] font-bold text-text"
                  >
                    <X size={13} aria-hidden /> {tr("Fermer")}
                  </button>
                </div>
              )}
              <ErrorBoundary label={tr("les réglages")}>
                <Sidebar
                  inputs={activeInputs}
                  rows={rows}
                  updateInput={updateInput}
                  scenarioLabel={comparing ? "Scénario B" : undefined}
                  snapshots={snapshots}
                  onSaveSnapshot={handleSaveSnapshot}
                  onLoadSnapshot={handleLoadSnapshot}
                  onRemoveSnapshot={handleRemoveSnapshot}
                  uiMode={uiMode}
                  collapsed={mobileSettingsOpen ? false : sidebarCollapsed}
                  onToggleCollapsed={mobileSettingsOpen ? () => setMobileSettingsOpen(false) : toggleSidebarCollapsed}
                  focusRequest={focusRequest}
                />
              </ErrorBoundary>
            </div>

            <main className="space-y-4 sm:space-y-5 min-w-0 order-1 lg:order-2">
              {sharedLinkLoaded && (
                <div className="glass-gold rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-text-muted flex items-center gap-2 min-w-0">
                    <Link2 size={12} className="text-primary shrink-0" />
                    <span>
                      {tr("Scénario chargé depuis un")} <strong className="text-text">{tr("lien partagé")}</strong>.{" "}
                      {tr(
                        "Il est aussi sauvegardé sur cet appareil — partagez à nouveau le lien pour propager vos modifications.",
                      )}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSharedLinkLoaded(false)}
                    aria-label={tr("Fermer le bandeau lien partagé")}
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
                    {tr("Des valeurs saisies sortent des bornes acceptées (")}
                    {tr(
                      validationErrors.filter(e => e.severity === "error").length > 1 ? "{n} erreurs" : "{n} erreur",
                      { n: validationErrors.filter(e => e.severity === "error").length },
                    )}
                    {tr("). Corrigez-les pour une simulation fiable.")}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFix}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold bg-danger/15 border border-danger/40 text-danger hover:bg-danger/25 transition-colors"
                  >
                    {tr("Corriger automatiquement")}
                  </button>
                </div>
              )}
              {comparing && <ComparisonBar onExit={toggleComparing} />}
              <TabBar tabs={TABS.map(t => ({ ...t, label: tr(t.label) }))} active={activeTab} onChange={setActiveTab} />

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
                  label={`${tr("l'onglet")} ${tr(TABS.find(t => t.id === activeTab)?.label ?? activeTab)}`}
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
                      <SimulatorTab rows={rows} inputs={activeInputs} darkMode={darkMode} uiMode={uiMode} />
                    ))}
                  {activeTab === "montecarlo" && (
                    <MonteCarloPanel
                      inputs={activeInputs}
                      darkMode={darkMode}
                      updateInput={updateInput}
                      uiMode={uiMode}
                    />
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
                      uiMode={uiMode}
                    />
                  )}
                  {activeTab === "goal" && (
                    <GoalTab inputs={activeInputs} rows={rows} updateInput={updateInput} darkMode={darkMode} />
                  )}
                  {activeTab === "simulations" && (
                    <SimulationsTab
                      inputs={activeInputs}
                      rows={rows}
                      snapshots={snapshots}
                      onNewSimulation={openNewSimulation}
                      onLoad={handleLoadSnapshot}
                      onRename={handleRenameSnapshot}
                      onRemove={handleRemoveSnapshot}
                    />
                  )}
                </ErrorBoundary>
              </div>
            </main>
          </div>

          <DisclaimerBar />
        </div>
      </div>
      {/* Rapport patrimonial imprimable — monté au premier clic « Rapport
          PDF », hors-écran à l'écran, seul visible à l'impression. */}
      {reportOpen && <PatrimonialReport rows={rows} inputs={activeInputs} />}
      {/* Onboarding v8 « Le chiffre d'abord » : le questionnaire s'ouvre en
          direct chez le nouveau visiteur (projection en direct → révélation),
          puis la visite guidée présente l'app en 3 bulles sur sa simulation.
          Le dialogue de sauvegarde précède le questionnaire quand la
          simulation en cours a des changements non sauvegardés. */}
      {showWizard && (
        <SimulationWizard firstRun={firstRun} onCancel={() => setShowWizard(false)} onComplete={handleWizardComplete} />
      )}
      {showTour && <SpotlightTour onClose={() => setShowTour(false)} />}
      {saveDialogOpen && (
        <SaveSimulationDialog
          onSave={handleSaveAndCreate}
          onDiscard={handleDiscardAndCreate}
          onCancel={() => setSaveDialogOpen(false)}
        />
      )}
    </>
  )
}
