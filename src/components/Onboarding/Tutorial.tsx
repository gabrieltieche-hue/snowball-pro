import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, LayoutGrid, Rocket, ShieldCheck, Sparkles, Wallet } from "lucide-react"
import { useLang } from "../../i18n"
import { cn } from "../../utils/cn"

interface TutorialProps {
  onFinish: () => void
}

/**
 * Tutoriel d'accueil (v7) — 5 écrans, NON skippable : le seul chemin est
 * « Suivant » puis « Lancer ma première simulation » (pas de croix, pas de
 * lien « passer »). Réservé au vrai nouveau visiteur (voir utils/onboarding.ts).
 * Langage visuel de la marque : or/ivoire, display font, pastilles de
 * progression — l'utilisateur comprend l'app AVANT de la toucher.
 */
export function Tutorial({ onFinish }: TutorialProps) {
  const { tr } = useLang()
  const [step, setStep] = useState(0)

  const slides = [
    {
      icon: Wallet,
      title: tr("Bienvenue sur Snowball Pro"),
      body: tr(
        "Votre épargne projetée dans l'avenir avec les vrais rendements de la bourse sur 100 ans — krachs compris. Des chiffres réels, expliqués simplement, sans promesse de rendement.",
      ),
    },
    {
      icon: Sparkles,
      title: tr("Un seul chiffre d'abord : votre nombre magique"),
      body: tr(
        "Chaque simulation affiche d'abord le capital final de votre épargne — et son pouvoir d'achat en euros d'aujourd'hui. C'est le point de départ de tout le reste.",
      ),
    },
    {
      icon: LayoutGrid,
      title: tr("Quatre onglets pour tout comprendre"),
      body: tr(
        "Projection : la courbe de votre épargne. Robustesse : votre plan résiste-t-il aux krachs ? Rente & Retraite : combien vivre de votre épargne. Combien investir : l'objectif inversé.",
      ),
    },
    {
      icon: ShieldCheck,
      title: tr("Simple, gratuit, 100 % privé"),
      body: tr(
        "Pas d'inscription obligatoire. Vos données ne quittent jamais votre appareil. L'app fonctionne hors-ligne, en français comme en anglais.",
      ),
    },
    {
      icon: Rocket,
      title: tr("C'est parti !"),
      body: tr(
        "Quelques questions simples et Snowball Pro construit votre première simulation — rien à régler, tout est guidé.",
      ),
    },
  ]

  const slide = slides[step]
  const isLast = step === slides.length - 1
  const Icon = slide.icon

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr("Bienvenue — présentation de Snowball Pro")}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-surface/90 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-3xl shadow-premium-lg p-6 sm:p-8"
          >
            {/* Icône du slide dans l'écrin or de la marque. */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-light via-primary to-primary-dark flex items-center justify-center shadow-gold">
              <Icon size={24} className="btn-gold-text" aria-hidden />
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-text mt-5">
              {slide.title}
            </h2>
            <p className="text-[12.5px] sm:text-[13px] text-text-muted leading-relaxed mt-2.5">{slide.body}</p>

            {/* Pastilles de progression : le chemin visible motive (goal-gradient). */}
            <div className="flex items-center gap-1.5 mt-6" aria-hidden>
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === step ? "w-7 bg-primary" : "w-2 bg-border",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                {tr("{current} sur {total}", { current: step + 1, total: slides.length })}
              </span>
              {isLast ? (
                <button
                  type="button"
                  onClick={onFinish}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text text-[12px] font-extrabold shadow-gold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  {tr("Lancer ma première simulation")}
                  <Rocket size={14} aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 text-[12px] font-extrabold transition-all duration-150 hover:bg-primary/20 active:scale-[0.98]"
                >
                  {tr("Suivant")}
                  <ArrowRight size={14} aria-hidden />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
