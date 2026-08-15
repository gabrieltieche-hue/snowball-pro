/**
 * PREUVES P0-1 (v6) — équivalence ancien moteur ↔ nouveau moteur à 2025,
 * et rétrocompatibilité des états v5 (localStorage, liens partagés, snapshots,
 * migration v4).
 *
 * L'ancien computeTaxBreakdown (v5.7.2) est réimplémenté À L'IDENTIQUE depuis
 * le commit 932a2627 (`git show 932a2627:src/engine/taxes.ts`), avec les
 * constantes de l'époque (17,2 % / 30 % / AV 7,5-12,8 %). C'est la référence
 * « moteur pré-migration ». Le nouveau moteur, interrogé avec taxYear: 2025,
 * doit produire les MÊMES résultats au centime près — la migration n'a donc
 * rien changé hors des règles 2026 (couvertes par taxRules.test.ts).
 */
import { describe, it, expect } from "vitest"
import {
  parseStoredInputs,
  DEFAULT_INPUTS,
  v4SettingsToInputs,
  createSnapshot,
  applyScenarioPatch,
  runSimulation,
  computeTaxBreakdown,
  getTaxRules,
  pfuRate,
  CURRENT_TAX_YEAR,
  roundCent,
} from "../engine"
import { encodeInputsForUrl, decodeInputsFromUrl } from "../utils/urlState"
import type { CtoTaxMode, EnvelopeType, SimulationInputs, TaxBreakdown, TaxBreakdownOptions } from "../types"

// ────────────────────────────────────────────────────────────────────────────
// Référence « ancien moteur » (v5.7.2) — réimplémentation fidèle
// ────────────────────────────────────────────────────────────────────────────

const LEGACY = {
  social: 0.172,
  pfuIncome: 0.128,
  pfu: 0.3,
  avReduced: 0.075,
  avExcess: 0.128,
  allowanceSingle: 4_600,
  allowanceCouple: 9_200,
  capSingle: 150_000,
  capCouple: 300_000,
  perSocial: 0.172,
}

function legacyTaxBreakdown(
  grossGainsInput: number,
  envelope: EnvelopeType,
  yearsHeld: number,
  couple: boolean,
  contributionBase = 0,
  opts: TaxBreakdownOptions = {},
): TaxBreakdown {
  const grossGains = Math.max(0, grossGainsInput)
  const tmi = opts.tmi ?? 0.3
  const ctoTaxMode: CtoTaxMode = opts.ctoTaxMode ?? "pfu"
  const notes: string[] = []
  let taxableGains = grossGains
  let taxableContributions = 0
  let contributionsTax = 0
  let socialCharges = 0
  let incomeTax = 0
  let flatTax = 0

  if ((grossGains <= 0 && envelope !== "per") || envelope === "none") {
    return {
      grossGains,
      taxableGains: 0,
      taxableContributions: 0,
      contributionsTax: 0,
      socialCharges: 0,
      incomeTax: 0,
      flatTax: 0,
      netGains: grossGains,
      totalTax: 0,
      effectiveRate: 0,
      notes: envelope === "none" ? ["Simulation sans impôts."] : notes,
    }
  }

  if (envelope === "cto") {
    socialCharges = grossGains * LEGACY.social
    if (ctoTaxMode === "bareme") {
      taxableGains = grossGains
      incomeTax = taxableGains * tmi
    } else {
      incomeTax = grossGains * LEGACY.pfuIncome
      flatTax = grossGains * LEGACY.pfu
    }
  }

  if (envelope === "pea") {
    socialCharges = grossGains * LEGACY.social
    if (yearsHeld >= 5) {
      incomeTax = 0
      flatTax = 0
    } else {
      incomeTax = grossGains * LEGACY.pfuIncome
      flatTax = grossGains * LEGACY.pfu
    }
  }

  if (envelope === "av") {
    socialCharges = grossGains * LEGACY.social
    if (yearsHeld >= 8) {
      const allowance = couple ? LEGACY.allowanceCouple : LEGACY.allowanceSingle
      const cap = couple ? LEGACY.capCouple : LEGACY.capSingle
      taxableGains = Math.max(0, grossGains - allowance)
      const withinFraction = contributionBase > 0 ? Math.min(1, cap / contributionBase) : 1
      incomeTax =
        taxableGains * withinFraction * LEGACY.avReduced + taxableGains * (1 - withinFraction) * LEGACY.avExcess
    } else {
      incomeTax = grossGains * LEGACY.pfuIncome
      flatTax = grossGains * LEGACY.pfu
    }
  }

  if (envelope === "per") {
    taxableContributions = Math.max(0, contributionBase)
    contributionsTax = taxableContributions * tmi
    socialCharges = grossGains * LEGACY.perSocial
    incomeTax = grossGains * LEGACY.pfuIncome
    flatTax = grossGains * (LEGACY.perSocial + LEGACY.pfuIncome)
  }

  const exitTax = socialCharges + incomeTax + contributionsTax
  return {
    grossGains,
    taxableGains,
    taxableContributions,
    contributionsTax,
    socialCharges,
    incomeTax,
    flatTax,
    netGains: Math.max(0, grossGains - socialCharges - incomeTax),
    totalTax: exitTax,
    effectiveRate: grossGains + taxableContributions > 0 ? exitTax / (grossGains + taxableContributions) : 0,
    notes,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Point 4 — équivalence ancien moteur ↔ nouveau moteur (taxYear 2025)
// ────────────────────────────────────────────────────────────────────────────

const SCENARIOS: {
  envelope: EnvelopeType
  yearsHeld: number
  couple: boolean
  base: number
  gains: number
  opts: TaxBreakdownOptions
}[] = [
  // CTO — PFU et barème, différentes TMI, couple, gains variés
  { envelope: "cto", yearsHeld: 1, couple: false, base: 0, gains: 10_000, opts: {} },
  { envelope: "cto", yearsHeld: 1, couple: false, base: 0, gains: 0, opts: {} },
  { envelope: "cto", yearsHeld: 1, couple: false, base: 0, gains: 12345.67, opts: { tmi: 0.41 } },
  {
    envelope: "cto",
    yearsHeld: 10,
    couple: true,
    base: 100_000,
    gains: 250_000.5,
    opts: { ctoTaxMode: "bareme", tmi: 0.3 },
  },
  { envelope: "cto", yearsHeld: 8, couple: true, base: 0, gains: 87_654.32, opts: { ctoTaxMode: "bareme", tmi: 0.11 } },
  // PEA — avant/après 5 ans, couple
  { envelope: "pea", yearsHeld: 2, couple: false, base: 10_000, gains: 25_000, opts: {} },
  { envelope: "pea", yearsHeld: 6, couple: false, base: 150_000, gains: 60_000, opts: {} },
  { envelope: "pea", yearsHeld: 15, couple: true, base: 300_000, gains: 120_000, opts: {} },
  // AV — avant/après 8 ans, au-dessus/sous plafond, couple
  { envelope: "av", yearsHeld: 5, couple: false, base: 0, gains: 30_000, opts: {} },
  { envelope: "av", yearsHeld: 10, couple: false, base: 100_000, gains: 40_000, opts: {} },
  { envelope: "av", yearsHeld: 12, couple: false, base: 200_000, gains: 100_000, opts: {} },
  { envelope: "av", yearsHeld: 10, couple: true, base: 400_000, gains: 150_000, opts: {} },
  // PER — TMI 11/30/41, versements déductibles
  { envelope: "per", yearsHeld: 10, couple: false, base: 50_000, gains: 10_000, opts: { tmi: 0.11 } },
  { envelope: "per", yearsHeld: 10, couple: false, base: 50_000, gains: 10_000, opts: { tmi: 0.3 } },
  { envelope: "per", yearsHeld: 10, couple: true, base: 120_000, gains: 30_000, opts: { tmi: 0.41 } },
  // Sans fiscalité
  { envelope: "none", yearsHeld: 10, couple: false, base: 0, gains: 50_000, opts: {} },
]

const TAX_FIELDS = [
  "grossGains",
  "taxableGains",
  "taxableContributions",
  "contributionsTax",
  "socialCharges",
  "incomeTax",
  "flatTax",
  "netGains",
  "totalTax",
] as const

describe("P0-1 — équivalence ancien moteur (v5.7.2) ↔ nouveau à taxYear 2025", () => {
  it.each(SCENARIOS)(
    "$envelope (détention $yearsHeld, couple $couple, base $base) : identique au centime",
    ({ envelope, yearsHeld, couple, base, gains, opts }) => {
      const legacy = legacyTaxBreakdown(gains, envelope, yearsHeld, couple, base, opts)
      const current = computeTaxBreakdown(gains, envelope, yearsHeld, couple, base, { ...opts, taxYear: 2025 })
      for (const field of TAX_FIELDS) {
        // Le nouveau moteur arrondit au centime, l'ancien non — marge = 1 centime
        expect(current[field]).toBeCloseTo(legacy[field], 2)
      }
      expect(current.effectiveRate).toBeCloseTo(legacy.effectiveRate, 10)
    },
  )

  it("simulation complète : taxNet 2025 identique au calcul ancien moteur, pour chaque enveloppe", () => {
    for (const envelope of ["cto", "pea", "av", "per", "none"] as const) {
      const inputs: SimulationInputs = {
        ...DEFAULT_INPUTS,
        envelope,
        taxYear: 2025,
        duration: 15,
        capitalInitial: 10_000,
        monthlyPayment: 500,
        etfFees: 0,
        brokerageFees: 0,
        insuranceFees: 0,
        managementFees: 0,
      }
      const rows = runSimulation(inputs)
      const last = rows[rows.length - 1]
      // Recalcul « à l'ancienne » des mêmes arguments que la simulation
      const yearsHeld = envelope === "pea" ? inputs.peaYearsHeld : envelope === "av" ? inputs.avYearsHeld + 15 : 15
      const legacyTax = legacyTaxBreakdown(last.interestsNom, envelope, yearsHeld, inputs.taxCouple, last.investedNom, {
        tmi: inputs.tmi,
        ctoTaxMode: inputs.ctoTaxMode,
      })
      expect(last.taxNet).toBeCloseTo(roundCent(Math.max(0, last.nominal - legacyTax.totalTax)), 1)
      // Nominal inchangé (pré-taxe) : les maths hors fiscalité n'ont pas bougé
      expect(last.tax).toBeCloseTo(legacyTax.totalTax, 1)
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Point 3 — rétrocompatibilité des états v5 (sans taxYear)
// ────────────────────────────────────────────────────────────────────────────

/** État v5 réel : les inputs tels que stockés par la v5 (aucun champ taxYear). */
function v5State(): SimulationInputs {
  const s: SimulationInputs = { ...DEFAULT_INPUTS }
  // taxYear est optionnel dans le type (rétrocompatibilité) : on le retire
  // pour reproduire EXACTEMENT un état v5 stocké ou partagé.
  delete s.taxYear
  return s
}

describe("P0-1 — rétrocompatibilité v5 (localStorage, liens partagés, snapshots, v4)", () => {
  it("parseStoredInputs charge un état v5 sans taxYear → année courante (2026), reste préservé", () => {
    const loaded = parseStoredInputs(JSON.stringify(v5State()))
    expect(loaded.taxYear).toBe(CURRENT_TAX_YEAR)
    expect(loaded.monthlyPayment).toBe(DEFAULT_INPUTS.monthlyPayment)
    expect(loaded.envelope).toBe(DEFAULT_INPUTS.envelope)
  })

  it("un lien partagé v5 (hash sans taxYear) se décode et la simulation utilise 2026", () => {
    const encoded = encodeInputsForUrl(v5State() as SimulationInputs)
    expect(encoded.startsWith("s=")).toBe(true)
    const decoded = decodeInputsFromUrl(encoded)
    expect(decoded).not.toBeNull()
    // L'état v5 n'avait pas de taxYear : le décodage le résout à l'année
    // courante (2026) — jamais un taux périmé, jamais un crash.
    expect((decoded as SimulationInputs).taxYear).toBe(CURRENT_TAX_YEAR)
    const rows = runSimulation(decoded as SimulationInputs)
    const last = rows[rows.length - 1]
    expect(last.taxNet).toBeGreaterThan(0)
    // Par défaut (2026) : CTO au PFU = prélèvements sociaux + part IR de l'année
    expect(last.tax).toBeCloseTo(last.interestsNom * pfuRate(getTaxRules()), 0)
  })

  it("la migration v4 (v4SettingsToInputs) hérite de l'année courante", () => {
    const v4 = v4SettingsToInputs({ p: 25_000, m: 750, t: 30 })
    expect(v4.taxYear).toBe(CURRENT_TAX_YEAR)
    expect(v4.capitalInitial).toBe(25_000)
    expect(v4.monthlyPayment).toBe(750)
    expect(v4SettingsToInputs({}).taxYear).toBe(CURRENT_TAX_YEAR)
  })

  it("un snapshot v5 (inputs sans taxYear) s'applique et recalcule proprement", () => {
    const state = v5State() as SimulationInputs
    const rows = runSimulation(state)
    const snap = createSnapshot(state, rows)
    // L'application d'un snapshot (applyPatch) ne re-sanitise pas les inputs :
    // la simulation suivante doit quand même fonctionner (sanitize interne).
    const patched = applyScenarioPatch({ A: DEFAULT_INPUTS, B: null }, snap.inputs, false)
    const reRows = runSimulation(patched.state.A)
    expect(reRows[reRows.length - 1].nominal).toBeCloseTo(rows[rows.length - 1].nominal, 0)
    expect(reRows[reRows.length - 1].taxNet).toBeGreaterThan(0)
  })
})
