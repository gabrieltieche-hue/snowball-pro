interface LegendChipProps {
  color: string
  label: string
  /** Swatch en tirets (séries Line type impôts) plutôt qu'un point plein. */
  dashed?: boolean
}

/** Pastille de légende en chip (v6.10) : le vocabulaire badge de l'app
 *  (bg-warning/10 rounded) appliqué aux légendes de graphique. Le swatch
 *  reprend la forme de la série : point plein (aire) ou trait pointillé
 *  (ligne). */
export function LegendChip({ color, label, dashed = false }: LegendChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-glass px-2 py-0.5 text-[10px] text-text-dim whitespace-nowrap">
      {dashed ? (
        <span className="w-3.5 h-0" style={{ borderTop: `2px dashed ${color}`, borderRadius: 1 }} aria-hidden="true" />
      ) : (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden="true" />
      )}
      {label}
    </span>
  )
}
