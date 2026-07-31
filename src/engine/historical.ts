import type { HistoricalDataset, HistoricalIndex } from "../types"
import { average, standardDeviation } from "./math"

const DATASET_START: Record<HistoricalIndex, number> = {
  "msci-world": 1995,
  sp500: 1995,
  nasdaq: 1995,
  cac40: 1995,
  bitcoin: 2011,
  gold: 2000,
}

const RETURNS: Record<HistoricalIndex, number[]> = {
  "msci-world": [
    0.184, 0.139, 0.157, 0.228, 0.243, -0.131, -0.183, -0.208, 0.31, 0.149, 0.098, 0.201, 0.071, -0.403, 0.292, 0.118,
    -0.053, 0.162, 0.248, 0.181, -0.021, 0.082, 0.215, -0.094, 0.279, 0.163, 0.206, -0.134, 0.191, 0.234, 0.083,
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
  bitcoin: [
    1.457, 0.346, -0.723, 0.874, 0.308, 1.446, 0.148, 5.5, -0.577, 0.354, 1.253, 13.3, -0.733, 0.953, 3.034, 0.598,
  ],
  gold: [
    -0.207, 0.007, 0.002, -0.059, 0.009, 0.252, 0.196, 0.052, 0.179, 0.228, 0.308, 0.053, 0.238, 0.296, 0.098, 0.068,
    -0.282, -0.022, -0.103, 0.081, 0.134, -0.023, 0.178, 0.245, -0.039, 0.009, 0.127, 0.272, 0.079,
  ],
}

export const INFLATION_SERIES = [
  0.017, 0.02, 0.012, 0.007, 0.005, 0.017, 0.016, 0.019, 0.021, 0.022, 0.019, 0.022, 0.027, 0.032, 0.001, 0.015, 0.021,
  0.02, 0.009, 0.005, 0.0, 0.002, 0.011, 0.018, 0.011, 0.005, 0.016, 0.052, 0.049, 0.026, 0.021,
]

export function getHistoricalDataset(index: HistoricalIndex): HistoricalDataset {
  const returns = RETURNS[index]
  const startYear = DATASET_START[index]
  const years = returns.map((r, i) => ({
    year: startYear + i,
    return: r,
    inflation: INFLATION_SERIES[i % INFLATION_SERIES.length] ?? 0.02,
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
