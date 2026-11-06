/**
 * Client Supabase **optionnel**.
 *
 * Rien ne casse si les variables d'environnement sont absentes : l'app reste
 * 100 % locale. La synchro cloud n'est activée que quand le wizard de setup
 * a rempli `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cached: SupabaseClient | null | undefined

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    cached = null
    return null
  }
  try {
    cached = createClient(url, key)
  } catch {
    cached = null
  }
  return cached
}

export function isCloudSyncAvailable(): boolean {
  return getSupabase() !== null
}
