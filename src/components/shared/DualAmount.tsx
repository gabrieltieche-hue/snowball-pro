import { fmtCurrency } from "../../engine"

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
  className,
}: DualAmountProps) {
  const accountLabel = `sur le compte${endYear ? ` en ${endYear}` : ""}`
  const primary = showReal ? real : nominal
  const secondary = showReal ? nominal : real
  const primaryLabel = showReal ? "en euros d'aujourd'hui" : accountLabel
  const secondaryLabel = showReal ? accountLabel : "en euros d'aujourd'hui"

  return (
    <div
      className={className}
      aria-label={`${fmtCurrency(primary)} ${primaryLabel}, ${fmtCurrency(secondary)} ${secondaryLabel}`}
    >
      <div className="mono text-sm sm:text-base font-bold truncate" style={{ color }} title={fmtCurrency(primary)}>
        {fmtCurrency(primary)}
      </div>
      <div className="text-[10px] text-text-dim mt-0.5 truncate" title={`${fmtCurrency(secondary)} ${secondaryLabel}`}>
        {fmtCurrency(secondary)} <span className="opacity-80">{secondaryLabel}</span>
      </div>
    </div>
  )
}
