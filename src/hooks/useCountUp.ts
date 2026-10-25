/**
 * Compteurs animés partagés (extrait de la landing en v8 — réutilisé par
 * l'onboarding « Le chiffre d'abord »).
 *
 * `usePrefersReducedMotion` écoute la préférence système en direct (pattern
 * maison — framer-motion est mocké en test, on n'utilise pas ses hooks).
 * `useCountUp` anime en ease-out cubique DEPUIS la dernière valeur affichée
 * (pas de retour à zéro lors d'une mise à jour : le chiffre « glisse » vers sa
 * nouvelle cible) — et saute directement à la cible si l'animation ne peut pas
 * tourner (motion réduite, jsdom, rAF absent).
 */
import { useEffect, useRef, useState } from "react"

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      setReduced(mq.matches)
      const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    } catch {
      return
    }
  }, [])
  return reduced
}

export function useCountUp(target: number, delayMs = 0, durationMs = 1200): number {
  const [value, setValue] = useState(0)
  const displayedRef = useRef(0)
  displayedRef.current = value
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    if (reduced || typeof requestAnimationFrame === "undefined") {
      setValue(target)
      return
    }
    let raf = 0
    let timer = 0
    const from = displayedRef.current
    const t0 = performance.now() + delayMs
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, now - t0) / durationMs)
      setValue(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, delayMs)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, delayMs, durationMs, reduced])
  return value
}
