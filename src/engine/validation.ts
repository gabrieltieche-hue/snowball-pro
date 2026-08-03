import type { SimulationInputs } from "../types"
import { clamp } from "./taxes"

// Fourchette recommandée pour le rendement de l'onglet Objectif (TOUJOURS
// brut, avant inflation) : moyenne MSCI World 1970-2025 ≈ 10,07 %/an. Une
// seule source de vérité — utilisée par la validation ET le libellé du curseur
// de l'onglet Objectif. Le Simulateur/MC/Rente n'ont plus de taux saisi
// (Option A) : ils rejouent toujours l'historique réel.
export const RECOMMENDED_RETURN_MIN = 0.07
export const RECOMMENDED_RETURN_MAX = 0.12

export interface ValidationError {
  field: keyof SimulationInputs
  message: string
  severity: "error" | "warning"
  value: number
  min?: number
  max?: number
}

export function validateInputs(inputs: SimulationInputs): ValidationError[] {
  const errors: ValidationError[] = []

  if (inputs.capitalInitial < 0) {
    errors.push({
      field: "capitalInitial",
      message: "Le capital initial ne peut pas être négatif",
      severity: "error",
      value: inputs.capitalInitial,
    })
  }
  if (inputs.capitalInitial > 100_000_000) {
    errors.push({
      field: "capitalInitial",
      message: "Capital initial très élevé (>100M€)",
      severity: "warning",
      value: inputs.capitalInitial,
      max: 100_000_000,
    })
  }

  if (inputs.monthlyPayment < 0) {
    errors.push({
      field: "monthlyPayment",
      message: "Le versement mensuel ne peut pas être négatif",
      severity: "error",
      value: inputs.monthlyPayment,
    })
  }
  if (inputs.monthlyPayment > 100_000) {
    errors.push({
      field: "monthlyPayment",
      message: "Versement mensuel très élevé (>100k€)",
      severity: "warning",
      value: inputs.monthlyPayment,
      max: 100_000,
    })
  }

  if (inputs.duration < 1) {
    errors.push({
      field: "duration",
      message: "La durée doit être d'au moins 1 an",
      severity: "error",
      value: inputs.duration,
      min: 1,
    })
  }
  if (inputs.duration > 80) {
    errors.push({
      field: "duration",
      message: "La durée maximale est de 80 ans",
      severity: "error",
      value: inputs.duration,
      max: 80,
    })
  }

  // Plus de validation de rendement/volatilité : ces saisies ont été supprimées
  // (Option A). Le rendement de l'onglet Objectif (goalAnnualReturn) garde sa
  // fourchette recommandée via RECOMMENDED_RETURN_MIN/MAX (libellé du curseur).
  if (inputs.inflation < -0.1) {
    errors.push({
      field: "inflation",
      message: "Inflation anormalement basse (<-10%)",
      severity: "warning",
      value: inputs.inflation,
      min: -0.1,
    })
  }
  if (inputs.inflation > 1) {
    errors.push({
      field: "inflation",
      message: "Inflation anormalement élevée (>100%)",
      severity: "warning",
      value: inputs.inflation,
      max: 1,
    })
  }

  if (inputs.etfFees < 0 || inputs.brokerageFees < 0 || inputs.managementFees < 0) {
    errors.push({
      field: "etfFees",
      message: "Les frais ne peuvent pas être négatifs",
      severity: "error",
      value: Math.min(inputs.etfFees, inputs.brokerageFees, inputs.managementFees),
    })
  }

  if (inputs.tmi < 0) {
    errors.push({
      field: "tmi",
      message: "La tranche marginale d'imposition ne peut pas être négative",
      severity: "error",
      value: inputs.tmi,
      min: 0,
    })
  }
  if (inputs.tmi > 0.45) {
    errors.push({
      field: "tmi",
      message: "TMI très élevée (>45 %) — vérifiez le barème en vigueur",
      severity: "warning",
      value: inputs.tmi,
      max: 0.45,
    })
  }

  if (inputs.ctoTaxMode !== "pfu" && inputs.ctoTaxMode !== "bareme") {
    errors.push({
      field: "ctoTaxMode",
      message: "Mode fiscal CTO invalide (PFU ou barème progressif)",
      severity: "error",
      value: 0,
    })
  }

  if (inputs.goalTarget <= 0) {
    errors.push({
      field: "goalTarget",
      message: "L'objectif doit être supérieur à 0",
      severity: "error",
      value: inputs.goalTarget,
    })
  }

  // La crise synthétique a été supprimée (Option A) : les krachs réels sont
  // déjà rejoués dans l'historique — plus de validation de crise.

  // Bornes réelles utilisées par runMonteCarlo / runDecumulation (alignées).
  if (inputs.mcRuns < 100 || inputs.mcRuns > 10000) {
    errors.push({
      field: "mcRuns",
      message: "Le nombre de simulations doit être entre 100 et 10 000",
      severity: "warning",
      value: inputs.mcRuns,
      min: 100,
      max: 10000,
    })
  }

  return errors
}

export function sanitizeInputs(inputs: SimulationInputs): SimulationInputs {
  return {
    ...inputs,
    capitalInitial: clamp(inputs.capitalInitial, 0, 100_000_000),
    monthlyPayment: clamp(inputs.monthlyPayment, 0, 200_000),
    duration: clamp(inputs.duration, 1, 80),
    indexation: clamp(inputs.indexation, 0, 0.5),
    inflation: clamp(inputs.inflation, -0.1, 1),
    etfFees: clamp(inputs.etfFees, 0, 0.5),
    brokerageFees: clamp(inputs.brokerageFees, 0, 0.5),
    managementFees: clamp(inputs.managementFees, 0, 0.5),
    insuranceFees: clamp(inputs.insuranceFees, 0, 0.5),
    peaYearsHeld: clamp(inputs.peaYearsHeld, 0, 50),
    avYearsHeld: clamp(inputs.avYearsHeld, 0, 50),
    mcRuns: Math.round(clamp(inputs.mcRuns, 100, 10000)),
    goalTarget: Math.max(inputs.goalTarget, 1),
    goalAnnualReturn: clamp(inputs.goalAnnualReturn, -0.95, 10),
    seed: Math.abs(inputs.seed) || 1,
    tmi: clamp(inputs.tmi, 0, 0.45),
    ctoTaxMode: inputs.ctoTaxMode === "bareme" ? "bareme" : "pfu",
  }
}
