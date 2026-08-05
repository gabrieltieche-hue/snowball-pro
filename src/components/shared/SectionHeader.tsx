import type { ElementType, ReactNode } from "react"
import { cn } from "../../utils/cn"

interface SectionHeaderProps {
  /** Titre affiché (texte ou nœud React). */
  title?: ReactNode
  /** Alternative à `title` pour le mini-titre `level="label"` (ex. <SectionHeader level="label">Paramètres</SectionHeader>). */
  children?: ReactNode
  /** Icône lucide à gauche du titre (teintée or par défaut). */
  icon?: ElementType
  /**
   * Poids visuel :
   * - "page" : grand titre de section (Statistiques clés, onglets)
   * - "card" : titre de carte / graphique (Vos impôts, frais, étapes…)
   * - "label" : mini-titre de sous-section (Modèle de retrait, Paramètres)
   */
  level?: "page" | "card" | "label"
  /** Balise rendue : h2 (graphiques), h3 (sections), span (dans un bouton). */
  as?: "h2" | "h3" | "span" | "div"
  /** Sous-titre discret sous le titre, aligné sous le texte (ex. l'enveloppe). */
  sub?: ReactNode
  /** Élément aligné à droite (pastille « € d'aujourd'hui », légende, chevron…). */
  trailing?: ReactNode
  /** Teinte de l'icône (défaut : or — utile pour un sens, ex. danger). */
  iconClassName?: string
  /** Empêche le titre de passer à la ligne (colonnes étroites + pastille). */
  nowrap?: boolean
  /** Mode « nu » : rend UNIQUEMENT du contenu phrasé (spans) — à utiliser dans
   * un <button> (accordéon), dont le modèle de contenu HTML n'admet pas de
   * <div> (valide pour Calendrier des flux, Méthodologie, Détail, crise…). */
  bare?: boolean
  className?: string
}

/**
 * Anatomie de titre UNIFORME sur tout le site (v5.6.4) : barre dorée + icône +
 * titre extrabold majuscule. Avant, chaque carte utilisait son propre style
 * (10px gris muet pour « Vos impôts » à côté d'un titre de section en
 * extrabold) — d'où une hiérarchie visuelle déséquilibrée entre les sections.
 * Composant unique pour que tous les titres partagent le même rythme.
 */
export function SectionHeader({
  title,
  children,
  icon: Icon,
  level = "card",
  as: Tag = "h3",
  sub,
  trailing,
  iconClassName,
  nowrap = false,
  bare = false,
  className,
}: SectionHeaderProps) {
  // Mini-titre de sous-section : barre fine + texte compact (ex. la sidebar
  // « Modèle de retrait » / « Paramètres » de l'onglet Rente).
  if (level === "label") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted mb-3",
          className,
        )}
      >
        <span className="w-1 h-3 rounded-full bg-primary shrink-0" aria-hidden />
        {children ?? title}
      </div>
    )
  }

  // Tailles légèrement réduites (demande utilisateur) : le niveau « page »
  // passait de 16/18 px à 15/17 px et « card » de 14/16 px à 13/14 px — même
  // hiérarchie (page > card > label), moins de poids visuel.
  const titleSize = level === "page" ? "text-[15px] sm:text-[17px]" : "text-[13px] sm:text-sm"
  const iconSize = level === "page" ? 18 : 16

  // Variante « bare » : uniquement du contenu phrasé (spans) pour vivre dans
  // un <button>. Aucun <div> ni <p> — sinon le HTML est invalide (le modèle de
  // contenu d'un bouton n'admet que le phrasing content).
  if (bare) {
    return (
      <span className={cn("flex items-center gap-3", className)}>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary shrink-0" aria-hidden />
            {Icon && (
              <Icon size={iconSize} className={cn("shrink-0", iconClassName ?? "text-primary")} aria-hidden />
            )}
            <span
              className={cn(
                "font-extrabold uppercase tracking-[0.08em] text-text leading-none",
                titleSize,
                nowrap && "whitespace-nowrap",
              )}
            >
              {title}
            </span>
          </span>
          {sub && (
            <span className="block text-[10px] font-medium uppercase tracking-wide text-text-muted mt-1.5 ml-7 truncate">
              {sub}
            </span>
          )}
        </span>
        {trailing}
      </span>
    )
  }

  return (
    <div className={cn("flex items-start justify-between gap-3 flex-wrap mb-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary shrink-0" aria-hidden />
          {Icon && <Icon size={iconSize} className={cn("shrink-0", iconClassName ?? "text-primary")} aria-hidden />}
          <Tag
            className={cn(
              "font-extrabold uppercase tracking-[0.08em] text-text leading-none",
              titleSize,
              nowrap && "whitespace-nowrap",
            )}
          >
            {title}
          </Tag>
        </div>
        {sub && (
          <p
            className="text-[10px] font-medium uppercase tracking-wide text-text-muted mt-1.5 ml-7 truncate"
            title={typeof sub === "string" ? sub : undefined}
          >
            {sub}
          </p>
        )}
      </div>
      {trailing}
    </div>
  )
}
