import type { SimulationInputs } from "../types"
import { parseStoredInputs } from "../engine"

const HASH_PREFIX = "s="

/** Encode les inputs en base64url JSON pour les partager dans l'URL. */
export function encodeInputsForUrl(inputs: SimulationInputs): string {
  const json = JSON.stringify(inputs)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return HASH_PREFIX + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Décode un état partagé depuis le hash ; renvoie null si invalide. */
export function decodeInputsFromUrl(encoded: string | null): SimulationInputs | null {
  if (!encoded || !encoded.startsWith(HASH_PREFIX)) return null
  try {
    const b64 = encoded.slice(HASH_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    return parseStoredInputs(json)
  } catch {
    return null
  }
}

/** Lit l'état partagé présent dans le hash de l'URL courante. */
export function readSharedState(): SimulationInputs | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash
  if (!hash.startsWith(`#${HASH_PREFIX}`)) return null
  return decodeInputsFromUrl(hash.slice(1))
}

/** Écrit l'état partagé dans le hash (replaceState : pas de pollution d'historique). */
export function writeSharedState(inputs: SimulationInputs): void {
  if (typeof window === "undefined") return
  try {
    window.history.replaceState(null, "", `#${encodeInputsForUrl(inputs)}`)
  } catch {
    /* hash indisponible (environnement restreint) */
  }
}

/** Construit l'URL partageable (origin + pathname + #s=…). */
export function buildShareUrl(inputs: SimulationInputs): string {
  const base = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`
  return `${base}#${encodeInputsForUrl(inputs)}`
}

/** Copie un texte dans le presse-papiers avec repli sur execCommand. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* repli ci-dessous */
  }
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
