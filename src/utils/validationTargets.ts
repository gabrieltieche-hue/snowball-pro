import type { SimulationInputs } from "../types"

/**
 * Cible de « Corriger l'erreur » pour chaque champ validé (validation.ts).
 * Un champ vit soit dans un onglet dédié (TAB_FIELD), soit dans une section
 * accordéon de la sidebar (FIELD_SECTION) avec éventuellement un input à
 * focus (FIELD_INPUT_ID, id du <input type="range"> de SliderInput).
 * Source de vérité unique — les ids doivent rester alignés sur Sidebar.tsx.
 */
export type FieldSectionId = "epargne" | "avance" | "compte" | "frais" | "profil"

export const TAB_FIELD: Partial<Record<keyof SimulationInputs, "goal" | "rente">> = {
  goalTarget: "goal",
  retirementYears: "rente",
}

export const FIELD_SECTION: Partial<Record<keyof SimulationInputs, FieldSectionId>> = {
  capitalInitial: "epargne",
  monthlyPayment: "epargne",
  duration: "epargne",
  indexation: "avance",
  inflation: "avance",
  mcRuns: "avance",
  etfFees: "frais",
  brokerageFees: "frais",
  managementFees: "frais",
  tmi: "compte",
  ctoTaxMode: "compte",
  peaYearsHeld: "compte",
  avYearsHeld: "compte",
  ageNow: "profil",
  ageRetirement: "profil",
  retirementExpenses: "profil",
  otherPensions: "profil",
  riskTolerance: "profil",
  maxDrawdownTolerance: "profil",
}

export const FIELD_INPUT_ID: Partial<Record<keyof SimulationInputs, string>> = {
  capitalInitial: "capital-initial",
  monthlyPayment: "monthly-payment",
  duration: "duration",
  indexation: "indexation",
  inflation: "inflation",
  mcRuns: "mc-runs",
  tmi: "tmi",
  peaYearsHeld: "pea-years",
  avYearsHeld: "av-years",
  ageNow: "age-now",
  ageRetirement: "age-retirement",
  retirementExpenses: "retirement-expenses",
  otherPensions: "other-pensions",
}
