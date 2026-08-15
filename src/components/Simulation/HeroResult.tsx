import { Sparkles, TrendingUp, Wallet } from "lucide-react"
import { SectionHeader } from "../shared/SectionHeader"
import { fmtCurrency } from "../../engine"
import type { SimulationInputs, YearRow } from "../../types"

interface HeroResultProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

/**
 * Héro v6 — « le nombre magique » (avis utilisateurs 1 & 2) : la première chose
 * que l'utilisateur doit voir est le RÉSULTAT, pas les réglages.
 *
 * - Grand chiffre sur l'échelle du toggle (pouvoir d'achat par défaut) ;
 * - l'autre échelle reste visible juste en dessous (jamais cachée, même
 *   philosophie que DualAmount) ;
 * - la décomposition « dont X épargnés + Y de croissance » — LA raison d'être
 *   de l'app (l'insight qui était noyé tout en bas avant v6) ;
 * - le ratio « votre épargne multipliée par N ».
 *
 * Composant 100 % présentation : tout vient de `rows` (déjà calculé par le
 * moteur), aucune logique de calcul ici.
 */
export function HeroResult({ rows, inputs }: HeroResultProps) {
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  const { showReal } = inputs
  // Même échelle que le toggle : les deux valeurs restent calculées par le
  // moteur, on ne choisit que laquelle est mise en avant.
  const total = showReal ? lastRow.real : lastRow.nominal
  const invested = showReal ? lastRow.investedReal : lastRow.investedNom
  const growth = Math.max(0, total - invested)
  const growthPct = total > 0 ? (growth / total) * 100 : 0
  const investedPct = total > 0 ? Math.max(0, 100 - growthPct) : 100
  const ratio = invested > 0 ? total / invested : null

  const endYear = lastRow.date.split(" ")[1]?.replace(".", "")
  const accountLabel = `sur le compte${endYear ? ` en ${endYear}` : ""}`
  const secondary = showReal
    ? { amount: lastRow.nominal, label: accountLabel }
    : { amount: lastRow.real, label: "en euros d'aujourd'hui" }

  return (
    <section
      aria-label="Résultat principal de la projection"
      className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden"
    >
      {/* Hiérarchie des titres (I6) : h1 sr-only en tête de page, le héro porte
          le premier h2 — masqué visuellement (le libellé visible « Votre
          patrimoine estimé » est le même), le graphique suit en h2. */}
      <h2 className="sr-only">Votre patrimoine estimé</h2>
      {/* La seconde échelle est rendue manuellement (pas DualAmount) :
          DualAmount afficherait aussi SON grand chiffre — un doublon du héro.
          On garde exactement ses libellés (« sur le compte en … » / « en euros
          d'aujourd'hui ») pour une copie identique à toute l'app. */}
      {/* Halo doré doux : même langage que la carte « Rendement » de la sidebar,
          sans alourdir — le chiffre reste le centre de gravité. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        /* Halo adaptatif aux deux thèmes (revue adverse) : color-mix sur le
           token --color-primary au lieu du doré codé en dur. */
        style={{
          background:
            "radial-gradient(120% 120% at 50% -20%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 60%)",
        }}
      />

      <div className="relative">
        {/* Titre dans l'anatomie SectionHeader uniforme (v5.6.4) : barre dorée
            + icône + extrabold majuscule — même rythme que les autres cartes. */}
        <SectionHeader
          level="card"
          as="span"
          icon={Wallet}
          title="Votre patrimoine estimé"
          className="mb-0 items-center"
          trailing={
            <span className="text-[10px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
              {inputs.duration} ans · {endYear}
            </span>
          }
        />

        {/* Le chiffre : grand, tabulaire, sans dégradé — le poids vient de la
            taille et de l'épaisseur, pas d'un habillage. */}
        <p className="mono text-4xl sm:text-5xl font-extrabold tracking-tight text-text mt-4 leading-none">
          {fmtCurrency(total)}
        </p>
        <p className="text-[11px] text-text-muted mt-2">
          {showReal ? "en euros d'aujourd'hui (pouvoir d'achat)" : accountLabel} —{" "}
          <span className="text-text-dim">
            {fmtCurrency(secondary.amount)} {secondary.label}
          </span>
        </p>

        {/* Barre de répartition épargne / croissance : l'insight « d'où vient
            votre argent » rendu visuel, une seule forme géométrique. */}
        {total > 0 && (
          <div className="mt-6 sm:mt-7">
            <div
              role="img"
              aria-label={`${investedPct.toFixed(0)} % de votre capital provient de votre épargne, ${growthPct.toFixed(0)} % de la croissance de la bourse`}
              className="flex h-2.5 rounded-full overflow-hidden bg-glass-hover"
            >
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${investedPct}%`, background: "var(--color-text-muted)" }}
              />
              {growth > 0 && (
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${growthPct}%`, background: "var(--color-primary)" }}
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 mt-2.5 flex-wrap">
              <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-text-muted shrink-0" aria-hidden />
                Épargné : <span className="mono font-semibold text-text">{fmtCurrency(invested)}</span>
              </span>
              {growth > 0 && (
                /* Vocabulaire unifié (v6.9.0) : « Gains de la bourse » comme le
                   panneau « Votre capital en détail » et le rapport PDF — avant,
                   trois noms pour le même chiffre dans le même viewport. */
                <span className="text-[10px] text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden />
                  Gains de la bourse : <span className="mono font-semibold">+{fmtCurrency(growth)}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-text-muted mt-3 leading-relaxed flex items-start gap-2">
              <Sparkles size={13} className="text-primary shrink-0 mt-0.5" aria-hidden />
              <span>
                {growth > 0 ? (
                  <>
                    La croissance de la bourse représente{" "}
                    <strong className="text-primary">{growthPct.toFixed(0)} %</strong> de votre capital final
                    {ratio && (
                      <>
                        {" "}— votre épargne est multipliée par{" "}
                        <strong className="text-primary">~{ratio.toFixed(1).replace(".", ",")}</strong>
                      </>
                    )}
                    .
                  </>
                ) : (
                  <>Votre capital repose pour l'instant sur votre épargne — la croissance s'ajoutera avec le temps.</>
                )}
              </span>
            </p>
          </div>
        )}

        {/* Icône décorative discrète, coupée par le bord (mouvement doux, pas
            d'animations dispersées). */}
        <TrendingUp
          size={96}
          aria-hidden
          className="absolute -right-6 -bottom-8 text-primary/[0.06] rotate-[-8deg] pointer-events-none"
        />
      </div>
    </section>
  )
}
