/**
 * Thème — source unique partagée entre l'app et la landing (même clé
 * localStorage, même classe sur <html>). Évite la dérive entre les deux
 * surfaces (revue adverse v6.1).
 */
export const THEME_KEY = "snowball_v5_theme"

/** Défaut clair (comme la v5/v6) : un choix explicite « dark » est respecté. */
export function loadInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored) return stored === "dark"
  } catch {
    /* localStorage indisponible */
  }
  return false
}

export function applyThemeClass(darkMode: boolean): void {
  document.documentElement.classList.toggle("light-mode", !darkMode)
}

/** Applique puis persiste (préférence d'appareil, partagée par tous les comptes). */
export function persistThemeClass(darkMode: boolean): void {
  applyThemeClass(darkMode)
  try {
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light")
  } catch {
    /* localStorage indisponible */
  }
}
