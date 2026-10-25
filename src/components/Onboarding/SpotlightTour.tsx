/**
 * Visite guidée post-onboarding (v8) : 3 bulles ancrées sur les vrais écrans
 * (héro résultat, onglets, réglages) via les attributs `data-tour`. Jamais
 * bloquante : « Passer » à tout moment, Échap aussi. Si la cible manque ou est
 * de taille nulle (DOM différent, jsdom), la bulle se centre — la visite reste
 * utilisable partout.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { useLang } from "../../i18n"
import { useFocusTrap } from "../../hooks/useFocusTrap"
import { cn } from "../../utils/cn"
import type { CSSProperties } from "react"

interface SpotlightTourProps {
  onClose: () => void
}

interface TourStep {
  target: string
  title: string
  body: string
}

const CARD_WIDTH = 340
const CARD_ESTIMATED_HEIGHT = 200

export function SpotlightTour({ onClose }: SpotlightTourProps) {
  const { tr } = useLang()
  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: "hero",
        title: tr("Votre chiffre"),
        body: tr("Capital projeté et pouvoir d'achat : le résultat se recalcule à chaque réglage."),
      },
      {
        target: "tabs",
        title: tr("Explorez les onglets"),
        body: tr(
          "Robustesse : et si les krachs tombaient au mauvais moment ? Rente : vivre de votre épargne. Objectif : combien investir.",
        ),
      },
      {
        target: "settings",
        title: tr("Tout se règle ici"),
        body: tr(
          "Épargne, frais, fiscalité : ouvrez les réglages avancés quand vous voulez. Vos données restent sur votre appareil.",
        ),
      },
    ],
    [tr],
  )
  const [stepIdx, setStepIdx] = useState(0)
  const step = steps[stepIdx]
  const isLast = stepIdx === steps.length - 1
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const trap = useFocusTrap(cardRef)

  // Cible du pas courant : mesurée après scroll. Rect introuvable ou zéro
  // (jsdom) → bulle centrée, sans découpe.
  useLayoutEffect(() => {
    const update = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      if (!el) {
        setRect(null)
        return
      }
      if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center", behavior: "auto" })
      const r = el.getBoundingClientRect()
      setRect(r.width > 0 && r.height > 0 ? r : null)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [step.target])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  // Focus la bulle à chaque pas (lecture d'écran + Tab dans le panneau).
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true })
  }, [stepIdx])

  // Position de la bulle : sous la cible si possible, au-dessus sinon, jamais
  // hors écran. Largeur bornée pour les très petits écrans.
  let cardStyle: CSSProperties | undefined
  {
    const viewportW = typeof window !== "undefined" ? window.innerWidth : 0
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 0
    const cardW = Math.min(CARD_WIDTH, Math.max(viewportW - 24, 240))
    if (rect) {
      const cardH = cardRef.current?.getBoundingClientRect().height || CARD_ESTIMATED_HEIGHT
      const below = rect.bottom + 12
      const top = below + cardH <= viewportH - 12 ? below : Math.max(12, rect.top - cardH - 12)
      const left = Math.min(Math.max(rect.left + rect.width / 2 - cardW / 2, 12), Math.max(12, viewportW - cardW - 12))
      cardStyle = { top, left, width: cardW }
    }
  }

  return (
    <div className="fixed inset-0 z-[75] no-print">
      {/* Voile : trou lumineux sur la cible si mesurable, sinon voile plein. */}
      {rect ? (
        <div
          aria-hidden
          className="fixed rounded-2xl ring-2 ring-primary/80 transition-all duration-200 pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(7, 10, 18, 0.62)",
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-[rgba(7,10,18,0.62)]" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={tr("Visite guidée")}
        tabIndex={-1}
        onKeyDown={trap}
        style={cardStyle}
        className={cn(
          "fixed glass rounded-2xl shadow-premium-lg border border-primary/25 p-4 sm:p-5 outline-none",
          !rect && "bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[340px]",
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          {stepIdx + 1} / {steps.length}
        </p>
        <h3 className="font-display text-sm font-extrabold tracking-tight text-text mt-1">{step.title}</h3>
        <p className="text-[11.5px] text-text-muted leading-relaxed mt-1.5">{step.body}</p>
        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-[11px] font-bold text-text-muted hover:text-text hover:bg-glass-hover transition-colors"
          >
            {tr("Passer")}
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text text-[11px] font-extrabold shadow-gold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              <Check size={13} aria-hidden /> {tr("Terminé")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIdx(i => Math.min(i + 1, steps.length - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text text-[11px] font-extrabold shadow-gold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              {tr("Suivant")} <ArrowRight size={13} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
