import { useId, useState } from "react"
import { useLang } from "../../i18n"
import { cn } from "../../utils/cn"

interface HelpTipProps {
  /** Texte affiché dans l'infobulle au survol / au focus. */
  text: string
  className?: string
}

/**
 * Petite icône « ? » qui affiche une infobulle au survol (et au focus clavier /
 * au clic, pour l'accessibilité et le tactile). Utilisée pour expliquer des
 * notions clés comme « rendement brut vs net d'inflation » sans surcharger le
 * libellé du curseur.
 */
export function HelpTip({ text, className }: HelpTipProps) {
  const { tr } = useLang()
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  return (
    <span
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Pas de onFocus auto-open : dans un vrai navigateur, un clic déclenche
          focus PUIS click — le focus ouvrait l'infobulle et le toggle la
          refermait aussitôt (le 1er clic semblait ne rien faire ; le test
          jsdom ne déclenchait pas focus et masquait le bug). Le clic ouvre
          TOUJOURS, la fermeture se fait au blur / au survol sortant. */}
      <button
        type="button"
        aria-label={tr("Aide")}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-text-dim/15 text-text-dim text-[10px] font-bold leading-none flex items-center justify-center cursor-help hover:bg-primary/25 hover:text-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        ?
      </button>
      {/* Centré sur le bouton : mesuré dans la sidebar réelle, le bouton « ? »
          se situe à ~155 px (le libellé long le pousse au centre) et un tooltip
          w-56 centré tient dans l'aside (51..275 dans 16..298) — un ancrage
          left-0 débordait à droite. Dans l'onglet Objectif (main sans
          overflow), il flotte librement au-dessus du contenu. */}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 p-2.5 rounded-lg glass-strong shadow-premium text-[10px] leading-snug text-text-muted z-30"
        >
          {text}
        </span>
      )}
    </span>
  )
}
