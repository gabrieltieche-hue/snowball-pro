/**
 * Onboarding v7 — fonctions pures du questionnaire « Nouvelle simulation ».
 *
 * Aucune dépendance DOM ni i18n : les recommandations (durée, enveloppe) et le
 * mapping réponses → SimulationInputs sont testables en node. Les libellés
 * français servent de clés i18n à l'affichage (convention du repo).
 */
import { DEFAULT_INPUTS } from "./migration"
import type { EnvelopeType, ReturnScenario, SimulationInputs } from "../types"

export type ProjectGoal = "retraite" | "immobilier" | "liberte" | "precaution" | "enrichissement" | "aucune"

export type RiskLevel = "prudent" | "equilibre" | "audacieux"

/** Réponses brutes du wizard (une par question, avant mapping moteur). */
export interface WizardAnswers {
  age: number
  hasCapital: boolean
  capital: number
  monthly: number
  project: ProjectGoal | null
  duration: number
  /** "auto" = laisser l'app recommander (recommandEnvelope). */
  envelope: EnvelopeType | "auto"
  retirementAge: number | null
  risk: RiskLevel
}

/** Réponses par défaut du wizard — la « situation type » de l'aperçu en direct.
 *  Source unique : l'aperçu (previewInputsFromAnswers) et le résultat final
 *  (buildSimulationFromAnswers) partagent ces défauts — le chiffre affiché ne
 *  saute donc jamais entre la dernière question et l'écran de révélation. */
export const WIZARD_DEFAULT_ANSWERS: WizardAnswers = {
  age: 30,
  hasCapital: false,
  capital: 0,
  monthly: 250,
  project: null,
  duration: 25,
  envelope: "auto",
  retirementAge: null,
  risk: "equilibre",
}

/** Choix proposés par le wizard — l'utilisateur peut aussi saisir « Autre ». */
export const AGE_CHOICES = [25, 35, 45, 55] as const

export const CAPITAL_CHOICES = [1000, 5000, 10000, 25000, 50000] as const

export const MONTHLY_CHOICES = [50, 100, 250, 500, 1000] as const

export const DURATION_CHOICES = [5, 10, 15, 20, 25, 30, 35, 40] as const

export const RETIREMENT_AGE_CHOICES = [55, 60, 62, 65, 67, 70] as const

/** Durée recommandée par projet — la ⭐ du wizard (« Je ne sais pas » → 25 ans). */
export const PROJECT_DURATIONS: Record<ProjectGoal, number> = {
  retraite: 35,
  immobilier: 10,
  liberte: 20,
  precaution: 5,
  enrichissement: 25,
  aucune: 25,
}

export function recommendDuration(project: ProjectGoal | null): number {
  return PROJECT_DURATIONS[project ?? "aucune"]
}

/**
 * Enveloppe recommandée d'après l'horizon : long terme → PEA (avantage fiscal
 * après 5 ans, idéal actions), moyen/court terme → assurance-vie (plus souple,
 * fonds en euros possible). La ⭐ du wizard suit cette règle.
 */
export function recommendEnvelope(_project: ProjectGoal | null, duration: number): EnvelopeType {
  return duration >= 15 ? "pea" : "av"
}

const RISK_TO_SCENARIO: Record<RiskLevel, { scenario: ReturnScenario; drawdown: number }> = {
  prudent: { scenario: "prudent", drawdown: 0.2 },
  equilibre: { scenario: "central", drawdown: 0.35 },
  audacieux: { scenario: "optimiste", drawdown: 0.5 },
}

/** Projets pour lesquels on demande l'âge de retraite (retraite ou liberté financière). */
export function asksRetirementAge(project: ProjectGoal | null): boolean {
  return project === "retraite" || project === "liberte"
}

/** Construit une SimulationInputs complète à partir des réponses du wizard. */
export function buildSimulationFromAnswers(answers: WizardAnswers): SimulationInputs {
  const envelope = answers.envelope === "auto" ? recommendEnvelope(answers.project, answers.duration) : answers.envelope
  const { scenario, drawdown } = RISK_TO_SCENARIO[answers.risk]
  return {
    ...DEFAULT_INPUTS,
    ageNow: answers.age,
    capitalInitial: answers.hasCapital ? answers.capital : 0,
    monthlyPayment: answers.monthly,
    duration: answers.duration,
    envelope,
    ageRetirement:
      asksRetirementAge(answers.project) && answers.retirementAge !== null
        ? answers.retirementAge
        : DEFAULT_INPUTS.ageRetirement,
    returnScenario: scenario,
    maxDrawdownTolerance: drawdown,
    riskTolerance: answers.risk,
  }
}

/** Inputs moteur correspondant à des réponses PARTIELLES (aperçu en direct du
 *  questionnaire) : les champs non répondus (absents OU vidés → undefined)
 *  suivent WIZARD_DEFAULT_ANSWERS. Avec des réponses complètes,
 *  ≡ buildSimulationFromAnswers. */
export function previewInputsFromAnswers(partial: Partial<WizardAnswers>): SimulationInputs {
  return buildSimulationFromAnswers({
    age: partial.age ?? WIZARD_DEFAULT_ANSWERS.age,
    hasCapital: partial.hasCapital ?? WIZARD_DEFAULT_ANSWERS.hasCapital,
    capital: partial.capital ?? WIZARD_DEFAULT_ANSWERS.capital,
    monthly: partial.monthly ?? WIZARD_DEFAULT_ANSWERS.monthly,
    project: partial.project ?? WIZARD_DEFAULT_ANSWERS.project,
    duration: partial.duration ?? WIZARD_DEFAULT_ANSWERS.duration,
    envelope: partial.envelope ?? WIZARD_DEFAULT_ANSWERS.envelope,
    retirementAge: partial.retirementAge ?? WIZARD_DEFAULT_ANSWERS.retirementAge,
    risk: partial.risk ?? WIZARD_DEFAULT_ANSWERS.risk,
  })
}

/** Libellés FR (clés i18n) des projets — base du nom par défaut d'une simulation. */
export const PROJECT_LABELS: Record<ProjectGoal, string> = {
  retraite: "Retraite",
  immobilier: "Projet immobilier",
  liberte: "Liberté financière",
  precaution: "Épargne de précaution",
  enrichissement: "Enrichissement",
  aucune: "Ma simulation",
}

/** Nom par défaut d'une simulation créée par le wizard : « {projet} — {durée} ans ». */
export function defaultSimulationName(answers: { project: ProjectGoal | null; duration: number }): string {
  const label = answers.project ? PROJECT_LABELS[answers.project] : PROJECT_LABELS.aucune
  return `${label} — ${answers.duration} ans`
}
