/**
 * Store de session pour React — pont entre `auth.ts` (pur) et l'UI.
 *
 * `useSession()` suit la session via `useSyncExternalStore` : App se remonte
 * avec le bon espace de stockage quand l'utilisateur se connecte/se déconnecte,
 * sans prop drilling ni store global (convention du projet : prop-based).
 */
import { useSyncExternalStore } from "react"
import { browserStorage, getSession } from "./auth"
import type { AuthSession } from "./auth"

let cachedSession: AuthSession | null | undefined = undefined
const listeners = new Set<() => void>()

function load(): AuthSession | null {
  return getSession(browserStorage)
}

/** Valeur stable entre deux changements (contrat useSyncExternalStore). */
export function getCachedSession(): AuthSession | null {
  if (cachedSession === undefined) cachedSession = load()
  return cachedSession
}

function emit(): void {
  listeners.forEach(listener => listener())
}

/** Re-synchronise le cache depuis le stockage puis notifie (login/logout…). */
export function syncSession(): void {
  cachedSession = load()
  emit()
}

/** Remise à zéro pour les tests (évite la fuite de session entre tests). */
export function resetSessionStoreForTests(): void {
  cachedSession = undefined
  listeners.clear()
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Hook React : la session courante (null = invité). */
export function useSession(): AuthSession | null {
  return useSyncExternalStore(subscribeSession, getCachedSession)
}
