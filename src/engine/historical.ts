import type { HistoricalDataset, HistoricalIndex } from "../types"
import { average, standardDeviation } from "./math"

const DATASET_START: Record<HistoricalIndex, number> = {
  "msci-world": 1970,
  sp500: 1995,
  nasdaq: 1995,
  cac40: 1995,
  bitcoin: 2011,
  gold: 2000,
}

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

// Inflation forfaitaire : 2,1 %/an fixe. L'inflation historique réelle (pic à
// plus de 10 %/an dans les années 1970) fausserait les moyennes de très long
// terme : on lui préfère un taux unique et lisible (choix produit).
export const INFLATION_SERIES = [0.021]

export function getHistoricalDataset(index: HistoricalIndex): HistoricalDataset {
  const returns = RETURNS[index]
  const startYear = DATASET_START[index]
  const years = returns.map((r, i) => ({
    year: startYear + i,
    return: r,
    inflation: INFLATION_SERIES[i % INFLATION_SERIES.length] ?? 0.021,
  }))
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
    avgReturn: average(returns),
    volatility: standardDeviation(returns),
    years,
  }
}
