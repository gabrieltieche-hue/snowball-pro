import { useEffect, useState } from "react"
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  Dices,
  Landmark,
  LineChart,
  Lock,
  Moon,
  Share2,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
} from "lucide-react"
import { cn } from "../../utils/cn"
import { navigateTo } from "../../router"
import { loadInitialDarkMode, persistThemeClass } from "../../utils/theme"
import { Brand } from "./Brand"
import { HeroChart } from "./HeroChart"

// ─── Petits blocs de section ─────────────────────────────────────────────────

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text">{title}</h2>
      {sub && <p className="text-sm text-text-muted mt-3 leading-relaxed">{sub}</p>}
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
  return (
    <article className="glass rounded-3xl p-6 card-interactive">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center mb-4">
        <Icon size={19} className="text-primary" aria-hidden />
      </div>
      <h3 className="font-display font-bold text-[15px] text-text mb-2">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed">{children}</p>
    </article>
  )
}

function EnvelopeCard({ badge, title, children }: { badge: string; title: string; children: React.ReactNode }) {
  return (
    <article className="glass rounded-3xl p-5 card-interactive">
      <span className="inline-block text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-lg mb-3">
        {badge}
      </span>
      <h3 className="font-display font-bold text-sm text-text mb-1.5">{title}</h3>
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
  return (
    <div className={cn("glass rounded-2xl overflow-hidden transition-colors", open && "border-primary/25")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-[13px] font-bold text-text">{question}</span>
        <ChevronDown
          size={15}
          aria-hidden
          className={cn("text-primary shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 animate-fade-in">
          <p className="text-xs text-text-muted leading-relaxed">{children}</p>
        </div>
      )}
    </div>
  )
}

// ─── Landing ─────────────────────────────────────────────────────────────────

const NAV = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#enveloppes", label: "Enveloppes" },
  { href: "#methode", label: "Méthodologie" },
  { href: "#faq", label: "FAQ" },
]

export function LandingPage() {
  const [darkMode, setDarkMode] = useState<boolean>(loadInitialDarkMode)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Le thème est une préférence d'appareil partagée avec l'app (même clé).
  useEffect(() => {
    persistThemeClass(darkMode)
  }, [darkMode])

  const launch = () => navigateTo("app")

  return (
    <div className="min-h-screen bg-surface text-text">
      <h1 className="sr-only">
        Snowball Pro — simulateur patrimonial français : projection d'épargne, fiscalité CTO PEA AV PER, Monte Carlo et
        rente retraite
      </h1>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/70 backdrop-blur-xl bg-surface/72 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <a href="#/" aria-label="Snowball Pro — accueil" className="flex items-center">
            <Brand />
          </a>
          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1">
            {NAV.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-[11.5px] font-bold text-text-muted hover:text-text hover:bg-glass-hover transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              aria-label={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
              title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover transition-colors"
            >
              {darkMode ? <Sun size={12} aria-hidden /> : <Moon size={12} aria-hidden />}
              <span className="hidden sm:inline">{darkMode ? "Clair" : "Sombre"}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo("login")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold glass hover:bg-glass-hover text-primary border border-primary/30 transition-colors"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={launch}
              className="btn-shine inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-extrabold bg-primary btn-gold-text shadow-gold transition-all duration-150 active:scale-[0.97] hover:brightness-110"
            >
              Lancer l'app <ArrowRight size={12} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* ── Héro ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(90% 60% at 50% -10%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 65%)",
          }}
        />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="animate-slide-up">
            <p className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={11} aria-hidden /> Fiscalité française 2026 · 100 ans d'historique réel
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.06]">
              Votre patrimoine, éclairé par <span className="text-primary">100 ans de vraie histoire boursière</span>
            </h2>
            <p className="text-sm sm:text-[15px] text-text-muted mt-5 leading-relaxed max-w-xl">
              Snowball Pro projette votre épargne avec les rendements réels du MSCI World — krachs et bulles compris —
              applique la fiscalité française (CTO, PEA, AV, PER) et mesure la robustesse de votre plan sur 10 000
              scénarios Monte Carlo.
            </p>
            <div className="flex items-center gap-3 mt-7 flex-wrap">
              <button
                type="button"
                onClick={launch}
                className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-sm px-6 py-3.5 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110"
              >
                Lancer la simulation <ArrowRight size={15} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => navigateTo("register")}
                className="inline-flex items-center gap-2 rounded-2xl glass px-6 py-3.5 text-sm font-bold text-text hover:bg-glass-hover transition-colors"
              >
                Créer un compte
              </button>
            </div>
            <ul className="flex items-center gap-4 mt-6 flex-wrap text-[10.5px] text-text-dim">
              {["Gratuit", "Sans inscription", "Vos données restent sur cet appareil"].map(item => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check size={11} className="text-primary" aria-hidden /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Démo réelle : le graphique exécute le moteur (réglages par défaut). */}
          <div className="animate-slide-up" style={{ animationDelay: "120ms" }}>
            <div className="glass-gold rounded-3xl p-5 sm:p-6 shadow-premium-lg relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary shrink-0" aria-hidden />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
                    Simulation par défaut — démo réelle
                  </span>
                </div>
                <span className="text-[9.5px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg">
                  MSCI World 1970–2025
                </span>
              </div>
              <HeroChart />
            </div>
          </div>
        </div>
      </section>

      {/* ── Chiffres clés ───────────────────────────────────────────────── */}
      <section aria-label="Chiffres clés" className="border-y border-border/70 bg-glass/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: "100 ans", label: "d'historique réel — S&P 500 1926–1969 + MSCI World 1970–2025" },
            { value: "10 000", label: "scénarios Monte Carlo — P10, P50, P90 et probabilité de succès" },
            { value: "4", label: "enveloppes fiscales françaises : CTO, PEA, AV, PER" },
            { value: "100 %", label: "local — calculé sur votre appareil, zéro serveur" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mono">
                {stat.value}
              </p>
              <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed max-w-[220px] mx-auto">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fonctionnalités ─────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <SectionTitle
          eyebrow="Fonctionnalités"
          title="Quatre onglets, une question : où va votre argent ?"
          sub="Projection, robustesse, rente & retraite, objectif inversé — chaque outil répond à un besoin précis, sur les mêmes données réelles."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <FeatureCard icon={LineChart} title="Projection lissée">
            Votre capital année après année, sans hasard : une courbe claire, avec le pouvoir d'achat en euros
            d'aujourd'hui toujours visible — et la décomposition épargne / croissance dès l'ouverture.
          </FeatureCard>
          <FeatureCard icon={Dices} title="Robustesse Monte Carlo">
            L'historique réel rejoué par blocs sur 10 000 scénarios : P10, P50, P90, probabilité de succès et
            histogramme des capitaux finaux — planifiez sur la médiane, pas la moyenne.
          </FeatureCard>
          <FeatureCard icon={Banknote} title="Rente & retraite">
            Garde-fous dynamiques, inflation réelle INSEE, stress tests 1973 · 2000 · 2008, et le scénario « et si le
            départ tombait en pleine crise ? ».
          </FeatureCard>
          <FeatureCard icon={Landmark} title="Fiscalité française">
            CTO, PEA, AV, PER : PFU, barème, TMI, abattements — les règles 2026 appliquées à la lettre, y compris la
            durée de détention du PEA.
          </FeatureCard>
          <FeatureCard icon={Target} title="Objectif inversé">
            « Combien investir pour atteindre X € ? » — l'épargne mensuelle nécessaire est calculée en une seconde, avec
            une jauge d'atteignabilité.
          </FeatureCard>
          <FeatureCard icon={Share2} title="Partage & comparaison">
            Lien de partage de votre scénario, comparaison A/B, snapshots, annuler/rétablir, export CSV, JSON et rapport
            PDF.
          </FeatureCard>
        </div>
      </section>

      {/* ── Enveloppes ──────────────────────────────────────────────────── */}
      <section id="enveloppes" className="border-t border-border/70 bg-glass/30 scroll-mt-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionTitle
            eyebrow="Fiscalité"
            title="Quatre enveloppes, leurs vraies règles"
            sub="Le moteur applique les régimes réels — pas d'approximation : votre impôt dépend de l'enveloppe, de la durée de détention et de votre TMI."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <EnvelopeCard badge="Compte-titres" title="CTO">
              PFU 30 % sur les gains, ou barème progressif à votre TMI — à vous de choisir le plus avantageux.
            </EnvelopeCard>
            <EnvelopeCard badge="PEA" title="Plan d'épargne en actions">
              17,2 % après 5 ans de détention, plafond 150 000 € (300 000 € en couple). Le curseur de détention change
              vraiment les chiffres.
            </EnvelopeCard>
            <EnvelopeCard badge="Assurance-vie" title="AV">
              Abattement annuel de 4 600 € (9 200 € en couple) après 8 ans — la fiscalité des gains est modélisée à la
              sortie.
            </EnvelopeCard>
            <EnvelopeCard badge="PER" title="Plan d'épargne retraite">
              Versements déduits à votre TMI à l'entrée, sortie imposée selon la nature des fonds. L'arbitrage se voit
              dans le héro.
            </EnvelopeCard>
          </div>
        </div>
      </section>

      {/* ── Méthodologie ────────────────────────────────────────────────── */}
      <section id="methode" className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16 sm:py-24 scroll-mt-20">
        <SectionTitle
          eyebrow="Méthodologie"
          title="Pourquoi 10,07 % et pas 5,99 % ?"
          sub="Trois étages, chacun retire une seule chose : la volatilité, puis l'inflation. Aucun chiffre inventé — tout est rejoué depuis les séries réelles."
        />
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-3xl p-6 sm:p-8">
            <dl className="space-y-4">
              {[
                { label: "Brut — moyenne des années", value: "10,07 %/an", note: "moyenne arithmétique MSCI World" },
                {
                  label: "Composé — krachs inclus",
                  value: "8,22 %/an",
                  note: "moyenne géométrique (2000, 2008, 2022…)",
                },
                {
                  label: "Réel — après inflation",
                  value: "5,99 %/an",
                  note: "formule de Fisher, déflaté de 2,1 %/an",
                  highlight: true,
                },
              ].map((row, i) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className={cn("text-[11.5px] font-bold", row.highlight ? "text-primary" : "text-text-muted")}>
                      {row.label}
                    </dt>
                    <dd className={cn("mono text-lg font-extrabold", row.highlight ? "text-primary" : "text-text")}>
                      {row.value}
                    </dd>
                  </div>
                  <p className="text-[10.5px] text-text-dim mt-0.5">{row.note}</p>
                  {i < 2 && <div className="gold-divider my-4" aria-hidden />}
                </div>
              ))}
            </dl>
            <p className="text-[10.5px] text-text-muted mt-5 pt-4 border-t border-border/60 leading-relaxed">
              Pourquoi pas 6,12 % (8,22 − 2,1) ? La soustraction simple est une approximation : la formule exacte de
              Fisher est <span className="mono font-semibold text-text">(1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %</span> —
              l'inflation rogne aussi vos gains, pas seulement votre capital de départ.
            </p>
            <p className="text-[10px] text-text-dim mt-3 flex items-center gap-1.5">
              <TrendingUp size={11} className="text-primary shrink-0" aria-hidden />
              Sources : S&P 500 SBBI 1926–1969 · MSCI World 1970–2025 · inflation française INSEE 1970–2025.
            </p>
          </div>

          {/* 3 étapes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            {[
              { n: "1", title: "Votre épargne", text: "Capital de départ, versement mensuel, durée." },
              { n: "2", title: "Votre enveloppe", text: "CTO, PEA, AV ou PER, avec votre fiscalité." },
              { n: "3", title: "Le résultat d'abord", text: "Capital final, épargne vs croissance, robustesse." },
            ].map(step => (
              <div key={step.n} className="glass rounded-2xl p-5">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-light via-primary to-primary-dark btn-gold-text flex items-center justify-center font-extrabold text-xs shadow-gold mb-3">
                  {step.n}
                </span>
                <h3 className="font-display font-bold text-[13px] text-text mb-1">{step.title}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-border/70 bg-glass/30 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionTitle eyebrow="FAQ" title="Questions fréquentes" />
          <div className="space-y-3">
            <FaqItem
              question="Mes données sont-elles envoyées sur un serveur ?"
              open={openFaq === 0}
              onToggle={() => setOpenFaq(openFaq === 0 ? null : 0)}
            >
              Non. Tout est calculé et stocké dans votre navigateur (localStorage) : aucune donnée ne quitte votre
              appareil. Un compte crée un espace isolé pour vos simulations sur cet appareil — la synchronisation cloud
              n'existe pas encore.
            </FaqItem>
            <FaqItem
              question="Un compte est-il obligatoire ?"
              open={openFaq === 1}
              onToggle={() => setOpenFaq(openFaq === 1 ? null : 1)}
            >
              Non, l'application fonctionne intégralement sans compte. Un compte vous permet d'isoler vos simulations de
              celles des autres utilisateurs de l'appareil et prépare la synchronisation future.
            </FaqItem>
            <FaqItem
              question="Pourquoi 10,07 % et pas 6,12 % ?"
              open={openFaq === 2}
              onToggle={() => setOpenFaq(openFaq === 2 ? null : 2)}
            >
              Parce que la soustraction simple est une approximation : l'inflation ronge aussi vos gains. La formule
              exacte (Fisher) est (1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %/an réel.
            </FaqItem>
            <FaqItem
              question="Qu'est-ce que Monte Carlo ?"
              open={openFaq === 3}
              onToggle={() => setOpenFaq(openFaq === 3 ? null : 3)}
            >
              Jusqu'à 10 000 scénarios qui rejouent l'historique réel par blocs — krachs et bull markets inclus. Vous
              obtenez les percentiles P10/P50/P90, la probabilité de succès et l'intervalle de confiance de cette
              estimation.
            </FaqItem>
            <FaqItem
              question="L'application est-elle vraiment gratuite ?"
              open={openFaq === 4}
              onToggle={() => setOpenFaq(openFaq === 4 ? null : 4)}
            >
              Oui. Gratuite, sans engagement et sans carte bancaire — aujourd'hui et demain.
            </FaqItem>
          </div>
        </div>
      </section>

      {/* ── Appel final ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(70% 90% at 50% 110%, color-mix(in srgb, var(--color-primary) 9%, transparent), transparent 65%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Voyez où va votre épargne, <span className="text-primary">avant de l'y mettre</span>
          </h2>
          <p className="text-sm text-text-muted mt-4 max-w-xl mx-auto">
            Quelques secondes suffisent — gratuit, sans inscription, sans envoyer vos données nulle part.
          </p>
          <button
            type="button"
            onClick={launch}
            className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-primary btn-gold-text font-extrabold text-sm px-8 py-4 mt-8 shadow-gold-strong transition-all duration-150 active:scale-[0.98] hover:brightness-110"
          >
            Lancer la simulation <ArrowRight size={15} aria-hidden />
          </button>
          <p className="text-[10.5px] text-text-dim mt-4 flex items-center justify-center gap-1.5">
            <Lock size={10} aria-hidden /> Aucune inscription requise — vos données ne quittent pas cet appareil.
          </p>
        </div>
      </section>

      {/* ── Pied de page ────────────────────────────────────────────────── */}
      <footer className="border-t border-border/70">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Brand />
            <nav
              aria-label="Navigation pied de page"
              className="flex items-center gap-5 flex-wrap text-[11px] font-bold text-text-muted"
            >
              {NAV.map(item => (
                <a key={item.href} href={item.href} className="hover:text-text transition-colors">
                  {item.label}
                </a>
              ))}
              <a href="#/login" className="hover:text-text transition-colors">
                Se connecter
              </a>
            </nav>
          </div>
          <div className="gold-divider my-6" aria-hidden />
          <p className="text-[10px] text-text-dim leading-relaxed max-w-3xl">
            Snowball Pro fournit des simulations pédagogiques basées sur des données historiques réelles — il ne
            constitue pas un conseil en investissement. Les performances passées ne préjugent pas des performances
            futures. Vos données restent stockées localement sur votre appareil.
          </p>
          <p className="text-[10px] text-text-dim mt-3">
            © 2026 Snowball Pro · v6.5.0 · Données 100 % locales · Fait avec les rendements réels, pas des promesses.
          </p>
        </div>
      </footer>
    </div>
  )
}
