/**
 * Révélation (v8 « Le chiffre d'abord ») : après la dernière question, le
 * résultat se met en scène — compteur qui monte, courbe qui se dessine,
 * décomposition épargne / croissance — puis « Ouvrir ma simulation » applique
 * les réponses (création du snapshot côté App). « Modifier mes réponses »
 * ramène au questionnaire, réponses conservées.
 */
import { useEffect, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowRight, PencilLine } from "lucide-react"
import { buildSimulationFromAnswers, runSimulation } from "../../engine"
import type { WizardAnswers } from "../../engine"
import { useLang } from "../../i18n"
import { useCountUp } from "../../hooks/useCountUp"
import { useFocusTrap } from "../../hooks/useFocusTrap"
import { Sparkline } from "./LivePreview"

interface RevealProps {
  answers: WizardAnswers
  name: string
  firstRun: boolean
  onOpen: () => void
  onBack: () => void
}

export function Reveal({ answers, name, firstRun, onOpen, onBack }: RevealProps) {
  const { tr, fmtCurrency } = useLang()
  const inputs = useMemo(() => buildSimulationFromAnswers(answers), [answers])
  const rows = useMemo(() => runSimulation(inputs), [inputs])
  const lastRow = rows[rows.length - 1]
  const showReal = inputs.showReal
  const total = showReal ? lastRow.real : lastRow.nominal
  const secondary = showReal ? lastRow.nominal : lastRow.real
  // Compteur de cérémonie : part du dernier chiffre affiché, 1,6 s d'ease-out.
  const shown = useCountUp(total, 250, 1600)
  const endYear = lastRow.date.split(" ")[1]?.replace(".", "") ?? ""
  const accountLabel = tr("sur le compte en {year}", { year: endYear })
  const invested = lastRow.investedNom
  const growth = Math.max(0, lastRow.nominal - invested)
  const investedPct = lastRow.nominal > 0 ? (invested / lastRow.nominal) * 100 : 0
  const growthPct = Math.max(0, 100 - investedPct)
  const cardRef = useRef<HTMLDivElement>(null)
  const trap = useFocusTrap(cardRef)

  // Focus le titre (lecture d'écran) à l'ouverture de la révélation.
  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true })
  }, [])

  const eyebrow = firstRun ? tr("Votre première simulation") : tr("Votre simulation est prête")

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={eyebrow}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-surface/95 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <motion.div
        ref={cardRef}
        onKeyDown={trap}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="glass rounded-3xl shadow-premium-lg p-6 sm:p-9 w-full max-w-2xl my-auto"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h2
          tabIndex={-1}
          className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-text mt-1.5 outline-none"
        >
          {name}
        </h2>

        {/* Le chiffre : même hiérarchie que le héro, en cérémonie. */}
        <p className="mono text-4xl sm:text-5xl font-extrabold tracking-tight text-text mt-5 leading-none">
          {fmtCurrency(shown)}
        </p>
        <p className="text-[11px] text-text-muted mt-2">
          {showReal ? tr("en euros d'aujourd'hui (pouvoir d'achat)") : accountLabel} —{" "}
          <span className="text-text-dim">
            {fmtCurrency(secondary)} {showReal ? accountLabel : tr("en euros d'aujourd'hui")}
          </span>
        </p>

        {/* La courbe : le chemin parcouru, krachs inclus. */}
        <div className="mt-6">
          <Sparkline
            values={rows.map(row => row.nominal)}
            width={560}
            height={150}
            strokeWidth={2.2}
            className="w-full"
          />
        </div>

        {/* D'où vient le chiffre : épargne vs croissance de la bourse. */}
        {total > 0 && (
          <div className="mt-5">
            <div
              role="img"
              aria-label={tr("{a} % de votre capital provient de votre épargne, {b} % de la croissance de la bourse", {
                a: investedPct.toFixed(0),
                b: growthPct.toFixed(0),
              })}
              className="flex h-2.5 rounded-full overflow-hidden bg-glass-hover"
            >
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${investedPct}%`, background: "var(--color-text-muted)" }}
              />
              {growth > 0 && (
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${growthPct}%`, background: "var(--color-primary)" }}
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 mt-2.5 flex-wrap">
              <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-text-muted shrink-0" aria-hidden />
                {tr("Épargné :")} <span className="mono font-semibold text-text">{fmtCurrency(invested)}</span>
              </span>
              {growth > 0 && (
                <span className="text-[10px] text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden />
                  {tr("Gains de la bourse :")} <span className="mono font-semibold">+{fmtCurrency(growth)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Honnêteté : ce qu'est ce chiffre — une estimation, pas une promesse. */}
        <p className="text-[10px] text-text-dim mt-5 leading-relaxed">
          {tr(
            "Projection hypothétique basée sur les rendements réels de la bourse (1926-2025), krachs inclus. Les performances passées ne garantissent pas les résultats futurs.",
          )}
        </p>

        <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-bold text-text-muted hover:text-text hover:bg-glass-hover transition-colors"
          >
            <PencilLine size={13} aria-hidden /> {tr("Modifier mes réponses")}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text text-[12px] font-extrabold shadow-gold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            {tr("Ouvrir ma simulation")}
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>

        {/* Valeur finale non animée : annonce lecteurs d'écran + déterminisme tests. */}
        <span role="status" className="sr-only">
          {fmtCurrency(total)} — {name}
        </span>
      </motion.div>
    </div>
  )
}
