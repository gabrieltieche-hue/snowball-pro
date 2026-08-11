/**
 * Mode d'interface Débutant / Avancé (audit) : les notions techniques (XIRR,
 * PFU, TMI, Fisher, Pástor–Stambaugh, Guyton–Klinger) sont masquées en mode
 * Débutant, qui reste le défaut. Préférence d'affichage → clé globale, non
 * scopée par compte (comme le thème).
 */
export type UiMode = "debutant" | "avance"

export const UI_MODE_KEY = "snowball_v5_ui_mode"

export function loadUiMode(): UiMode {
  try {
    return localStorage.getItem(UI_MODE_KEY) === "avance" ? "avance" : "debutant"
  } catch {
    return "debutant"
  }
}

export function saveUiMode(mode: UiMode): void {
  try {
    localStorage.setItem(UI_MODE_KEY, mode)
  } catch {
    /* localStorage indisponible */
  }
}
