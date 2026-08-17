import { describe, expect, it } from "vitest"
import { TAB_FIELD, FIELD_SECTION, FIELD_INPUT_ID } from "../utils/validationTargets"

// Champs susceptibles de produire une ValidationError dans validation.ts.
const VALIDATED_FIELDS = [
  "capitalInitial",
  "monthlyPayment",
  "duration",
  "inflation",
  "etfFees",
  "brokerageFees",
  "managementFees",
  "tmi",
  "ctoTaxMode",
  "goalTarget",
  "mcRuns",
  "retirementYears",
  "ageRetirement",
] as const

describe("validationTargets — chaque champ validé a une destination « Corriger »", () => {
  it("tous les champs de validateInputs sont couverts", () => {
    for (const field of VALIDATED_FIELDS) {
      expect(TAB_FIELD[field] ?? FIELD_SECTION[field], `champ sans cible : ${field}`).toBeDefined()
    }
  })

  it("les champs d'onglet ne sont pas aussi dans la sidebar", () => {
    expect(FIELD_SECTION.goalTarget).toBeUndefined()
    expect(FIELD_SECTION.retirementYears).toBeUndefined()
  })

  it("les ids d'inputs correspondent aux ids SliderInput de la sidebar", () => {
    const EXPECTED_IDS = {
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
    expect(FIELD_INPUT_ID).toEqual(EXPECTED_IDS)
  })
})
