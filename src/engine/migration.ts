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
  month: number
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
  inflation: 0.02,
  inflationMode: "custom",
  startMonth: 0,
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
    inflation: clamp(num(s.inf, 2) / 100, -0.1, 1),
    startMonth: clamp(Math.round(num(s.month, 0)), 0, 11),
    envelope,
    crisisYear: clamp(num(s.kraschYear, DEFAULT_INPUTS.crisisYear), 1, 80),
    crisisAmplitude: clamp(num(s.kraschPct, DEFAULT_INPUTS.crisisAmplitude), 0, 70),
    showReal: Boolean(s.showReal),
  }
}

export function parseStoredInputs(raw: string | null): SimulationInputs {
  if (!raw) return DEFAULT_INPUTS
  try {
    const parsed = JSON.parse(raw) as Partial<SimulationInputs>
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_INPUTS
    return { ...DEFAULT_INPUTS, ...parsed }
  } catch {
    return DEFAULT_INPUTS
  }
}
