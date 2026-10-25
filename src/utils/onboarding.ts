/**
 * Onboarding (v8 « Le chiffre d'abord ») — persistance et détection du « vrai
 * nouveau visiteur ».
 *
 * Le questionnaire s'ouvre en direct UNIQUEMENT pour qui n'a jamais vu l'app :
 *  - aucune clé globale `snowball_v5_tutorial_done` (déjà vu, quel que soit le
 *    compte — un compte créé après l'invité n'a pas besoin de refaire le guide) ;
 *  - pas de lien partagé `#s=` (état explicitement demandé, pas un nouveau venu) ;
 *  - aucun réglage ni snapshot dans le scope courant (visiteur connu).
 */
import { SETTINGS_KEY, SNAPSHOT_STORAGE_KEY } from "../engine"
import { scopeKey } from "../auth/storage"
import { readSharedState } from "./urlState"

export const TUTORIAL_DONE_KEY = "snowball_v5_tutorial_done"

export function loadOnboardingVisible(scope: string | null): boolean {
  try {
    if (localStorage.getItem(TUTORIAL_DONE_KEY)) return false
    if (readSharedState() !== null) return false
    if (localStorage.getItem(scopeKey(scope, SETTINGS_KEY))) return false
    if (localStorage.getItem(scopeKey(scope, SNAPSHOT_STORAGE_KEY))) return false
    return true
  } catch {
    return false
  }
}

export function saveOnboardingDone(): void {
  try {
    localStorage.setItem(TUTORIAL_DONE_KEY, "1")
  } catch {
    /* localStorage indisponible */
  }
}
