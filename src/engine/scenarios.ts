import type { ScenarioId, SimulationInputs } from "../types"

export interface ScenarioState {
  A: SimulationInputs
  B: SimulationInputs | null
}

export interface ScenarioPatchResult {
  state: ScenarioState
  target: ScenarioId
}

/**
 * Résout la cible d'une modification : en mode comparaison, les éditions
 * du panneau vont au scénario B ; sinon au scénario A.
 */
export function resolveScenarioTarget(comparing: boolean, explicit: ScenarioId | null): ScenarioId {
  if (explicit) return explicit
  return comparing ? "B" : "A"
}

/**
 * Applique un patch au bon scénario sans jamais écraser l'autre.
 * Retourne le nouvel état et la cible effective (pour l'historique).
 */
export function applyScenarioPatch(
  state: ScenarioState,
  patch: Partial<SimulationInputs>,
  comparing: boolean,
  explicit: ScenarioId | null = null,
): ScenarioPatchResult {
  const target = resolveScenarioTarget(comparing, explicit)
  if (target === "B") {
    const base = state.B ?? state.A
    return { state: { A: state.A, B: { ...base, ...patch } }, target }
  }
  return { state: { A: { ...state.A, ...patch }, B: state.B }, target }
}

/**
 * Entre en mode comparaison : fige A et réinitialise B DEPUIS A. Un ancien B
 * mémorisé (localStorage) serait obsolète — repartir de A évite les surprises.
 */
export function enterComparison(state: ScenarioState): ScenarioState {
  return {
    A: { ...state.A },
    B: { ...state.A },
  }
}

/** Quitte le mode comparaison : A reprend la main, B reste mémorisé. */
export function exitComparison(state: ScenarioState): ScenarioState {
  return { A: state.A, B: state.B }
}
