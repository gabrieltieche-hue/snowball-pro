import type { SimulationInputs } from "../types"
import { clamp } from "./taxes"

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

  if (inputs.annualReturn <= -1) {
    errors.push({
      field: "annualReturn",
      message: "Le rendement ne peut pas être ≤ -100%",
      severity: "error",
      value: inputs.annualReturn,
      min: -0.99,
    })
  }
  if (inputs.annualReturn > 10) {
    errors.push({
      field: "annualReturn",
      message: "Rendement annuel très élevé (>1000%)",
      severity: "warning",
      value: inputs.annualReturn,
      max: 10,
    })
  }

  if (inputs.volatility <= 0) {
    errors.push({
      field: "volatility",
      message: "La volatilité doit être positive",
      severity: "error",
      value: inputs.volatility,
      min: 0.001,
    })
  }
  if (inputs.volatility > 3) {
    errors.push({
      field: "volatility",
      message: "Volatilité extrêmement élevée (>300%)",
      severity: "warning",
      value: inputs.volatility,
      max: 3,
    })
  }

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

  if (inputs.dividendYield < 0 || inputs.dividendYield > 1) {
    errors.push({
      field: "dividendYield",
      message: "Le rendement des dividendes devrait être entre 0% et 100%",
      severity: "warning",
      value: inputs.dividendYield,
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
    annualReturn: clamp(inputs.annualReturn, -0.95, 10),
    volatility: clamp(inputs.volatility, 0.001, 3),
    duration: clamp(inputs.duration, 1, 80),
    indexation: clamp(inputs.indexation, 0, 0.5),
    inflation: clamp(inputs.inflation, -0.1, 1),
    etfFees: clamp(inputs.etfFees, 0, 0.5),
    brokerageFees: clamp(inputs.brokerageFees, 0, 0.5),
    managementFees: clamp(inputs.managementFees, 0, 0.5),
    insuranceFees: clamp(inputs.insuranceFees, 0, 0.5),
    peaYearsHeld: clamp(inputs.peaYearsHeld, 0, 50),
    avYearsHeld: clamp(inputs.avYearsHeld, 0, 50),
    dividendYield: clamp(inputs.dividendYield, 0, 1),
    crisisAmplitude: clamp(inputs.crisisAmplitude, 0, 85),
    crisisDuration: clamp(inputs.crisisDuration, 0.5, 10),
    mcRuns: Math.round(clamp(inputs.mcRuns, 100, 10000)),
    goalTarget: Math.max(inputs.goalTarget, 1),
    goalAnnualReturn: clamp(inputs.goalAnnualReturn, -0.95, 10),
    seed: Math.abs(inputs.seed) || 1,
    tmi: clamp(inputs.tmi, 0, 0.45),
    ctoTaxMode: inputs.ctoTaxMode === "bareme" ? "bareme" : "pfu",
  }
}
