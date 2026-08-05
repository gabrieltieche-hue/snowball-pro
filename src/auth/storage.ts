/**
 * Espace de stockage par compte.
 *
 * Invité  → clés historiques inchangées (`snowball_v5_settings`, …) : la v5
 *           continue de charger ses données, rétrocompatibilité totale.
 * Connecté → clés préfixées `u:<id>:…` : chaque compte a SES simulations,
 *           ses snapshots et son scénario B, isolés des autres comptes et de
 *           l'invité. Le thème reste global (préférence d'appareil).
 */
import { SETTINGS_KEY, SNAPSHOT_STORAGE_KEY } from "../engine"

export const SETTINGS_B_KEY = "snowball_v5_settings_b"

/** Clés de base scopées par compte (celles qui contiennent des données métier). */
export const SCOPED_BASE_KEYS = [SETTINGS_KEY, SETTINGS_B_KEY, SNAPSHOT_STORAGE_KEY] as const

/** Préfixe la clé si un utilisateur est connecté ; inchangée sinon. */
export function scopeKey(userId: string | null, key: string): string {
  return userId ? `u:${userId}:${key}` : key
}

/** Supprime TOUTES les données scopées d'un compte (à la suppression du compte). */
export function removeScopedData(userId: string): void {
  for (const baseKey of SCOPED_BASE_KEYS) {
    try {
      localStorage.removeItem(scopeKey(userId, baseKey))
    } catch {
      /* localStorage indisponible */
    }
  }
}
