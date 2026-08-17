import type { SavedSnapshot, SimulationInputs, YearRow } from "../types"

// 30 (v7) : la limite basse de 8 était pensée pour des « captures » manuelles ;
// depuis v7 la même liste sert de bibliothèque « Mes simulations » (chaque
// simulation créée par le wizard y est ajoutée) — une limite de 8 ferait
// disparaître silencieusement les plus anciennes.
export const SNAPSHOT_LIMIT = 30
export const SNAPSHOT_STORAGE_KEY = "snowball_v5_snapshots"
export const V41_STATE_KEY = "snowball_pro_v41_state"

export function createSnapshot(inputs: SimulationInputs, rows: YearRow[], name?: string): SavedSnapshot {
  const now = new Date()
  const defaultName = `Snapshot ${now.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    name: name && name.trim() !== "" ? name.trim() : defaultName,
    createdAt: now.toISOString(),
    inputs: { ...inputs },
    finalCapital: rows[rows.length - 1]?.taxNet ?? 0,
  }
}

export function addSnapshot(list: SavedSnapshot[], snapshot: SavedSnapshot, limit = SNAPSHOT_LIMIT): SavedSnapshot[] {
  return [snapshot, ...list].slice(0, limit)
}

export function removeSnapshot(list: SavedSnapshot[], id: string): SavedSnapshot[] {
  return list.filter(s => s.id !== id)
}

export function renameSnapshot(list: SavedSnapshot[], id: string, name: string): SavedSnapshot[] {
  const trimmed = name.trim()
  if (trimmed === "") return list
  return list.map(s => (s.id === id ? { ...s, name: trimmed } : s))
}
