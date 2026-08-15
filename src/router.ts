/**
 * Routeur minimal par hash — compatible avec les liens partagés v5/v6 :
 * `#s=…` (état partagé) route vers l'application, comme avant.
 *
 *   (aucun hash) | #/          → landing
 *   #/app                     → application (simulateur)
 *   #/login | #/register      → écrans d'authentification
 *   #s=…                      → application (lien partagé, historique)
 */
import { useSyncExternalStore } from "react"

export type View = "landing" | "app" | "login" | "register"

export function parseHash(hash: string): View {
  const h = hash.replace(/^#/, "")
  if (h.startsWith("s=")) return "app"
  if (h === "/app") return "app"
  if (h === "/login") return "login"
  if (h === "/register") return "register"
  return "landing"
}

function getHash(): string {
  return typeof window === "undefined" ? "" : window.location.hash
}

export function getCurrentView(): View {
  return parseHash(getHash())
}

/** Navigue vers une vue (écrit dans le hash ; déclenche les abonnés). */
export function navigateTo(view: View): void {
  const target = view === "app" ? "#/app" : view === "login" ? "#/login" : view === "register" ? "#/register" : "#/"
  window.location.hash = target
}

function subscribeHash(listener: () => void): () => void {
  window.addEventListener("hashchange", listener)
  return () => window.removeEventListener("hashchange", listener)
}

/** Vue courante, réactive aux changements de hash (back/forward inclus). */
export function useHashView(): View {
  return useSyncExternalStore(subscribeHash, getCurrentView)
}
