// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import App from "../App"
import { ErrorBoundary } from "../components/shared/ErrorBoundary"
import { buildEquitySeries } from "../components/Charts/EquityChart"
import { DualAmount } from "../components/shared/DualAmount"
import { GoalTab } from "../components/Tabs/GoalTab"
import { MonteCarloPanel } from "../components/Tabs/MonteCarloPanel"
import { RenteRetraiteTab } from "../components/Tabs/RenteRetraiteTab"
import { TerminalHistogram } from "../components/Simulation/TerminalHistogram"
import { CashflowCalendar } from "../components/Simulation/CashflowCalendar"
import { FiscalPanel } from "../components/Simulation/FiscalPanel"
import { SliderInput } from "../components/shared/SliderInput"
import { SmartInput } from "../components/shared/SmartInput"
import { SectionHeader } from "../components/shared/SectionHeader"
import { Shield } from "lucide-react"
import { DEFAULT_INPUTS, fmtCompact, fmtCurrency, runSimulation, runDecumulation, buildTerminalHistogram, solveGoal } from "../engine"
import { encodeInputsForUrl, decodeInputsFromUrl } from "../utils/urlState"

/* Les graphes Recharts sont volontairement remplacés par des stubs : ils
 * nécessitent des mesures de conteneur (ResizeObserver) absentes de jsdom.
 * On rend juste un div, les flux logiques restent entièrement testés. */
vi.mock("recharts", async () => {
  const React = await import("react")
  // Les vrais composants Recharts rendent un <svg> : en rendant les enfants
  // dans un <div>, les balises SVG qu'ils contiennent (defs, linearGradient,
  // stop…) étaient créées dans le namespace HTML → warnings
  // « <linearGradient> is unrecognized » dans stderr. On rend un <svg>.
  const stub = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("svg", { "data-testid": "chart-stub" }, children)
  const names = [
    "ResponsiveContainer",
    "AreaChart",
    "Area",
    "LineChart",
    "Line",
    "XAxis",
    "YAxis",
    "CartesianGrid",
    "Tooltip",
    "BarChart",
    "Bar",
    "PieChart",
    "Pie",
    "Cell",
    "Legend",
    "ComposedChart",
    "ReferenceLine",
    "Label",
  ]
  const mod: Record<string, unknown> = {}
  for (const n of names) mod[n] = stub
  return mod
})

/* Le rendu complet d'<App /> (simulation + onglets) dépasse le timeout par
 * défaut de 5 s en jsdom, surtout sous contention CPU (build + tests en
 * parallèle) : on relève le timeout pour tout ce fichier. */
vi.setConfig({ testTimeout: 30_000 })

/* framer-motion n'apporte rien de testable en jsdom : motion.xxx devient
 * l'élément DOM dont il porte le nom, AnimatePresence passe les enfants tels
 * quels. Rendue en <div> générique, motion.tr (tableaux de ComparisonTab et
 * AmortissementTable) produisait du HTML invalide en test — warnings
 * « <td> dans <div> » / « <div> dans <tbody> » dans stderr. On rend donc la
 * VRAIE balise, comme framer-motion en production.
 *
 * IMPORTANT : le Proxy retourne une fonction STABLE par balise (mise en
 * cache). Un getter créant une nouvelle fonction par accès ferait croire à
 * React que le type d'élément change à chaque rendu → remontage du sous-arbre
 * entier à chaque render (tempête de remounts, tests 10× plus lents, timeouts
 * flaky). */
vi.mock("framer-motion", async () => {
  const React = await import("react")
  // Props spécifiques à framer-motion qui ne doivent PAS finir sur l'élément
  // DOM réel : React avertirait « does not recognize the `layout` prop » sur
  // une balise HTML. Filtrer par liste explicite évite de dépendre d'un
  // destructuring à maintenir à la main (layout/drag/whileFocus… ajoutés
  // plus tard dans l'app le feraient resurgir les warnings).
  const FRAMER_PROPS = new Set([
    "animate",
    "custom",
    "drag",
    "dragConstraints",
    "dragDirectionLock",
    "dragElastic",
    "dragListener",
    "dragMomentum",
    "dragPropagation",
    "dragTransition",
    "exit",
    "initial",
    "layout",
    "layoutId",
    "onAnimationComplete",
    "onAnimationRepeat",
    "onAnimationStart",
    "onDrag",
    "onDragEnd",
    "onDragStart",
    "onDragTransitionEnd",
    "onViewportEnter",
    "onViewportLeave",
    "transition",
    "variants",
    "viewport",
    "whileDrag",
    "whileFocus",
    "whileHover",
    "whileInView",
    "whileTap",
  ])
  const stubs = new Map<string, (props: Record<string, unknown>) => React.ReactNode>()
  const motion = new Proxy(
    {},
    {
      get: (_target, tag) => {
        if (typeof tag !== "string") return undefined
        if (!stubs.has(tag)) {
          const Stub = ({ children, ...rest }: Record<string, unknown>) => {
            const domProps: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(rest)) {
              if (!FRAMER_PROPS.has(key)) domProps[key] = value
            }
            return React.createElement(tag, domProps, children as React.ReactNode)
          }
          stubs.set(tag, Stub)
        }
        return stubs.get(tag)
      },
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  }
})

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ""
})

afterEach(() => {
  cleanup()
  // Restaure tous les spies (console.error, HTMLAnchorElement.click…) même si
  // une assertion échoue en cours de test : pas de mock qui fuit entre tests.
  vi.restoreAllMocks()
})

/* Monter l'App complète en jsdom est coûteux (simulation entière recalculée à
 * chaque modification) et ce fichier tourne en parallèle des tests moteur MC
 * (gros consommateurs CPU) : on laisse une marge confortable au timeout. */
const APP_TIMEOUT = 30_000

describe("undo / redo — historique des modifications", () => {
  it(
    "annule puis rétablit une modification de curseur",
    () => {
      render(<App />)

      const slider = screen.getByRole("slider", { name: "Épargne mensuelle (€)" })
      expect(slider).toHaveValue("500")

      fireEvent.change(slider, { target: { value: "800" } })
      expect(slider).toHaveValue("800")

      // fireEvent pour la robustesse : le premier mock framer-motion créait une
      // fonction par accès → remontage du sous-arbre à chaque rendu (tempête de
      // remounts, tests 10× plus lents et timeouts flaky). Mock stabilisé, mais
      // on garde fireEvent : le flux logique (history → patch → re-render) est
      // identique et le test reste déterministe sous charge.
      fireEvent.click(screen.getByRole("button", { name: "Annuler la dernière modification" }))
      expect(slider).toHaveValue("500")

      fireEvent.click(screen.getByRole("button", { name: "Rétablir la modification annulée" }))
      expect(slider).toHaveValue("800")
    },
    APP_TIMEOUT,
  )

  it(
    "désactive Annuler quand l'historique est vide",
    () => {
      render(<App />)
      expect(screen.getByRole("button", { name: "Annuler la dernière modification" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Rétablir la modification annulée" })).toBeDisabled()
    },
    APP_TIMEOUT,
  )
})

describe("comparaison A/B", () => {
  it(
    "entre en comparaison, édite le scénario B, puis en sort",
    () => {
      render(<App />)

      fireEvent.click(screen.getByRole("button", { name: /comparer/i }))
      expect(screen.getByText("Mode Comparaison actif")).toBeInTheDocument()
      // Le panneau édite désormais le scénario B : le badge Sidebar ET le
      // libellé de la barre de comparaison l'affichent → getAllByText.
      expect(screen.getAllByText(/Scénario B/).length).toBeGreaterThan(0)

      const slider = screen.getByRole("slider", { name: "Durée (années)" })
      fireEvent.change(slider, { target: { value: "30" } })
      expect(slider).toHaveValue("30")

      fireEvent.click(screen.getByRole("button", { name: /quitter la comparaison/i }))
      expect(screen.queryByText("Mode Comparaison actif")).not.toBeInTheDocument()
    },
    APP_TIMEOUT,
  )
})

describe("snapshots", () => {
  it(
    "sauvegarde puis supprime un état",
    async () => {
      const user = userEvent.setup()
      render(<App />)

      expect(screen.getByText(/aucun état sauvegardé/i)).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: /sauvegarder/i }))
      expect(await screen.findByText(/^Snapshot /)).toBeInTheDocument()

      // Suppression en deux temps (anti-erreur de tap) : 1er clic arme la
      // confirmation, le 2ᵉ supprime réellement.
      await user.click(screen.getByTitle("Supprimer ce snapshot"))
      await user.click(screen.getByTitle("Confirmer la suppression"))
      await waitFor(() => expect(screen.queryByText(/^Snapshot /)).not.toBeInTheDocument())
      expect(screen.getByText(/aucun état sauvegardé/i)).toBeInTheDocument()
    },
    APP_TIMEOUT,
  )
})

describe("buildEquitySeries — même échelle pour tout le graphique (audit v5.2.0)", () => {
  it("déflate les impôts quand showReal est actif (plus de 303 k€ vs 176 k€)", () => {
    const inputs = { ...DEFAULT_INPUTS, showReal: true, envelope: "cto" as const, duration: 10 }
    const rows = runSimulation(inputs)
    const series = buildEquitySeries(rows, true, "cto")
    const last = series[series.length - 1]
    const row = rows[rows.length - 1]

    // L'épargne et les gains sont en euros d'aujourd'hui
    expect(last.investi).toBe(row.investedReal)
    expect(last.gains).toBeCloseTo(row.real - row.investedReal, 0)
    // Les impôts SONT déflatés : impôts réels = (nominal − taxNet) × (real/nominal)
    const expectedTaxes = Math.max(0, row.nominal - row.taxNet) * (row.real / row.nominal)
    expect(last.impôts).toBeCloseTo(expectedTaxes, 0)
    // Le tooltip ne peut plus afficher un montant NOMINAL à côté de cartes réelles
    expect(last.impôts).toBeLessThan(row.nominal - row.taxNet)
  })

  it("garde les impôts en euros courants quand showReal est inactif", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, showReal: false, envelope: "cto" as const, duration: 10 })
    const series = buildEquitySeries(rows, false, "cto")
    const last = series[series.length - 1]
    const row = rows[rows.length - 1]
    expect(last.investi).toBe(row.investedNom)
    expect(last.impôts).toBeCloseTo(Math.max(0, row.nominal - row.taxNet), 0)
  })

  it("n'affiche aucun impôt sans enveloppe fiscale", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, showReal: true, envelope: "none" as const, duration: 5 })
    const series = buildEquitySeries(rows, true, "none")
    for (const point of series) expect(point.impôts).toBe(0)
  })
})

describe("DualAmount — les deux échelles toujours affichées (demande utilisateur)", () => {
  // toLocaleString("fr-FR") insère une espace insécable (U+202F) dans les
  // milliers : on normalise en espace simple avant de comparer.
  const text = (container: HTMLElement) => (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")

  it("affiche la valeur du compte ET le pouvoir d'achat quand showReal est inactif", () => {
    const { container } = render(<DualAmount nominal={46610} real={30700} showReal={false} />)
    const t = text(container)
    // La valeur nominale est le grand chiffre…
    expect(t).toContain("46 610 €")
    // …et l'équivalent en euros d'aujourd'hui reste visible en dessous.
    expect(t).toContain("en euros d'aujourd'hui")
    expect(t).toContain("30 700 €")
  })

  it("garde la valeur du compte visible même quand showReal est actif", () => {
    const { container } = render(<DualAmount nominal={46610} real={30700} showReal={true} endYear="2046" />)
    const t = text(container)
    // Le pouvoir d'achat devient le grand chiffre…
    expect(t).toContain("30 700 €")
    // …mais la valeur sur le compte n'est PLUS cachée : elle reste affichée.
    expect(t).toContain("46 610 €")
    expect(t).toContain("sur le compte en 2046")
  })

  it("sans fin de projection, le libellé secondaire reste générique", () => {
    const { container } = render(<DualAmount nominal={1000} real={800} showReal={true} />)
    expect(text(container)).toContain("sur le compte")
  })
})

describe("rendement BRUT — clarté sur tous les onglets (demande TRUC 1/2/4)", () => {
  it("GoalTab : label « (% brut) » + note taux recommandé 7-12 %/an · défaut 10,07 %", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    const { container } = render(
      <GoalTab inputs={DEFAULT_INPUTS} rows={rows} darkMode={false} updateInput={() => {}} />,
    )
    // toLocaleString(« fr-FR ») insère des espaces insécables (U+202F) : on
    // normalise avant de comparer.
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    expect(screen.getByText("Rendement de la bourse (% brut)")).toBeInTheDocument()
    expect(text).toContain("référence")
    expect(text).toContain("10,07 % brut (moyenne MSCI World)")
    expect(text).toContain("taux recommandé")
    // Le curseur Objectif démarre sur le défaut 10,07 % (valeur en %)
    expect(screen.getByRole("slider", { name: "Rendement de la bourse (% brut)" })).toHaveValue("10.07")
  })

  it("Sidebar (v5.6.0) : la note « Rendement lissé » remplace le curseur de rendement", () => {
    const { container } = render(<App />)
    // Plus de « taux saisi » : la sidebar affiche désormais la référence de
    // courbe LISSÉE (demande utilisateur) — rendement moyen MSCI World chaque
    // année, plus de zigzags. Le texte est fragmenté par des <strong> : on
    // compare le texte complet du container.
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    expect(text).toContain("Rendement de la bourse (MSCI World)")
    // Échelle pédagogique v5.7.1 : les TROIS étages sont affichés — brut
    // (arithmétique), composé (géométrique, chaînon manquant avant v5.7.1) et
    // réel (après inflation). Chaque étage déduit une seule chose : la
    // volatilité puis l'inflation — plus de « double déduction » apparente.
    expect(text).toContain("Brut (moyenne des années)")
    expect(text).toContain("10,07 %/an")
    expect(text).toContain("Composé (krachs inclus)")
    expect(text).toContain("8,22 %/an")
    expect(text).toContain("Réel (après inflation 2,1 %)")
    expect(text).toContain("5,99 %/an")
    expect(text).toContain("la volatilité")
    expect(text).toContain("l'inflation")
    // v5.7.2 : la formule de Fisher est explicitée — 8,22 − 2,1 = 6,12 est une
    // approximation, la formule exacte (1+8,22%)/(1+2,1%)−1 = 5,99 % explique
    // pourquoi le chiffre affiché n'est pas une simple soustraction.
    expect(text).toContain("Pourquoi pas 6,12 %")
    expect(text).toContain("formule exacte (Fisher)")
    // Le curseur de rendement de la bourse a disparu de la sidebar.
    expect(screen.queryByRole("slider", { name: /rendement annuel de la bourse/i })).not.toBeInTheDocument()
  })

  it("Sidebar (Option A) : plus d'alerte de double déduction (le taux saisi n'existe plus)", () => {
    render(<App />)
    // L'ancienne alerte « si le taux était déjà net d'inflation » n'a plus de
    // sens : il n'y a plus de taux saisi, rien à déduire deux fois.
    expect(screen.queryByText(/double déduction|serait déduite|trop pessimiste/i)).not.toBeInTheDocument()
  })

  it("App : le toggle « Euros d'aujourd'hui » est COCHÉ par défaut (vraies valeurs)", () => {
    render(<App />)
    // Demande utilisateur : l'affichage par défaut montre les vraies valeurs
    // nettes d'inflation — le montant sur le compte reste affiché partout.
    const toggle = screen.getByRole("switch", { name: /euros d'aujourd'hui/i })
    expect(toggle).toBeChecked()
  })

  it("SliderInput : l'infobulle « ? » explique la règle du rendement BRUT", () => {
    render(
      <SliderInput
        label="Rendement annuel de la bourse (% brut)"
        id="annual-return-test"
        value={10.07}
        min={0.1}
        max={20}
        step={0.1}
        help="Rendement BRUT = rendement réel du marché avant inflation (ex. MSCI World : 10,07 %/an brut). Ne saisissez jamais un taux déjà net d'inflation."
        onChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Aide" }))
    expect(screen.getByRole("tooltip")).toHaveTextContent(/ne saisissez jamais un taux déjà net d'inflation/i)
  })
})

describe("menu Export — toutes les fonctionnalités d'export dans un bouton", () => {
  it("ouvre un popup avec CSV, JSON et Rapport PDF au clic", () => {
    render(<App />)
    // Un seul bouton « Exporter », les trois formats n'existent pas avant
    // l'ouverture du menu.
    expect(screen.getByRole("button", { name: /exporter/i })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /export json/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /exporter/i }))

    expect(screen.getByRole("menuitem", { name: /export csv/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /export json/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /rapport pdf/i })).toBeInTheDocument()
  })

  it("se ferme au clic extérieur (aucune option piégée)", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: /exporter/i }))
    expect(screen.getByRole("menuitem", { name: /export csv/i })).toBeInTheDocument()

    // Clic hors du menu → fermeture (le composant écoute mousedown natif)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole("menuitem", { name: /export csv/i })).not.toBeInTheDocument()
  })
})

describe("export CSV", () => {
  it("génère un fichier CSV avec en-tête et séparateur ;", async () => {
    const createObjectURL = vi.fn((_blob: Blob | string) => "blob:mock")
    const originalCreate = URL.createObjectURL
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    try {
      render(<App />)
      // fireEvent (comme pour undo/redo) : userEvent attend une géométrie DOM
      // réelle absente de jsdom et expirait sur les boutons de l'ActionBar.
      // Le CSV est désormais caché derrière le menu Export (un seul bouton).
      fireEvent.click(screen.getByRole("button", { name: /exporter/i }))
      fireEvent.click(screen.getByRole("menuitem", { name: /export csv/i }))

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      const blob = createObjectURL.mock.calls[0][0] as Blob
      expect(blob.type).toContain("text/csv")
      // blob.text() décode UTF-8 et CONSOMME le BOM : on vérifie donc les
      // octets bruts EF BB BF présents dans le Blob.
      const bytes = new Uint8Array(await blob.arrayBuffer())
      expect(bytes[0]).toBe(0xef)
      expect(bytes[1]).toBe(0xbb)
      expect(bytes[2]).toBe(0xbf)
      const text = new TextDecoder().decode(bytes)
      expect(text).toContain("Annee")
      expect(text).toContain("Date")
      expect(text).toContain("Net Fiscal")
      expect(text.split("\n").length).toBeGreaterThan(2) // en-tête + années
    } finally {
      clickSpy.mockRestore()
      Object.defineProperty(URL, "createObjectURL", {
        value: originalCreate,
        configurable: true,
      })
    }
  })
})

describe("ErrorBoundary", () => {
  it("affiche un message de secours au lieu de faire tomber l'app", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const Bomb = () => {
      throw new Error("pouf")
    }
    render(
      <ErrorBoundary label="un onglet">
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByRole("alert")).toHaveTextContent(/une erreur est survenue/i)
    expect(screen.getByRole("button", { name: /recharger/i })).toBeInTheDocument()
    spy.mockRestore()
  })

  it("laisse les enfants s'afficher quand tout va bien", () => {
    render(
      <ErrorBoundary label="un onglet">
        <p>contenu sain</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText("contenu sain")).toBeInTheDocument()
  })
})

describe("partage par URL (hash)", () => {
  it("encode / décode un état complet sans perte", () => {
    const encoded = encodeInputsForUrl(DEFAULT_INPUTS)
    expect(encoded.startsWith("s=")).toBe(true)
    expect(decodeInputsFromUrl(encoded)).toEqual(DEFAULT_INPUTS)
  })

  it("rejette un hash malformé", () => {
    expect(decodeInputsFromUrl("z=abcd")).toBeNull()
    expect(decodeInputsFromUrl(null)).toBeNull()
    expect(decodeInputsFromUrl("s=!!not-base64!!")).toBeNull()
  })

  it(
    "charge l'état du hash au démarrage de l'application",
    () => {
      const custom = { ...DEFAULT_INPUTS, capitalInitial: 12345 }
      window.location.hash = `#${encodeInputsForUrl(custom)}`
      render(<App />)
      const slider = screen.getByRole("slider", { name: "Capital de départ (€)" })
      expect(slider).toHaveValue("12345")
    },
    APP_TIMEOUT,
  )
})

describe("fiabilité v5.5.0 — MonteCarloPanel : options et histogramme", () => {
  it("les 2 options de fiabilité sont COCHÉES par défaut (incertitude + historique étendu)", () => {
    const updateInput = vi.fn()
    render(
      <MonteCarloPanel
        inputs={{ ...DEFAULT_INPUTS, parameterUncertainty: true, extendedHistory: true }}
        darkMode={false}
        updateInput={updateInput}
      />,
    )
    expect(screen.getByRole("switch", { name: /incertitude des paramètres/i })).toBeChecked()
    expect(screen.getByRole("switch", { name: /historique étendu/i })).toBeChecked()
  })

  it("décoché → updateInput est appelé avec la bonne clé", () => {
    const updateInput = vi.fn()
    render(
      <MonteCarloPanel
        inputs={{ ...DEFAULT_INPUTS, parameterUncertainty: false, extendedHistory: false }}
        darkMode={false}
        updateInput={updateInput}
      />,
    )
    fireEvent.click(screen.getByRole("switch", { name: /incertitude des paramètres/i }))
    expect(updateInput).toHaveBeenCalledWith("parameterUncertainty", true)
  })

  it("TerminalHistogram totalise les classes et affiche médiane + moyenne", () => {
    const bins = buildTerminalHistogram([0, 0, 100, 200, 500, 1000, 5000, 12000], 5)
    render(
      <TerminalHistogram
        bins={bins}
        mean={2400}
        median={350}
        format={v => `${v} €`}
        highlightRuin
        leftNote="0 € = échec"
      />,
    )
    const container = screen.getByText(/médiane/i).closest("div")
    expect(container).not.toBeNull()
    // La légende contient les deux repères pédagogiques
    expect(screen.getByText(/médiane/i)).toBeInTheDocument()
    expect(screen.getByText(/moyenne/i)).toBeInTheDocument()
    expect(screen.getByText(/0 € = échec/i)).toBeInTheDocument()
  })

  it("TerminalHistogram gère un histogramme vide sans planter", () => {
    const { container } = render(<TerminalHistogram bins={[]} mean={0} median={0} format={v => `${v} €`} />)
    expect(container.firstChild).toBeNull()
  })
})

describe("fiabilité v5.5.0 — RenteRetraiteTab : options, CI et stress tests", () => {
  const lastRow = runSimulation({ ...DEFAULT_INPUTS, duration: 25 })[
    runSimulation({ ...DEFAULT_INPUTS, duration: 25 }).length - 1
  ]
  const baseProps = {
    inputs: {
      ...DEFAULT_INPUTS,
      withdrawalModel: "rule-4" as const,
      withdrawalInflation: true,
      retirementYears: 20,
    },
    lastRow,
    darkMode: false,
    decumResult: null,
    updateInput: vi.fn(),
    updateInputs: vi.fn(),
    runDecum: vi.fn(),
  }

  it("les 4 options de fiabilité sont COCHÉES par défaut", () => {
    render(<RenteRetraiteTab {...baseProps} />)
    expect(screen.getByRole("switch", { name: /incertitude des paramètres/i })).toBeChecked()
    expect(screen.getByRole("switch", { name: /historique étendu/i })).toBeChecked()
    expect(screen.getByRole("switch", { name: /inflation stochastique/i })).toBeChecked()
    expect(screen.getByRole("switch", { name: /garde-fous dynamiques/i })).toBeChecked()
  })

  it("les 3 stress tests historiques sont rendus quand on déplie la section (v5.6.0)", () => {
    render(<RenteRetraiteTab {...baseProps} />)
    // Les stress tests ne s'imposent plus à chaque visite : la section est
    // repliée par défaut — le titre est visible, mais pas les cartes.
    expect(screen.getByRole("button", { name: /et si vous partiez en pleine crise/i })).toBeInTheDocument()
    expect(screen.queryByText(/choc pétrolier 1973-74/i)).not.toBeInTheDocument()
    // On déplie → les 3 scénarios et leurs verdicts apparaissent.
    fireEvent.click(screen.getByRole("button", { name: /et si vous partiez en pleine crise/i }))
    expect(screen.getByText(/choc pétrolier 1973-74/i)).toBeInTheDocument()
    expect(screen.getByText(/bulle internet 2000-03/i)).toBeInTheDocument()
    expect(screen.getByText(/crise financière 2008/i)).toBeInTheDocument()
    // Chaque carte affiche un verdict Survit / Épuisé
    expect(screen.getAllByText(/survit|épuisé/i).length).toBe(3)
  })

  it("« Partir en période difficile » : OFF par défaut, le clic demande l'activation", () => {
    render(<RenteRetraiteTab {...baseProps} />)
    const toggle = screen.getByRole("switch", { name: /partir en période difficile/i })
    expect(toggle).not.toBeChecked()
    // Les curseurs de krach n'existent pas tant que l'option est éteinte
    expect(screen.queryByRole("slider", { name: "Intensité du krach en pourcentage" })).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(baseProps.updateInput).toHaveBeenCalledWith("crisisScenario", true)
  })

  it("« Partir en période difficile » : activé → curseurs année et intensité visibles", () => {
    render(<RenteRetraiteTab {...baseProps} inputs={{ ...baseProps.inputs, crisisScenario: true }} />)
    // Valeurs par défaut : le krach frappe après 1 an, à −30 %
    expect(screen.getByRole("slider", { name: "Années avant le krach" })).toHaveValue("1")
    expect(screen.getByRole("slider", { name: "Intensité du krach en pourcentage" })).toHaveValue("30")
  })

  it("un résultat de décaissement affiche l'intervalle de confiance du taux de survie", () => {
    const decum = runDecumulation(baseProps.inputs, 1_000_000, 150)
    render(<RenteRetraiteTab {...baseProps} decumResult={decum} />)
    // La note pédagogique sur la précision du taux de survie est affichée
    expect(screen.getByText(/intervalle de confiance à 95 %/i)).toBeInTheDocument()
    // L'histogramme des capitaux finaux est présent
    expect(screen.getByText(/distribution des capitaux finaux/i)).toBeInTheDocument()
  })
})

describe("audit v5.6.3 — SmartInput : retour visible sur saisie invalide ou hors bornes", () => {
  it("rejette une valeur négative avec un message (plus de reset silencieux)", () => {
    const onChange = vi.fn()
    render(<SmartInput value={1000} onChange={onChange} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "-500" } })
    fireEvent.blur(input)
    // La valeur négative n'est PAS appliquée…
    expect(onChange).not.toHaveBeenCalled()
    // …et l'utilisateur voit pourquoi.
    expect(screen.getByRole("alert")).toHaveTextContent(/valeur négative/i)
  })

  it("clamp une valeur hors borne haute avec un message explicite (plus de divergence silencieuse)", () => {
    const onChange = vi.fn()
    render(<SmartInput value={1000} onChange={onChange} max={100_000_000} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "999 999 999" } })
    fireEvent.blur(input)
    // La valeur calculée est la borne, pas la saisie…
    expect(onChange).toHaveBeenCalledWith(100_000_000)
    // …le message l'explique.
    expect(screen.getByRole("alert")).toHaveTextContent(/limité au maximum/i)
  })

  it("laisse passer une saisie valide sans message", () => {
    const onChange = vi.fn()
    render(<SmartInput value={1000} onChange={onChange} max={100_000_000} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "25000" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(25000)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("audit v5.6.3 — GoalTab : le taux courant du curseur est une ligne du tableau", () => {
  it("la carte principale et la ligne « 10,07 % » du tableau affichent le MÊME montant", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    const { container } = render(
      <GoalTab inputs={DEFAULT_INPUTS} rows={rows} darkMode={false} updateInput={() => {}} />,
    )
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    // La ligne du taux courant (10,07 %) existe dans le tableau…
    expect(text).toContain("10,07%")
    // …et son épargne mensuelle est exactement celle de la carte principale.
    const expected = solveGoal(DEFAULT_INPUTS).pmtPerMonth
    const amount = fmtCurrency(expected ?? 0).replace(/[\u202F\u00A0]/g, " ")
    const occurrences = text.split(amount).length - 1
    expect(occurrences).toBeGreaterThanOrEqual(2)
  })
})

describe("audit v5.6.3 — CashflowCalendar : capital initial réconcilié avec « Total épargné »", () => {
  it("ajoute la ligne « Départ » et totalise les versements = investedNom final", () => {
    const rows = runSimulation({ ...DEFAULT_INPUTS, capitalInitial: 10_000, monthlyPayment: 500, duration: 25 })
    render(<CashflowCalendar rows={rows} showReal={false} />)
    // Déplie le calendrier
    fireEvent.click(screen.getByRole("button", { name: /calendrier des flux/i }))
    // La ligne « Capital initial » est présente (getAllByText : le matcher
    // remonte aussi aux ancêtres <tr>/<table> qui contiennent le texte)
    expect(screen.getAllByText("Capital initial").length).toBeGreaterThan(0)
    // Le total des versements affiché = investedNom final (comme la carte)
    const last = rows[rows.length - 1]
    expect(screen.getByText(fmtCompact(last.investedNom))).toBeInTheDocument()
  })
})

describe("v5.6.4 — SectionHeader : anatomie de titre uniforme sur tout le site", () => {
  it("rend le titre en en-tête avec barre dorée + icône + sous-titre + élément droit", () => {
    const { container } = render(
      <SectionHeader
        title="Vos impôts"
        icon={Shield}
        level="card"
        as="h3"
        sub="Compte-titres ordinaire"
        trailing={<span>€ d'aujourd'hui</span>}
      />,
    )
    const heading = screen.getByRole("heading", { name: /vos impôts/i })
    expect(heading.tagName).toBe("H3")
    // La barre dorée décorative est masquée des lecteurs d'écran
    expect(container.querySelector("[aria-hidden]")).not.toBeNull()
    expect(screen.getByText("Compte-titres ordinaire")).toBeInTheDocument()
    expect(screen.getByText("€ d'aujourd'hui")).toBeInTheDocument()
  })

  it("level=\"label\" rend un mini-titre via children (Modèle de retrait / Paramètres)", () => {
    render(<SectionHeader level="label">Modèle de retrait</SectionHeader>)
    expect(screen.getByText("Modèle de retrait")).toBeInTheDocument()
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("mode bare : aucun <div>/<p> (valide dans un <button>) — revue adverse v5.6.4", () => {
    const { container } = render(
      <SectionHeader bare level="card" icon={Shield} title="Calendrier des flux" />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.tagName).toBe("SPAN")
    expect(root.querySelector("div, p")).toBeNull()
    expect(screen.getByText("Calendrier des flux")).toBeInTheDocument()
  })
})

describe("v5.6.4 — FiscalPanel : titre proportionné à « Statistiques clés »", () => {
  it("affiche « Vos impôts » en TITRE et l'enveloppe en sous-titre (plus de tiret dans le titre)", () => {
    const inputs = { ...DEFAULT_INPUTS, envelope: "cto" as const, duration: 10 }
    const rows = runSimulation(inputs)
    render(<FiscalPanel rows={rows} inputs={inputs} />)
    const title = screen.getByRole("heading", { name: /vos impôts/i })
    // Le titre est court et lisible (même anatomie que « Statistiques clés »)
    expect(title.textContent).toBe("Vos impôts")
    // L'enveloppe n'est plus collée au titre par un tiret : sous-titre séparé
    expect(screen.getByText("Compte-titres ordinaire")).toBeInTheDocument()
    expect(screen.queryByText(/Vos impôts —/)).not.toBeInTheDocument()
  })

  it("le sous-titre suit l'enveloppe choisie (PEA → Plan d'épargne en actions)", () => {
    const inputs = { ...DEFAULT_INPUTS, envelope: "pea" as const, duration: 10 }
    const rows = runSimulation(inputs)
    render(<FiscalPanel rows={rows} inputs={inputs} />)
    expect(screen.getByText("Plan d'épargne en actions")).toBeInTheDocument()
  })
})

describe("régression — stderr propre pendant les tests (audit v5.4.0)", () => {
  it("un rendu complet d'App ne déclenche ni console.error ni console.warn", () => {
    // Les mocks framer-motion/Recharts rendent désormais les vraies balises :
    // un rendu d'App entier doit être totalement silencieux (plus de
    // « <linearGradient> is unrecognized », « <td> cannot be a child of
    // <div> »…). Garde-fou contre toute régression future.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    render(<App />)

    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
