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
  // Plus de rendement saisi par l'utilisateur (Option A) : le Simulateur, Monte
  // Carlo et la Rente rejouent TOUJOURS les rendements réels du MSCI World
  // (1970-2025, moyenne 10,07 %/an brut) — pas de taux défini ni de volatilité.
  duration: 25,
  indexation: 0,
  inflation: 0.021,
  inflationMode: "custom",
  envelope: "cto",
  taxCouple: false,
  peaYearsHeld: 0,
  avYearsHeld: 0,
  historicalIndex: "msci-world",
  etfFees: 0,
  brokerageFees: 0,
  insuranceFees: 0,
  managementFees: 0,
  // Affichage par défaut = EUROS D'AUJOURD'HUI (les vraies valeurs nettes
  // d'inflation). Le moteur calcule TOUJOURS les deux échelles (nominal + real,
  // cf. simulation.ts) : le toggle ne fait que choisir laquelle est mise en
  // avant. Coche par défaut → l'utilisateur voit d'emblée le pouvoir d'achat
  // réel, le montant sur le compte restant affiché partout (demande utilisateur).
  showReal: true,
  withdrawalModel: "custom",
  withdrawalRate: 0.04,
  withdrawalFixed: 2000,
  withdrawalInflation: false,
  retirementYears: 30,
  goalTarget: 500000,
  goalDuration: 15,
  goalCapital: 10000,
  goalPayment: 500,
  // Défaut aligné sur le rendement de l'onglet principal : 10,07 %/an BRUT
  // (moyenne MSCI World) — jamais un taux net d'inflation (demande utilisateur).
  goalAnnualReturn: 0.1007,
  mcRuns: 10000,
  seed: 42,
  tmi: 0.3,
  ctoTaxMode: "pfu",
}

const VALID_ENVELOPES: EnvelopeType[] = ["cto", "pea", "av", "per", "none"]

const num = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback)

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))

export function v4SettingsToInputs(s: Partial<V4Settings>): SimulationInputs {
  const envelope = VALID_ENVELOPES.includes(s.envelope as EnvelopeType)
    ? (s.envelope as EnvelopeType)
    : DEFAULT_INPUTS.envelope

  return {
    ...DEFAULT_INPUTS,
    capitalInitial: clamp(num(s.p, DEFAULT_INPUTS.capitalInitial), 0, 100_000_000),
    monthlyPayment: clamp(num(s.m, DEFAULT_INPUTS.monthlyPayment), 0, 200_000),
    duration: clamp(num(s.t, DEFAULT_INPUTS.duration), 1, 80),
    indexation: clamp(num(s.idx, 0) / 100, 0, 0.5),
    inflation: clamp(num(s.inf, 2.1) / 100, -0.1, 1),
    envelope,
    // Le rendement v4 (r) et la crise (krasch*) sont ignorés : l'app rejoue
    // toujours l'historique réel (Option A), un taux saisi n'a plus de sens.
    // Migration v4 → v5 : le défaut d'affichage est désormais « euros
    // d'aujourd'hui ». On respecte un choix v4 explicitement stocké, mais on
    // retombe sur le défaut (vrai) quand l'ancien état ne précisait rien.
    showReal: s.showReal !== false,
  }
}

const NUMERIC_KEYS: (keyof SimulationInputs)[] = [
  "capitalInitial",
  "monthlyPayment",
  "duration",
  "indexation",
  "inflation",
  "peaYearsHeld",
  "avYearsHeld",
  "etfFees",
  "brokerageFees",
  "insuranceFees",
  "managementFees",
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
  "tmi",
]

const BOOLEAN_KEYS: (keyof SimulationInputs)[] = ["taxCouple", "showReal", "withdrawalInflation"]

const STRING_KEYS: (keyof SimulationInputs)[] = [
  "inflationMode",
  "envelope",
  "historicalIndex",
  "withdrawalModel",
  "ctoTaxMode",
]

const ENUM_VALUES: Record<string, string[]> = {
  inflationMode: ["custom", "historical", "dynamic"],
  envelope: ["cto", "pea", "av", "per", "none"],
  historicalIndex: ["msci-world", "sp500", "nasdaq", "cac40", "bitcoin", "gold"],
  withdrawalModel: ["rule-4", "ultra-safe", "optimistic", "custom"],
  ctoTaxMode: ["pfu", "bareme"],
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
    // Les modes d'inflation « Historique » et « Cyclique » ont été supprimés de
    // l'interface : l'inflation est désormais TOUJOURS le taux personnalisé du
    // curseur (défaut 2,1 %/an). Un état stocké ou partagé qui contenait un
    // ancien mode est normalisé pour rester cohérent avec l'UI.
    target.inflationMode = "custom"
    // Le sélecteur d'indices a été supprimé : l'historique est TOUJOURS le
    // MSCI World. Un index stocké différent est normalisé. Les anciens champs
    // (returnMode, annualReturn, volatility, crise) sont simplement ignorés
    // par la liste de clés connues — ils n'ont plus de sens (Option A).
    target.historicalIndex = "msci-world"
    return merged
  } catch {
    return DEFAULT_INPUTS
  }
}
