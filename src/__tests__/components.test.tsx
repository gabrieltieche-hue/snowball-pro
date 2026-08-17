// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import App from "../App"
import { AuthScreen } from "../components/Auth/AuthScreen"
import { HeroChart } from "../components/Landing/HeroChart"
import { LandingPage } from "../components/Landing/LandingPage"
import { ACCOUNTS_KEY, browserStorage, logout, register } from "../auth/auth"
import { getCachedSession, resetSessionStoreForTests, syncSession } from "../auth/store"
import { ErrorBoundary } from "../components/shared/ErrorBoundary"
import { buildEquitySeries } from "../components/Charts/EquityChart"
import { DualAmount } from "../components/shared/DualAmount"
import { GoalTab } from "../components/Tabs/GoalTab"
import { MonteCarloPanel } from "../components/Tabs/MonteCarloPanel"
import { RenteRetraiteTab } from "../components/Tabs/RenteRetraiteTab"
import { TerminalHistogram } from "../components/Simulation/TerminalHistogram"
import { CashflowCalendar } from "../components/Simulation/CashflowCalendar"
import { FiscalPanel } from "../components/Simulation/FiscalPanel"
import { SummaryStats } from "../components/Simulation/SummaryStats"
import { SliderInput } from "../components/shared/SliderInput"
import { SmartInput } from "../components/shared/SmartInput"
import { SectionHeader } from "../components/shared/SectionHeader"
import { KpiGrid } from "../components/Simulation/KpiGrid"
import { AIInsightCard } from "../components/Simulation/AIInsightCard"
import { Shield } from "lucide-react"
import {
  DEFAULT_INPUTS,
  computeKPIs,
  createSnapshot,
  fmtCompact,
  fmtCurrency,
  getHistoricalDataset,
  parseStoredInputs,
  runSimulation,
  runDecumulation,
  buildTerminalHistogram,
  solveGoal,
} from "../engine"
import { encodeInputsForUrl, decodeInputsFromUrl } from "../utils/urlState"
import { LangProvider, useLang } from "../i18n"
import { LanguageToggle } from "../components/shared/LanguageToggle"

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
  // v6.1 : la session est un cache module-level (useSyncExternalStore) — il
  // faut l'invalider entre les tests pour ne pas hériter d'une session.
  resetSessionStoreForTests()
  // v7 : par défaut, les tests App considèrent le tutoriel terminé et la
  // sidebar DÉPLIÉE (les réglages restent le chemin principal des tests
  // existants) — les tests d'onboarding retirent ces clés explicitement.
  localStorage.setItem("snowball_v5_tutorial_done", "1")
  localStorage.setItem("snowball_v62_sidebar_collapsed", "0")
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
      // « Comparer » vit désormais dans le menu « ⋯ » du header (audit).
      const openMore = () => fireEvent.click(screen.getByRole("button", { name: "Autres actions" }))

      openMore()
      fireEvent.click(screen.getByRole("menuitem", { name: /comparer deux scénarios/i }))
      expect(screen.getByText("Mode Comparaison actif")).toBeInTheDocument()
      // Le panneau édite désormais le scénario B : le badge Sidebar ET le
      // libellé de la barre de comparaison l'affichent → getAllByText.
      expect(screen.getAllByText(/Scénario B/).length).toBeGreaterThan(0)

      const slider = screen.getByRole("slider", { name: "Durée (années)" })
      fireEvent.change(slider, { target: { value: "30" } })
      expect(slider).toHaveValue("30")

      openMore()
      fireEvent.click(screen.getByRole("menuitem", { name: /quitter la comparaison/i }))
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

  it("peut masquer le libellé de la seconde échelle (panneau à légende partagée v6.9.0)", () => {
    const { container } = render(<DualAmount nominal={46610} real={30700} showReal={false} hideSecondaryLabel />)
    const t = text(container)
    // Les DEUX valeurs restent affichées…
    expect(t).toContain("46 610 €")
    expect(t).toContain("30 700 €")
    // …mais le libellé d'échelle vit désormais dans la légende du panneau.
    expect(t).not.toContain("en euros d'aujourd'hui")
  })

  it("peut afficher le libellé du grand chiffre en ligne (échelles libellées)", () => {
    const { container } = render(
      <DualAmount nominal={46610} real={30700} showReal={false} endYear="2046" primaryLabelInline size="lg" />,
    )
    const t = text(container)
    // Chaque valeur porte SON libellé d'échelle, sans légende partagée :
    expect(t).toContain("46 610 € sur le compte en 2046")
    expect(t).toContain("30 700 € en euros d'aujourd'hui")
  })

  it("applique un préfixe (signe « + ») aux deux échelles", () => {
    const { container } = render(
      <DualAmount nominal={504648} real={333022} showReal={false} hideSecondaryLabel prefix="+" />,
    )
    const t = text(container)
    expect(t).toContain("+504 648 €")
    expect(t).toContain("+333 022 €")
  })
})

describe("SummaryStats — panneau « Votre capital en détail » (v6.9.0, échelles libellées)", () => {
  const text = (container: HTMLElement) => (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")

  it("intègre le bloc de synthèse : titre, gains en or, échelles libellées sur chaque valeur", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    const { container } = render(<SummaryStats rows={rows} inputs={DEFAULT_INPUTS} />)
    const t = text(container)
    // Le bloc porte l'anatomie de la page (titre SectionHeader)…
    expect(screen.getByText("Votre capital en détail")).toBeInTheDocument()
    // …la statistique « Gains de la bourse » reste présente (demande explicite)…
    expect(t).toContain("Gains de la bourse")
    expect(t).toContain("+")
    // Retour utilisateur : la légende d'en-tête n'était « pas
    // appliquée » — chaque valeur porte désormais SON libellé d'échelle
    // (≥ 1 par colonne, pas une légende partagée unique).
    const accountLabels = t.match(/sur le compte en \d{4}/g) ?? []
    const todayLabels = t.match(/en euros d'aujourd'hui/g) ?? []
    expect(accountLabels.length).toBeGreaterThanOrEqual(4)
    expect(todayLabels.length).toBeGreaterThanOrEqual(4)
    // Les 4 mesures de la synthèse sont toutes là.
    expect(t).toContain("Valeur brute")
    expect(t).toContain("Net fiscal")
    expect(t).toContain("Impôt théorique")
    expect(t).toContain("Total épargné")
  })
})

describe("rendement BRUT — clarté sur tous les onglets (demande TRUC 1/2/4)", () => {
  it("GoalTab : label « (% brut) » + note taux recommandé 7-12 %/an · défaut aligné scénario Central 8,22 %", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    const { container } = render(
      <GoalTab inputs={DEFAULT_INPUTS} rows={rows} darkMode={false} updateInput={() => {}} />,
    )
    // toLocaleString(« fr-FR ») insère des espaces insécables (U+202F) : on
    // normalise avant de comparer.
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    expect(screen.getByText("Rendement de la bourse (% brut)")).toBeInTheDocument()
    expect(text).toContain("référence")
    expect(text).toContain("8,22 % brut (scénario Central)")
    expect(text).toContain("taux recommandé")
    // Le curseur Objectif démarre sur le défaut du scénario Central (valeur en
    // %) — 0,0822 × 100 = 8,2199… en virgule flottante : on compare en nombre.
    const slider = screen.getByRole("slider", { name: "Rendement de la bourse (% brut)" }) as HTMLInputElement
    expect(parseFloat(slider.value)).toBeCloseTo(8.22, 2)
  })

  it("Sidebar (v6) : l'échelle pédagogique des rendements vit dans « Pourquoi ces chiffres ? », repliée par défaut", () => {
    // La formule de Fisher est une notion technique : mode Avancé pour
    // vérifier le contenu intégral (audit — masquée en Débutant).
    localStorage.setItem("snowball_v5_ui_mode", "avance")
    const { container } = render(<App />)
    // v6 : le contenu pédagogique (rendement moyen MSCI World + échelle
    // 10,07 → 8,22 → 5,99 + Fisher) a quitté le chemin de réglages pour un
    // panneau replié par défaut. Repliée → le contenu n'est pas dans le DOM.
    expect(screen.getByRole("button", { name: /pourquoi ces chiffres/i })).toBeInTheDocument()
    expect(container.textContent).not.toContain("Rendement de la bourse (MSCI World)")

    // On déplie → le contenu INTÉGRAL est là (demande : on déplace, on ne
    // jette rien). Le texte est fragmenté par des <strong> : on compare le
    // texte complet du container.
    fireEvent.click(screen.getByRole("button", { name: /pourquoi ces chiffres/i }))
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
    // L'hypothèse d'inflation est explicitée : 2,1 %/an (cible BCE), vs 4,0 %
    // de moyenne réelle 1970-2025 — et la médiane de la période est 2,1 %.
    expect(text).toContain("cible BCE")
    expect(text).toContain("médiane de la période")
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

  it("App : le toggle « Euros d'aujourd'hui » est DÉCOCHÉ par défaut (valeur sur le compte en avant)", () => {
    render(<App />)
    // Demande utilisateur : l'option « Euros d'aujourd'hui » n'est pas cochée
    // par défaut — le chiffre principal est ce qui sera sur le compte. Le
    // pouvoir d'achat reste affiché partout via la double échelle. Le toggle
    // vit dans « Paramètres avancés », replié par défaut (audit).
    fireEvent.click(screen.getByRole("button", { name: /paramètres avancés/i }))
    const toggle = screen.getByRole("switch", { name: /euros d'aujourd'hui/i })
    expect(toggle).not.toBeChecked()
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

describe("scénario de rendement — déplacé dans les réglages « Votre épargne » (v6.4.1)", () => {
  it(
    "le sélecteur vit dans la sidebar et change le résultat de la projection",
    () => {
      render(<App />)
      // Le sélecteur a quitté le haut de l'onglet Projection : il vit dans la
      // section « Votre épargne » de la sidebar (ouverte par défaut).
      expect(screen.getByText("Scénario de rendement")).toBeInTheDocument()

      const hero = screen.getByLabelText("Résultat principal de la projection")
      // Le bandeau « médiane historique » est fragmenté par des <strong> (même
      // technique que le test « Pourquoi ces chiffres ? ») : on compare le
      // texte complet de la sidebar plutôt que queryByText.
      const sidebarText = () => (document.querySelector("aside")?.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
      // Défaut : Central → le bandeau « médiane historique » est visible.
      expect(sidebarText()).toContain("médiane historique")
      const before = hero.textContent

      // Changer de scénario depuis les réglages → la projection change. Le
      // groupe est un radiogroup (même pattern ARIA que « Tolérance au
      // risque ») : on cible les radios, pas les boutons.
      fireEvent.click(screen.getByRole("radio", { name: /^Optimiste/ }))
      expect(hero.textContent).not.toBe(before)
      // Le bandeau « médiane historique » ne concerne que le scénario central.
      expect(sidebarText()).not.toContain("médiane historique")

      // Retour au Central → le bandeau réapparaît et le résultat revient.
      fireEvent.click(screen.getByRole("radio", { name: /^Central/ }))
      expect(sidebarText()).toContain("médiane historique")
      expect(hero.textContent).toBe(before)
    },
    APP_TIMEOUT,
  )
})

describe("Sidebar repliée — rail d'icônes style ChatGPT (v6.2)", () => {
  it(
    "replier → rail d'icônes ; clic sur une icône → déplie ET ouvre la section ciblée",
    () => {
      render(<App />)
      // Dépliée par défaut : les réglages sont là, le bouton « Replier » aussi.
      expect(screen.getByRole("slider", { name: "Capital de départ (€)" })).toBeInTheDocument()

      // Repli → le panneau devient un rail d'icônes (une par catégorie), le
      // contenu disparaît, l'état persiste en localStorage.
      fireEvent.click(screen.getByRole("button", { name: "Replier les réglages avancés" }))
      expect(screen.getByRole("button", { name: "Votre épargne" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Votre profil" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Sauvegarder un snapshot" })).toBeInTheDocument()
      expect(screen.queryByRole("slider", { name: "Capital de départ (€)" })).not.toBeInTheDocument()
      expect(localStorage.getItem("snowball_v62_sidebar_collapsed")).toBe("1")

      // Clic sur l'icône « Votre profil » → la sidebar se déplie ET la section
      // ciblée est ouverte (son curseur est présent), comme une navigation.
      fireEvent.click(screen.getByRole("button", { name: "Votre profil" }))
      expect(screen.getByRole("slider", { name: "Âge actuel" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Replier les réglages avancés" })).toBeInTheDocument()
      // « Votre épargne » restait ouverte (l'état des sections est préservé).
      expect(screen.getByRole("slider", { name: "Capital de départ (€)" })).toBeInTheDocument()
    },
    APP_TIMEOUT,
  )
})

describe("P0-2 — libellé PER : pas d'abattement de 10 % inventé (audit v6)", () => {
  it(
    "le suffixe TMI en PER explique la sortie réelle (TMI pleine sans abattement, gains au PFU)",
    () => {
      render(<App />)
      // Le sélecteur de compte vit dans « Compte d'investissement », repliée
      // par défaut (audit) — on déplie puis on sélectionne PER / PERIN.
      fireEvent.click(screen.getByRole("button", { name: /compte d'investissement/i }))
      fireEvent.click(screen.getByRole("button", { name: /PER \/ PERIN/i }))
      // Le curseur TMI apparaît pour le PER.
      expect(screen.getByRole("slider", { name: "Tranche marginale d'imposition (%)" })).toBeInTheDocument()
      // L'ancien libellé « sortie taxée à TMI − 10 % » affirmait un abattement
      // que le moteur (taxes.ts) n'applique JAMAIS sur les versements PER.
      expect(screen.queryByText(/sortie taxée à TMI/i)).not.toBeInTheDocument()
      // Le nouveau suffixe dit la vérité : versements imposés à la TMI pleine,
      // sans abattement de 10 %, gains au PFU (même doctrine que le FiscalPanel).
      expect(screen.getByText(/versements imposés à votre TMI/i)).toBeInTheDocument()
      expect(screen.getByText(/gains au PFU/i)).toBeInTheDocument()
    },
    APP_TIMEOUT,
  )
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

describe("rapport patrimonial PDF (PISTES V6.1 — idée 2)", () => {
  it("n'est pas monté tant que l'utilisateur n'a pas cliqué « Rapport PDF »", () => {
    render(<App />)
    // Le rapport hors-écran ne pollue ni le DOM ni l'accessibilité avant usage.
    expect(document.querySelector(".report-print-only")).toBeNull()
    expect(screen.queryByText("Rapport patrimonial de synthèse")).not.toBeInTheDocument()
  })

  it("monte le rapport imprimable au clic et appelle window.print", async () => {
    const printSpy = vi.fn()
    Object.defineProperty(window, "print", { value: printSpy, configurable: true, writable: true })
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: /exporter/i }))
    fireEvent.click(screen.getByRole("menuitem", { name: /rapport pdf/i }))

    // Le rapport doit être rendu avant d'ouvrir le dialogue d'impression.
    await waitFor(() => expect(printSpy).toHaveBeenCalled())
    const report = document.querySelector(".report-print-only")
    expect(report).not.toBeNull()
    const text = (report?.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")

    // Couverture + héro + synthèse + graphique + fiscalité + tableau + méthodo.
    expect(text).toContain("Rapport patrimonial de synthèse")
    expect(text).toContain("Paramètres de la simulation")
    expect(text).toContain("Rendement net / an (XIRR)")
    expect(text).toContain("Projection de votre capital")
    expect(text).toContain("Gains après impôts")
    expect(text).toContain("Détail année par année")
    expect(text).toContain("Méthodologie")

    // Le shell de l'app porte la classe masquée à l'impression (.app-shell).
    expect(document.querySelector(".app-shell")).toBeInTheDocument()
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
  // v6 : le panneau « Fiabilité du modèle » est REPLIÉ par défaut — les
  // options restent cochées (défauts moteur), mais il faut déplier la section
  // pour les voir et les basculer (demande utilisateur).
  const openReliability = () => fireEvent.click(screen.getByRole("button", { name: /fiabilité du modèle/i }))

  it("mode Débutant (défaut) : la section « Fiabilité du modèle » est masquée (audit)", () => {
    render(<MonteCarloPanel inputs={DEFAULT_INPUTS} darkMode={false} updateInput={() => {}} />)
    expect(screen.queryByRole("button", { name: /fiabilité du modèle/i })).not.toBeInTheDocument()
  })

  it("mode Avancé : le panneau « Fiabilité du modèle » est replié par défaut (v6)", () => {
    render(<MonteCarloPanel inputs={DEFAULT_INPUTS} darkMode={false} updateInput={() => {}} uiMode="avance" />)
    // Le titre est visible, mais pas les options tant qu'on ne déplie pas.
    expect(screen.getByRole("button", { name: /fiabilité du modèle/i })).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("switch", { name: /incertitude des paramètres/i })).not.toBeInTheDocument()
  })

  it("les 2 options de fiabilité sont COCHÉES par défaut (incertitude + historique étendu)", () => {
    const updateInput = vi.fn()
    render(
      <MonteCarloPanel
        inputs={{ ...DEFAULT_INPUTS, parameterUncertainty: true, extendedHistory: true }}
        darkMode={false}
        updateInput={updateInput}
        uiMode="avance"
      />,
    )
    openReliability()
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
        uiMode="avance"
      />,
    )
    openReliability()
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

  it("mode Débutant (défaut) : « Fiabilité & sûreté » est masquée (audit)", () => {
    render(<RenteRetraiteTab {...baseProps} />)
    expect(screen.queryByRole("button", { name: /fiabilité & sûreté des estimations/i })).not.toBeInTheDocument()
  })

  it("mode Avancé : la section « Fiabilité & sûreté des estimations » est repliée par défaut (v6)", () => {
    render(<RenteRetraiteTab {...baseProps} uiMode="avance" />)
    // v6 (comme Monte Carlo) : le titre est visible, mais pas les options
    // tant qu'on ne déplie pas — les 4 restent actives par défaut au moteur.
    expect(screen.getByRole("button", { name: /fiabilité & sûreté des estimations/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
    expect(screen.queryByRole("switch", { name: /incertitude des paramètres/i })).not.toBeInTheDocument()
  })

  it("les 4 options de fiabilité sont COCHÉES par défaut", () => {
    render(<RenteRetraiteTab {...baseProps} uiMode="avance" />)
    // Le panneau est replié par défaut : on le déplie pour inspecter les toggles.
    fireEvent.click(screen.getByRole("button", { name: /fiabilité & sûreté des estimations/i }))
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
  it("la carte principale et la ligne « 8,22 % » du tableau affichent le MÊME montant", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    const { container } = render(
      <GoalTab inputs={DEFAULT_INPUTS} rows={rows} darkMode={false} updateInput={() => {}} />,
    )
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    // La ligne du taux courant (8,22 %, scénario Central par défaut) existe
    // dans le tableau…
    expect(text).toContain("8,22%")
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

describe("audit v6.5 — GoalTab : synchronisation et lignes dédupliquées", () => {
  it("mode synchronisé : les cartes citent la durée du scénario principal, pas goalDuration", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      goalSync: true,
      goalDuration: 15,
      duration: 25,
    }
    const rows = runSimulation(inputs)
    const { container } = render(<GoalTab inputs={inputs} rows={rows} darkMode={false} updateInput={() => {}} />)
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    // Le calcul (et donc le texte) utilise 25 ans (scénario principal), pas 15.
    expect(text).toContain("en 25 ans")
    expect(text).not.toContain("en 15 ans")
  })

  it("une seule ligne « 8,22 % ← » dans la comparaison (plus de doublon Central)", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    render(<GoalTab inputs={DEFAULT_INPUTS} rows={rows} darkMode={false} updateInput={() => {}} />)
    // Avant le correctif, le taux courant (10,07) et la moyenne arithmétique
    // (10,0655) produisaient DEUX lignes « 10,07 % ← Optimiste » avec des
    // montants différents. Aujourd'hui le même piège existe entre le taux
    // courant (8,22, scénario Central par défaut) et le rendement composé
    // (8,2196) — la déduplication n'en laisse qu'une.
    expect(screen.getAllByText(/←/).length).toBe(1)
    expect(screen.getAllByText(/8,22% ←/).length).toBe(1)
  })
})

describe("audit v6.5 — CashflowCalendar : total des impôts non cumulable", () => {
  it("le pied de tableau affiche « — » pour les impôts (somme sans sens, pas un total trompeur)", () => {
    const rows = runSimulation(DEFAULT_INPUTS)
    render(<CashflowCalendar rows={rows} showReal={false} />)
    fireEvent.click(screen.getByRole("button", { name: /calendrier des flux/i }))
    expect(screen.getByTitle(/impôts non cumulables/i)).toHaveTextContent("—")
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

  it('level="label" rend un mini-titre via children (Modèle de retrait / Paramètres)', () => {
    render(<SectionHeader level="label">Modèle de retrait</SectionHeader>)
    expect(screen.getByText("Modèle de retrait")).toBeInTheDocument()
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("mode bare : aucun <div>/<p> (valide dans un <button>) — revue adverse v5.6.4", () => {
    const { container } = render(<SectionHeader bare level="card" icon={Shield} title="Calendrier des flux" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.tagName).toBe("SPAN")
    expect(root.querySelector("div, p")).toBeNull()
    expect(screen.getByText("Calendrier des flux")).toBeInTheDocument()
  })
})

describe("v5.6.4 — FiscalPanel : titre proportionné à « Statistiques clés »", () => {
  it("affiche « Votre impôt théorique (si vente totale) » en TITRE et l'enveloppe en sous-titre (plus de tiret dans le titre)", () => {
    const inputs = { ...DEFAULT_INPUTS, envelope: "cto" as const, duration: 10 }
    const rows = runSimulation(inputs)
    render(<FiscalPanel rows={rows} inputs={inputs} />)
    const title = screen.getByRole("heading", { name: /impôt/i })
    // Le titre est court et lisible (même anatomie que « Statistiques clés »)
    expect(title.textContent).toBe("Votre impôt théorique (si vente totale)")
    // L'enveloppe n'est plus collée au titre par un tiret : sous-titre séparé
    expect(screen.getByText("Compte-titres ordinaire")).toBeInTheDocument()
    expect(screen.queryByText(/Votre impôt théorique —/)).not.toBeInTheDocument()
  })

  it("le sous-titre suit l'enveloppe choisie (PEA → Plan d'épargne en actions)", () => {
    const inputs = { ...DEFAULT_INPUTS, envelope: "pea" as const, duration: 10 }
    const rows = runSimulation(inputs)
    render(<FiscalPanel rows={rows} inputs={inputs} />)
    expect(screen.getByText("Plan d'épargne en actions")).toBeInTheDocument()
  })
})

describe("v6.1 — landing page", () => {
  it("rend le héro (CTA, démo réelle du moteur) et les sections", () => {
    render(<LandingPage />)
    // CTA principal orienté bénéfice (header + héro + appel final → getAllByRole)
    expect(screen.getAllByRole("button", { name: /calculer mon nombre magique/i }).length).toBeGreaterThan(0)
    // CTA secondaire du héro : « Voir la méthode » (ancre vers la section Méthodologie)
    expect(screen.getByRole("link", { name: /voir la méthode/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument()
    // Coupe typographique en 2 lignes (spans block) : le nom accessible vient de l'aria-label.
    expect(screen.getByRole("heading", { name: /combien peut valoir votre épargne dans 25 ans/i })).toBeInTheDocument()
    expect(screen.getByText(/votre nombre magique, c'est le capital final/i)).toBeInTheDocument()
    // La démo du héro exécute le vrai moteur (aria-label du graphique SVG)
    expect(screen.getByRole("img")).toBeInTheDocument()
    // Sections fonctionnalités + méthodologie + FAQ
    expect(screen.getByText("Quatre onglets, une question : où va votre argent ?")).toBeInTheDocument()
    expect(screen.getByText("Pourquoi 10,07 % → 5,99 % ?")).toBeInTheDocument()
    // La méthodologie précise que 2,1 % est une hypothèse d'inflation future (cible BCE),
    // pas la moyenne réelle 1970-2025 (4,0 %) — la médiane tombe justement sur 2,1 %.
    expect(screen.getByText("2,1 %/an (cible BCE)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /mes données sont-elles envoyées/i })).toBeInTheDocument()
  })

  it("bande « attaque du cluster taux fixe » : oppose le rendement fixe supposé à l'historique réel, sans citer de taux", () => {
    render(<LandingPage />)
    // La bande (region nommée par son aria-label) oppose le rendement fixe des
    // simulateurs SEO à l'historique réel rejoué — vérifié DANS la bande.
    const band = screen.getByRole("region", {
      name: /les autres simulateurs supposent un rendement fixe.*nous, on rejoue 100 ans/i,
    })
    expect(within(band).getByText(/les autres simulateurs supposent un rendement fixe/i)).toBeInTheDocument()
    expect(within(band).getByText(/nous, on rejoue 100 ans de vraie histoire, krachs inclus/i)).toBeInTheDocument()
    // Aucun « 5 % par an » n'est cité dans la bande (décision : pas de taux en dur).
    expect(within(band).queryByText(/5 % par an/i)).not.toBeInTheDocument()
  })

  it("comparaison : le tableau honnête cite les vrais concurrents et maillent les pages /alternatives/", () => {
    render(<LandingPage />)
    // Correspondance EXACTE : la carte « Dernières éditions » v6.18.0 s'appelle
    // « Le tableau honnête + l'objectif inversé » — le regex large matcherait 2 headings.
    expect(screen.getByRole("heading", { name: "Le tableau honnête" })).toBeInTheDocument()
    // Les 3 colonnes concurrentes (Snowball Pro est la première colonne).
    expect(screen.getByText("ProjectionLab")).toBeInTheDocument()
    expect(screen.getByText("Finary")).toBeInTheDocument()
    expect(screen.getByText("Simulateurs SEO FR")).toBeInTheDocument()
    // Critères de différenciation : fiscalité FR, historique réel, Monte Carlo.
    expect(screen.getByText("Fiscalité française (PEA, AV, PER)")).toBeInTheDocument()
    expect(screen.getByText("Monte Carlo — l'incertitude")).toBeInTheDocument()
    expect(screen.getByText("Décumulation (retraite)")).toBeInTheDocument()
    // Maillage interne vers les 4 comparatifs détaillés (dans la section — le
    // pied de page répète aussi ces liens).
    const compare = screen.getByRole("region", { name: /comment on se compare/i })
    for (const name of ["Portfolio Visualizer", "FireCalc", "Networthify", "Quantalys"]) {
      expect(within(compare).getByRole("link", { name: new RegExp(name, "i") })).toBeInTheDocument()
    }
  })

  it("objectif inversé : le solveur calcule l'épargne mensuelle en direct et le CTA repart via #s=", () => {
    render(<LandingPage />)
    expect(screen.getByRole("heading", { name: /je veux 1 m€/i })).toBeInTheDocument()
    // Le montant affiché est celui du VRAI solveur (mêmes inputs que la section).
    const base = parseStoredInputs(null)
    const historical = getHistoricalDataset(base.historicalIndex)
    const expected = solveGoal({
      ...base,
      goalTarget: 1_000_000,
      goalDuration: 20,
      goalCapital: 0,
      goalAnnualReturn: historical.compoundedReturn,
    }).pmtPerMonth
    const section = screen.getByRole("region", { name: /objectif inversé/i })
    const text = (section.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    expect(text).toContain(fmtCurrency(expected ?? 0).replace(/[\u202F\u00A0]/g, " "))
    // Le CTA « Repartir de cette simulation » écrit un hash #s=… décodable qui
    // route vers l'app avec les MÊMES réglages d'objectif (deep-link v6).
    fireEvent.click(screen.getByRole("button", { name: /repartir de cette simulation/i }))
    expect(window.location.hash).toMatch(/^#s=/)
    const decoded = decodeInputsFromUrl(window.location.hash.slice(1))
    expect(decoded?.goalTarget).toBe(1_000_000)
    expect(decoded?.goalDuration).toBe(20)
  })

  it("dernières éditions : au plus 4 versions + lien vers le changelog complet", () => {
    render(<LandingPage />)
    const section = screen.getByRole("region", { name: /dernières évolutions/i })
    const cards = within(section).getAllByRole("article")
    expect(cards.length).toBeLessThanOrEqual(4)
    const link = within(section).getByRole("link", { name: /toutes les versions/i })
    expect(link).toHaveAttribute("href", "/changelog.html")
  })

  it("déplie la FAQ au clic", () => {
    render(<LandingPage />)
    const question = screen.getByRole("button", { name: /un compte est-il obligatoire/i })
    expect(question).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(question)
    expect(question).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText(/non, l'application fonctionne intégralement sans compte/i)).toBeInTheDocument()
  })

  it("FAQ : « Pourquoi 2,1 % d'inflation… » justifie l'hypothèse par la médiane", () => {
    render(<LandingPage />)
    const question = screen.getByRole("button", { name: /pourquoi 2,1 % d'inflation/i })
    expect(question).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(question)
    expect(question).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText(/cible BCE de 2 %/i)).toBeInTheDocument()
    expect(screen.getByText(/13,7 % en 1974/i)).toBeInTheDocument()
  })

  it("le thème partagé avec l'app : le bouton bascule la classe light-mode", () => {
    render(<LandingPage />)
    // Défaut clair (comme l'app) → classe light-mode posée sur <html>
    expect(document.documentElement.classList.contains("light-mode")).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Passer en mode sombre" }))
    expect(document.documentElement.classList.contains("light-mode")).toBe(false)
    // La préférence est persistée (même clé que l'app)
    expect(localStorage.getItem("snowball_v5_theme")).toBe("dark")
  })

  it("HeroChart : la démo est calculée par le moteur (aucun chiffre codé en dur)", () => {
    render(<HeroChart />)
    const chart = screen.getByRole("img")
    expect(chart).toBeInTheDocument()
    // La légende affiche un montant de capital final réellement simulé
    expect(screen.getByText(/capital final/i)).toBeInTheDocument()
    expect(screen.getByText(/croissance/i)).toBeInTheDocument()
  })
})

describe("v6.1 — comptes : inscription, connexion, déconnexion", () => {
  it("l'inscription ouvre une session, persiste le compte et navigue vers l'app", async () => {
    const user = userEvent.setup()
    render(<AuthScreen mode="register" />)
    await user.type(screen.getByLabelText("Votre nom"), "Marie Dupont")
    await user.type(screen.getByLabelText("Adresse email"), "marie@exemple.fr")
    await user.type(screen.getByLabelText("Mot de passe"), "secret12")
    await user.type(screen.getByLabelText("Confirmer le mot de passe"), "secret12")
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }))

    expect(getCachedSession()).not.toBeNull()
    expect(window.location.hash).toBe("#/app")
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]")
    expect(accounts[0].email).toBe("marie@exemple.fr")
    // Le mot de passe n'est jamais stocké en clair
    expect(JSON.stringify(accounts)).not.toContain("secret12")
  })

  it("refuse une confirmation de mot de passe qui ne correspond pas", async () => {
    const user = userEvent.setup()
    render(<AuthScreen mode="register" />)
    await user.type(screen.getByLabelText("Votre nom"), "Marie")
    await user.type(screen.getByLabelText("Adresse email"), "marie@exemple.fr")
    await user.type(screen.getByLabelText("Mot de passe"), "secret12")
    await user.type(screen.getByLabelText("Confirmer le mot de passe"), "autre123")
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }))

    expect(screen.getByText(/les deux mots de passe ne correspondent pas/i)).toBeInTheDocument()
    expect(getCachedSession()).toBeNull()
  })

  it("un mauvais mot de passe à la connexion est refusé avec un message générique", async () => {
    const user = userEvent.setup()
    register(browserStorage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" })
    logout(browserStorage)

    render(<AuthScreen mode="login" />)
    await user.type(screen.getByLabelText("Adresse email"), "marie@exemple.fr")
    await user.type(screen.getByLabelText("Mot de passe"), "mauvais12")
    await user.click(screen.getByRole("button", { name: /se connecter/i }))

    expect(screen.getByRole("alert")).toHaveTextContent(/email ou mot de passe incorrect/i)
    expect(getCachedSession()).toBeNull()
  })

  it("connexion → session ouverte, puis déconnexion depuis le menu de compte de l'app", async () => {
    const user = userEvent.setup()
    register(browserStorage, { name: "Marie", email: "marie@exemple.fr", password: "secret12" })
    logout(browserStorage)

    render(<AuthScreen mode="login" />)
    await user.type(screen.getByLabelText("Adresse email"), "marie@exemple.fr")
    await user.type(screen.getByLabelText("Mot de passe"), "secret12")
    await user.click(screen.getByRole("button", { name: /se connecter/i }))
    expect(getCachedSession()).not.toBeNull()

    // On bascule sur l'app (rendu direct : pas de routeur dans ce test)
    cleanup()
    render(<App />)
    fireEvent.click(screen.getByTitle(/compte de marie/i))
    expect(screen.getByRole("menuitem", { name: /se déconnecter/i })).toBeInTheDocument()
    expect(screen.getByText("marie@exemple.fr")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("menuitem", { name: /se déconnecter/i }))
    await waitFor(() => expect(getCachedSession()).toBeNull())
    // Le menu revient à l'état invité
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument()
  })

  it("un compte connecté isole ses simulations : données invité intactes après connexion", async () => {
    // L'invité a des réglages stockés
    localStorage.setItem("snowball_v5_settings", JSON.stringify({ ...DEFAULT_INPUTS, capitalInitial: 42_000 }))
    // On crée puis connecte un compte
    const { session } = register(browserStorage, {
      name: "Yoric",
      email: "yoric@exemple.fr",
      password: "secret12",
    }) as { ok: true; account: { id: string }; session: { userId: string } }
    syncSession()
    expect(session.userId).toBeTruthy()

    render(<App />)
    // Le compte démarre VIERGE (pas de migration des données invité) :
    // le capital est le défaut, pas les 42 000 € de l'invité.
    expect(screen.getByRole("slider", { name: "Capital de départ (€)" })).toHaveValue(
      String(DEFAULT_INPUTS.capitalInitial),
    )
  })
})

describe("audit v6.6 — KpiGrid : la chaîne brut → net de frais → réel est explicite", () => {
  // Normalise les espaces insécables fr-FR (même technique que les autres tests).
  const textOf = (container: HTMLElement) => (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")

  it("affiche 2 décimales et la chaîne complète du scénario Central (8,22 → 7,95 → 5,73)", () => {
    const inputs = { ...DEFAULT_INPUTS, returnScenario: "central" as const }
    const kpis = computeKPIs(runSimulation(inputs), inputs)
    const { container } = render(<KpiGrid kpis={kpis} inputs={inputs} />)
    const text = textOf(container)

    // La chaîne relie les trois taux : brut appliqué → net de frais → réel.
    expect(text).toContain("Taux appliqué :")
    expect(text).toContain("8,22 %/an brut")
    expect(text).toContain("7,95 % net de frais")
    expect(text).toContain("5,73 % après inflation")
    // La carte « Rendement net / an » affiche le XIRR net de frais (7,95, pas 8,22).
    expect(screen.getByText("Rendement net / an")).toBeInTheDocument()
    // Mode Débutant (défaut du test) : le sous-titre dit « après tous vos frais ».
    expect(text).toContain("après tous vos frais, avant impôts et inflation")
    // La carte « Après inflation » montre la formule de Fisher avec les valeurs affichées.
    expect(text).toContain("(1 + 7,95 %) ÷ (1 + 2,10 %) − 1 = 5,73 %")
    // Plus de « XIRR brut » ni de référence historique 5,99 mélangée à la projection.
    expect(text).not.toContain("XIRR brut")
    expect(text).not.toContain("référence historique réelle")
  })

  it("la chaîne suit le scénario choisi (Optimiste : 10,07 → 9,79 → 7,53)", () => {
    const inputs = { ...DEFAULT_INPUTS, returnScenario: "optimiste" as const }
    const kpis = computeKPIs(runSimulation(inputs), inputs)
    const { container } = render(<KpiGrid kpis={kpis} inputs={inputs} />)
    const text = textOf(container)
    expect(text).toContain("10,07 %/an brut")
    expect(text).toContain("9,79 % net de frais")
    expect(text).toContain("7,53 % après inflation")
  })

  it("sans frais, brut et net de frais coïncident (le scénario est bien le seul levier)", () => {
    const inputs = { ...DEFAULT_INPUTS, etfFees: 0, managementFees: 0, brokerageFees: 0 }
    const kpis = computeKPIs(runSimulation(inputs), inputs)
    const { container } = render(<KpiGrid kpis={kpis} inputs={inputs} />)
    const text = textOf(container)
    expect(text).toContain("8,22 %/an brut")
    expect(text).toContain("8,22 % net de frais")
  })
})

describe("audit v6.6 — AIInsightCard : référence = taux brut du scénario, 2 décimales", () => {
  it("compare le XIRR au taux brut appliqué du scénario, pas à la moyenne arithmétique", () => {
    const inputs = { ...DEFAULT_INPUTS, returnScenario: "central" as const }
    const rows = runSimulation(inputs)
    const kpis = computeKPIs(rows, inputs)
    render(<AIInsightCard rows={rows} inputs={inputs} kpis={kpis} />)
    // Avec 0,25 %/an de frais : XIRR 7,95 vs brut appliqué 8,22 → « proche du
    // taux brut appliqué de 8,22 %/an (scénario Central) », plus de référence
    // arithmétique 10,07 qui faisait paraître la projection en retard.
    expect(screen.getByText(/proche du taux brut appliqué de 8,22%\/an \(scénario Central\)/)).toBeInTheDocument()
    expect(screen.queryByText(/moyenne BRUTE de référence/)).not.toBeInTheDocument()
  })

  it("mode Avancé : le XIRR est dit « après frais », plus jamais « brut »", () => {
    const inputs = { ...DEFAULT_INPUTS, returnScenario: "central" as const }
    const rows = runSimulation(inputs)
    const kpis = computeKPIs(rows, inputs)
    render(<AIInsightCard rows={rows} inputs={inputs} kpis={kpis} uiMode="avance" />)
    expect(screen.getByText(/\(XIRR après frais, avant inflation, versements inclus\)/)).toBeInTheDocument()
    expect(screen.queryByText(/XIRR brut/)).not.toBeInTheDocument()
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

describe("v7 — onboarding : tutoriel non-skippable, questionnaire et bibliothèque", () => {
  it("le vrai nouveau visiteur voit le tutoriel (aucun bouton fermer/skip) puis le questionnaire s'ouvre", () => {
    localStorage.removeItem("snowball_v5_tutorial_done")
    render(<App />)
    // Tutoriel visible, sans croix ni lien « passer » : seul « Suivant » existe.
    expect(screen.getByRole("dialog", { name: /bienvenue — présentation de snowball pro/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /fermer/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Suivant" })).toBeInTheDocument()

    // 4 × Suivant → dernière slide (« C'est parti ! ») puis le CTA final.
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: "Suivant" }))
    expect(screen.getByRole("button", { name: "Lancer ma première simulation" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Lancer ma première simulation" }))

    // Le questionnaire s'ouvre et le tutoriel ne reviendra plus jamais.
    expect(screen.getByRole("dialog", { name: /nouvelle simulation — questionnaire guidé/i })).toBeInTheDocument()
    expect(localStorage.getItem("snowball_v5_tutorial_done")).toBe("1")
  })

  it("le tutoriel ne s'affiche pas pour un visiteur qui a déjà des réglages", () => {
    localStorage.removeItem("snowball_v5_tutorial_done")
    localStorage.setItem("snowball_v5_settings", JSON.stringify({ ...DEFAULT_INPUTS, capitalInitial: 42000 }))
    render(<App />)
    expect(screen.queryByRole("dialog", { name: /bienvenue — présentation/i })).not.toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Capital de départ (€)" })).toHaveValue("42000")
  })

  it("le tutoriel ne s'affiche pas pour un lien partagé #s=", () => {
    localStorage.removeItem("snowball_v5_tutorial_done")
    window.location.hash = `#${encodeInputsForUrl({ ...DEFAULT_INPUTS, capitalInitial: 75000 })}`
    render(<App />)
    expect(screen.queryByRole("dialog", { name: /bienvenue — présentation/i })).not.toBeInTheDocument()
    expect(screen.getByRole("slider", { name: "Capital de départ (€)" })).toHaveValue("75000")
  })

  it("le questionnaire complet crée la simulation nommée et met à jour l'app", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Nouvelle simulation" }))
    const dialog = screen.getByRole("dialog", { name: /nouvelle simulation — questionnaire guidé/i })
    const inDialog = within(dialog)

    // 1. Âge
    fireEvent.click(inDialog.getByRole("button", { name: /35 ans/ }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 2. Capital : Oui → le montant est demandé
    fireEvent.click(inDialog.getByRole("button", { name: "Oui" }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    fireEvent.click(inDialog.getByRole("button", { name: /10\s*000\s*€/ }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 3. Épargne mensuelle
    fireEvent.click(inDialog.getByRole("button", { name: /250,00\s*€/ }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 4. Projet → Retraite (fixe aussi la durée recommandée 35 ans)
    fireEvent.click(inDialog.getByRole("button", { name: /Retraite\s*Préparer vos vieux jours/i }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 5. Durée déjà pré-remplie par la recommandation
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 6. Enveloppe → « Je ne sais pas » (recommandation auto → PEA à 35 ans)
    fireEvent.click(inDialog.getByRole("button", { name: /je ne sais pas — recommandez-moi/i }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 7. Question retraite conditionnelle (projet = Retraite)
    fireEvent.click(inDialog.getByRole("button", { name: /65 ans/ }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 8. Risque
    fireEvent.click(inDialog.getByRole("button", { name: /Équilibré/i }))
    fireEvent.click(inDialog.getByRole("button", { name: "Suivant" }))
    // 9. Nom + résultat
    fireEvent.change(inDialog.getByLabelText("Nom de la simulation"), { target: { value: "Ma retraite rêvée" } })
    fireEvent.click(inDialog.getByRole("button", { name: "Voir mon résultat" }))

    expect(screen.queryByRole("dialog", { name: /nouvelle simulation — questionnaire guidé/i })).not.toBeInTheDocument()
    // Les réglages reflètent les réponses (la section « Votre profil » s'ouvre
    // pour lire l'âge).
    fireEvent.click(screen.getByRole("button", { name: "Votre profil" }))
    expect(screen.getByRole("slider", { name: "Âge actuel" })).toHaveValue("35")
    expect(screen.getByRole("slider", { name: "Capital de départ (€)" })).toHaveValue("10000")
    expect(screen.getByRole("slider", { name: "Épargne mensuelle (€)" })).toHaveValue("250")
    expect(screen.getByRole("slider", { name: "Durée (années)" })).toHaveValue("35")
    // La simulation nommée apparaît dans la bibliothèque (et dans le panneau
    // Snapshots de la sidebar — même liste).
    fireEvent.click(screen.getByRole("tab", { name: /mes simulations/i }))
    expect(screen.getAllByText("Ma retraite rêvée").length).toBeGreaterThan(0)
    expect(screen.getByText("Simulation en cours")).toBeInTheDocument()
  })

  it("« Nouvelle simulation » propose de sauvegarder quand la simulation a été modifiée", () => {
    render(<App />)
    fireEvent.change(screen.getByRole("slider", { name: "Capital de départ (€)" }), { target: { value: "15000" } })
    fireEvent.click(screen.getByRole("button", { name: "Nouvelle simulation" }))
    expect(screen.getByRole("dialog", { name: /sauvegarder la simulation en cours/i })).toBeInTheDocument()
    // Créer sans sauvegarder → le questionnaire s'ouvre ; l'annuler ramène à l'app.
    fireEvent.click(screen.getByRole("button", { name: "Créer sans sauvegarder" }))
    expect(screen.getByRole("dialog", { name: /nouvelle simulation — questionnaire guidé/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Fermer le questionnaire" }))
    expect(screen.queryByRole("dialog", { name: /nouvelle simulation — questionnaire guidé/i })).not.toBeInTheDocument()
  })

  it("l'onglet « Mes simulations » liste, renomme et supprime les simulations", () => {
    const s1 = createSnapshot(
      { ...DEFAULT_INPUTS, capitalInitial: 20000, duration: 20 },
      runSimulation({ ...DEFAULT_INPUTS, capitalInitial: 20000, duration: 20 }),
      "Retraite — 20 ans",
    )
    const s2 = createSnapshot(
      { ...DEFAULT_INPUTS, monthlyPayment: 1000 },
      runSimulation({ ...DEFAULT_INPUTS, monthlyPayment: 1000 }),
      "Croissance",
    )
    localStorage.setItem("snowball_v5_snapshots", JSON.stringify([s1, s2]))
    render(<App />)
    fireEvent.click(screen.getByRole("tab", { name: /mes simulations/i }))
    // Le nom apparaît aussi dans le panneau Snapshots de la sidebar (réglages avancés).
    expect(screen.getAllByText("Retraite — 20 ans").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Croissance").length).toBeGreaterThan(0)

    // Renommer s2 (inline, Entrée valide).
    fireEvent.click(screen.getByRole("button", { name: "Renommer Croissance" }))
    fireEvent.change(screen.getByLabelText("Nom de la simulation"), { target: { value: "Mon projet" } })
    fireEvent.keyDown(screen.getByLabelText("Nom de la simulation"), { key: "Enter" })
    expect(screen.getAllByText("Mon projet").length).toBeGreaterThan(0)

    // Supprimer s1 : deux clics (armement puis confirmation).
    fireEvent.click(screen.getByRole("button", { name: "Supprimer Retraite — 20 ans" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la suppression de Retraite — 20 ans" }))
    expect(screen.queryAllByText("Retraite — 20 ans")).toHaveLength(0)
  })
})

describe("v6.8 — CRO landing : nav « Pour qui », CTA sticky mobile, taux 2026", () => {
  it("la navigation propose désormais « Pour qui »", () => {
    render(<LandingPage />)
    // NAV est rendue deux fois (header + footer) : les deux doivent proposer
    // l'ancre vers la section « Pour qui ».
    expect(screen.getAllByRole("link", { name: "Pour qui" }).length).toBeGreaterThan(0)
  })

  it("le CTA sticky mobile est caché au chargement puis apparaît après scroll", () => {
    render(<LandingPage />)
    const bar = screen.getByTestId("cta-sticky-mobile")
    // Invisible tant que la page n'a pas défilé (hors de l'ordre de tabulation)
    expect(bar.className).toContain("translate-y-full")
    expect(bar.className).toContain("invisible")

    // jsdom ne simule pas le scroll : on fixe scrollY puis on dispatche.
    Object.defineProperty(window, "scrollY", { value: 600, configurable: true, writable: true })
    fireEvent.scroll(window)
    expect(bar.className).toContain("translate-y-0")
    expect(bar.className).not.toContain("invisible")
    // Le CTA reste masqué sur desktop (md:hidden) : le header suffit à l'écran.
    expect(bar.className).toContain("md:hidden")
  })

  it("les taux fiscaux cités sont ceux de 2026, dérivés du moteur (plus de 17,2 % / PFU 30 %)", () => {
    const { container } = render(<LandingPage />)
    const text = (container.textContent ?? "").replace(/[\u202F\u00A0]/g, " ")
    // Règles 2026 appliquées par l'app : PFU 31,4 % (12,8 + 18,6), PEA 18,6 %.
    expect(text).toContain("31,4 %")
    expect(text).toContain("18,6 %")
    // Les taux 2025 périmés ont disparu de la landing.
    expect(text).not.toContain("PFU 30 %")
    expect(text).not.toContain("17,2 % après 5 ans")
  })
})

// ─── i18n (v6.12.0) : bascule de langue FR ⇄ EN ─────────────────────────────

describe("i18n — bascule de langue", () => {
  // jsdom signale souvent navigator.language = "en-US" : on force la langue
  // initiale en français avant chaque test (loadInitialLang la lit au mount).
  beforeEach(() => {
    localStorage.setItem("snowball_v5_lang", "fr")
  })
  afterEach(() => {
    localStorage.removeItem("snowball_v5_lang")
    cleanup()
  })

  function Harness() {
    const { tr, fmtCurrency } = useLang()
    return (
      <div>
        <LanguageToggle />
        <p data-testid="greeting">{tr("Durée")}</p>
        <p data-testid="amount">{fmtCurrency(1234.5)}</p>
      </div>
    )
  }

  it("passe du français à l'anglais et inverse les formatters au clic", () => {
    render(
      <LangProvider>
        <Harness />
      </LangProvider>,
    )
    // Défaut : français (préférence forcée dans beforeEach)
    expect(screen.getByTestId("greeting")).toHaveTextContent("Durée")
    expect(screen.getByTestId("amount")).toHaveTextContent("1 234,50 €")

    // Clic → anglais : la traduction ET le formatage basculent
    fireEvent.click(screen.getByRole("button", { name: "Passer en anglais" }))
    expect(screen.getByTestId("greeting")).toHaveTextContent("Duration")
    expect(screen.getByTestId("amount")).toHaveTextContent("€1,234.50")

    // Clic retour → français
    fireEvent.click(screen.getByRole("button", { name: "Switch to French" }))
    expect(screen.getByTestId("greeting")).toHaveTextContent("Durée")
  })

  it("le formulaire d'inscription traduit ses libellés selon la langue", () => {
    render(
      <LangProvider>
        <LanguageToggle />
        <AuthScreen mode="register" />
      </LangProvider>,
    )
    // Le titre apparaît deux fois (h1 sr-only + h2 visible de AuthLayout).
    expect(screen.getAllByText("Créez votre compte").length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole("button", { name: "Passer en anglais" }))
    expect(screen.getAllByText("Create your account").length).toBeGreaterThan(0)
    expect(screen.getByLabelText("Email address")).toBeTruthy()
  })
})

describe("v6.13 — partage visible (boucle virale) : X, WhatsApp, LinkedIn, copie", () => {
  it("ouvre le panneau Partager avec les 4 canaux au clic", () => {
    render(<App />)
    const shareButton = screen.getByRole("button", { name: /partager/i })
    expect(screen.queryByRole("menuitem", { name: /partager sur x/i })).not.toBeInTheDocument()

    fireEvent.click(shareButton)

    expect(screen.getByRole("menuitem", { name: /partager sur x \(twitter\)/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /partager sur whatsapp/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /partager sur linkedin/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /copier le lien/i })).toBeInTheDocument()
  })

  it("embarque le scénario pré-rempli (#s=…) et l'UTM de canal dans chaque lien", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: /partager/i }))

    const xLink = screen.getByRole("menuitem", { name: /partager sur x \(twitter\)/i }) as HTMLAnchorElement
    expect(xLink.href).toContain("https://twitter.com/intent/tweet?text=")
    // L'URL du scénario est encodée dans le paramètre `url` : on la décode
    // avant de vérifier l'UTM et l'état pré-rempli.
    const sharedUrl = decodeURIComponent(xLink.href.split("url=")[1])
    expect(sharedUrl).toContain("utm_source=partage&utm_medium=x")
    expect(sharedUrl).toContain("#s=")
    // Le scénario partagé doit être décodable par le décodeur de l'app.
    const encoded = decodeInputsFromUrl(sharedUrl.slice(sharedUrl.indexOf("#s=") + 1))
    expect(encoded).not.toBeNull()
    expect(encoded?.monthlyPayment).toBe(DEFAULT_INPUTS.monthlyPayment)

    const waLink = screen.getByRole("menuitem", { name: /partager sur whatsapp/i }) as HTMLAnchorElement
    expect(waLink.href).toContain("wa.me/?text=")
    // WhatsApp encode tout le texte dans `text=` : on décode avant de vérifier.
    expect(decodeURIComponent(waLink.href)).toContain("utm_medium=whatsapp")

    const liLink = screen.getByRole("menuitem", { name: /partager sur linkedin/i }) as HTMLAnchorElement
    expect(liLink.href).toContain("linkedin.com/sharing/share-offsite/?url=")
    const liUrl = decodeURIComponent(liLink.href.split("url=")[1])
    expect(liUrl).toContain("utm_medium=linkedin")
    expect(liUrl).toContain("#s=")
  })

  it("copie le lien avec l'UTM « copie » et affiche « Lien copié ! »", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    // jsdom n'est pas un « secure context » : l'API Clipboard n'est utilisée
    // que si window.isSecureContext est vrai (urlState.ts en dépend).
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true })
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: /partager/i }))

    fireEvent.click(screen.getByRole("menuitem", { name: /copier le lien/i }))

    await waitFor(() => expect(writeText).toHaveBeenCalled())
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain("utm_medium=copie")
    expect(copied).toContain("#s=")
    expect(screen.getByRole("menuitem", { name: /lien copié !/i })).toBeInTheDocument()
  })

  it("se ferme au clic extérieur", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: /partager/i }))
    expect(screen.getByRole("menuitem", { name: /copier le lien/i })).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole("menuitem", { name: /copier le lien/i })).not.toBeInTheDocument()
  })
})
