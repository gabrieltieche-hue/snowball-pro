// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import App from "../App"
import { ErrorBoundary } from "../components/shared/ErrorBoundary"
import { encodeInputsForUrl, decodeInputsFromUrl } from "../utils/urlState"
import { DEFAULT_INPUTS } from "../engine"

/* Les graphes Recharts sont volontairement remplacés par des stubs : ils
 * nécessitent des mesures de conteneur (ResizeObserver) absentes de jsdom.
 * On rend juste un div, les flux logiques restent entièrement testés. */
vi.mock("recharts", async () => {
  const React = await import("react")
  const stub = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "chart-stub" }, children)
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

/* framer-motion n'apporte rien de testable en jsdom : motion.xxx devient un
 * simple div, AnimatePresence passe les enfants tels quels.
 *
 * IMPORTANT : le Proxy retourne une fonction STABLE pour chaque propriété.
 * Un getter créant une nouvelle fonction par accès ferait croire à React que
 * le type d'élément change à chaque rendu → remontage du sous-arbre entier à
 * chaque render (tempête de remounts, tests 10× plus lents, timeouts flaky). */
vi.mock("framer-motion", async () => {
  const React = await import("react")
  // Les props spécifiques à framer-motion (initial/animate/whileTap…) seraient
  // passées telles quelles à un <div> brut → warnings React dans la sortie de
  // test. On les destructure pour ne garder que les props DOM réelles.
  const Stub = ({
    children,
    initial: _i,
    animate: _a,
    exit: _e,
    whileHover: _wh,
    whileTap: _wt,
    whileInView: _wv,
    transition: _t,
    variants: _v,
    ...rest
  }: Record<string, unknown>) => React.createElement("div", rest, children as React.ReactNode)
  const motion = new Proxy({}, { get: () => Stub })
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

      await user.click(screen.getByTitle("Supprimer ce snapshot"))
      await waitFor(() => expect(screen.queryByText(/^Snapshot /)).not.toBeInTheDocument())
      expect(screen.getByText(/aucun état sauvegardé/i)).toBeInTheDocument()
    },
    APP_TIMEOUT,
  )
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
      fireEvent.click(screen.getByRole("button", { name: /export csv/i }))

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
