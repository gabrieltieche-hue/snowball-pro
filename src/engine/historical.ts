import type { HistoricalDataset, HistoricalIndex, HistoricalPool } from "../types"
import { average, standardDeviation } from "./math"

const DATASET_START: Record<HistoricalIndex, number> = {
  "msci-world": 1970,
  sp500: 1995,
  nasdaq: 1995,
  cac40: 1995,
  bitcoin: 2011,
  gold: 2000,
}

/**
 * Longueur d'un bloc pour le rééchantillonnage : 5 années consécutives
 * conservent la séquence krach → reprise sans jamais créer de transition
 * artificielle entre la fin et le début de l'historique (2025 → 1970).
 * Constante partagée (Monte Carlo + Rente) pour une seule source de vérité.
 */
export const BLOCK_LENGTH = 5

// Rendement total annuel du S&P 500 (dividendes réinvestis), 1926-1969.
// Série SBBI/Ibbotson « Stocks, Bonds, Bills and Inflation », récupérée le
// 2026-08 (Slickcharts « S&P 500 Total Returns by Year Since 1926 », Novel
// Investor) et vérifiée sur les ancrages publiés (1929 ≈ −8,4 %, 1931 ≈
// −43,3 %, 1933 ≈ +54 %, 1954 ≈ +52,6 %).
const SP500_TOTAL_RETURNS_1926_1969: number[] = [
  0.1162, 0.3749, 0.4361, -0.0842, -0.249, -0.4334, -0.0819, 0.5399, -0.0144, 0.4767, 0.3392, -0.3503, 0.3112, -0.0041,
  -0.0978, -0.1159, 0.2034, 0.259, 0.1975, 0.3644, -0.0807, 0.0571, 0.055, 0.1879, 0.3171, 0.2402, 0.1837, -0.0099,
  0.5262, 0.3156, 0.0656, -0.1078, 0.4336, 0.1196, 0.0047, 0.2689, -0.0873, 0.228, 0.1648, 0.1245, -0.1006, 0.2398,
  0.1106, -0.085,
]

// Historique étendu : 100 ans de rendements réels pour le rééchantillonnage
// Monte-Carlo / Rente. Aucune série mondiale exprimée en EUR n'existe avant
// 1970 : le S&P 500 américain (SBBI) sert de proxy (les krachs et les bull
// markets de l'entre-deux-guerres — 1929, 1931, 1933… — sont ainsi rejoués).
const RETURNS: Record<HistoricalIndex, number[]> = {
  // MSCI World Net Return exprimé en EUR (dividendes nets réinvestis), 1970-2025.
  // Vérifié : 2022-2025 = performances officielles du CW8 (justETF / Amundi,
  // ISIN LU1681043599) ; antérieur = indice MSCI World NR EUR reconstitué
  // (Curvo, factsheets Amundi/MSCI). Années marquantes : 1999 +46,2 %,
  // 2008 -37,3 %, 2002 -32,7 %.
  "msci-world": [
    -0.0309, 0.0571, 0.1986, -0.2958, -0.3128, 0.4209, 0.0308, -0.0913, 0.0183, 0.0691, 0.3893, 0.1362, 0.2457, 0.4145,
    0.1974, 0.158, 0.1863, -0.0413, 0.3172, 0.1835, -0.2929, 0.2456, -0.0037, 0.3428, -0.0219, 0.1477, 0.1649, 0.2936,
    0.176, 0.462, -0.0626, -0.1218, -0.3267, 0.1052, 0.0637, 0.2641, 0.0755, -0.0245, -0.3729, 0.2558, 0.1914, -0.0269,
    0.1384, 0.2117, 0.1923, 0.1065, 0.1066, 0.0744, -0.0419, 0.2984, 0.0626, 0.3094, -0.1287, 0.1946, 0.2633, 0.0639,
  ],
  sp500: [
    0.376, 0.23, 0.332, 0.285, 0.21, -0.091, -0.118, -0.221, 0.287, 0.108, 0.049, 0.158, 0.052, -0.37, 0.264, 0.15,
    0.021, 0.16, 0.324, 0.134, 0.012, 0.119, 0.218, -0.044, 0.312, 0.183, 0.277, -0.182, 0.262, 0.253, 0.098,
  ],
  nasdaq: [
    0.398, 0.227, 0.216, 0.401, 0.856, -0.392, -0.21, -0.318, 0.496, 0.086, 0.019, 0.103, 0.097, -0.406, 0.438, 0.178,
    -0.02, 0.17, 0.399, 0.192, 0.078, 0.084, 0.291, -0.032, 0.381, 0.474, 0.268, -0.331, 0.432, 0.29, 0.121,
  ],
  cac40: [
    0.078, 0.227, 0.291, 0.32, 0.509, -0.011, -0.221, -0.337, 0.159, 0.074, 0.229, 0.181, 0.008, -0.427, 0.22, -0.031,
    -0.168, 0.152, 0.184, -0.011, 0.091, 0.046, 0.123, -0.107, 0.255, -0.071, 0.287, -0.089, 0.158, 0.028, 0.067,
  ],
  bitcoin: [13.67, 1.83, 55.07, -0.58, 0.35, 1.25, 13.3, -0.73, 0.94, 3.05, 0.6, -0.65, 1.55, 1.22, 0.13],
  gold: [
    -0.064, 0.023, 0.248, 0.196, 0.052, 0.179, 0.228, 0.308, 0.053, 0.238, 0.296, 0.098, 0.068, -0.282, -0.022, -0.103,
    0.081, 0.134, -0.023, 0.178, 0.245, -0.039, 0.009, 0.127, 0.272, 0.079,
  ],
}

// Historique étendu : 100 ans de rendements réels pour le rééchantillonnage
// Monte-Carlo / Rente. Aucune série mondiale exprimée en EUR n'existe avant
// 1970 : le S&P 500 américain (SBBI) sert de proxy (les krachs et les bull
// markets de l'entre-deux-guerres — 1929, 1931, 1933… — sont ainsi rejoués).
export const EXTENDED_WORLD_START_YEAR = 1926
export const EXTENDED_WORLD_RETURNS: number[] = [...SP500_TOTAL_RETURNS_1926_1969, ...RETURNS["msci-world"]]
export const EXTENDED_WORLD_AVG_RETURN = average(EXTENDED_WORLD_RETURNS)
export const EXTENDED_WORLD_VOLATILITY = standardDeviation(EXTENDED_WORLD_RETURNS)

// Inflation française réelle 1970-2025 — INSEE, indice des prix à la
// consommation (variation annuelle moyenne), récupérée le 2026-08 (Insee
// Focus n° 87, Tableaux de l'économie française). Les pics des années 1970
// (13,7 % en 1974) et la quasi-déflation de 2015 (0,0 %) sont capturés :
// indispensable pour une rente indexée — un taux fixe de 2,1 % sous-estime
// les pires périodes d'érosion du pouvoir d'achat.
export const FRENCH_INFLATION_1970_2025: number[] = [
  0.052, 0.057, 0.062, 0.092, 0.137, 0.118, 0.096, 0.094, 0.091, 0.108, 0.136, 0.134, 0.118, 0.096, 0.074, 0.058, 0.027,
  0.031, 0.027, 0.036, 0.034, 0.032, 0.024, 0.021, 0.016, 0.018, 0.02, 0.012, 0.007, 0.005, 0.017, 0.016, 0.019, 0.021,
  0.021, 0.018, 0.017, 0.015, 0.028, 0.001, 0.015, 0.021, 0.02, 0.009, 0.005, 0.0, 0.002, 0.01, 0.019, 0.011, 0.005,
  0.016, 0.052, 0.049, 0.02, 0.009,
]

// Inflation forfaitaire : 2,1 %/an fixe — utilisée par la SIMULATION
// d'accumulation (et l'affichage nominal/real). La Rente peut rejouer la série
// réelle FRENCH_INFLATION_1970_2025 quand l'option « inflation stochastique »
// est active : les deux coexistents, l'une pour l'accumulation (lisibilité),
// l'autre pour le décaissement (honnêteté).
export const INFLATION_SERIES = [0.021]

// Moyenne arithmétique de la série MSCI World (1970-2025, EUR Net Return) —
// ≈ 10,07 %/an brut. C'est la seule référence de rendement de l'app depuis
// l'Option A (plus de taux saisi par l'utilisateur) : elle sert de repli
// défensif quand un tableau de rendements est vide. Dérivée de la moyenne
// réellement calculée du dataset (pas de doublon codé en dur qui pourrait
// dériver si la série était allongée).
export const MSCI_WORLD_AVG_RETURN = average(RETURNS["msci-world"])

export function getHistoricalDataset(index: HistoricalIndex): HistoricalDataset {
  const returns = RETURNS[index]
  const startYear = DATASET_START[index]
  const years = returns.map((r, i) => ({
    year: startYear + i,
    return: r,
    inflation: INFLATION_SERIES[i % INFLATION_SERIES.length] ?? 0.021,
  }))
  const avgReturn = average(returns)
  const inflation = INFLATION_SERIES[0] ?? 0.021
  // Le rendement réel composé doit partir de la moyenne géométrique de la
  // série, puis retirer l'inflation. La moyenne arithmétique (10,07 % pour le
  // MSCI World) décrit le taux moyen d'une année, pas le pouvoir d'achat
  // effectivement multiplié sur toute la période. Ainsi 8,22 % est bien le
  // composé nominal et environ 5,99 % le composé réel à 2,1 % d'inflation.
  const growthFactor = returns.reduce((factor, yearlyReturn) => factor * Math.max(0, 1 + yearlyReturn), 1)
  const geometricReturn = returns.length > 0 ? Math.pow(growthFactor, 1 / returns.length) - 1 : 0
  const netReturn = (1 + geometricReturn) / (1 + inflation) - 1
  return {
    id: index,
    name: (
      {
        "msci-world": "MSCI World",
        sp500: "S&P 500",
        nasdaq: "Nasdaq 100",
        cac40: "CAC 40",
        bitcoin: "Bitcoin",
        gold: "Gold",
      } as Record<HistoricalIndex, string>
    )[index],
    // La moyenne arithmétique sert à la courbe lissée ; netReturn est le
    // rendement composé réel de la série, après inflation forfaitaire.
    avgReturn,
    netReturn,
    volatility: standardDeviation(returns),
    years,
  }
}

/**
 * Sélectionne le « vivier » de rendements réels utilisé par le rééchantillon-
 * nage (Monte Carlo + Rente). Avec l'historique étendu, le MSCI World rejoue
 * 100 ans (S&P 500 1926-1969 + MSCI World 1970-2025) : plus de blocs, plus de
 * krachs et de bull markets. Le Simulateur (backtest déterministe) reste sur
 * la série 1970-2025 pour préserver sa figure de référence 10,07 %/an.
 *
 * CORRECTIF v5.6.1 (paradoxe « plus de fiabilité = plus de gains ») : la
 * moyenne BRUTE du vivier étendu (≈ 11,00 %/an) dépasse la référence MSCI
 * World (≈ 10,07 %/an) — le S&P 500 1926-1969 a rendu en moyenne 12,18 %/an.
 * Utilisée telle quelle, elle faisait monter P50/P90 dès qu'on activait
 * « Historique étendu », un biais déroutant (activer la fiabilité semblait
 * fabriquer de la performance). La série étendue est donc CENTRÉE sur la
 * moyenne de référence : les krachs (1929, 1931, 1933…) restent rejoués,
 * mais le niveau moyen redevient celui du MSCI World. Le scénario médian ne
 * bouge plus quand on coche l'option ; seules les bandes P10/P90 s'élargissent.
 */
export function getHistoricalPool(historicalIndex: HistoricalIndex, extendedHistory: boolean): HistoricalPool {
  if (extendedHistory && historicalIndex === "msci-world") {
    const centeredReturns = EXTENDED_WORLD_RETURNS.map(r => r - EXTENDED_WORLD_AVG_RETURN + MSCI_WORLD_AVG_RETURN)
    return {
      returns: centeredReturns,
      avgReturn: MSCI_WORLD_AVG_RETURN,
      // La volatilité est invariante par translation : on garde celle de la
      // série étendue (plus de krachs testés → bandes plus larges).
      volatility: EXTENDED_WORLD_VOLATILITY,
      startYear: EXTENDED_WORLD_START_YEAR,
      label: `S&P 500 + MSCI World (${EXTENDED_WORLD_START_YEAR}-2025)`,
    }
  }
  const dataset = getHistoricalDataset(historicalIndex)
  return {
    returns: dataset.years.map(y => y.return),
    avgReturn: dataset.avgReturn,
    volatility: dataset.volatility,
    startYear: dataset.years[0]?.year ?? 0,
    label: dataset.name,
  }
}

/**
 * Rééchantillonnage par blocs NON CHEVAUCHANTS générique (partagé Monte
 * Carlo + Rente) : la série est découpée en blocs de BLOCK_LENGTH années
 * consécutives, puis des blocs entiers sont tirés avec remise. Chaque bloc
 * reste une fenêtre réelle et contiguë du passé, ce qui préserve la séquence
 * des krachs et des bull markets SANS jamais reboucler la fin vers le début.
 */
export function sampleBlocks(
  values: number[],
  duration: number,
  rng: () => number,
  blockLength = BLOCK_LENGTH,
): number[] {
  const len = values.length
  if (len === 0) return []
  if (blockLength >= len) {
    const out: number[] = []
    while (out.length < duration) {
      for (const v of values) {
        if (out.length >= duration) break
        out.push(v)
      }
    }
    return out
  }
  const blocks: number[][] = []
  for (let start = 0; start < len; start += blockLength) {
    blocks.push(values.slice(start, start + blockLength))
  }
  const out: number[] = []
  while (out.length < duration) {
    const block = blocks[Math.floor(rng() * blocks.length)] ?? values
    for (const v of block) {
      if (out.length >= duration) break
      out.push(v)
    }
  }
  return out
}
