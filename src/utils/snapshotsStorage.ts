import { SNAPSHOT_STORAGE_KEY, V41_STATE_KEY } from "../engine"
import type { SavedSnapshot } from "../types"

export function loadSnapshotsFromStorage(): SavedSnapshot[] {
  try {
    const stored = localStorage.getItem(SNAPSHOT_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as SavedSnapshot[]
      return Array.isArray(parsed) ? parsed : []
    }
    const v41 = localStorage.getItem(V41_STATE_KEY)
    if (v41) {
      const parsed = JSON.parse(v41) as { snapshots?: SavedSnapshot[] }
      if (Array.isArray(parsed.snapshots)) return parsed.snapshots
    }
  } catch {
    /* localStorage indisponible ou contenu invalide */
  }
  return []
}

export function saveSnapshotsToStorage(snapshots: SavedSnapshot[]): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots))
  } catch {
    /* localStorage indisponible */
  }
}
