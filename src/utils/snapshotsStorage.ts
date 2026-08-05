import { SNAPSHOT_STORAGE_KEY, V41_STATE_KEY } from "../engine"
import { scopeKey } from "../auth/storage"
import type { SavedSnapshot } from "../types"

/** Snapshots du scope courant (invité = clé historique, compte = clé scopée). */
export function loadSnapshotsFromStorage(scope: string | null): SavedSnapshot[] {
  try {
    const stored = localStorage.getItem(scopeKey(scope, SNAPSHOT_STORAGE_KEY))
    if (stored) {
      const parsed = JSON.parse(stored) as SavedSnapshot[]
      return Array.isArray(parsed) ? parsed : []
    }
    // Migration v4.1 : uniquement pour l'invité (un compte démarre vierge).
    if (scope === null) {
      const v41 = localStorage.getItem(V41_STATE_KEY)
      if (v41) {
        const parsed = JSON.parse(v41) as { snapshots?: SavedSnapshot[] }
        if (Array.isArray(parsed.snapshots)) return parsed.snapshots
      }
    }
  } catch {
    /* localStorage indisponible ou contenu invalide */
  }
  return []
}

export function saveSnapshotsToStorage(snapshots: SavedSnapshot[], scope: string | null): void {
  try {
    localStorage.setItem(scopeKey(scope, SNAPSHOT_STORAGE_KEY), JSON.stringify(snapshots))
  } catch {
    /* localStorage indisponible */
  }
}
