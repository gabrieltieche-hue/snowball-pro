import type { SavedSnapshot, SimulationInputs, YearRow } from "../types"

export const SNAPSHOT_LIMIT = 8
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
