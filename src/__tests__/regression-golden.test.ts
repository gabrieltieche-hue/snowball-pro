/**
 * NON-RÉGRESSION v6 — valeurs dorées du moteur (graine 42, runs réduits).
 *
 * Ces valeurs FIGENT le comportement mathématique du moteur AVANT les
 * corrections fiscales v6 (migration taxRules.ts). Toute modification qui
 * toucherait les maths (simulation, Monte Carlo, décaissement, XIRR, KPIs)
 * casserait ces ancrages — par construction, une correction qui ne change
 * PAS ces valeurs ne touche pas les mathématiques.
 *
 * IMPORTANT (v6) : les ancrages utilisent `taxYear: 2025` explicitement — ils
 * sont la PREUVE de rétrocompatibilité des règles 2025 (les taux 2026 sont
 * couverts par taxRules.test.ts). Le défaut de l'app est désormais 2026.
 *
 * Généré le 2026-08-05 à partir du moteur v5.7.2 (audit).
 */
import { describe, it, expect } from "vitest"
import {
  runSimulation,
  runMonteCarlo,
  runDecumulation,
  computeKPIs,
  computeXIRR,
  futureValue,
  PMTfromFV,
  monthlyRate,
  calcXIRR,
  buildCashFlows,
  DEFAULT_INPUTS,
  MSCI_WORLD_AVG_RETURN,
} from "../engine"

// Simulation déterministe (courbe lissée 10,07 %, CTO, 10 k€ + 500 €/mois, 25 ans)
// Règles fiscales 2025 épinglées : ces ancrages couvrent les maths ET la
// rétrocompatibilité fiscale (voir l'en-tête du fichier).
const GOLDEN_INPUTS = { ...DEFAULT_INPUTS, taxYear: 2025 }
const GOLDEN_NOMINAL = [
  10000, 17278.56, 25289.74, 34107.3, 43812.4, 54494.37, 66251.51, 79192.1, 93435.21, 109111.98, 126366.69,
  145358.18, 166261.28, 189268.39, 214591.28, 242463.07, 273140.28, 306905.33, 344068.99, 384973.39, 429995.02,
  479548.33, 534089.47, 594120.44, 660193.84, 732917.88,
]
const GOLDEN_REAL = [
  10000, 16923.17, 24260.12, 32045.73, 40317.54, 49115.99, 58484.57, 68470.21, 79123.34, 90498.37, 102653.84,
  115652.84, 129563.36, 144458.61, 160417.48, 177524.98, 195872.69, 215559.33, 236691.23, 259383.06, 283758.31,
  309950.11, 338101.96, 368368.45, 400916.25, 435924.99,
]
const GOLDEN_TAXNET = [
  10000, 16894.99, 24302.82, 32275.11, 40868.68, 50146.06, 60176.06, 71034.47, 82804.65, 95578.39, 109456.68,
  124550.73, 140982.9, 158887.87, 178413.9, 199724.15, 222998.2, 248433.73, 276248.29, 306681.37, 339996.51,
  376483.83, 416462.63, 460284.31, 508335.69, 561042.52,
]

describe("NON-RÉGRESSION — simulation déterministe (maths figées)", () => {
  it("nominal année par année = ancrage", () => {
    const rows = runSimulation(GOLDEN_INPUTS)
    rows.forEach((r, i) => expect(r.nominal).toBeCloseTo(GOLDEN_NOMINAL[i] ?? 0, 1))
  })

  it("real (euros d'aujourd'hui) année par année = ancrage", () => {
    const rows = runSimulation(GOLDEN_INPUTS)
    rows.forEach((r, i) => expect(r.real).toBeCloseTo(GOLDEN_REAL[i] ?? 0, 1))
  })

  it("taxNet année par année = ancrage", () => {
    const rows = runSimulation(GOLDEN_INPUTS)
    rows.forEach((r, i) => expect(r.taxNet).toBeCloseTo(GOLDEN_TAXNET[i] ?? 0, 1))
  })

  it("dernière ligne : montants clés = ancrage", () => {
    const last = runSimulation(GOLDEN_INPUTS)[25]
    expect(last.nominal).toBeCloseTo(732917.88, 1)
    expect(last.investedNom).toBe(160000)
    expect(last.interestsNom).toBeCloseTo(572917.88, 1)
    expect(last.tax).toBeCloseTo(171875.36, 1)
    expect(last.taxNet).toBeCloseTo(561042.52, 1)
    expect(last.feesLost).toBe(0)
  })

  it("KPIs = ancrage (xirr 10,07 %, cagr, realReturn)", () => {
    const rows = runSimulation(GOLDEN_INPUTS)
    const k = computeKPIs(rows, GOLDEN_INPUTS)
    expect(k.cagr).toBeCloseTo(18.74, 1)
    expect(k.xirr).toBeCloseTo(10.07, 1)
    expect(k.sharpe).toBe(0)
    expect(k.capitalMultiple).toBeCloseTo(4.58, 1)
    expect(k.doublingTime).toBeCloseTo(7.23, 1)
    expect(k.realReturn).toBeCloseTo(7.8, 1)
    expect(k.contributionPct).toBeCloseTo(21.83, 1)
    expect(k.gainsPct).toBeCloseTo(78.17, 1)
    expect(k.powerPurchaseRatio).toBeCloseTo(59.48, 1)
    expect(k.totalTax).toBeCloseTo(171875.36, 1)
    expect(k.netCapital).toBeCloseTo(561042.52, 1)
  })

  it("XIRR de la projection = ancrage (≈ 10,07 % brut)", () => {
    const last = runSimulation(GOLDEN_INPUTS)[25]
    expect(computeXIRR(GOLDEN_INPUTS, last.nominal)).toBeCloseTo(0.10065535, 6)
  })
})

describe("NON-RÉGRESSION — Monte Carlo (graine fixe, 200 runs)", () => {
  const mc = runMonteCarlo({ ...GOLDEN_INPUTS, mcRuns: 200 }, 200)
  const last = mc.p50.length - 1

  it("bandes terminales = ancrage", () => {
    expect(mc.p5[last]).toBeCloseTo(127486.14, 1)
    expect(mc.p10[last]).toBeCloseTo(161137.62, 1)
    expect(mc.p25[last]).toBeCloseTo(233123.89, 1)
    expect(mc.p50[last]).toBeCloseTo(409805.03, 1)
    expect(mc.p75[last]).toBeCloseTo(799116.12, 1)
    expect(mc.p90[last]).toBeCloseTo(1357308.54, 1)
    expect(mc.p95[last]).toBeCloseTo(2007876.42, 1)
  })

  it("taux de succès, moyenne, extrêmes = ancrage", () => {
    expect(mc.successRate).toBe(42)
    expect(mc.mean).toBeCloseTo(631200.99, 1)
    expect(mc.bestCase).toBeCloseTo(3637046.71, 1)
    expect(mc.worstCase).toBeCloseTo(57934.26, 1)
  })
})

describe("NON-RÉGRESSION — décaissement (graine fixe, 200 runs, 100 k€)", () => {
  const dec = runDecumulation(GOLDEN_INPUTS, 100_000, 200)
  const last = dec.p50.length - 1

  it("bandes terminales et taux de ruine = ancrage", () => {
    expect(dec.p10[last]).toBeCloseTo(0, 1)
    expect(dec.p50[last]).toBeCloseTo(0, 1)
    expect(dec.p90[last]).toBeCloseTo(0, 1)
    expect(dec.ruinProbability).toBeCloseTo(99.5, 1)
    expect(dec.survivalProbability).toBeCloseTo(0.5, 1)
    expect(dec.mean).toBeCloseTo(16695.49, 1)
    expect(dec.ruinYearMedian).toBe(6)
  })

  it("retrait mensuel initial = ancrage (custom 2000 €)", () => {
    expect(dec.initialWithdrawal).toBe(2000)
  })
})

describe("NON-RÉGRESSION — formules mathématiques (indépendantes du moteur)", () => {
  it("runSimulation = formule fermée des intérêts composés (0 frais, 0 inflation)", () => {
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      capitalInitial: 10_000,
      monthlyPayment: 500,
      duration: 5,
      indexation: 0,
      inflation: 0,
      envelope: "none",
      etfFees: 0,
      brokerageFees: 0,
      insuranceFees: 0,
      managementFees: 0,
    })
    const r = monthlyRate(MSCI_WORLD_AVG_RETURN)
    const expected = 10_000 * Math.pow(1 + r, 60) + 500 * ((Math.pow(1 + r, 60) - 1) / r)
    expect(rows[5].nominal).toBeCloseTo(expected, 0)
  })

  it("PMTfromFV est l'inverse exact de futureValue", () => {
    const pmt = PMTfromFV(250_000, 10_000, 0.007, 180)
    expect(futureValue(10_000, pmt, 0.007, 180)).toBeCloseTo(250_000, 0)
  })

  it("XIRR indépendant (Newton maison) = XIRR du moteur", () => {
    const { flows, months } = buildCashFlows(DEFAULT_INPUTS, 732_917.88)
    const myXirr = (cf: number[], mo: number[]): number => {
      const t0 = mo[0]
      let rate = 0.05
      for (let k = 0; k < 200; k += 1) {
        let f = 0
        let fp = 0
        for (let i = 0; i < cf.length; i += 1) {
          const t = (mo[i] - t0) / 12
          const d = Math.pow(1 + rate, t)
          f += cf[i] / d
          fp -= (t * cf[i]) / (d * (1 + rate))
        }
        if (Math.abs(f) < 1e-10) break
        const nr = rate - f / fp
        if (!Number.isFinite(nr) || nr <= -0.999 || nr >= 100) break
        rate = nr
      }
      return rate
    }
    expect(calcXIRR(flows, months)).toBeCloseTo(myXirr(flows, months), 10)
  })
})
