import { Landmark, PieChart, PiggyBank, Receipt, TrendingUp } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { deflationFactor, ENVELOPE_CONFIGS } from "../../engine"
import { useLang } from "../../i18n"
import { DualAmount } from "../shared/DualAmount"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs, YearRow } from "../../types"

interface SummaryStatsProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

interface StatColumn {
  label: string
  /** Montant en euros courants (ce qui sera sur le compte). */
  nominal: number
  /** Équivalent en euros d'aujourd'hui (pouvoir d'achat). */
  real: number
  color: string
  /** Légende descriptive sous le montant (ex. « avant impôts »). */
  sub?: string
  icon: LucideIcon
  /** Décomposition propre à la colonne (ex. gains de la bourse dans
   *  « Total épargné ») — les DEUX échelles, comme le reste du panneau. */
  gains?: { nominal: number; real: number }
}

/**
 * Panneau « Votre capital en détail » — la synthèse brut → net → impôts →
 * épargné (+ gains de la bourse).
 *
 * Avant v6.9.0 : 4 cartes flottantes, le SEUL bloc de l'onglet sans titre ni
 * conteneur — posé entre le héro et le graphique, il se lisait comme un corps
 * étranger (revue utilisateur : « ça ne s'intègre pas très bien au reste »).
 * Il reprend désormais l'anatomie de la page (glass + SectionHeader) et
 * expose les 4 mesures en colonnes séparées par des filets.
 *
 * Retour utilisateur : la légende d'échelle PARTAGÉE de l'en-tête
 * n'était « pas appliquée » — l'utilisateur ne rattachait pas les pastilles
 * aux chiffres. Elle est supprimée : chaque valeur porte désormais SON
 * libellé (« 1,31 M€ sur le compte en 2045 » / « 864 713 € en euros
 * d'aujourd'hui »), le panneau est resserré verticalement (moins de padding,
 * de marges et de filets) et les grands chiffres passent en text-lg/xl.
 *
 * Composant 100 % présentation : tout vient de `rows` (déjà calculé par le
 * moteur), aucune logique de calcul ici.
 */
export function SummaryStats({ rows, inputs }: SummaryStatsProps) {
  const { tr } = useLang()
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const { showReal, envelope } = inputs
  const endYear = lastRow.date.split(" ")[1]?.replace(".", "")

  // MÊME facteur de déflation pour toutes les colonnes (helper partagé avec le
  // panneau fiscal et les graphiques — une seule source de vérité). Avant
  // l'audit v5.1.4, « Valeur brute » suivait showReal mais « Net fiscal »
  // restait en euros courants → net affiché PLUS ÉLEVÉ que le brut
  // (1 176 k€ vs 862 k€), absurde et incohérent avec le panneau fiscal.
  const factor = deflationFactor(lastRow)
  const netAfterTax = lastRow.taxNet
  const taxAmount = Math.max(0, lastRow.nominal - lastRow.taxNet)
  // Gains de la bourse sur les DEUX échelles : la décomposition épargné +
  // croissance est la raison d'être de l'app — les deux montants sont affichés
  // (plus d'ambiguïté silencieuse au toggle, cf. DualAmount).
  const gainsNominal = Math.max(0, lastRow.nominal - lastRow.investedNom)
  const gainsReal = Math.max(0, lastRow.real - lastRow.investedReal)

  // Chaque colonne expose le montant sur les DEUX échelles : l'échelle mise en
  // avant (grand chiffre) suit le toggle « Euros d'aujourd'hui », l'autre
  // reste toujours visible en dessous. Chaque valeur porte SON libellé
  // d'échelle (primaryLabelInline) — plus de légende d'en-tête à décoder.
  const columns: StatColumn[] = [
    {
      // Libellé adapté à l'échelle mise en avant (audit v5.1.4 : jamais de
      // montant net d'inflation sous un libellé « brut »). Les DEUX échelles
      // restent affichées par DualAmount quel que soit le toggle.
      label: showReal ? tr("Valeur réelle") : tr("Valeur brute"),
      nominal: lastRow.nominal,
      real: lastRow.real,
      color: "var(--color-text)",
      sub: tr("avant impôts"),
      icon: TrendingUp,
    },
    {
      label: tr("Net fiscal ({env})", {
        env: ENVELOPE_CONFIGS.find(e => e.id === envelope)?.shortLabel ?? "BRUT",
      }),
      nominal: netAfterTax,
      real: netAfterTax * factor,
      color: "var(--color-value-gold)",
      sub: envelope !== "none" ? tr("après impôts") : tr("Aucun impôt à payer"),
      icon: Landmark,
    },
    {
      label: tr("Impôt théorique"),
      nominal: taxAmount,
      real: taxAmount * factor,
      color: "var(--color-value-red)",
      sub: envelope === "per" ? tr("impôt théorique sur gains + versements") : tr("impôt théorique à la liquidation"),
      icon: Receipt,
    },
    {
      label: tr("Total épargné"),
      nominal: lastRow.investedNom,
      real: lastRow.investedReal,
      color: "var(--color-text-muted)",
      icon: PiggyBank,
      gains: { nominal: gainsNominal, real: gainsReal },
    },
  ]

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <SectionHeader as="h2" level="card" icon={PieChart} title={tr("Votre capital en détail")} className="mb-3" />
      {/* Colonnes séparées par des filets verticaux (≥ lg, une seule ligne) ;
          en 2×2 sur mobile, les filets disparaissent au profit de l'espace. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4 lg:gap-x-0 lg:divide-x lg:divide-[color:var(--color-border)]">
        {columns.map(col => {
          const Icon = col.icon
          return (
            <div key={col.label} className="min-w-0 lg:px-4 lg:first:pl-0">
              <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${col.color} 14%, transparent)`, color: col.color }}
                >
                  <Icon size={12} aria-hidden />
                </span>
                <div className="text-[10px] text-text-dim uppercase tracking-wider truncate" title={col.label}>
                  {col.label}
                </div>
              </div>
              <DualAmount
                nominal={col.nominal}
                real={col.real}
                showReal={showReal}
                color={col.color}
                endYear={endYear}
                primaryLabelInline
                size="lg"
              />
              {col.sub && (
                <div className="text-[10px] text-text-dim mt-0.5 truncate" title={col.sub}>
                  {col.sub}
                </div>
              )}
              {col.gains && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                  {/* Sans tracking-wider : sur mobile (2 colonnes), le libellé
                      dépasse de 2 px et se tronquait — la statistique vedette
                      mérite son nom complet (vérifié à 320 px). */}
                  <div className="text-[10px] text-text-dim uppercase truncate" title={tr("Gains de la bourse")}>
                    {tr("Gains de la bourse")}
                  </div>
                  {/* Gains en or (même teinte que la carte « Net fiscal ») :
                      la statistique la plus motivante du panneau n'est plus une
                      légende grise — c'est un chiffre, sur les deux échelles. */}
                  <DualAmount
                    nominal={col.gains.nominal}
                    real={col.gains.real}
                    showReal={showReal}
                    color="var(--color-value-gold)"
                    endYear={endYear}
                    primaryLabelInline
                    size="lg"
                    prefix="+"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
