import { useEffect, useRef } from "react"

/**
 * M7 — Recharts pose `role="application"` sur le wrapper de chaque graphe, ce
 * qui pollue l'arbre d'accessibilité et la tabulation clavier. Au montage, on
 * le remplace par un rôle `img` nommé et non focusable.
 *
 * Attention : Recharts crée ce wrapper APRÈS le montage (mesure du conteneur
 * via ResizeObserver) et le ré-applique à chaque re-render (resize, données,
 * tooltip…). Un simple useEffect ne suffit pas — le rôle serait « application »
 * dès le premier rafraîchissement. Un MutationObserver maintient la
 * synchronisation : dès que Recharts remet `role="application"`, on le repasse
 * en `img` (l'écriture elle-même ne déclenche qu'un aller-retour sans boucle).
 */
export function useChartA11y(label: string) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const fix = () => {
      const wrapper = host.querySelector<HTMLElement>("[role='application']")
      if (wrapper && wrapper.getAttribute("role") !== "img") {
        wrapper.setAttribute("role", "img")
        wrapper.setAttribute("aria-label", label)
        wrapper.setAttribute("tabindex", "-1")
      }
    }
    fix()
    const observer = new MutationObserver(fix)
    observer.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role"],
    })
    return () => observer.disconnect()
  }, [label])

  return ref
}
