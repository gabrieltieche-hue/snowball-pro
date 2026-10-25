/**
 * Piège de focus léger pour les overlays modaux (onboarding v8) : Tab /
 * Shift+Tab bouclent sur les éléments focusables du conteneur. Aucune
 * dépendance externe, aucun effet de bord si le conteneur est vide
 * (contenu transitoire, jsdom).
 */
import { useCallback } from "react"
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react"

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>) {
  return useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key !== "Tab") return
      const container = containerRef.current
      if (!container) return
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    },
    [containerRef],
  )
}
