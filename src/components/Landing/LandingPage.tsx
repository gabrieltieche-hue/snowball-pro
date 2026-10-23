import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Ban,
  Banknote,
  Check,
  ChevronDown,
  Dices,
  History,
  Landmark,
  LineChart,
  Lock,
  Moon,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  User,
  X,
} from "lucide-react"
import { cn } from "../../utils/cn"
import { navigateTo } from "../../router"
import { encodeInputsForUrl } from "../../utils/urlState"
import { loadInitialDarkMode, persistThemeClass } from "../../utils/theme"
import {
  STRESS_TEST_SCENARIOS,
  baseMonthlyWithdrawal,
  fmtTaxPercent,
  getHistoricalDataset,
  getTaxRules,
  parseStoredInputs,
  pfuRate,
  replayCrashFrom,
  runSimulation,
  runStressTest,
  solveGoal,
} from "../../engine"
import { useLang } from "../../i18n"
import type { EnvelopeType, GoalDifficulty, ReturnScenario, YearRow } from "../../types"
import { SliderInput } from "../shared/SliderInput"
import { QUICKSTART_PROFILES } from "../../utils/quickStart"
import { Brand } from "./Brand"
import { CrashChart } from "./CrashChart"
import { HeroChart } from "./HeroChart"
import { RetirementChart } from "./RetirementChart"

// ─── Hooks maison (framer-motion est mocké en test : on n'utilise pas useInView) ──

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      setReduced(mq.matches)
      const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    } catch {
      return
    }
  }, [])
  return reduced
}

/** Compteur animé (ease-out cubique), déclenché au montage après un délai de
 *  cascade — jamais à zéro si l'animation ne peut pas tourner (motion réduite,
 *  jsdom, rAF absent) : on saute directement à la cible. */
function useCountUp(target: number, delayMs = 0): number {
  const [value, setValue] = useState(0)
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    if (reduced || typeof requestAnimationFrame === "undefined") {
      setValue(target)
      return
    }
    let raf = 0
    let timer = 0
    const t0 = performance.now() + delayMs
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, now - t0) / 1200)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, delayMs)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, delayMs, reduced])
  return value
}

/** Montant animé (compteur) — isolé pour que le héro recalcule sans recréer le reste. */
function AnimatedAmount({ value }: { value: number }) {
  const { fmtCurrency } = useLang()
  const shown = useCountUp(value)
  return <>{fmtCurrency(shown)}</>
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Apparition au défilement (une seule fois). Contenu visible par défaut en test. */
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

// ─── Petits blocs de section ─────────────────────────────────────────────────

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  const { tr } = useLang()
  return (
    <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
      <p className="section-eyebrow mb-3">{tr(eyebrow)}</p>
      <h2 className="font-display text-3xl sm:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-[1.08] text-text text-balance">
        {tr(title)}
      </h2>
      {sub && (
        <p className="text-[15px] text-text-muted mt-4 leading-relaxed max-w-xl mx-auto text-balance">{tr(sub)}</p>
      )}
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof LineChart
  title: string
  children: React.ReactNode
}) {
  const { tr } = useLang()
  return (
    <article className="glass card-top-gold rounded-3xl p-6 card-interactive group">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
        <Icon size={19} className="text-primary" aria-hidden />
      </div>
      <h3 className="font-display font-bold text-[15px] text-text mb-2">{tr(title)}</h3>
      <p className="text-xs text-text-muted leading-relaxed">{children}</p>
    </article>
  )
}

/** Cellule du tableau honnête : ✅ (vert), ⚠ (rouge doux, partiel), ✕ (gris). */
function CompareCellView({ cell }: { cell: CompareCell }) {
  const { tr } = useLang()
  const nuance = cell.text && <span className="text-[10px] text-text-muted">{tr(cell.text)}</span>
  if (cell.kind === "yes")
    return (
      <span className="inline-flex items-center gap-1.5">
        <Check size={14} style={{ color: "var(--color-success)" }} aria-hidden className="compare-glow" />
        {nuance}
      </span>
    )
  if (cell.kind === "partial")
    return (
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle size={13} style={{ color: "var(--color-danger-light)" }} aria-hidden />
        {nuance}
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5">
      <X size={13} className="text-text-dim/60" aria-hidden />
      {nuance}
    </span>
  )
}

function EnvelopeCard({ badge, title, children }: { badge: string; title: string; children: React.ReactNode }) {
  const { tr } = useLang()
  return (
    <article className="glass card-top-gold rounded-3xl p-5 card-interactive group">
      <span className="inline-block text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-lg mb-3">
        {tr(badge)}
      </span>
      <h3 className="font-display font-bold text-sm text-text mb-1.5">{tr(title)}</h3>
      <p className="text-[11.5px] text-text-muted leading-relaxed">{children}</p>
    </article>
  )
}

function FaqItem({
  question,
  children,
  open,
  onToggle,
}: {
  question: string
  children: React.ReactNode
  open: boolean
  onToggle: () => void
}) {
  const { tr } = useLang()
  return (
    <div className={cn("glass rounded-2xl overflow-hidden transition-colors", open && "border-primary/25")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-[13px] font-bold text-text">{tr(question)}</span>
        <ChevronDown
          size={15}
          aria-hidden
          className={cn("text-primary shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              <p className="text-xs text-text-muted leading-relaxed">{children}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Chiffre clé avec compteur animé (cascade au chargement). */
function CountUpStat({
  value,
  suffix,
  label,
  icon: Icon,
  delay = 0,
}: {
  value: number
  suffix: string
  label: string
  icon: typeof History
  delay?: number
}) {
  const { tr, locale } = useLang()
  const shown = useCountUp(value, delay)
  return (
    <div className="flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center group">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
        <Icon size={18} className="text-primary" aria-hidden />
      </div>
      <div className="sm:text-center">
        <p className="font-display text-4xl sm:text-[2.75rem] font-extrabold text-primary tracking-tight mono leading-none">
          {shown.toLocaleString(locale)}
          {tr(suffix)}
        </p>
        <p className="text-[11px] text-text-muted mt-2 leading-relaxed max-w-[220px] mx-auto">{tr(label)}</p>
      </div>
    </div>
  )
}

/** Carte scénario : moteur réel (prudent / central / optimiste). */
function ScenarioCard({
  badge,
  title,
  rate,
  text,
  last,
}: {
  badge: string
  title: string
  rate: string
  text: string
  last: YearRow | null
}) {
  const { tr, fmtCurrency } = useLang()
  return (
    <article className="glass rounded-3xl p-6 card-interactive flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-lg">
          {tr(badge)}
        </span>
        <span className="mono text-[11px] font-bold text-text-muted">{tr(rate)}</span>
      </div>
      <h3 className="font-display font-bold text-[15px] text-text mb-1">{tr(title)}</h3>
      {last && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10.5px] text-text-muted">{tr("Capital final")}</span>
            <span className="mono text-[15px] font-extrabold text-primary">{fmtCurrency(last.nominal)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10.5px] text-text-muted">{tr("En € d'aujourd'hui")}</span>
            <span className="mono text-[12px] font-bold text-text-muted">{fmtCurrency(last.real)}</span>
          </div>
        </div>
      )}
      <p className="text-xs text-text-muted leading-relaxed mt-3">{tr(text)}</p>
    </article>
  )
}

/** Carte profil « Pour qui » : moteur réel sur une situation type. */
function ProfileCard({ name, meta, last, note }: { name: string; meta: string; last: YearRow | null; note: string }) {
  const { tr, fmtCurrency } = useLang()
  return (
    <article className="glass rounded-3xl p-6 card-interactive flex flex-col">
      <h3 className="font-display font-bold text-[15px] text-text mb-1">{tr(name)}</h3>
      <p className="text-[10.5px] text-text-muted uppercase tracking-[0.12em]">{tr(meta)}</p>
      {last && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10.5px] text-text-muted">{tr("Capital final")}</span>
            <span className="mono text-[15px] font-extrabold text-primary">{fmtCurrency(last.nominal)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10.5px] text-text-muted">{tr("En € d'aujourd'hui")}</span>
            <span className="mono text-[12px] font-bold text-text-muted">{fmtCurrency(last.real)}</span>
          </div>
        </div>
      )}
      <p className="text-[10.5px] text-text-dim leading-relaxed mt-3">{tr(note)}</p>
    </article>
  )
}

/** Barre de décomposition épargné / croissance (résultat d'abord). */
function DecompositionBar({ invested, growth }: { invested: number; growth: number }) {
  const { tr, fmtCurrency } = useLang()
  const total = Math.max(1, invested + growth)
  const investedPct = (invested / total) * 100
  const growthPct = (growth / total) * 100
  return (
    <div className="mt-3">
      <div aria-hidden className="flex h-2.5 rounded-full overflow-hidden bg-surface-100/60 border border-border/50">
        <div className="bg-text-muted/45" style={{ width: `${investedPct}%` }} />
        <div className="bg-gradient-to-r from-primary-light to-primary" style={{ width: `${growthPct}%` }} />
      </div>
      <div className="flex items-center justify-between gap-3 mt-2 text-[9.5px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-muted/50 shrink-0" aria-hidden />
          {tr("Épargné")} · <span className="mono text-text">{fmtCurrency(invested)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden />
          {tr("Croissance")} · <span className="mono text-primary">{fmtCurrency(growth)}</span>
        </span>
      </div>
    </div>
  )
}

// ─── Métadonnées des scénarios de rendement ──────────────────────────────────

const SCENARIO_ORDER: ReturnScenario[] = ["prudent", "central", "optimiste"]

const SCENARIO_META: Record<ReturnScenario, { label: string; desc: string }> = {
  prudent: { label: "Prudent", desc: "réel, après inflation" },
  central: { label: "Central", desc: "krachs inclus · défaut" },
  optimiste: { label: "Optimiste", desc: "moyenne des années" },
}

/** Sélecteur segmenté du héro : change la démo réelle en un clic. */
function ScenarioSwitch({
  value,
  onChange,
  rates,
}: {
  value: ReturnScenario
  onChange: (v: ReturnScenario) => void
  rates: Record<ReturnScenario, number>
}) {
  const { tr, lang } = useLang()
  return (
    <div
      role="radiogroup"
      aria-label={tr("Scénario de rendement de la démo")}
      className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface-50/70 border border-border"
    >
      {SCENARIO_ORDER.map(id => {
        const active = value === id
        const rate = (rates[id] * 100).toFixed(2)
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={cn(
              "rounded-xl px-2 py-2 text-center transition-all duration-200",
              active ? "bg-primary btn-gold-text shadow-gold" : "text-text-muted hover:text-text hover:bg-glass-hover",
            )}
          >
            <span className="block text-[10px] font-extrabold leading-tight">{tr(SCENARIO_META[id].label)}</span>
            <span
              className={cn("block text-[8.5px] mt-0.5 leading-none mono", active ? "opacity-80" : "text-text-dim")}
            >
              {lang === "en" ? rate : rate.replace(".", ",")} %
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Landing ─────────────────────────────────────────────────────────────────

const NAV = [
  { href: "#krachs", label: "Krachs" },
  { href: "#retraite", label: "Retraite" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#scenarios", label: "Scénarios" },
  { href: "#comparaison", label: "Comparaison" },
  { href: "#manifeste", label: "Manifeste" },
  { href: "#enveloppes", label: "Enveloppes" },
  { href: "#methode", label: "Méthodologie" },
  { href: "#pourqui", label: "Pour qui" },
  { href: "#objectif", label: "Objectif" },
  { href: "#faq", label: "FAQ" },
]

/** Pages statiques SEO (guides, comparatifs, tarifs, changelog) — distribution. */
const GUIDES_LINKS = [
  { href: "/guides/simulateur-pea.html", label: "Simulateur PEA" },
  { href: "/guides/pea-ou-assurance-vie.html", label: "PEA ou assurance vie" },
  { href: "/guides/calcul-interets-composes.html", label: "Calcul des intérêts composés" },
  { href: "/alternatives/portfolio-visualizer.html", label: "Portfolio Visualizer" },
  { href: "/alternatives/firecalc.html", label: "FireCalc" },
  { href: "/alternatives/networthify.html", label: "Networthify" },
  { href: "/alternatives/quantalys.html", label: "Quantalys" },
  { href: "/pricing.html", label: "Tarifs" },
  { href: "/changelog.html", label: "Changelog" },
]

/** Comparatifs détaillés — maillage interne (chantier 4.2). */
const ALTERNATIVES_LINKS = [
  { href: "/alternatives/portfolio-visualizer.html", label: "Portfolio Visualizer" },
  { href: "/alternatives/firecalc.html", label: "FireCalc" },
  { href: "/alternatives/networthify.html", label: "Networthify" },
  { href: "/alternatives/quantalys.html", label: "Quantalys" },
]

/** Cellule du tableau honnête : ✅ / ⚠ (partiel, à vérifier) / ✕. */
type CompareCell = { kind: "yes" | "no" | "partial"; text?: string }

/**
 * Tableau honnête (1.4 + 4.2) — établi à partir du résumé concurrentiel
 * (competitor-profiles/_summary.md, vérifié le 17/08/2026). Chaque case est
 * soit vérifiable dans le code (Snowball Pro), soit sur la page publique de
 * l'outil. ⚠ = partiel / à vérifier, jamais de ✕ inventé.
 */
const COMPARE_COLS = ["Snowball Pro", "ProjectionLab", "Finary", "Simulateurs SEO FR"] as const

const COMPARE_ROWS: { label: string; cells: [CompareCell, CompareCell, CompareCell, CompareCell] }[] = [
  {
    label: "Fiscalité française (PEA, AV, PER)",
    cells: [
      { kind: "yes" },
      { kind: "no", text: "100 % US" },
      { kind: "partial", text: "bases" },
      { kind: "partial", text: "simplifiée" },
    ],
  },
  {
    label: "100 ans d'historique réel",
    cells: [{ kind: "yes" }, { kind: "yes" }, { kind: "no" }, { kind: "no" }],
  },
  {
    label: "Monte Carlo — l'incertitude",
    cells: [{ kind: "yes", text: "10 000 scénarios" }, { kind: "yes", text: "2 000" }, { kind: "no" }, { kind: "no" }],
  },
  {
    label: "Décumulation (retraite)",
    cells: [{ kind: "yes" }, { kind: "partial", text: "partielle" }, { kind: "no" }, { kind: "no" }],
  },
  {
    label: "Gratuit, sans inscription",
    cells: [{ kind: "yes" }, { kind: "partial", text: "freemium" }, { kind: "yes" }, { kind: "yes" }],
  },
  {
    label: "Données 100 % sur votre appareil",
    cells: [
      { kind: "yes" },
      { kind: "partial", text: "partiel" },
      { kind: "no" },
      { kind: "partial", text: "selon l'outil" },
    ],
  },
]

/** Libellés de difficulté du solveur d'objectif — mêmes chaînes que l'app. */
const GOAL_DIFFICULTY_META: Record<GoalDifficulty, { label: string; color: string }> = {
  easy: { label: "Atteignable (livrets, obligations)", color: "var(--color-success)" },
  moderate: { label: "Marché actions diversifié", color: "var(--color-primary)" },
  ambitious: { label: "Très ambitieux", color: "var(--color-danger)" },
  impossible: { label: "Objectif irréaliste", color: "var(--color-danger)" },
}

/** Les trois krachs rejouables (3.2) — années de départ du replay. */
const CRASH_YEARS = [2000, 2008, 2022] as const

/** Démo retraite (5.3) : les trois fenêtres réelles du moteur de décaissement. */
const RETIREMENT_YEARS = STRESS_TEST_SCENARIOS.map(s => s.startYear)
type CrashYear = (typeof CRASH_YEARS)[number]

/** Manifeste « Ce que nous ne faisons pas » (5.2) — les 5 refus, l'envers de
 *  l'attaque 1.2. Aucun chiffre : que des engagements vérifiables. */
const MANIFESTO = [
  {
    title: "Pas de rendement garanti",
    text: "Nul ne peut promettre un rendement. Si un outil vous en promet un, il ment — nous, on rejoue l'histoire réelle, krachs inclus.",
  },
  {
    title: "Pas de conseil en investissement",
    text: "Un simulateur pédagogique, pas un conseiller : aucune recommandation personnalisée, aucun produit poussé, aucune pression.",
  },
  {
    title: "Pas de vente de données",
    text: "Tout est calculé sur votre appareil. Il n'y a aucune donnée à vendre — et aucun serveur pour la recevoir.",
  },
  {
    title: "Pas de compte obligatoire",
    text: "Ni compte, ni email, ni carte bancaire : tout fonctionne sans inscription, aujourd'hui comme demain.",
  },
  {
    title: "Pas de publicité",
    text: "Aucune pub, aucun sponsor, aucun lien affilié. Rien n'est sponsorisé ici — même pas cette ligne.",
  },
]

/** Dernières éditions réelles (CHANGELOG.md) — aucun chiffre inventé. */
const UPDATES = [
  {
    version: "v6.23.0",
    title: "La retraite en 2008 + l'app mobile allégée",
    text: "Nouvelle démo landing : choisissez votre année de retraite (1973, 2000 ou 2008) et votre capital, le moteur rejoue la crise réelle — rente de 4 %, inflation, garde-fous. Côté mobile : en-tête compact, onglets sur une rangée, réglages en tiroir, et les explications secondaires rangées pour ne garder que l'essentiel.",
  },
  {
    version: "v6.22.1",
    title: "La carte démo tient à l'écran",
    text: "La fenêtre de simulation du héro est compactée (courbe réduite, espacements resserrés) : le bouton « Repartir de cette simulation » est visible dès l'arrivée, sans scroller.",
  },
  {
    version: "v6.22.0",
    title: "La démo du héro devient éditable",
    text: "Le héro n'est plus une vitrine : 3 curseurs (montant initial, versement mensuel, durée) recalculent le vrai moteur en direct, avec le sélecteur Prudent/Central/Optimiste et le bouton « Repartir de cette simulation » qui pré-remplit l'app via deep-link #s=.",
  },
  {
    version: "v6.21.0",
    title: "Header épuré : un CTA + l'erreur se corrige seule",
    text: "Le simulateur respire : un seul bouton doré (« Nouvelle simulation »), les actions secondaires rangées dans « ⋯ » (le thème Sombre/Clair reste à portée), et l'avertissement ⚠ est maintenant actionnable — un clic l'explique simplement, et « Corriger automatiquement » corrige tout seul (bornes + cohérence âge/durée/retraite), avec Annuler ⌘Z pour revenir en arrière.",
  },
  {
    version: "v6.20.0",
    title: "Vos 100 € face aux krachs",
    text: "Nouvelle section signature : choisissez 2000, 2008 ou 2022 et regardez 100 € investis plonger puis revenir — sur le vrai MSCI World, rejoué année par année (2008 : −37 %, retour en 2012 ; 2000 : la décennie perdue, retour en 2013). S'y ajoute le manifeste « Ce que nous ne faisons pas » : pas de rendement garanti, pas de conseil, pas de vente de données, pas de compte obligatoire, pas de pub.",
  },
  {
    version: "v6.18.0",
    title: "Le tableau honnête + l'objectif inversé",
    text: "Un tableau compare franchement Snowball Pro à ProjectionLab, Finary et les simulateurs SEO (fiscalité FR, historique réel, Monte Carlo — chaque case se vérifie), une démo « Je veux 1 M€ → combien par mois ? » calcule votre épargne en direct avec le vrai solveur, le FAQ passe en schema FAQPage pour les AI answers, et les « Dernières éditions » renvoient désormais vers une page changelog complète.",
  },
  {
    version: "v6.17.0",
    title: "La bande « taux fixe » sous le héro",
    text: "Snowball Pro se démarque des simulateurs qui supposent un rendement fixe : sous le héro, une bande rappelle notre méthode — 100 ans de vraie histoire rejouée, krachs inclus, sans citer le moindre taux en dur.",
  },
  {
    version: "v6.16.0",
    title: "Mobile 100 % — résultat d'abord",
    text: "Sur téléphone, le simulateur affiche d'abord le capital final et les onglets (les réglages passent en dessous), le bandeau « Commencez ici » devient compact et défilant, les champs ne déclenchent plus le zoom iOS et les boutons sont plus faciles à toucher. Le site est aussi prêt pour une future app iOS (Capacitor).",
  },
  {
    version: "v6.14.0",
    title: "4 pages alternatives + page tarifs",
    text: "Quatre comparatifs honnêtes (Portfolio Visualizer, FireCalc, Networthify, Quantalys) et une page Tarifs « 100 % gratuit » — indexées au sitemap, dans llms.txt et liées depuis le pied de page de la landing.",
  },
]

export function LandingPage() {
  const { tr, fmtCurrency, locale } = useLang()
  const [darkMode, setDarkMode] = useState<boolean>(loadInitialDarkMode)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  // Scénario actif de la démo interactive : le héro devient un vrai simulateur.
  const [heroScenario, setHeroScenario] = useState<ReturnScenario>("central")
  // Démo éditable (2.1) : 3 curseurs branchés sur le vrai moteur — le visiteur
  // se projette avec SES chiffres (IKEA effect), puis repart via deep-link #s=.
  const [heroCapital, setHeroCapital] = useState(10000)
  const [heroMonthly, setHeroMonthly] = useState(500)
  const [heroDuration, setHeroDuration] = useState(25)
  // Démo « objectif inversé » (5.1) : objectif + horizon réglables, le solveur
  // de l'app (solveGoal) calcule l'épargne mensuelle en direct.
  const [goalTarget, setGoalTarget] = useState(500_000)
  const [goalDuration, setGoalDuration] = useState(28)
  // Replay des krachs (3.2) : année de départ active (défaut 2008, le grand
  // plongeon — la bascule 2000/2008/2022 rejoue le vrai MSCI World).
  const [crashYear, setCrashYear] = useState<CrashYear>(2008)
  // Démo retraite (5.3) : l'année où le visiteur liquide son capital et le
  // capital liquidé — le moteur rejoue la retraite réelle, garde-fous inclus.
  const [retirementYear, setRetirementYear] = useState(2008)
  const [retirementCapital, setRetirementCapital] = useState(500_000)
  // CRO v6.8 — CTA sticky mobile : apparu après un scroll de 480 px (rendu en
  // bas de page). Le masquage ≥ sm est purement CSS (md:hidden) : jsdom n'a
  // pas de matchMedia, la logique ici ne dépend que du scroll.
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)

  // Le thème est une préférence d'appareil partagée avec l'app (même clé).
  useEffect(() => {
    persistThemeClass(darkMode)
  }, [darkMode])

  // CTA sticky mobile : état recalculé à chaque scroll (et au montage).
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY ?? 0
      setStickyCtaVisible(y > 480)
      setShowTop(y > 1200)
      try {
        const h = document.documentElement.scrollHeight - window.innerHeight
        setScrollProgress(h > 0 ? Math.min(1, Math.max(0, y / h)) : 0)
      } catch {
        /* jsdom */
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Chiffres des sections : TOUS calculés par le vrai moteur (le héro a son
  // propre HeroChart, lui aussi exécuté par runSimulation).
  const base = useMemo(() => parseStoredInputs(null), [])

  // Rendements réels par scénario (même source que le moteur — jamais codés en dur).
  const rates = useMemo(() => {
    const historical = getHistoricalDataset(base.historicalIndex)
    return {
      prudent: historical.netReturn,
      central: historical.compoundedReturn,
      optimiste: historical.avgReturn,
    }
  }, [base])

  // Taux fiscaux 2026 dérivés du moteur (taxRules.ts) — la landing ne cite
  // jamais un taux en dur : elle suit automatiquement les règles appliquées
  // par l'app (v6.8 : « 17,2 % » et « PFU 30 % » cités avant étaient les taux
  // 2025, contradictoires avec le moteur qui applique 18,6 % / 31,4 %).
  const tax = useMemo(() => {
    const rules = getTaxRules()
    return { pfu: fmtTaxPercent(pfuRate(rules)), pea: fmtTaxPercent(rules.socialRate) }
  }, [])

  // Séries complètes pour la démo interactive (la courbe change de forme).
  // La démo éditable rejoue le moteur avec les réglages du visiteur.
  const heroRows = useMemo(
    () =>
      Object.fromEntries(
        SCENARIO_ORDER.map(s => [
          s,
          runSimulation({
            ...base,
            capitalInitial: heroCapital,
            monthlyPayment: heroMonthly,
            duration: heroDuration,
            returnScenario: s,
          }),
        ]),
      ) as Record<ReturnScenario, YearRow[]>,
    [base, heroCapital, heroMonthly, heroDuration],
  )

  const heroLast = heroRows[heroScenario][heroRows[heroScenario].length - 1]
  const heroInvested = heroLast.investedNom
  const heroGrowth = Math.max(0, heroLast.nominal - heroInvested)

  // Objectif inversé : même solveur que l'onglet « Combien investir ? » de
  // l'app, sur le rendement composé réel (scénario Central) — zéro épargne de
  // départ, la démo répond à « combien par mois ? ».
  const goalRes = useMemo(
    () => solveGoal({ ...base, goalTarget, goalDuration, goalCapital: 0, goalAnnualReturn: rates.central }),
    [base, rates, goalTarget, goalDuration],
  )
  const goalPmt = goalRes.pmtPerMonth ?? 0
  const goalMeta = GOAL_DIFFICULTY_META[goalRes.difficulty]

  // Replay des krachs : chiffres TOUJOURS dérivés du moteur (jamais en dur).
  const crash = useMemo(() => replayCrashFrom(crashYear), [crashYear])
  const crashDrawdownPct = Math.round((crash?.maxDrawdown ?? 0) * 100)
  const crashTroughValue = crash?.values.find(v => v.year === crash.troughYear)?.value
  const fmt2 = (v: number | undefined) =>
    v === undefined ? "—" : v.toLocaleString(locale, { maximumFractionDigits: 2 })

  // Démo retraite (5.3) : le vrai moteur de décaissement, pas une maquette.
  // Retrait de la règle des 4 % (le modèle « rule-4 » du moteur), rente indexée
  // sur l'inflation réelle de chaque année rejouée, garde-fous dynamiques ON.
  const retirementInputs = useMemo(
    () => ({ ...base, withdrawalModel: "rule-4" as const, withdrawalInflation: true }),
    [base],
  )
  const retirementScenario = useMemo(() => {
    const found = STRESS_TEST_SCENARIOS.find(s => s.startYear === retirementYear)
    if (!found) throw new Error(`scénario de retraite ${retirementYear} introuvable`)
    return found
  }, [retirementYear])
  const retirement = useMemo(
    () => runStressTest(retirementInputs, retirementCapital, retirementScenario),
    [retirementInputs, retirementCapital, retirementScenario],
  )
  // Même retraite SANS les garde-fous : l'écart est le propos de la section
  // (couper 10 % après une année négative sauve la rente là où elle s'épuisait).
  const retirementNoGuards = useMemo(
    () => runStressTest({ ...retirementInputs, dynamicGuardrails: false }, retirementCapital, retirementScenario),
    [retirementInputs, retirementCapital, retirementScenario],
  )
  const retirementMonthly = baseMonthlyWithdrawal(retirementInputs, retirementCapital)
  const retirementEndYear = retirement.windowReturns[retirement.windowReturns.length - 1]?.year ?? retirementYear
  const retirementYearsPlayed = retirement.windowReturns.length
  const retirementWorstIdx = retirement.yearsPath.indexOf(Math.min(...retirement.yearsPath))
  const retirementWorstYear = retirementWorstIdx <= 0 ? retirementYear : retirementYear + retirementWorstIdx - 1
  const retirementFirstDrop = Math.round(Math.abs(retirement.windowReturns[0]?.return ?? 0) * 100)
  const retirementGuardNote = !retirement.survived
    ? tr("Même avec les garde-fous, la rente s'épuise en {year}.", { year: retirement.ruinYear ?? "" })
    : retirementNoGuards.ruinYear !== null
      ? tr(
          "Sans les garde-fous dynamiques, elle s'épuisait en {year} : couper 10 % après une année négative, c'est ce qui la sauve.",
          { year: retirementNoGuards.ruinYear },
        )
      : tr(
          "Sans les garde-fous, il restait {value} € en {endYear} — les coupes de 10 % après une année négative changent la fin de l'histoire.",
          { value: fmtCurrency(retirementNoGuards.finalCapital), endYear: retirementEndYear },
        )

  const scenarios = useMemo(
    () => SCENARIO_ORDER.map(s => ({ scenario: s, last: heroRows[s][heroRows[s].length - 1] })),
    [heroRows],
  )

  // Les trois profils de la landing ET du bandeau « Commencez ici » de l'app
  // partagent la même source (utils/quickStart.ts) : mêmes situations, mêmes
  // chiffres, aucune dérive possible. Le capital final est calculé par le
  // moteur (résultat d'abord, comme partout).
  const profiles = useMemo(
    () =>
      QUICKSTART_PROFILES.map(p => {
        const rows = runSimulation({ ...base, ...p.patch })
        return { ...p, last: rows[rows.length - 1] }
      }),
    [base],
  )

  // Notes fiscales des profils : dérivées des règles 2026 du moteur
  // (taxRules.ts) — plus de taux en dur qui se périment.
  const noteForProfile = (envelope: EnvelopeType | undefined): string => {
    switch (envelope) {
      case "pea":
        return tr("PEA : {rate} de cotisations sociales après 5 ans de détention, plafond 150 000 €.", {
          rate: tax.pea,
        })
      case "av":
        return tr("AV : abattement annuel de 4 600 € (9 200 € en couple) après 8 ans de détention.")
      case "per":
        return tr("PER : versements déduits à votre TMI à l'entrée, sortie imposée selon la nature des fonds.")
      default:
        return tr("CTO : impôt unique de {rate} sur les gains, ou barème progressif à votre TMI.", { rate: tax.pfu })
    }
  }

  const launch = () => navigateTo("app")

  // « Repartir de cette simulation » : écrit un hash #s=… (deep-link v6) qui
  // route vers l'app AVEC les réglages d'objectif de la démo — parseHash
  // traite #s= comme la vue app, loadInitialInputs lit l'état partagé.
  const launchFromGoal = () => {
    window.location.hash = encodeInputsForUrl({
      ...base,
      goalTarget,
      goalDuration,
      goalCapital: 0,
      goalAnnualReturn: rates.central,
    })
  }

  // Démo éditable (2.1) : même pattern, avec les réglages du héro (capital,
  // mensuel, durée, scénario) — l'app s'ouvre avec la simulation du visiteur.
  const launchFromHero = () => {
    window.location.hash = encodeInputsForUrl({
      ...base,
      capitalInitial: heroCapital,
      monthlyPayment: heroMonthly,
      duration: heroDuration,
      returnScenario: heroScenario,
    })
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <h1 className="sr-only">
        {tr(
          "Snowball Pro — simulateur patrimonial français : projection d'épargne, fiscalité CTO PEA AV PER, Monte Carlo et rente retraite",
        )}
      </h1>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <header className="sticky-header sticky top-0 z-40 border-b border-border/70 backdrop-blur-xl bg-surface/72 no-print">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          <a href="#/" aria-label={tr("Snowball Pro — accueil")} className="flex items-center">
            <Brand />
          </a>
          <nav
            aria-label={tr("Navigation principale")}
            className="hidden lg:flex items-center gap-1 max-w-[560px] overflow-x-auto"
          >
            {NAV.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="px-2.5 py-2 rounded-lg text-[11px] font-bold text-text-muted hover:text-text hover:bg-glass-hover transition-colors whitespace-nowrap"
              >
                {tr(item.label)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              aria-label={tr(darkMode ? "Passer en mode clair" : "Passer en mode sombre")}
              title={tr(darkMode ? "Passer en mode clair" : "Passer en mode sombre")}
              className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors"
            >
              {darkMode ? <Sun size={13} aria-hidden /> : <Moon size={13} aria-hidden />}
              <span className="hidden sm:inline">{tr(darkMode ? "Clair" : "Sombre")}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo("login")}
              aria-label={tr("Se connecter")}
              className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover text-primary border border-primary/30 transition-colors"
            >
              <User size={14} className="sm:hidden" aria-hidden />
              <span className="hidden sm:inline">{tr("Se connecter")}</span>
            </button>
            <button
              type="button"
              onClick={launch}
              aria-label={tr("Calculer mon nombre magique")}
              className="btn-shine inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-[11px] font-extrabold bg-primary btn-gold-text shadow-gold transition-all duration-150 active:scale-[0.97] hover:brightness-110"
            >
              <span className="hidden sm:inline">{tr("Calculer mon nombre magique")}</span>
              <span className="sm:hidden">{tr("Calculer")}</span>
              <ArrowRight size={12} aria-hidden />
            </button>
          </div>
        </div>
        <nav
          aria-label={tr("Navigation principale")}
          className="hidden sm:block lg:hidden border-t border-border/60 overflow-x-auto"
        >
          <div className="flex items-center gap-1 px-4 py-2 w-max">
            {NAV.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold text-text-muted hover:text-text hover:bg-glass-hover transition-colors whitespace-nowrap"
              >
                {tr(item.label)}
              </a>
            ))}
          </div>
        </nav>
        <div aria-hidden className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />
      </header>

      {/* ── Héro (démo interactive) ─────────────────────────────────────── */}
      <section aria-label={tr("Démo interactive")} className="relative overflow-hidden">
        <div aria-hidden className="aurora" />
        <div aria-hidden className="absolute inset-0 pointer-events-none hero-grid" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-pulse-glow"
          style={{
            background:
              "radial-gradient(90% 60% at 50% -10%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 65%), radial-gradient(50% 35% at 82% 22%, color-mix(in srgb, var(--color-primary) 7%, transparent), transparent 60%)",
          }}
        />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-full mb-4 shadow-gold">
              <span aria-hidden className="eyebrow-dot" /> <Sparkles size={11} aria-hidden />{" "}
              {tr("Fiscalité française 2026 · 100 ans d'historique réel")}
            </p>
            <h2
              aria-label={tr("Combien peut valoir votre épargne dans 25 ans ?")}
              className="font-display text-[clamp(2.8rem,6vw,4.8rem)] font-extrabold tracking-[-0.04em] leading-[1.02] text-balance"
            >
              <span className="block">{tr("Combien peut valoir votre épargne")}</span>
              <span className="block">
                <span className="text-gold-gradient whitespace-nowrap">{tr("dans 25 ans")}</span> ?
              </span>
            </h2>
            <p className="text-sm sm:text-[15px] text-text-muted mt-5 leading-relaxed max-w-xl">
              {tr(
                "Votre nombre magique, c'est le capital final de votre épargne — calculé sur 100 ans de vraie histoire boursière, krachs inclus. En 30 secondes, sans inscription, sur votre appareil.",
              )}
            </p>
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <button
                type="button"
                onClick={launch}
                className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-sm px-6 py-3.5 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110 hover:scale-[1.02]"
              >
                {tr("Calculer mon nombre magique")} <ArrowRight size={15} aria-hidden />
              </button>
              <a
                href="#methode"
                className="inline-flex items-center gap-2 rounded-2xl glass px-6 py-3.5 text-sm font-bold text-text hover:bg-glass-hover transition-colors"
              >
                {tr("Voir la méthode")} <ArrowDown size={14} aria-hidden />
              </a>
            </div>
            <ul className="flex items-center gap-4 mt-4 flex-wrap text-[10.5px] text-text-dim">
              {[tr("Gratuit"), tr("Sans inscription"), tr("Vos données restent sur cet appareil")].map(item => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check size={11} className="text-primary" aria-hidden /> {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10.5px] text-text-muted leading-relaxed flex items-start gap-1.5 max-w-xl">
              <ShieldCheck size={11} className="text-primary shrink-0 mt-0.5" aria-hidden />
              {tr(
                "Des chiffres réels, pas des promesses : chaque nombre de cette page est calculé en direct par le moteur, sur les vrais rendements MSCI World 1970-2025 — krachs inclus, fiscalité française 2026.",
              )}
            </p>
          </motion.div>

          {/* Démo réelle interactive : curseurs + bascule de scénario, le moteur recalcule. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <div className="app-window glass-gold shadow-premium-lg ring-1 ring-primary/30 relative overflow-hidden">
              <div className="app-window-bar">
                <span className="app-window-dot bg-danger/70" aria-hidden />
                <span className="app-window-dot bg-warning/70" aria-hidden />
                <span className="app-window-dot bg-success/70" aria-hidden />
                <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted truncate">
                  {tr("Simulation par défaut — démo réelle")}
                </span>
                <span className="ml-auto text-[9.5px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
                  MSCI World 1970-2025
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <ScenarioSwitch value={heroScenario} onChange={setHeroScenario} rates={rates} />

                {/* Démo éditable (2.1) : 3 curseurs branchés sur le vrai moteur, en
                  une rangée compacte (empilés, la carte écrase la colonne
                  texte). La saisie directe est bridée en largeur pour que le
                  libellé ne soit jamais recouvert en colonne étroite. */}
                <div className="slider-xxl mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-0 [&>div]:mb-2 [&_input[type=text]]:w-20">
                  <SliderInput
                    label={tr("Montant initial (€)")}
                    id="landing-hero-capital"
                    value={heroCapital}
                    min={0}
                    max={200000}
                    step={1000}
                    color="var(--color-primary)"
                    hideBounds
                    onChange={setHeroCapital}
                  />
                  <SliderInput
                    label={tr("Versement mensuel (€)")}
                    id="landing-hero-monthly"
                    value={heroMonthly}
                    min={0}
                    max={5000}
                    step={50}
                    color="var(--color-primary)"
                    hideBounds
                    onChange={setHeroMonthly}
                  />
                  <SliderInput
                    label={tr("Durée (ans)")}
                    id="landing-hero-duration"
                    value={heroDuration}
                    min={5}
                    max={40}
                    step={1}
                    color="var(--color-primary)"
                    hideBounds
                    onChange={setHeroDuration}
                  />
                </div>

                {/* Le nombre magique : résultat d'abord, recalculé à chaque réglage. */}
                <div className="mt-3">
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
                        {tr("Capital final")} · {tr(SCENARIO_META[heroScenario].label)}
                      </p>
                      <p className="stat-glow font-display text-4xl sm:text-[2.75rem] font-extrabold tracking-tight text-text mono leading-none">
                        <AnimatedAmount value={heroLast.nominal} />
                      </p>
                    </div>
                    <div className="text-right pb-0.5">
                      <p className="text-[9.5px] text-text-dim">{tr("en € d'aujourd'hui")}</p>
                      <p className="mono text-base font-bold text-text-muted">{fmtCurrency(heroLast.real)}</p>
                    </div>
                  </div>
                  <DecompositionBar invested={heroInvested} growth={heroGrowth} />
                </div>

                {/* La courbe, exécutée par le vrai moteur (clé = réglages → redessin animé). */}
                <div className="mt-3">
                  <HeroChart
                    key={`${heroScenario}-${heroCapital}-${heroMonthly}-${heroDuration}`}
                    rows={heroRows[heroScenario]}
                    inputs={{
                      ...base,
                      capitalInitial: heroCapital,
                      monthlyPayment: heroMonthly,
                      duration: heroDuration,
                      returnScenario: heroScenario,
                    }}
                    footer={false}
                  />
                  <p className="text-[10px] text-text-dim mt-2 flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-primary shrink-0" aria-hidden />
                    {heroDuration} {tr("ans")} · {heroMonthly.toLocaleString(locale)} €/{tr("mois")} ·{" "}
                    {tr(SCENARIO_META[heroScenario].desc)}
                  </p>
                  <button
                    type="button"
                    onClick={launchFromHero}
                    className="btn-shine mt-3 inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-[13px] px-5 py-2.5 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110 hover:scale-[1.02]"
                  >
                    {tr("Repartir de cette simulation")} <ArrowRight size={14} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Bande « attaque du cluster taux fixe » (1.2) — le message le
          plus drastique et le plus défendable, juste sous le héro. Pas de
          taux en dur (décision utilisateur) : la promesse porte sur la
          méthode — un rendement fixe supposé vs 100 ans d'historique réel. */}
      <section
        aria-label={`${tr("Les autres simulateurs supposent un rendement fixe.")} ${tr(
          "Nous, on rejoue 100 ans de vraie histoire, krachs inclus.",
        )}`}
        className="relative overflow-hidden border-y border-primary/25 bg-surface-50"
      >
        <div aria-hidden className="aurora" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-9 sm:py-11 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-center">
          <p className="text-sm sm:text-base font-bold leading-snug text-text-muted">
            {tr("Les autres simulateurs supposent un rendement fixe.")}
          </p>
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/12 border border-primary/30 shrink-0">
            <ArrowRight size={15} className="text-primary rotate-90 md:rotate-0" aria-hidden />
          </span>
          <p className="font-display text-xl sm:text-[1.5rem] font-extrabold tracking-tight leading-snug text-text text-balance">
            {tr("Nous, on rejoue 100 ans de vraie histoire, krachs inclus.")}
          </p>
        </div>
      </section>

      {/* ── Chiffres clés ───────────────────────────────────────────────── */}
      <section aria-label={tr("Chiffres clés")} className="border-y border-border/70 bg-surface-50/70">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <CountUpStat
            value={100}
            suffix=" ans"
            label="d'historique réel — S&P 500 1926-1969 + MSCI World 1970-2025"
            icon={History}
            delay={300}
          />
          <CountUpStat
            value={10000}
            suffix=""
            label="scénarios Monte Carlo — P10, P50, P90 et probabilité de succès"
            icon={Dices}
            delay={450}
          />
          <CountUpStat
            value={4}
            suffix=""
            label="enveloppes fiscales françaises : CTO, PEA, AV, PER"
            icon={Landmark}
            delay={600}
          />
          <CountUpStat
            value={100}
            suffix=" %"
            label="local — calculé sur votre appareil, zéro serveur"
            icon={Lock}
            delay={750}
          />
        </div>
      </section>

      {/* ── Replay des krachs (3.2) — l'élément signature. 2000 / 2008 /
          2022 rejoués avec le VRAI MSCI World EUR (replayCrashFrom) : le
          creux, la baisse maximale et le retour à l'équilibre sont dérivés
          de la série — aucun chiffre en dur. */}
      <section
        id="krachs"
        aria-label={tr("Vos 100 € face aux krachs")}
        className="border-t border-border/70 bg-surface-50/50 scroll-mt-20"
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <Reveal>
            <SectionTitle
              eyebrow="Histoire réelle"
              title="Vos 100 € face aux krachs"
              sub="Choisissez une année de départ : c'est le vrai MSCI World, rejoué année par année, dividendes réinvestis. Personne ne vous montre ça — parce qu'il faut l'assumer."
            />
          </Reveal>
          <Reveal>
            <div className="glass-strong rounded-3xl p-5 sm:p-8 shadow-premium-lg ring-1 ring-primary/30 relative overflow-hidden">
              {/* Sélecteur d'année (radiogroup, comme la démo du héro). */}
              <div
                role="radiogroup"
                aria-label={tr("Année de départ du replay")}
                className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface-50/70 border border-border max-w-xs mx-auto mb-8"
              >
                {CRASH_YEARS.map(year => {
                  const active = crashYear === year
                  return (
                    <button
                      key={year}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCrashYear(year)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-center text-[11px] font-extrabold mono transition-all duration-200",
                        active
                          ? "bg-primary btn-gold-text shadow-gold"
                          : "text-text-muted hover:text-text hover:bg-glass-hover",
                      )}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 items-center">
                {/* Colonne chiffres — le creux + le retour, moteur réel. */}
                <div className="text-center md:text-left">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
                    {tr("au pire, votre épargne")}
                  </p>
                  <p className="font-display text-6xl sm:text-7xl font-extrabold tracking-tight text-primary mono leading-none drop-shadow-[0_0_24px_rgba(212,175,55,0.25)]">
                    −{crashDrawdownPct} <span className="text-2xl font-bold text-text-muted">%</span>
                  </p>
                  <p className="mt-2 text-[11px] text-text-muted">
                    {tr("100 € → {value} € en {year}", {
                      value: fmt2(crashTroughValue),
                      year: crash?.troughYear ?? "",
                    })}
                  </p>
                  {crash?.recoveryYear && (
                    <p className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold border border-border/60 bg-surface/50 text-text">
                      <TrendingUp size={11} className="text-primary shrink-0" aria-hidden />
                      {tr("revenu à 100 € en {year}", { year: crash.recoveryYear })}
                    </p>
                  )}
                  <p className="mt-4 text-[10.5px] text-text-dim">
                    {tr("et {value} € fin {year}", { value: fmt2(crash?.finalValue), year: crash?.endYear ?? "" })}
                  </p>
                </div>

                {/* Colonne courbe — le replay animé (moteur réel). */}
                <div>
                  {crash ? (
                    <CrashChart key={crashYear} replay={crash} />
                  ) : (
                    <p className="text-xs text-text-muted">{tr("Replay indisponible pour cette année.")}</p>
                  )}
                  <p className="text-[9.5px] text-text-dim mt-3 leading-relaxed">
                    {tr(
                      "100 € investis en début d'année · MSCI World Net Return EUR, dividendes nets réinvestis · avant frais, fiscalité et versements supplémentaires.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Retraite en pleine crise (5.3) : la décumulation en scène. Le
          visiteur choisit l'année de son départ à la retraite (les trois
          fenêtres réelles du moteur : 1973, 2000, 2008) et son capital ;
          runStressTest rejoue les rendements réels contigus, retraits et
          garde-fous compris. Aucun chiffre en dur. */}
      <section
        id="retraite"
        aria-label={tr("Et si vous preniez votre retraite en 2008 ?")}
        className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20"
      >
        <Reveal>
          <SectionTitle
            eyebrow="La question que personne ne pose"
            title="Et si vous preniez votre retraite en 2008 ?"
            sub="Le marché s'effondre la première année — et vous retirez de l'argent chaque mois. Le moteur rejoue la vraie histoire : retraits, inflation réelle, garde-fous."
          />
        </Reveal>
        <Reveal>
          <div className="glass-strong rounded-3xl p-5 sm:p-8 shadow-premium-lg ring-1 ring-primary/30">
            {/* Année de départ : les trois stress tests réels du moteur. */}
            <div
              role="radiogroup"
              aria-label={tr("Année de départ à la retraite")}
              className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface-50/70 border border-border max-w-xs mx-auto mb-6"
            >
              {RETIREMENT_YEARS.map(year => {
                const active = retirementYear === year
                return (
                  <button
                    key={year}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRetirementYear(year)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-center text-[11px] font-extrabold mono transition-all duration-200",
                      active
                        ? "bg-primary btn-gold-text shadow-gold"
                        : "text-text-muted hover:text-text hover:bg-glass-hover",
                    )}
                  >
                    {year}
                  </button>
                )
              })}
            </div>

            <div className="max-w-md mx-auto mb-8">
              <SliderInput
                label={tr("Capital à la retraite (€)")}
                id="landing-retirement-capital"
                value={retirementCapital}
                min={200_000}
                max={1_500_000}
                step={25_000}
                color="var(--color-primary)"
                onChange={setRetirementCapital}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 items-center">
              {/* Colonne chiffres — la rente, le pire point, la fin. */}
              <div className="text-center md:text-left">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
                  {tr("votre rente la première année")}
                </p>
                <p className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-primary mono leading-none drop-shadow-[0_0_24px_rgba(212,175,55,0.25)]">
                  {fmtCurrency(retirementMonthly)}
                  <span className="text-2xl font-bold text-text-muted"> /{tr("mois")}</span>
                </p>
                <p className="mt-2 text-[11px] text-text-muted">
                  {tr("règle des 4 % — la rente est indexée sur l'inflation de chaque année rejouée")}
                </p>
                <p
                  className={cn(
                    "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold border",
                    retirement.survived
                      ? "border-border/60 bg-surface/50 text-text"
                      : "border-[color:var(--color-value-red)]/40 bg-[color:var(--color-value-red)]/10 text-[color:var(--color-value-red)]",
                  )}
                >
                  {retirement.survived ? (
                    <>
                      <Check size={11} className="text-primary shrink-0" aria-hidden />
                      {tr("la rente tient jusqu'en {endYear}", { endYear: retirementEndYear })}
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={11} className="shrink-0" aria-hidden />
                      {tr("la rente s'épuise en {ruinYear}", { ruinYear: retirement.ruinYear ?? "" })}
                    </>
                  )}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-left">
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">
                      {tr("la première année")}
                    </dt>
                    <dd className="mono text-sm font-extrabold text-text">−{retirementFirstDrop} %</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">{tr("au pire")}</dt>
                    <dd className="mono text-sm font-extrabold text-text">
                      {fmtCurrency(retirement.minCapital)}{" "}
                      <span className="text-[10px] font-bold text-text-muted">{retirementWorstYear}</span>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-text-dim">
                      {tr("en {endYear}, après {years} ans rejoués", {
                        endYear: retirementEndYear,
                        years: retirementYearsPlayed,
                      })}
                    </dt>
                    <dd className="mono text-sm font-extrabold text-primary">{fmtCurrency(retirement.finalCapital)}</dd>
                  </div>
                </dl>

                <p className="mt-4 text-[10.5px] text-text-dim leading-relaxed">{retirementGuardNote}</p>
              </div>

              {/* Colonne courbe — le capital restant, moteur réel. */}
              <div>
                <RetirementChart
                  key={`${retirementYear}-${retirementCapital}`}
                  path={retirement.yearsPath}
                  startYear={retirementYear}
                  endYear={retirementEndYear}
                  initial={retirement.yearsPath[0] ?? retirementCapital}
                />
                <p className="text-[9.5px] text-text-dim mt-3 leading-relaxed">
                  {tr(
                    "Moteur réel — {years} ans de retraite prévus, fenêtre bornée par la fin de l'historique · CTO, frais et fiscalité inclus · inflation française réelle des années rejouées.",
                    { years: retirementInputs.retirementYears },
                  )}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Fonctionnalités ─────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20">
        <Reveal>
          <SectionTitle
            eyebrow="Fonctionnalités"
            title="Quatre onglets, une question : où va votre argent ?"
            sub="Projection, robustesse, rente & retraite, objectif inversé — chaque outil répond à un besoin précis, sur les mêmes données réelles."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              icon: LineChart,
              title: "Projection lissée",
              text: "Votre capital année après année, sans hasard : une courbe claire, avec le pouvoir d'achat en euros d'aujourd'hui toujours visible — et la décomposition épargne / croissance dès l'ouverture.",
            },
            {
              icon: Dices,
              title: "Robustesse Monte Carlo",
              text: "L'historique réel rejoué par blocs sur 10 000 scénarios : P10, P50, P90, probabilité de succès et histogramme des capitaux finaux — planifiez sur la médiane, pas la moyenne.",
            },
            {
              icon: Banknote,
              title: "Rente & retraite",
              text: "Garde-fous dynamiques, inflation réelle INSEE, stress tests 1973 · 2000 · 2008, et le scénario « et si le départ tombait en pleine crise ? ».",
            },
            {
              icon: Landmark,
              title: "Fiscalité française",
              text: "CTO, PEA, AV, PER : PFU, barème, TMI, abattements — les règles 2026 appliquées à la lettre, y compris la durée de détention du PEA.",
            },
            {
              icon: Target,
              title: "Objectif inversé",
              text: "« Combien investir pour atteindre X € ? » — l'épargne mensuelle nécessaire est calculée en une seconde, avec une jauge d'atteignabilité.",
            },
            {
              icon: Share2,
              title: "Partage & comparaison",
              text: "Lien de partage de votre scénario, comparaison A/B, snapshots, annuler/rétablir, export CSV, JSON et rapport PDF.",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <FeatureCard icon={f.icon} title={f.title}>
                {tr(f.text)}
              </FeatureCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Scénarios (moteur réel) ─────────────────────────────────────── */}
      <section id="scenarios" className="border-t border-border/70 bg-glass/30 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <Reveal>
            <SectionTitle
              eyebrow="Scénarios"
              title="Trois scénarios, un seul moteur"
              sub="Le même historique réel rejoué trois fois. L'app applique le Central par défaut — changez de monde en un clic, les chiffres suivent."
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <Reveal>
              <ScenarioCard
                badge="Prudent"
                title="Le monde réel, après inflation"
                rate="≈ 5,99 %/an"
                last={scenarios[0]?.last ?? null}
                text="Chaque année, le rendement réel composé de l'historique (déflaté de l'inflation) : votre plan tient-il même sans la bourse au sec ?"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <ScenarioCard
                badge="Central · défaut"
                title="La géométrie, krachs inclus"
                rate="≈ 8,22 %/an"
                last={scenarios[1]?.last ?? null}
                text="La moyenne géométrique du MSCI World, 2000, 2008 et 2022 inclus. C'est le scénario appliqué par défaut : la projection honnête, pas la meilleure moyenne."
              />
            </Reveal>
            <Reveal delay={0.16}>
              <ScenarioCard
                badge="Optimiste"
                title="La moyenne des années"
                rate="≈ 10,07 %/an"
                last={scenarios[2]?.last ?? null}
                text="La moyenne arithmétique des années boursières : le haut de la fourchette. Utile pour l'imaginer — mais les krachs ne se lissent pas."
              />
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="text-[10.5px] text-text-dim mt-6 text-center">
              {tr(
                "Moteur réel — mêmes défauts que l'app (10 k€, 500 €/mois, 25 ans, CTO, frais inclus). Vos chiffres dans l'app, en changeant le scénario dans « Votre épargne ».",
              )}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Comparaison honnête (1.4 + 4.2) : le tableau vs les vrais
          concurrents + maillage interne vers les comparatifs détaillés. Les
          cases viennent du résumé concurrentiel (competitor-profiles/) —
          ⚠ = partiel / à vérifier, jamais de ✕ inventé. */}
      <section
        id="comparaison"
        aria-label={tr("Comment on se compare")}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20"
      >
        <Reveal>
          <SectionTitle
            eyebrow="Comparaison"
            title="Le tableau honnête"
            sub="Ni pub, ni coup marketing : ce que chaque outil fait vraiment, vérifié en août 2026. Chaque case se vérifie — les nôtres, dans le code."
          />
        </Reveal>
        <Reveal>
          <div className="glass-strong rounded-3xl overflow-hidden shadow-premium ring-1 ring-primary/20 overflow-x-auto">
            <table className="compare-table w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-primary/8 border-b border-primary/20">
                  <th className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted px-4 py-4">
                    {tr("Ce que l'outil fait")}
                  </th>
                  {COMPARE_COLS.map((name, i) => (
                    <th key={name} className={cn("px-4 py-4 text-left", i === 0 && "bg-primary/10")}>
                      <span
                        className={cn(
                          "text-[11px] font-extrabold uppercase tracking-[0.12em]",
                          i === 0 ? "text-primary" : "text-text",
                        )}
                      >
                        {tr(name)}
                      </span>
                      {i === 0 && (
                        <span className="ml-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded align-middle">
                          {tr("vous")}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, ri) => (
                  <tr key={row.label} className={cn("border-t border-border/60", ri % 2 === 1 && "bg-glass/40")}>
                    <th scope="row" className="text-left text-[11.5px] font-bold text-text px-4 py-3.5 leading-snug">
                      {tr(row.label)}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td
                        key={i}
                        data-col={tr(COMPARE_COLS[i])}
                        className={cn("px-4 py-3.5", i === 0 && "bg-primary/10 ring-1 ring-inset ring-primary/20")}
                      >
                        <CompareCellView cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] text-text-dim leading-relaxed">
            {tr("Légende :")}{" "}
            <span className="inline-flex items-center gap-1 mr-3">
              <Check size={11} style={{ color: "var(--color-success)" }} aria-hidden /> {tr("oui")}
            </span>
            <span className="inline-flex items-center gap-1 mr-3">
              <AlertTriangle size={11} style={{ color: "var(--color-danger-light)" }} aria-hidden />{" "}
              {tr("partiel — à vérifier")}
            </span>
            <span className="inline-flex items-center gap-1">
              <X size={11} className="text-text-dim/60" aria-hidden /> {tr("non")}
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-[11px] text-text-muted leading-relaxed max-w-3xl mx-auto text-center mt-8">
            {tr(
              "Vérifié le 17 août 2026 sur les pages publiques de chaque outil — les offres évoluent. ProjectionLab est un excellent produit, mais 100 % fiscalité US ; Finary agrège votre patrimoine, il ne simule pas l'avenir ; les simulateurs SEO supposent un rendement fixe. C'est exactement ce que nous ne faisons pas.",
            )}
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              {tr("Nos comparatifs détaillés")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {ALTERNATIVES_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-xl glass px-3.5 py-2 text-[11px] font-bold text-text hover:bg-glass-hover transition-colors"
                >
                  {tr(link.label)} <ArrowRight size={11} className="text-primary" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Manifeste « Ce que nous ne faisons pas » (5.2) — l'envers de
          l'attaque 1.2, juste après le tableau honnête : la preuve par
          l'honnêteté. Aucun simulateur français n'ose l'écrire. */}
      <section
        id="manifeste"
        aria-label={tr("Ce que nous ne faisons pas")}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20"
      >
        <Reveal>
          <SectionTitle
            eyebrow="Manifeste"
            title="Ce que nous ne faisons pas"
            sub="L'envers de la promesse. Aucun simulateur français n'ose l'écrire — voici notre liste, vérifiable dans le code."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {MANIFESTO.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07}>
              <article className="manifesto-card rounded-3xl p-6 card-interactive h-full">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 border"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
                    borderColor: "color-mix(in srgb, var(--color-danger) 28%, transparent)",
                  }}
                >
                  <Ban size={19} style={{ color: "var(--color-danger)" }} aria-hidden />
                </div>
                <h3 className="font-display font-bold text-[15px] text-text mb-2">{tr(item.title)}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{tr(item.text)}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15}>
          <p className="text-center text-[11.5px] text-text-muted mt-8 max-w-2xl mx-auto leading-relaxed">
            {tr(
              "Ce que les autres font pour gagner de l'argent, nous ne le faisons pas — et c'est vérifiable : chaque chiffre de ce site est calculé par le moteur, sur votre appareil.",
            )}
          </p>
          <div className="text-center mt-4">
            <a
              href="#comparaison"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-primary hover:underline transition-colors"
            >
              {tr("Revoir le tableau honnête")} <ArrowRight size={12} aria-hidden />
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── Enveloppes ──────────────────────────────────────────────────── */}
      <section id="enveloppes" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20">
        <Reveal>
          <SectionTitle
            eyebrow="Fiscalité"
            title="Quatre enveloppes, leurs vraies règles"
            sub="Le moteur applique les régimes réels — pas d'approximation : votre impôt dépend de l'enveloppe, de la durée de détention et de votre TMI."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              badge: "Compte-titres",
              title: "CTO",
              text: `Impôt unique de ${tax.pfu} sur les gains, ou barème progressif à votre TMI — à vous de choisir le plus avantageux.`,
            },
            {
              badge: "PEA",
              title: "Plan d'épargne en actions",
              text: `${tax.pea} de cotisations sociales après 5 ans de détention, plafond 150 000 € (300 000 € en couple). Le curseur de détention change vraiment les chiffres.`,
            },
            {
              badge: "Assurance-vie",
              title: "AV",
              text: "Abattement annuel de 4 600 € (9 200 € en couple) après 8 ans — la fiscalité des gains est modélisée à la sortie.",
            },
            {
              badge: "PER",
              title: "Plan d'épargne retraite",
              text: "Versements déduits à votre TMI à l'entrée, sortie imposée selon la nature des fonds. L'arbitrage se voit dans le héro.",
            },
          ].map((env, i) => (
            <Reveal key={env.badge} delay={i * 0.06}>
              <EnvelopeCard badge={env.badge} title={env.title}>
                {tr(env.text)}
              </EnvelopeCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Méthodologie ────────────────────────────────────────────────── */}
      <section id="methode" className="border-t border-border/70 bg-glass/30 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <Reveal>
            <SectionTitle
              eyebrow="Méthodologie"
              title="Pourquoi 10,07 % → 5,99 % ?"
              sub="Le même indice (MSCI World), trois façons de le compter. À chaque étape on retire une seule chose — la volatilité, puis l'inflation. Aucun chiffre inventé : ce sont les trois scénarios de l'app."
            />
          </Reveal>
          <Reveal>
            <div className="max-w-2xl mx-auto">
              {/* Échelle descendante : brut → composé → réel. Chaque ligne
                  retire UNE chose, dans l'ordre — la volatilité d'abord, puis
                  l'inflation. Même langage que le panneau « Pourquoi ces
                  chiffres ? » de la sidebar. */}
              <div className="glass rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-text">
                      {tr("Brut")} <span className="font-medium text-text-muted">{tr("— la moyenne des années")}</span>
                    </p>
                    <p className="text-[10.5px] text-text-dim mt-0.5">
                      {tr("moyenne arithmétique")} · {tr("scénario")}{" "}
                      <span className="font-semibold text-text">{tr("Optimiste")}</span>
                    </p>
                  </div>
                  <p className="mono text-[28px] font-extrabold tracking-tight text-text shrink-0">
                    10,07 <span className="text-[11px] font-medium text-text-muted">{tr("%/an")}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 my-3.5 pl-1">
                  <span className="w-6 h-6 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowDown size={13} className="text-primary" aria-hidden />
                  </span>
                  <p className="text-[10.5px] text-text-muted leading-snug">
                    {tr("on retire")} <strong className="text-text">{tr("la volatilité")}</strong>{" "}
                    {tr("— les krachs réels (2000, 2008, 2022…) réduisent le gain réellement composé")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/12 px-4 py-3.5 shadow-gold">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-primary">
                      {tr("Composé")} <span className="font-medium text-text-muted">{tr("— krachs inclus")}</span>
                      <span className="ml-1.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-primary bg-primary/15 border border-primary/30 px-1.5 py-0.5 rounded align-middle">
                        {tr("défaut")}
                      </span>
                    </p>
                    <p className="text-[10.5px] text-text-dim mt-0.5">
                      {tr("moyenne géométrique")} · {tr("scénario")}{" "}
                      <span className="font-semibold text-text">{tr("Central")}</span>
                    </p>
                  </div>
                  <p className="mono text-[28px] font-extrabold tracking-tight text-primary shrink-0">
                    8,22 <span className="text-[11px] font-medium text-text-muted">{tr("%/an")}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 my-3.5 pl-1">
                  <span className="w-6 h-6 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowDown size={13} className="text-primary" aria-hidden />
                  </span>
                  <p className="text-[10.5px] text-text-muted leading-snug">
                    {tr("on retire")} <strong className="text-text">{tr("l'inflation")}</strong> (2,1 %/an) —{" "}
                    {tr("pour connaître votre pouvoir d'achat réel")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-primary">
                      {tr("Réel")} <span className="font-medium text-text-muted">{tr("— après inflation")}</span>
                    </p>
                    <p className="text-[10.5px] text-text-dim mt-0.5">
                      {tr("formule de Fisher")} · {tr("scénario")}{" "}
                      <span className="font-semibold text-text">{tr("Prudent")}</span>
                    </p>
                  </div>
                  <p className="mono text-[28px] font-extrabold tracking-tight text-primary shrink-0">
                    5,99 <span className="text-[11px] font-medium text-text-muted">{tr("%/an")}</span>
                  </p>
                </div>

                <p className="text-[10.5px] text-text-muted mt-5 pt-4 border-t border-border/60 leading-relaxed">
                  {tr(
                    "Pourquoi pas 6,12 % (8,22 − 2,1) ? La soustraction simple est une approximation : la formule exacte de Fisher est",
                  )}{" "}
                  <span className="mono font-semibold text-text">(1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %</span> —{" "}
                  {tr("l'inflation rogne aussi vos gains, pas seulement votre capital de départ.")}
                </p>
                <p className="text-[10px] text-text-dim mt-2 leading-relaxed">
                  {tr("Hypothèse d'inflation :")} <strong className="text-text">{tr("2,1 %/an (cible BCE)")}</strong>,{" "}
                  {tr(
                    "vs 4,0 % en moyenne réelle 1970-2025. La médiane de la période est justement 2,1 % : la moyenne est tirée vers le haut par les chocs des années 1970-1985.",
                  )}
                </p>
                <p className="text-[10px] text-text-dim mt-3 flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-primary shrink-0" aria-hidden />
                  {tr("Sources : S&P 500 SBBI 1926-1969 · MSCI World 1970-2025 · inflation française INSEE 1970-2025.")}
                </p>
              </div>

              {/* 3 étapes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                {[
                  { n: "1", title: "Votre épargne", text: "Capital de départ, versement mensuel, durée." },
                  { n: "2", title: "Votre enveloppe", text: "CTO, PEA, AV ou PER, avec votre fiscalité." },
                  { n: "3", title: "Le résultat d'abord", text: "Capital final, épargne vs croissance, robustesse." },
                ].map((step, i) => (
                  <Reveal key={step.n} delay={i * 0.08}>
                    <div className="glass rounded-2xl p-5">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-light via-primary to-primary-dark btn-gold-text flex items-center justify-center font-extrabold text-xs shadow-gold mb-3">
                        {step.n}
                      </span>
                      <h3 className="font-display font-bold text-[13px] text-text mb-1">{tr(step.title)}</h3>
                      <p className="text-[11px] text-text-muted leading-relaxed">{tr(step.text)}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pour qui (moteur réel) ──────────────────────────────────────── */}
      <section id="pourqui" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20">
        <Reveal>
          <SectionTitle
            eyebrow="Exemples"
            title="Trois profils, trois horizons"
            sub="Le moteur à l'œuvre sur des situations types — les chiffres sont calculés, pas illustrés."
          />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {profiles.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <ProfileCard name={p.name} meta={p.meta} last={p.last} note={noteForProfile(p.patch.envelope)} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p className="text-[10.5px] text-text-dim mt-6 text-center">
            {tr(
              "Moteur réel — versements et durées indiqués sur chaque carte, frais et fiscalité inclus, scénario Central. Ajustez tout cela dans l'app : c'est votre situation qui compte, pas un exemple.",
            )}
          </p>
        </Reveal>
      </section>

      {/* ── Objectif inversé (5.1) : le solveur de l'app branché sur la
          landing. Curseurs réels (Objectif / Horizon), résultat calculé en
          direct par solveGoal — et CTA « Repartir de cette simulation » qui
          écrit un deep-link #s=… décodable par l'app. */}
      <section
        id="objectif"
        aria-label={tr("Objectif inversé")}
        className="border-t border-border/70 bg-glass/30 scroll-mt-20"
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <Reveal>
            <SectionTitle
              eyebrow="Objectif inversé"
              title="Je veux 500 k€ → combien par mois ?"
              sub="Dites-nous votre objectif et votre horizon : le moteur calcule l'épargne mensuelle nécessaire, sur le rendement réel composé du MSCI World — krachs inclus."
            />
          </Reveal>
          <Reveal>
            <div className="glass-gold rounded-3xl p-5 sm:p-8 shadow-premium-lg ring-1 ring-primary/30 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
              <div>
                <SliderInput
                  label={tr("Objectif (€)")}
                  id="landing-goal-target"
                  value={goalTarget}
                  min={100000}
                  max={2000000}
                  step={25000}
                  color="var(--color-primary)"
                  onChange={setGoalTarget}
                />
                <SliderInput
                  label={tr("Horizon (ans)")}
                  id="landing-goal-duration"
                  value={goalDuration}
                  min={5}
                  max={40}
                  step={1}
                  color="var(--color-primary)"
                  onChange={setGoalDuration}
                />
              </div>
              <div className="text-center lg:text-left">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
                  {tr("à épargner chaque mois")}
                </p>
                <p className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-primary mono leading-none">
                  {fmtCurrency(goalPmt)}
                  <span className="text-2xl font-bold text-text-muted"> /{tr("mois")}</span>
                </p>
                <p
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold border border-border/60 bg-surface/50"
                  style={{ color: goalMeta.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: goalMeta.color }} aria-hidden />
                  {tr(goalMeta.label)}
                </p>
                <p className="mt-4 text-[10.5px] text-text-dim leading-relaxed">
                  {tr(
                    "Calcul brut avant fiscalité et frais — dans l'app, votre enveloppe (CTO, PEA, AV, PER) et les règles françaises s'appliquent au résultat.",
                  )}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={launchFromGoal}
                    className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-[13px] px-5 py-3 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110 hover:scale-[1.02]"
                  >
                    {tr("Repartir de cette simulation")} <ArrowRight size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={launch}
                    className="inline-flex items-center gap-2 rounded-2xl glass px-5 py-3 text-[13px] font-bold text-text hover:bg-glass-hover transition-colors"
                  >
                    {tr("Ouvrir l'onglet « Combien investir ? »")}
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-border/70 bg-glass/30 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <Reveal>
            <SectionTitle eyebrow="FAQ" title="Questions fréquentes" />
          </Reveal>
          <div className="space-y-3">
            <Reveal>
              <FaqItem
                question="Mes données sont-elles envoyées sur un serveur ?"
                open={openFaq === 0}
                onToggle={() => setOpenFaq(openFaq === 0 ? null : 0)}
              >
                {tr(
                  "Non. Tout est calculé et stocké dans votre navigateur (localStorage) : aucune donnée ne quitte votre appareil. Un compte crée un espace isolé pour vos simulations sur cet appareil — la synchronisation cloud n'existe pas encore.",
                )}
              </FaqItem>
            </Reveal>
            <Reveal>
              <FaqItem
                question="Un compte est-il obligatoire ?"
                open={openFaq === 1}
                onToggle={() => setOpenFaq(openFaq === 1 ? null : 1)}
              >
                {tr(
                  "Non, l'application fonctionne intégralement sans compte. Un compte vous permet d'isoler vos simulations de celles des autres utilisateurs de l'appareil et prépare la synchronisation future.",
                )}
              </FaqItem>
            </Reveal>
            <Reveal>
              <FaqItem
                question="Prudent, Central, Optimiste : c'est quoi la différence ?"
                open={openFaq === 2}
                onToggle={() => setOpenFaq(openFaq === 2 ? null : 2)}
              >
                {tr(
                  "Trois lectures du même historique (MSCI World 1970-2025). L'app applique par défaut le Central : la moyenne géométrique composée (≈ 8,22 %/an), krachs inclus. L'Optimiste est la moyenne arithmétique des années (≈ 10,07 %), le Prudent le rendement réel après inflation (≈ 5,99 %). Comparez votre plan dans les trois mondes — c'est la même échelle que la section Méthodologie.",
                )}
              </FaqItem>
            </Reveal>
            <Reveal>
              <FaqItem
                question="Pourquoi 10,07 % et pas 6,12 % ?"
                open={openFaq === 3}
                onToggle={() => setOpenFaq(openFaq === 3 ? null : 3)}
              >
                {tr(
                  "10,07 % est la moyenne arithmétique des années (scénario Optimiste) ; l'app applique par défaut le Central, 8,22 %/an composé. 6,12 serait la simple soustraction 8,22 − 2,1 : c'est une approximation. La formule exacte de Fisher est (1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %/an réel — le scénario Prudent.",
                )}
              </FaqItem>
            </Reveal>
            <Reveal>
              <FaqItem
                question="Pourquoi 2,1 % d'inflation et pas la moyenne réelle ?"
                open={openFaq === 4}
                onToggle={() => setOpenFaq(openFaq === 4 ? null : 4)}
              >
                {tr(
                  "2,1 % est une hypothèse d'inflation future (proche de la cible BCE de 2 %), pas la moyenne historique : l'inflation française réelle 1970-2025 est de 4,0 % en moyenne, mais cette moyenne est tirée vers le haut par les chocs des années 1970-1985 (jusqu'à 13,7 % en 1974). La médiane de la période est justement 2,1 %, et depuis 1986 la moyenne n'est que de 1,9 % — pour l'avenir, 2,1 % est une hypothèse raisonnable, voire prudente.",
                )}
              </FaqItem>
            </Reveal>
            <Reveal>
              <FaqItem
                question="Qu'est-ce que Monte Carlo ?"
                open={openFaq === 5}
                onToggle={() => setOpenFaq(openFaq === 5 ? null : 5)}
              >
                {tr(
                  "Jusqu'à 10 000 scénarios qui rejouent l'historique réel par blocs — krachs et bull markets inclus. Vous obtenez les percentiles P10/P50/P90, la probabilité de succès et l'intervalle de confiance de cette estimation.",
                )}
              </FaqItem>
            </Reveal>
            <Reveal>
              <FaqItem
                question="Comment est construit l'historique de 100 ans ?"
                open={openFaq === 6}
                onToggle={() => setOpenFaq(openFaq === 6 ? null : 6)}
              >
                {tr(
                  "S&P 500 SBBI 1926-1969 (dividendes réinvestis) puis MSCI World 1970-2025 : la période récente est couverte par un indice mondial, l'ancienne par le marché américain, seul indice de référence fiable à l'époque. L'inflation utilisée est la série INSEE française.",
                )}
              </FaqItem>
            </Reveal>
            <Reveal>
              <FaqItem
                question="L'application est-elle vraiment gratuite ?"
                open={openFaq === 7}
                onToggle={() => setOpenFaq(openFaq === 7 ? null : 7)}
              >
                {tr("Oui. Gratuite, sans engagement et sans carte bancaire — aujourd'hui et demain.")}
              </FaqItem>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Dernières éditions (CHANGELOG réel) ──────────────────────────── */}
      <section
        id="editions"
        aria-label={tr("Dernières évolutions")}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20"
      >
        <Reveal>
          <div className="flex items-center gap-2 justify-center mb-6">
            <History size={13} className="text-primary" aria-hidden />
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{tr("Dernières éditions")}</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {UPDATES.slice(0, 4).map((u, i) => (
            <Reveal key={u.version} delay={i * 0.07}>
              <article className="glass rounded-2xl p-4 card-interactive">
                <span className="mono text-[9.5px] font-bold text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-lg">
                  {u.version}
                </span>
                <h3 className="font-display font-bold text-[13px] text-text mt-2.5 mb-1">{tr(u.title)}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed">{tr(u.text)}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href="/changelog.html"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline transition-colors"
          >
            {tr("Toutes les versions")} <ArrowRight size={12} aria-hidden />
          </a>
        </div>
      </section>

      {/* ── Appel final ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="aurora" />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-pulse-glow"
          style={{
            background:
              "radial-gradient(70% 90% at 50% 110%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 65%), radial-gradient(40% 40% at 50% 100%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 60%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
          <Reveal>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.02em] leading-[1.05] text-balance">
              {tr("Voyez où va votre épargne,")} <span className="text-gold-gradient">{tr("avant de l'y mettre")}</span>
            </h2>
            <p className="text-[15px] text-text-muted mt-5 max-w-xl mx-auto leading-relaxed">
              {tr("Quelques secondes suffisent — gratuit, sans inscription, sans envoyer vos données nulle part.")}
            </p>
            <button
              type="button"
              onClick={launch}
              className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-base px-10 py-5 mt-10 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110 hover:scale-[1.02]"
            >
              {tr("Calculer mon nombre magique")} <ArrowRight size={15} aria-hidden />
            </button>
            <p className="text-[10.5px] text-text-dim mt-4 flex items-center justify-center gap-1.5">
              <Lock size={10} aria-hidden />{" "}
              {tr("Aucune inscription requise — vos données ne quittent pas cet appareil.")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA sticky mobile (v6.8, CRO) — le CTA du header défile ; sur mobile
          un bandeau en bas d'écran rappelle l'action après un scroll de 480 px.
          Masqué ≥ sm (le header suffit), et hors de l'ordre de tabulation tant
          qu'il est invisible (visibility:hidden + translate hors-écran). */}
      <div
        data-testid="cta-sticky-mobile"
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 md:hidden transition-transform duration-300 ease-out",
          // Fond dégradé : le bouton reste lisible même posé sur du contenu.
          "bg-gradient-to-t from-surface via-surface/85 to-transparent pt-8",
          stickyCtaVisible ? "translate-y-0" : "translate-y-full invisible",
        )}
      >
        <div className="mx-auto max-w-lg px-4 pb-4">
          <button
            type="button"
            onClick={launch}
            className="btn-shine w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-sm px-6 py-3.5 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110 hover:scale-[1.02]"
          >
            {tr("Calculer mon nombre magique")} <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={tr("Retour en haut")}
          className="back-to-top glass-strong text-primary hover:bg-glass-hover transition-colors"
        >
          <ArrowDown size={16} aria-hidden className="rotate-180" />
        </button>
      )}

      {/* ── Pied de page ────────────────────────────────────────────────── */}
      <footer className="border-t border-border/70">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Brand />
            <nav
              aria-label={tr("Navigation pied de page")}
              className="flex items-center gap-5 flex-wrap text-[11px] font-bold text-text-muted"
            >
              {NAV.map(item => (
                <a key={item.href} href={item.href} className="hover:text-text transition-colors">
                  {tr(item.label)}
                </a>
              ))}
              <a href="#/login" className="hover:text-text transition-colors">
                {tr("Se connecter")}
              </a>
            </nav>
          </div>
          <nav
            aria-label={tr("Guides et comparatifs")}
            className="mt-5 flex items-center gap-5 flex-wrap text-[11px] font-bold text-text-muted"
          >
            {GUIDES_LINKS.map(item => (
              <a key={item.href} href={item.href} className="hover:text-text transition-colors">
                {tr(item.label)}
              </a>
            ))}
          </nav>
          <div className="gold-divider my-6" aria-hidden />
          <p className="text-[10px] text-text-dim leading-relaxed max-w-3xl">
            {tr(
              "Snowball Pro fournit des simulations pédagogiques basées sur des données historiques réelles — il ne constitue pas un conseil en investissement. Les performances passées ne préjugent pas des performances futures. Vos données restent stockées localement sur votre appareil.",
            )}
          </p>
          <p className="text-[10px] text-text-dim mt-3">
            {tr(
              "© 2026 Snowball Pro · v6.23.0 · Données 100 % locales · Fait avec les rendements réels, pas des promesses.",
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}
