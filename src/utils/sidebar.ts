/**
 * Préférence UI (v6.2) : l'état replié/déplié de la sidebar persiste d'une
 * visite à l'autre — comme le thème, c'est une préférence d'affichage, pas
 * une donnée de scénario (donc clé globale, non scopée par compte). L'état
 * vit dans App (la grille doit rétrécir quand on replie) ; ce module est la
 * seule source de vérité pour la persistance.
 */
export const SIDEBAR_COLLAPSED_KEY = "snowball_v62_sidebar_collapsed"

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
  } catch {
    return false
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0")
  } catch {
    /* localStorage indisponible */
  }
}
