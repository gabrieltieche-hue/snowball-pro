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
import { SliderInput } from "../components/shared/SliderInput"
import { DEFAULT_INPUTS, runSimulation } from "../engine"
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
  const text = (container: HTMLElement) =>
    (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")

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

  it("Sidebar (Option A) : la note MSCI World remplace le curseur de rendement", () => {
    const { container } = render(<App />)
    // Plus de « taux saisi » : le Simulateur, Monte Carlo et la Rente rejouent
    // TOUJOURS l'historique réel — la note MSCI World est affichée à la place
    // du curseur de rendement supprimé. Le texte est fragmenté par des
    // <strong> : on compare le texte complet du container.
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    expect(text).toContain("MSCI World — historique réel")
    expect(text).toContain("Moyenne de la série")
    expect(text).toContain("net d'inflation")
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
