import { useLang } from "../../i18n"

interface DualAmountProps {
  /** Valeur en euros courants (ce qui sera écrit sur le compte). */
  nominal: number
  /** Valeur corrigée de l'inflation (euros d'aujourd'hui / pouvoir d'achat). */
  real: number
  /** Échelle mise en avant : true → le pouvoir d'achat est le grand chiffre.
   *  Quelle que soit la position, les DEUX valeurs restent affichées. */
  showReal: boolean
  color?: string
  /** Année de fin de projection, ex. « 2046 » → « sur le compte en 2046 ». */
  endYear?: string
  /** Préfixe appliqué aux deux valeurs (ex. « + » pour les gains de bourse). */
  prefix?: string
  /** Masque le libellé de la seconde échelle : la valeur reste affichée,
   *  l'échelle étant portée par le contexte (panneau à légende partagée).
   *  L'aria-label reste complet (v6.9.0). */
  hideSecondaryLabel?: boolean
  /** Affiche le libellé d'échelle du GRAND chiffre sur la même ligne que lui
   *  (« 1,31 M€ sur le compte en 2045 »). Fini la légende partagée que
   *  l'utilisateur ne rattachait pas aux chiffres : chaque valeur porte son
   *  échelle (retour utilisateur). En colonne étroite, le libellé passe à la
   *  ligne (flex-wrap) au lieu de tronquer. */
  primaryLabelInline?: boolean
  /** Taille du grand chiffre : "md" (défaut) | "lg" (panneau de synthèse). */
  size?: "md" | "lg"
  className?: string
}

/**
 * Affiche un montant sur DEUX échelles simultanément :
 * - la valeur sur le compte (euros courants, ex. 46 600 € en 2046) ;
 * - son équivalent en euros d'aujourd'hui (pouvoir d'achat, ex. 30 700 €).
 *
 * Le toggle « Euros d'aujourd'hui » ne fait plus que choisir quel chiffre est
 * mis en avant (le grand) : l'autre reste toujours visible en dessous, avec un
 * libellé explicite. Fini l'ambiguïté « le chiffre change, mais pourquoi ? ».
 */
export function DualAmount({
  nominal,
  real,
  showReal,
  color = "var(--color-text)",
  endYear,
  prefix = "",
  hideSecondaryLabel = false,
  primaryLabelInline = false,
  size = "md",
  className,
}: DualAmountProps) {
  const { tr, fmtCurrency } = useLang()
  const accountLabel = endYear ? tr("sur le compte en {year}", { year: endYear }) : tr("sur le compte")
  const todayLabel = tr("en euros d'aujourd'hui")
  const primary = showReal ? real : nominal
  const secondary = showReal ? nominal : real
  const primaryLabel = showReal ? todayLabel : accountLabel
  const secondaryLabel = showReal ? accountLabel : todayLabel
  const primarySize = size === "lg" ? "text-lg sm:text-xl" : "text-sm sm:text-base"

  return (
    <div
      className={className}
      aria-label={`${prefix}${fmtCurrency(primary)} ${primaryLabel}, ${prefix}${fmtCurrency(secondary)} ${secondaryLabel}`}
    >
      {primaryLabelInline ? (
        <div className="flex items-baseline gap-x-1.5 flex-wrap min-w-0">
          <span
            className={`mono ${primarySize} font-bold truncate min-w-0`}
            style={{ color }}
            title={`${prefix}${fmtCurrency(primary)}`}
          >
            {prefix}
            {fmtCurrency(primary)}
          </span>
          <span className="text-[10px] text-text-dim"> {primaryLabel}</span>
        </div>
      ) : (
        <div
          className={`mono ${primarySize} font-bold truncate`}
          style={{ color }}
          title={`${prefix}${fmtCurrency(primary)}`}
        >
          {prefix}
          {fmtCurrency(primary)}
        </div>
      )}
      <div
        className="flex items-baseline gap-x-1 flex-wrap mt-0.5"
        title={`${prefix}${fmtCurrency(secondary)} ${secondaryLabel}`}
      >
        {/* La valeur seule peut tronquer (colonne très étroite) mais le
            libellé passe à la ligne au lieu d'être coupé : l'échelle reste
            toujours lisible (retour utilisateur). */}
        <span className="text-[10px] text-text-dim truncate min-w-0">
          {prefix}
          {fmtCurrency(secondary)}
        </span>
        {!hideSecondaryLabel && <span className="text-[10px] text-text-dim opacity-80"> {secondaryLabel}</span>}
      </div>
    </div>
  )
}
