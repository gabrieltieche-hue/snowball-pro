import { Activity, Gauge, Layers, Receipt, Shield, Timer, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getHistoricalDataset } from "../../engine"
import { useLang } from "../../i18n"
import { HelpTip } from "../shared/HelpTip"
import { SectionHeader } from "../shared/SectionHeader"
import type { KPIs, SimulationInputs } from "../../types"
import type { UiMode } from "../../utils/uiMode"

interface KpiGridProps {
  kpis: KPIs | null
  /** Hypothèses de la projection : le scénario appliqué et l'inflation servent
   * à expliquer la chaîne brut → net de frais → réel (audit v6.6 — les trois
   * taux coexistaient sans le chaînon qui les relie). */
  inputs: SimulationInputs
  /** Mode Débutant / Avancé (audit) : le terme « XIRR » est masqué en Débutant. */
  uiMode?: UiMode
}

const GOLD = "var(--color-value-gold)"
const RED = "var(--color-value-red)"

interface KpiCard {
  key: keyof KPIs
  label: string
  suffix: string
  color: string
  digits?: number
  currency?: boolean
  sub: string
  /** Variante du sous-titre sans jargon, pour le mode Débutant (audit). */
  subDebutant?: string
  icon: LucideIcon
  visible?: (k: KPIs) => boolean
}

// Indicateurs affichés selon la simulation : on masque les stats qui n'ont
// pas de sens (pas de chute, pas de risque, capital qui ne double pas) et on
// évite les doublons avec le camembert 3D « D'où vient votre argent ? ».
// Avec la courbe lissée du Simulateur (v5.6.0), le sharpe vaut toujours 0 et
// la chute maximale est nulle → 6 cartes par défaut : une grille 2×3 remplie
// sans trou (avant : auto-fit 4 colonnes → 2 cases vides au 2e rang).
const CARDS: KpiCard[] = [
  {
    key: "xirr",
    label: "Rendement net / an",
    suffix: "%",
    color: GOLD,
    digits: 2,
    // Sous-titres DYNAMIQUES (construits dans le composant) : la carte ne dit
    // plus « brut » alors que le XIRR est net de frais — c'était la source de
    // la confusion « 8,22 %/an vs 8,0 % » (audit v6.6).
    sub: "",
    subDebutant: "",
    icon: TrendingUp,
  },
  {
    key: "sharpe",
    label: "Gain par risque",
    suffix: "",
    color: GOLD,
    digits: 2,
    sub: "le gain obtenu pour chaque risque pris (Sharpe)",
    icon: Activity,
    visible: k => k.sharpe > 0,
  },
  {
    key: "capitalMultiple",
    label: "Multiplié par",
    suffix: "x",
    color: GOLD,
    sub: "capital final ÷ argent épargné",
    icon: Layers,
    visible: k => k.capitalMultiple > 0,
  },
  {
    key: "doublingTime",
    label: "Pour doubler",
    suffix: " ans",
    color: GOLD,
    sub: "années pour que votre capital double",
    icon: Timer,
    visible: k => k.doublingTime !== null,
  },
  {
    key: "realReturn",
    label: "Après inflation",
    suffix: "%",
    color: GOLD,
    digits: 2,
    // Sous-titre dynamique : la formule de Fisher avec les valeurs affichées,
    // plus de « référence historique 5,99 % » qui mélangeait deux notions.
    sub: "",
    icon: Shield,
  },
  {
    key: "maxDrawdownPct",
    label: "Pire chute",
    suffix: "%",
    color: RED,
    sub: "la plus grosse baisse du capital en cours de route",
    icon: TrendingDown,
    visible: k => k.maxDrawdownPct > 0.05,
  },
  {
    key: "totalFees",
    label: "Frais payés",
    suffix: "",
    color: RED,
    currency: true,
    sub: "tous les frais cumulés sur la durée",
    icon: Receipt,
    visible: k => k.totalFees > 0,
  },
  {
    key: "powerPurchaseRatio",
    label: "Pouvoir d'achat conservé",
    suffix: "%",
    color: GOLD,
    sub: "part de la valeur du capital restant après inflation",
    icon: Wallet,
    visible: k => k.powerPurchaseRatio > 0 && k.powerPurchaseRatio < 100,
  },
]

export function KpiGrid({ kpis, inputs, uiMode = "debutant" }: KpiGridProps) {
  const { tr, lang, fmtCurrency, fmtDecimal } = useLang()
  if (!kpis) return null

  // Chaîne de rendement de la projection (audit v6.6) : le taux BRUT appliqué
  // par le scénario, le rendement net de frais (XIRR) et le rendement réel
  // (net de frais ET d'inflation). Les trois valeurs viennent du moteur — le
  // scénario est la seule chose que l'utilisateur choisit, tout le reste est
  // dérivé (mêmes sources que GoalTab / MethodologyPanel).
  const historical = getHistoricalDataset(inputs.historicalIndex)
  const scenarioRate =
    inputs.returnScenario === "prudent"
      ? historical.netReturn
      : inputs.returnScenario === "optimiste"
        ? historical.avgReturn
        : historical.compoundedReturn
  const scenarioLabel = { prudent: "Prudent", central: "Central", optimiste: "Optimiste" }[inputs.returnScenario]
  // Taux sans zéros inutiles : 2,10 → « 2,1 », 7,95 → « 7,95 » (virgule en
  // français, point en anglais).
  const fmt = (r: number): string => {
    const s = (r * 100).toFixed(2)
    const local = lang === "en" ? s : s.replace(".", ",")
    return local.replace(/0+$/, "").replace(/[.,]$/, "")
  }
  const xirrRatio = kpis.xirr / 100
  const realRatio = kpis.realReturn / 100
  // Inflation IMPLIQUÉE (en %) par les deux valeurs affichées (rapport
  // XIRR / réel) : la formule de Fisher du sous-titre reste exacte au
  // centième quelle que soit la configuration, sans dépendre d'un arrondi du
  // curseur. Travail en POINTS de pourcentage : toFixed(2) sur le ratio
  // (0,021 → « 0.02 ») affichait une inflation « 2,00 % » et un résultat
  // « 5,83 % » à côté de la carte « 5,73 % » (attrapé par le test v6.6).
  const inflationPct =
    Number.isFinite(realRatio) && realRatio > -1 && Number.isFinite(xirrRatio) && xirrRatio > -1
      ? Number((((1 + xirrRatio) / (1 + realRatio) - 1) * 100).toFixed(2))
      : inputs.inflation * 100
  const eqPct =
    Number.isFinite(inflationPct) && inflationPct > -100
      ? Math.round(((1 + xirrRatio) / (1 + inflationPct / 100) - 1) * 10000) / 100
      : kpis.realReturn
  // Sous-titres dynamiques des deux cartes « taux » : ils expliquent la chaîne
  // au lieu de citer une référence historique sans lien avec la projection.
  const inflationStr = fmtDecimal(inflationPct, 2)
  const dynamicSubs: Partial<Record<keyof KPIs, { sub: string; subDebutant: string }>> = {
    xirr: {
      // La chaîne au-dessus du bloc donne déjà le taux brut appliqué : la carte
      // ne le répète pas, elle précise ce qu'EST ce nombre (net de frais, avant
      // impôts et inflation — le XIRR est pré-impôt).
      sub: tr("XIRR de VOTRE projection : net de tous vos frais, avant impôts et inflation"),
      subDebutant: tr("rendement annuel moyen de votre épargne, après tous vos frais, avant impôts et inflation"),
    },
    realReturn: {
      sub: tr("net de frais et d'inflation : (1 + {a} %) ÷ (1 + {b} %) − 1 = {c} %", {
        a: fmt(xirrRatio),
        b: inflationStr,
        c: fmt(eqPct / 100),
      }),
      subDebutant: tr(
        "votre rendement après frais ET inflation : (1 + {a} %) ÷ (1 + {b} %) − 1 = {c} % — le pouvoir d'achat de votre épargne",
        { a: fmt(xirrRatio), b: inflationStr, c: fmt(eqPct / 100) },
      ),
    },
  }

  const cards = CARDS.filter(card => !card.visible || card.visible(kpis))

  return (
    <div className="animate-fade-in min-w-0">
      {/* v6 : rétrogradé au niveau « card » — le héro est désormais LE niveau
          « page » de l'onglet, « Statistiques clés » ne doit pas lui faire
          concurrence en pleine page (revue adverse). */}
      <SectionHeader title={tr("Statistiques clés")} icon={Gauge} level="card" as="h3" />
      {/* Chaîne de rendement (audit v6.6) : le lien visible entre les trois
          taux — brut appliqué → net de frais → réel. C'est la réponse en une
          ligne à « pourquoi 8,22 %/an devient 8,0 % puis 5,7 % ? ». */}
      <p className="text-[10px] text-text-muted leading-snug mt-1.5 mb-3">
        {tr("Taux appliqué :")}{" "}
        <strong className="text-text mono">
          {fmt(scenarioRate)}
          {tr(" %/an brut")}
        </strong>{" "}
        {tr("(scénario")} {tr(scenarioLabel)}) →{" "}
        <strong className="text-text mono">
          {fmt(xirrRatio)}
          {tr(" % net de frais")}
        </strong>{" "}
        →{" "}
        <strong className="text-text mono">
          {fmt(realRatio)}
          {tr(" % après inflation")}
        </strong>
      </p>
      {/* Grille 2×3 par défaut (6 cartes) : aucune case vide, contrairement à
          l'ancien auto-fit qui laissait un trou de 2 cartes sur les écrans
          larges. Les cartes sont plus hautes → le bloc remplit mieux la
          colonne à côté du panneau fiscal. */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(kpi => {
          const val = kpis[kpi.key]
          const dyn = dynamicSubs[kpi.key]
          const display = kpi.currency
            ? fmtCurrency(val as number)
            : `${fmtDecimal(val as number, kpi.digits ?? 1)}${tr(kpi.suffix)}`
          const Icon = kpi.icon
          return (
            <div
              key={kpi.key}
              className="card-subtle rounded-2xl p-4 card-interactive flex flex-col min-w-0 min-h-[132px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted leading-snug min-w-0">
                  {tr(kpi.label)}
                  {/* XIRR : terme technique masqué en mode Débutant (audit) ;
                      le sous-titre devient la source principale. */}
                  {kpi.key === "xirr" && uiMode === "avance" && (
                    <HelpTip
                      text={tr(
                        "XIRR : le rendement annuel réellement obtenu par VOTRE projection, versements étalés dans le temps inclus, après tous vos frais et avant inflation.",
                      )}
                      className="ml-1 align-[-1px]"
                    />
                  )}
                </div>
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${kpi.color} 12%, transparent)`, color: kpi.color }}
                >
                  <Icon size={12} aria-hidden />
                </span>
              </div>
              <div className="mono text-lg font-bold mt-2 leading-tight" style={{ color: kpi.color }}>
                {display}
              </div>
              <div className="text-[10px] text-text-muted mt-auto pt-2 leading-snug">
                {dyn
                  ? uiMode === "debutant"
                    ? dyn.subDebutant
                    : dyn.sub
                  : uiMode === "debutant" && "subDebutant" in kpi
                    ? tr((kpi as KpiCard & { subDebutant: string }).subDebutant)
                    : tr(kpi.sub)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
