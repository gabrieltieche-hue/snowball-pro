import { useEffect, useState } from "react"

/**
 * M1 — détecte un pointeur « coarse » (mobile/tactile). Les tooltips Recharts
 * déclenchés en hover ne répondent pas au tap ; sur pointeur coarse, les
 * graphiques basculent sur un déclenchement au clic.
 */
export function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
    return window.matchMedia("(pointer: coarse)").matches
  })

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const mq = window.matchMedia("(pointer: coarse)")
    const handler = (e: MediaQueryListEvent) => setCoarse(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return coarse
}
