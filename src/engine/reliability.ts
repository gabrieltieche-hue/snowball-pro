import { sampleNormal } from "./math"

export interface RegimeParams {
  /** Moyenne annuelle du régime (autour de l'estimation historique). */
  mu: number
  /** Volatilité annuelle du régime (autour de l'estimation historique). */
  sigma: number
}

/**
 * Nombre d'observations INDÉPENDANTES d'une série rééchantillonnée par blocs :
 * le bootstrap par blocs ne crée pas d'information — une série de N années
 * découpée en blocs de L ans ne vaut que N/L observations indépendantes.
 * C'est cette taille effective qui pilote l'erreur d'estimation de la moyenne.
 */
export function effectiveSampleSize(seriesLength: number, blockLength: number): number {
  return Math.max(2, Math.floor(seriesLength / blockLength))
}

/**
 * Tire un « régime » de marché autour des estimations historiques. Le point
 * central de l'honnêteté statistique : la moyenne 10,07 % (et la volatilité)
 * ne sont PAS des vérités connues — ce sont des estimations avec une erreur
 * d'échantillonnage (Pástor & Stambaugh 2012, Merton 1980). Traiter la moyenne
 * comme connue resserre artificiellement les percentiles extrêmes et rend le
 * « 95,8 % de survie » trop confiant.
 *
 *  - μ̃ ~ Normal(μ̂, σ̂/√n_eff) : l'erreur standard de la moyenne (avec la
 *    taille effective du bootstrap par blocs, pas la taille brute).
 *  - σ̃ ~ σ̂ × exp(η), η ~ Normal(0, 1/√(2(n_eff−1))) : approximation de la
 *    loi de χ sur la variance (la vol est elle aussi estimée, pas connue).
 *
 * Chaque SCÉNARIO tire son propre régime : entre deux simulations, la moyenne
 * « vraie » peut être de 4 % ou de 15 %. C'est exactement l'incertitude que
 * l'utilisateur vit réellement en investissant.
 */
export function sampleRegime(avgReturn: number, volatility: number, nObs: number, rng: () => number): RegimeParams {
  const sigmaHat = Math.max(volatility, 0.01)
  const n = Math.max(2, nObs)
  const se = sigmaHat / Math.sqrt(n)
  const sigma = sigmaHat * Math.exp(sampleNormal(0, 1 / Math.sqrt(2 * (n - 1)), rng))
  const mu = avgReturn + sampleNormal(0, se, rng)
  return {
    // Bornes larges mais réalistes : un régime à −20 %/an de moyenne ou à
    // +45 %/an sortirait du champ des marchés actions historiques.
    mu: Math.max(-0.2, Math.min(0.45, mu)),
    sigma: Math.max(sigmaHat * 0.6, Math.min(sigmaHat * 2.2, sigma)),
  }
}

/**
 * Applique un régime à une série de rendements rééchantillonnée :
 *   r' = μ̃ + (σ̃/σ̂)·(r − μ̂)
 * La structure des blocs (krachs enchaînés, bull markets) est préservée ; seul
 * le niveau moyen et l'ampleur des écarts changent pour refléter le régime.
 */
export function applyRegime(returns: number[], regime: RegimeParams, avgReturn: number, volatility: number): number[] {
  const sigmaHat = Math.max(volatility, 1e-6)
  const scale = regime.sigma / sigmaHat
  return returns.map(r => {
    const shifted = regime.mu + scale * (r - avgReturn)
    // Un rendement annuel sous -100 % est physiquement impossible (le capital
    // ne peut pas devenir négatif en une année). Les régimes extrêmes (μ̃ à
    // -20 %, σ̃ à 2,2×σ̂) combinés au pire bloc rejoué (1931 : -43 %) donnerait
    // r' ≈ -137 % sans cette borne : on la garde large mais réaliste.
    return Math.max(-0.95, Math.min(3, shifted))
  })
}
