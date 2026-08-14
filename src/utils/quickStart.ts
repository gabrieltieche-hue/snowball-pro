/**
 * Profils de départ « Commencez ici » (v6.8, activation) — source unique des
 * trois situations types proposées à un nouvel utilisateur : le bandeau
 * QuickStart de l'app ET la section « Pour qui » de la landing partagent ces
 * données (mêmes noms, mêmes chiffres, aucune dérive possible).
 *
 * Les MONTANTS sont des situations types ; le capital final affiché n'est
 * jamais codé en dur — chaque surface le calcule avec runSimulation.
 */
import { SETTINGS_KEY } from "../engine"
import type { SimulationInputs } from "../types"
import { scopeKey } from "../auth/storage"

export const QUICKSTART_DISMISSED_KEY = "snowball_v5_quickstart_dismissed"

export interface QuickStartProfile {
  id: string
  name: string
  meta: string
  patch: Partial<SimulationInputs>
}

export const QUICKSTART_PROFILES: QuickStartProfile[] = [
  {
    id: "premiers-pas",
    name: "Premiers pas — à 25 ans",
    meta: "10 k€ · 250 €/mois · 40 ans · PEA",
    patch: { capitalInitial: 10_000, monthlyPayment: 250, duration: 40, envelope: "pea" },
  },
  {
    id: "carriere",
    name: "Carrière — à 35 ans",
    meta: "30 k€ · 800 €/mois · 25 ans · CTO",
    patch: { capitalInitial: 30_000, monthlyPayment: 800, duration: 25, envelope: "cto" },
  },
  {
    id: "retraite",
    name: "Horizon retraite — à 55 ans",
    meta: "100 k€ · 1 500 €/mois · 10 ans · AV",
    patch: { capitalInitial: 100_000, monthlyPayment: 1_500, duration: 10, envelope: "av" },
  },
]

/**
 * Le bandeau ne se montre qu'une fois : soit l'utilisateur l'a fermé (clic X ou
 * premier réglage modifié), soit il revient avec des réglages déjà sauvegardés
 * (visiteur connu) — dans les deux cas il n'en a plus besoin.
 */
export function loadQuickStartVisible(scope: string | null): boolean {
  try {
    if (localStorage.getItem(QUICKSTART_DISMISSED_KEY)) return false
    return localStorage.getItem(scopeKey(scope, SETTINGS_KEY)) === null
  } catch {
    return false
  }
}

export function saveQuickStartDismissed(): void {
  try {
    localStorage.setItem(QUICKSTART_DISMISSED_KEY, "1")
  } catch {
    /* localStorage indisponible */
  }
}
