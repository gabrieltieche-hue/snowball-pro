import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowDown,
  ArrowRight,
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
} from "lucide-react"
import { cn } from "../../utils/cn"
import { navigateTo } from "../../router"
import { loadInitialDarkMode, persistThemeClass } from "../../utils/theme"
import {
  fmtTaxPercent,
  getHistoricalDataset,
  getTaxRules,
  parseStoredInputs,
  pfuRate,
  runSimulation,
} from "../../engine"
import { useLang } from "../../i18n"
import type { EnvelopeType, ReturnScenario, YearRow } from "../../types"
import { QUICKSTART_PROFILES } from "../../utils/quickStart"
import { Brand } from "./Brand"
import { HeroChart } from "./HeroChart"

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
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

// ─── Petits blocs de section ─────────────────────────────────────────────────

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  const { tr } = useLang()
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary mb-3">{tr(eyebrow)}</p>
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text">{tr(title)}</h2>
      {sub && <p className="text-sm text-text-muted mt-3 leading-relaxed">{tr(sub)}</p>}
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
    <article className="glass rounded-3xl p-6 card-interactive group">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
        <Icon size={19} className="text-primary" aria-hidden />
      </div>
      <h3 className="font-display font-bold text-[15px] text-text mb-2">{tr(title)}</h3>
      <p className="text-xs text-text-muted leading-relaxed">{children}</p>
    </article>
  )
}

function EnvelopeCard({ badge, title, children }: { badge: string; title: string; children: React.ReactNode }) {
  const { tr } = useLang()
  return (
    <article className="glass rounded-3xl p-5 card-interactive">
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
    <div className="flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" aria-hidden />
      </div>
      <div className="sm:text-center">
        <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mono">
          {shown.toLocaleString(locale)}
          {tr(suffix)}
        </p>
        <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed max-w-[220px] mx-auto">{tr(label)}</p>
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
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#scenarios", label: "Scénarios" },
  { href: "#pourqui", label: "Pour qui" },
  { href: "#enveloppes", label: "Enveloppes" },
  { href: "#methode", label: "Méthodologie" },
  { href: "#faq", label: "FAQ" },
]

/** Pages statiques SEO (guides, comparatifs, tarifs) — distribution. */
const GUIDES_LINKS = [
  { href: "/guides/simulateur-pea.html", label: "Simulateur PEA" },
  { href: "/guides/pea-ou-assurance-vie.html", label: "PEA ou assurance vie" },
  { href: "/guides/calcul-interets-composes.html", label: "Calcul des intérêts composés" },
  { href: "/alternatives/portfolio-visualizer.html", label: "Portfolio Visualizer" },
  { href: "/alternatives/firecalc.html", label: "FireCalc" },
  { href: "/alternatives/networthify.html", label: "Networthify" },
  { href: "/alternatives/quantalys.html", label: "Quantalys" },
  { href: "/pricing.html", label: "Tarifs" },
]

/** Dernières éditions réelles (CHANGELOG.md) — aucun chiffre inventé. */
const UPDATES = [
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
  {
    version: "v6.13.1",
    title: "Onglets nets sur mobile",
    text: "Correction mobile : les onglets du simulateur ne débordent plus de l'écran sur téléphone — « Robustesse de votre plan » passe proprement à la ligne au lieu de déborder, même à 320 px.",
  },
  {
    version: "v6.13.0",
    title: "Partagez votre simulation en un clic",
    text: "Boutons de partage X, WhatsApp et LinkedIn avec votre scénario pré-rempli dans le lien (UTM par canal pour mesurer chaque source), pied de rapport PDF « Créé avec Snowball Pro » + lien du scénario, et 3 guides SEO qui arrivent de Google : simulateur PEA, PEA ou assurance vie, intérêts composés.",
  },
  {
    version: "v6.12.0",
    title: "L'application en anglais 🇬🇧",
    text: "Un bouton FR/EN (en-tête de l'app et de la landing) traduit toute l'application en anglais : simulateur, Monte Carlo, rente, objectif, rapport PDF et landing — avec le formatage des montants adapté (€1,234.56 au lieu de 1 234,56 €).",
  },
  {
    version: "v6.11.2",
    title: "Capital en détail, clarifié",
    text: "Le panneau « Votre capital en détail » est resserré (grands chiffres en text-lg/xl) et chaque montant porte son échelle : « sur le compte en 2050 » et « en euros d'aujourd'hui » sont écrits sur chaque valeur — fini la légende à décoder.",
  },
  {
    version: "v6.11.1",
    title: "Icône Google",
    text: "Une vraie favicon .ico (16/32/48 px) : l'application affiche son icône dans les résultats de recherche Google, les favoris et les onglets.",
  },
  {
    version: "v6.11.0",
    title: "L'inflation, sans détour",
    text: "L'hypothèse d'inflation 2,1 %/an (cible BCE) est explicitée face à la moyenne réelle 1970-2025 (4,0 %) — et la médiane de la période tombe justement sur 2,1 %. Nouvelle entrée FAQ : pourquoi 2,1 % et pas la moyenne ?",
  },
  {
    version: "v6.10.0",
    title: "Graphiques lus d'un coup d'œil",
    text: "La valeur finale de chaque courbe s'affiche en bout de tracé, sans survol — avec un point or sur les gains. Palette unifiée entre camembert et courbes, légendes en chips, axes et infobulles harmonisés.",
  },
  {
    version: "v6.9.0",
    title: "Capital en détail",
    text: "Les 4 cartes de synthèse deviennent un panneau titré « Votre capital en détail » : colonnes séparées, gains de la bourse en or, une seule légende d'échelle — le bloc s'intègre enfin entre le héro et le graphique.",
  },
  {
    version: "v6.8.2",
    title: "Rythme uniformisé",
    text: "Espacements verticaux harmonisés sur une seule échelle — moins d'air entre les sections, héro et colonnes alignés en haut, même respiration sur tous les écrans.",
  },
  {
    version: "v6.8.0",
    title: "Commencez ici",
    text: "Trois profils de départ prêts à l'emploi à l'ouverture de l'app (capital calculé par le moteur, appliqué en un clic) et CTA mobile permanent sur la landing.",
  },
]

export function LandingPage() {
  const { tr, fmtCurrency, locale } = useLang()
  const [darkMode, setDarkMode] = useState<boolean>(loadInitialDarkMode)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  // Scénario actif de la démo interactive : le héro devient un vrai simulateur.
  const [heroScenario, setHeroScenario] = useState<ReturnScenario>("central")
  // CRO v6.8 — CTA sticky mobile : apparu après un scroll de 480 px (rendu en
  // bas de page). Le masquage ≥ sm est purement CSS (md:hidden) : jsdom n'a
  // pas de matchMedia, la logique ici ne dépend que du scroll.
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false)

  // Le thème est une préférence d'appareil partagée avec l'app (même clé).
  useEffect(() => {
    persistThemeClass(darkMode)
  }, [darkMode])

  // CTA sticky mobile : état recalculé à chaque scroll (et au montage).
  useEffect(() => {
    const onScroll = () => setStickyCtaVisible((window.scrollY ?? 0) > 480)
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
  const heroRows = useMemo(
    () =>
      Object.fromEntries(SCENARIO_ORDER.map(s => [s, runSimulation({ ...base, returnScenario: s })])) as Record<
        ReturnScenario,
        YearRow[]
      >,
    [base],
  )

  const heroLast = heroRows[heroScenario][heroRows[heroScenario].length - 1]
  const heroInvested = heroLast.investedNom
  const heroGrowth = Math.max(0, heroLast.nominal - heroInvested)

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

  return (
    <div className="min-h-screen bg-surface text-text">
      <h1 className="sr-only">
        {tr(
          "Snowball Pro — simulateur patrimonial français : projection d'épargne, fiscalité CTO PEA AV PER, Monte Carlo et rente retraite",
        )}
      </h1>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <header className="sticky-header sticky top-0 z-40 border-b border-border/70 backdrop-blur-xl bg-surface/72 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <a href="#/" aria-label={tr("Snowball Pro — accueil")} className="flex items-center">
            <Brand />
          </a>
          <nav aria-label={tr("Navigation principale")} className="hidden md:flex items-center gap-1">
            {NAV.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-[11.5px] font-bold text-text-muted hover:text-text hover:bg-glass-hover transition-colors"
              >
                {tr(item.label)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              aria-label={tr(darkMode ? "Passer en mode clair" : "Passer en mode sombre")}
              title={tr(darkMode ? "Passer en mode clair" : "Passer en mode sombre")}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors"
            >
              {darkMode ? <Sun size={12} aria-hidden /> : <Moon size={12} aria-hidden />}
              <span className="hidden sm:inline">{tr(darkMode ? "Clair" : "Sombre")}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo("login")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover text-primary border border-primary/30 transition-colors"
            >
              {tr("Se connecter")}
            </button>
            <button
              type="button"
              onClick={launch}
              className="btn-shine inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-[11px] font-extrabold bg-primary btn-gold-text shadow-gold transition-all duration-150 active:scale-[0.97] hover:brightness-110"
            >
              {tr("Calculer mon nombre magique")} <ArrowRight size={12} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* ── Héro (démo interactive) ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-pulse-glow"
          style={{
            background:
              "radial-gradient(90% 60% at 50% -10%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 65%)",
          }}
        />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={11} aria-hidden /> {tr("Fiscalité française 2026 · 100 ans d'historique réel")}
            </p>
            <h2
              aria-label={tr("Combien peut valoir votre épargne dans 25 ans ?")}
              className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.06]"
            >
              <span className="block">{tr("Combien peut valoir votre épargne")}</span>
              <span className="block">
                <span className="text-primary whitespace-nowrap">{tr("dans 25 ans")}</span> ?
              </span>
            </h2>
            <p className="text-sm sm:text-[15px] text-text-muted mt-5 leading-relaxed max-w-xl">
              {tr(
                "Votre nombre magique, c'est le capital final de votre épargne — calculé sur 100 ans de vraie histoire boursière, krachs inclus. En 30 secondes, sans inscription, sur votre appareil.",
              )}
            </p>
            <div className="flex items-center gap-3 mt-7 flex-wrap">
              <button
                type="button"
                onClick={launch}
                className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-sm px-6 py-3.5 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110"
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
            <ul className="flex items-center gap-4 mt-6 flex-wrap text-[10.5px] text-text-dim">
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

          {/* Démo réelle interactive : basculez de scénario, le moteur recalcule. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <div className="glass-gold rounded-3xl p-5 sm:p-6 shadow-premium-lg relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary shrink-0" aria-hidden />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    {tr("Simulation par défaut — démo réelle")}
                  </span>
                </div>
                <span className="text-[9.5px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg">
                  MSCI World 1970-2025
                </span>
              </div>

              <ScenarioSwitch value={heroScenario} onChange={setHeroScenario} rates={rates} />

              {/* Le nombre magique : résultat d'abord, recalculé à chaque bascule. */}
              <div className="mt-5">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-text-muted mb-1">
                      {tr("Capital final")} · {tr(SCENARIO_META[heroScenario].label)}
                    </p>
                    <p className="font-display text-[2.6rem] sm:text-5xl font-extrabold tracking-tight text-text mono leading-none">
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

              {/* La courbe, exécutée par le vrai moteur (clé = scénario → redessin animé). */}
              <div className="mt-5">
                <HeroChart
                  key={heroScenario}
                  rows={heroRows[heroScenario]}
                  inputs={{ ...base, returnScenario: heroScenario }}
                  footer={false}
                />
                <p className="text-[10px] text-text-dim mt-3 flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-primary shrink-0" aria-hidden />
                  {base.duration} {tr("ans")} · {base.monthlyPayment.toLocaleString(locale)} €/{tr("mois")} ·{" "}
                  {tr(SCENARIO_META[heroScenario].desc)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Chiffres clés ───────────────────────────────────────────────── */}
      <section aria-label={tr("Chiffres clés")} className="border-y border-border/70 bg-glass/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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

      {/* ── Fonctionnalités ─────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
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

      {/* ── Enveloppes ──────────────────────────────────────────────────── */}
      <section id="enveloppes" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
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
                  <p className="mono text-2xl font-extrabold text-text shrink-0">
                    10,07 <span className="text-[11px] font-medium text-text-muted">{tr("%/an")}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 my-3 pl-1">
                  <span className="w-5 h-5 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowDown size={11} className="text-primary" aria-hidden />
                  </span>
                  <p className="text-[10.5px] text-text-muted leading-snug">
                    {tr("on retire")} <strong className="text-text">{tr("la volatilité")}</strong>{" "}
                    {tr("— les krachs réels (2000, 2008, 2022…) réduisent le gain réellement composé")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/8 px-3.5 py-3">
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
                  <p className="mono text-2xl font-extrabold text-primary shrink-0">
                    8,22 <span className="text-[11px] font-medium text-text-muted">{tr("%/an")}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 my-3 pl-1">
                  <span className="w-5 h-5 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowDown size={11} className="text-primary" aria-hidden />
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
                  <p className="mono text-2xl font-extrabold text-primary shrink-0">
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
      <section id="pourqui" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
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

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-border/70 bg-glass/30 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
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
      <section aria-label="Dernières évolutions" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <Reveal>
          <div className="flex items-center gap-2 justify-center mb-6">
            <History size={13} className="text-primary" aria-hidden />
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{tr("Dernières éditions")}</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
          {UPDATES.map((u, i) => (
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
      </section>

      {/* ── Appel final ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-pulse-glow"
          style={{
            background:
              "radial-gradient(70% 90% at 50% 110%, color-mix(in srgb, var(--color-primary) 9%, transparent), transparent 65%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              {tr("Voyez où va votre épargne,")} <span className="text-primary">{tr("avant de l'y mettre")}</span>
            </h2>
            <p className="text-sm text-text-muted mt-4 max-w-xl mx-auto">
              {tr("Quelques secondes suffisent — gratuit, sans inscription, sans envoyer vos données nulle part.")}
            </p>
            <button
              type="button"
              onClick={launch}
              className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-sm px-8 py-4 mt-8 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110"
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
            className="btn-shine w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-sm px-6 py-3.5 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110"
          >
            {tr("Calculer mon nombre magique")} <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>

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
              "© 2026 Snowball Pro · v6.16.0 · Données 100 % locales · Fait avec les rendements réels, pas des promesses.",
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}
