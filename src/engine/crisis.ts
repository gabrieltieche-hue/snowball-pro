import type { CrisisProfile, SimulationInputs } from "../types"
import { clamp } from "./taxes"

interface CrisisDefinition {
  label: string
  amplitude: number
  durationYears: number
  recoveryYears: number
  volMultiplier: number
  inflationShock: number
}

const CRISIS_LIBRARY: Record<Exclude<CrisisProfile, "none">, CrisisDefinition> = {
  "flash-crash": {
    label: "Flash crash",
    amplitude: 0.25,
    durationYears: 1,
    recoveryYears: 2,
    volMultiplier: 2.2,
    inflationShock: 0.005,
  },
  "bear-market": {
    label: "Bear market",
    amplitude: 0.4,
    durationYears: 2,
    recoveryYears: 4,
    volMultiplier: 1.8,
    inflationShock: 0.01,
  },
  "long-depression": {
    label: "Dépression longue",
    amplitude: 0.55,
    durationYears: 5,
    recoveryYears: 8,
    volMultiplier: 1.45,
    inflationShock: 0.015,
  },
  stagflation: {
    label: "Stagflation",
    amplitude: 0.35,
    durationYears: 4,
    recoveryYears: 6,
    volMultiplier: 1.65,
    inflationShock: 0.035,
  },
}

export function getCrisisProfile(profile: CrisisProfile): CrisisDefinition | null {
  if (profile === "none") return null
  return CRISIS_LIBRARY[profile]
}

export function crisisAdjustment(
  inputs: SimulationInputs,
  monthIndex: number,
): { returnShock: number; volMultiplier: number } {
  if (!inputs.crisisEnabled || inputs.crisisProfile === "none") return { returnShock: 0, volMultiplier: 1 }
  const profile = getCrisisProfile(inputs.crisisProfile)
  if (!profile) return { returnShock: 0, volMultiplier: 1 }
  const startMonth = Math.max(1, inputs.crisisYear) * 12 - 11
  const durationMonths = Math.max(1, Math.round((inputs.crisisDuration || profile.durationYears) * 12))
  const recoveryMonths = Math.max(1, Math.round(profile.recoveryYears * 12))
  const amplitude = clamp((inputs.crisisAmplitude ?? profile.amplitude * 100) / 100, 0, 0.85)

  if (monthIndex >= startMonth && monthIndex < startMonth + durationMonths) {
    return { returnShock: Math.pow(1 - amplitude, 1 / durationMonths) - 1, volMultiplier: profile.volMultiplier }
  }
  if (monthIndex >= startMonth + durationMonths && monthIndex < startMonth + durationMonths + recoveryMonths) {
    return {
      returnShock: Math.pow(1 + amplitude * 0.72, 1 / recoveryMonths) - 1,
      volMultiplier: Math.max(1, profile.volMultiplier * 0.75),
    }
  }
  return { returnShock: 0, volMultiplier: 1 }
}
