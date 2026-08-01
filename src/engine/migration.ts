import type { EnvelopeType, SimulationInputs } from "../types"

export const V4_SETTINGS_KEY = "snowball_v4_settings"
export const SETTINGS_KEY = "snowball_v5_settings"

export interface V4Settings {
  p: number
  m: number
  r: number
  t: number
  idx: number
  inf: number
  envelope: string
  kraschYear: number
  kraschPct: number
  showReal: boolean
  activeTab?: string
}

export const DEFAULT_INPUTS: SimulationInputs = {
  capitalInitial: 10000,
  monthlyPayment: 500,
  annualReturn: 0.08,
  volatility: 0.15,
  duration: 25,
  indexation: 0,
  inflation: 0.021,
  inflationMode: "custom",
  envelope: "cto",
  taxCouple: false,
  peaYearsHeld: 0,
  avYearsHeld: 0,
  returnMode: "fixed",
  historicalIndex: "msci-world",
  crisisEnabled: false,
  crisisProfile: "flash-crash",
  crisisYear: 10,
  crisisAmplitude: 30,
  crisisDuration: 0,
  etfFees: 0,
  brokerageFees: 0,
  insuranceFees: 0,
  managementFees: 0,
  dividendYield: 0,
  showReal: false,
  withdrawalModel: "custom",
  withdrawalRate: 0.04,
  withdrawalFixed: 2000,
  withdrawalInflation: false,
  retirementYears: 30,
  goalTarget: 500000,
  goalDuration: 15,
  goalCapital: 10000,
  goalPayment: 500,
  goalAnnualReturn: 0.07,
  mcRuns: 300,
  seed: 42,
  fiscalYear: 2026,
}

const VALID_ENVELOPES: EnvelopeType[] = ["cto", "pea", "av", "per", "none"]

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))

export function v4SettingsToInputs(s: Partial<V4Settings>): SimulationInputs {
  const envelope = VALID_ENVELOPES.includes(s.envelope as EnvelopeType)
    ? (s.envelope as EnvelopeType)
    : DEFAULT_INPUTS.envelope

  return {
    ...DEFAULT_INPUTS,
    capitalInitial: clamp(num(s.p, DEFAULT_INPUTS.capitalInitial), 0, 100_000_000),
    monthlyPayment: clamp(num(s.m, DEFAULT_INPUTS.monthlyPayment), 0, 200_000),
    annualReturn: clamp(num(s.r, 8) / 100, -0.95, 10),
    duration: clamp(num(s.t, DEFAULT_INPUTS.duration), 1, 80),
    indexation: clamp(num(s.idx, 0) / 100, 0, 0.5),
    inflation: clamp(num(s.inf, 2.1) / 100, -0.1, 1),
    envelope,
    crisisYear: clamp(num(s.kraschYear, DEFAULT_INPUTS.crisisYear), 1, 80),
    crisisAmplitude: clamp(num(s.kraschPct, DEFAULT_INPUTS.crisisAmplitude), 0, 70),
    showReal: Boolean(s.showReal),
  }
}

const NUMERIC_KEYS: (keyof SimulationInputs)[] = [
  "capitalInitial",
  "monthlyPayment",
  "annualReturn",
  "volatility",
  "duration",
  "indexation",
  "inflation",
  "peaYearsHeld",
  "avYearsHeld",
  "crisisYear",
  "crisisAmplitude",
  "crisisDuration",
  "etfFees",
  "brokerageFees",
  "insuranceFees",
  "managementFees",
  "dividendYield",
  "withdrawalRate",
  "withdrawalFixed",
  "retirementYears",
  "goalTarget",
  "goalDuration",
  "goalCapital",
  "goalPayment",
  "goalAnnualReturn",
  "mcRuns",
  "seed",
  "fiscalYear",
]

const BOOLEAN_KEYS: (keyof SimulationInputs)[] = [
  "taxCouple",
  "showReal",
  "withdrawalInflation",
  "crisisEnabled",
]

const STRING_KEYS: (keyof SimulationInputs)[] = [
  "inflationMode",
  "envelope",
  "returnMode",
  "historicalIndex",
  "crisisProfile",
  "withdrawalModel",
]

const ENUM_VALUES: Record<string, string[]> = {
  inflationMode: ["custom", "historical", "dynamic"],
  envelope: ["cto", "pea", "av", "per", "none"],
  returnMode: ["fixed", "random", "historical"],
  historicalIndex: ["msci-world", "sp500", "nasdaq", "cac40", "bitcoin", "gold"],
  crisisProfile: ["none", "flash-crash", "bear-market", "long-depression", "stagflation"],
  withdrawalModel: ["rule-4", "ultra-safe", "optimistic", "custom"],
}

export function parseStoredInputs(raw: string | null): SimulationInputs {
  if (!raw) return DEFAULT_INPUTS
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return DEFAULT_INPUTS

    const merged = { ...DEFAULT_INPUTS } as SimulationInputs
    const target = merged as unknown as Record<string, unknown>
    for (const key of NUMERIC_KEYS) {
      const v = parsed[key]
      if (typeof v === "number" && Number.isFinite(v)) target[key] = v
    }
    for (const key of BOOLEAN_KEYS) {
      const v = parsed[key]
      if (typeof v === "boolean") target[key] = v
    }
    for (const key of STRING_KEYS) {
      const v = parsed[key]
      const allowed = ENUM_VALUES[key]
      if (typeof v === "string" && allowed && allowed.includes(v)) target[key] = v
    }
    // Le millésime fiscal est borné dès le chargement pour rester cohérent
    // avec les règles affichables (avant toute sanitisation par la simulation).
    target.fiscalYear = clamp(num(parsed.fiscalYear, DEFAULT_INPUTS.fiscalYear), 2020, 2032)
    return merged
  } catch {
    return DEFAULT_INPUTS
  }
}
