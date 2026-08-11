/**
 * NON-RÉGRESSION v6.4 — valeurs dorées du moteur (graine 42, runs réduits).
 *
 * Ces valeurs FIGENT le comportement mathématique du moteur. Toute
 * modification qui toucherait les maths (simulation, Monte Carlo,
 * décaissement, XIRR, KPIs) casserait ces ancrages — par construction, une
 * correction qui ne change PAS ces valeurs ne touche pas les mathématiques.
 *
 * IMPORTANT (v6.4, paquets 1 & 2) : les ancrages utilisent DÉSORMAIS les
 * DÉFAUTS réalistes — frais ETF 0,25 %/an, scénario CENTRAL (rendement
 * géométrique composé ≈ 8,22 %/an au lieu de la moyenne arithmétique) et
 * `taxYear: 2025` explicitement (rétrocompatibilité des règles 2025, les
 * taux 2026 sont couverts par taxRules.test.ts).
 *
 * Régénéré le 2026-08-11 à partir du moteur v6.4 (paquets 1 & 2).
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

// Simulation déterministe (courbe lissée CENTRALE 8,22 %, CTO, frais 0,25 %,
// 10 k€ + 500 €/mois, 25 ans) — règles fiscales 2025 épinglées.
const GOLDEN_INPUTS = { ...DEFAULT_INPUTS, taxYear: 2025 }
const GOLDEN_NOMINAL = [
  10000, 17010.59, 24578.48, 32748.02, 41566.97, 51087.01, 61363.89, 72457.74, 84433.5, 97361.33, 111316.87, 126381.84,
  142644.44, 160199.87, 179150.88, 199608.44, 221692.3, 245531.77, 271266.4, 299046.87, 329035.81, 361408.75, 396355.3,
  434079.99, 474803.67, 518764.77,
]
const GOLDEN_REAL = [
  10000, 16660.71, 23577.81, 30768.61, 38251.23, 46044.93, 54169.95, 62647.62, 71500.46, 80752.28, 90428.13, 100554.5,
  111159.34, 122272.14, 133924.04, 146147.96, 158978.62, 172452.73, 186609.03, 201488.45, 217134.25, 233592.06,
  250910.22, 269139.66, 288334.27, 308550.97,
]
const GOLDEN_TAXNET = [
  10000, 16707.41, 23804.94, 31323.61, 39296.88, 47760.91, 56754.72, 66320.42, 76503.45, 87352.93, 98921.81, 111267.29,
  124451.11, 138539.91, 153605.62, 169725.91, 186984.61, 205472.24, 225286.48, 246532.81, 269325.07, 293786.12,
  320048.71, 348255.99, 378562.57, 411135.34,
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
    expect(last.nominal).toBeCloseTo(518764.77, 1)
    expect(last.investedNom).toBe(160000)
    expect(last.interestsNom).toBeCloseTo(358764.77, 1)
    expect(last.tax).toBeCloseTo(107629.43, 1)
    expect(last.taxNet).toBeCloseTo(411135.34, 1)
    // Paquet 1 : des frais réalistes sont appliqués par défaut (0,25 %/an).
    expect(last.feesLost).toBeCloseTo(11751.48, 1)
  })

  it("KPIs = ancrage (xirr ≈ 7,95 %, cagr, realReturn)", () => {
    const rows = runSimulation(GOLDEN_INPUTS)
    const k = computeKPIs(rows, GOLDEN_INPUTS)
    expect(k.cagr).toBeCloseTo(17.11, 1)
    expect(k.xirr).toBeCloseTo(7.95, 1)
    expect(k.sharpe).toBe(0)
    expect(k.capitalMultiple).toBeCloseTo(3.24, 1)
    expect(k.doublingTime).toBeCloseTo(9.06, 1)
    expect(k.realReturn).toBeCloseTo(5.73, 1)
    expect(k.contributionPct).toBeCloseTo(30.84, 1)
    expect(k.gainsPct).toBeCloseTo(69.16, 1)
    expect(k.powerPurchaseRatio).toBeCloseTo(59.48, 1)
    expect(k.totalTax).toBeCloseTo(107629.43, 1)
    expect(k.netCapital).toBeCloseTo(411135.34, 1)
  })

  it("XIRR de la projection = ancrage (≈ 7,95 % brut, central avec frais)", () => {
    const last = runSimulation(GOLDEN_INPUTS)[25]
    expect(computeXIRR(GOLDEN_INPUTS, last.nominal)).toBeCloseTo(0.07949708, 6)
  })
})

describe("NON-RÉGRESSION — Monte Carlo (graine fixe, 200 runs)", () => {
  const mc = runMonteCarlo({ ...GOLDEN_INPUTS, mcRuns: 200 }, 200)
  const last = mc.p50.length - 1

  it("bandes terminales = ancrage", () => {
    expect(mc.p5[last]).toBeCloseTo(122961.58, 1)
    expect(mc.p10[last]).toBeCloseTo(157018.59, 1)
    expect(mc.p25[last]).toBeCloseTo(226142.31, 1)
    expect(mc.p50[last]).toBeCloseTo(395015.75, 1)
    expect(mc.p75[last]).toBeCloseTo(765202.58, 1)
    expect(mc.p90[last]).toBeCloseTo(1292573.34, 1)
    expect(mc.p95[last]).toBeCloseTo(1909533.53, 1)
  })

  it("taux de succès, moyenne, extrêmes = ancrage", () => {
    expect(mc.successRate).toBe(40.5)
    expect(mc.mean).toBeCloseTo(604427.32, 1)
    expect(mc.bestCase).toBeCloseTo(3451217.67, 1)
    expect(mc.worstCase).toBeCloseTo(56963.45, 1)
  })

  it("paquet 1 — bandes RÉELLES (euros d'aujourd'hui) et succès réel = ancrage", () => {
    expect(mc.p10r[last]).toBeCloseTo(93391.53, 1)
    expect(mc.p50r[last]).toBeCloseTo(234947.52, 1)
    expect(mc.p90r[last]).toBeCloseTo(768796.94, 1)
    // Le succès en pouvoir d'achat est TOUJOURS ≤ le succès nominal.
    expect(mc.successRateReal).toBe(22.5)
    expect(mc.successRateReal).toBeLessThanOrEqual(mc.successRate)
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
    // Paquet 2 : les frais de gestion (0,25 %/an) rognent la moyenne terminale.
    expect(dec.mean).toBeCloseTo(14096.11, 1)
    expect(dec.ruinYearMedian).toBe(6)
  })

  it("retrait mensuel initial = ancrage (custom 2000 €)", () => {
    expect(dec.initialWithdrawal).toBe(2000)
  })

  it("paquet 2 — fiscalité et frais du décaissement = ancrage (CTO)", () => {
    // La rente nette est inférieure à la brute (impôt sur les gains des retraits)
    expect(dec.netInitialWithdrawal).toBeCloseTo(1968.65, 1)
    expect(dec.netInitialWithdrawal).toBeLessThan(dec.initialWithdrawal)
    expect(dec.totalTaxPaid).toBeCloseTo(11578.65, 1)
    expect(dec.totalFeesPaid).toBeCloseTo(1073.52, 1)
    expect(dec.totalTaxPaid).toBeGreaterThan(0)
  })
})

describe("NON-RÉGRESSION — formules mathématiques (indépendantes du moteur)", () => {
  it("runSimulation = formule fermée des intérêts composés (0 frais, 0 inflation, optimiste)", () => {
    const rows = runSimulation({
      ...DEFAULT_INPUTS,
      // Scénario optimiste : la formule fermée compare la capitalisation à la
      // moyenne arithmétique (MSCI_WORLD_AVG_RETURN) — le défaut de l'app est
      // désormais Central/géométrique (paquet 1).
      returnScenario: "optimiste",
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
    const { flows, months } = buildCashFlows(DEFAULT_INPUTS, 518_764.77)
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
