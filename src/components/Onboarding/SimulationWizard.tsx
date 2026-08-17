import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, ChevronLeft, Star, Wallet, X } from "lucide-react"
import {
  AGE_CHOICES,
  CAPITAL_CHOICES,
  DURATION_CHOICES,
  ENVELOPE_CONFIGS,
  MONTHLY_CHOICES,
  RETIREMENT_AGE_CHOICES,
  asksRetirementAge,
  defaultSimulationName,
  recommendDuration,
  recommendEnvelope,
} from "../../engine"
import type { ProjectGoal, RiskLevel, WizardAnswers } from "../../engine"
import type { EnvelopeType } from "../../types"
import { useLang } from "../../i18n"
import { cn } from "../../utils/cn"

interface SimulationWizardProps {
  onCancel: () => void
  onComplete: (answers: WizardAnswers, name: string) => void
}

type StepId =
  "age" | "hasCapital" | "capital" | "monthly" | "project" | "duration" | "envelope" | "retirementAge" | "risk" | "name"

const PROJECT_OPTIONS: { id: ProjectGoal; label: string; desc: string }[] = [
  { id: "retraite", label: "Retraite", desc: "Préparer vos vieux jours (30-40 ans)" },
  { id: "immobilier", label: "Achat immobilier", desc: "Constituer un apport (10 ans)" },
  { id: "liberte", label: "Liberté financière", desc: "Vivre de votre épargne (20 ans)" },
  { id: "precaution", label: "Épargne de précaution", desc: "Un matelas de sécurité (5 ans)" },
  { id: "enrichissement", label: "Enrichissement personnel", desc: "Faire grandir votre patrimoine (25 ans)" },
  { id: "aucune", label: "Je ne sais pas encore", desc: "L'app choisit une situation type (25 ans)" },
]

const RISK_OPTIONS: { id: RiskLevel; label: string; desc: string }[] = [
  { id: "prudent", label: "Tranquille", desc: "Je préfère limiter les variations de mon épargne" },
  { id: "equilibre", label: "Équilibré", desc: "Un bon compromis entre sécurité et croissance" },
  { id: "audacieux", label: "Croissance", desc: "J'accepte des variations pour viser plus haut" },
]

/**
 * Questionnaire guidé « Nouvelle simulation » (v7) : une question par écran,
 * gros boutons, barre de progression, étoile ⭐ sur la recommandation calculée
 * à partir des réponses précédentes, question retraite conditionnelle, et nom
 * de la simulation en dernière étape. Réponses vierges à chaque ouverture —
 * on peut très bien vouloir tester d'autres chiffres.
 */
export function SimulationWizard({ onCancel, onComplete }: SimulationWizardProps) {
  const { tr, fmtCurrency } = useLang()
  const [answers, setAnswers] = useState<Partial<WizardAnswers>>({})
  const [name, setName] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  // « Autre / Autre montant » : l'étape où un champ libre est ouvert (l'input
  // doit apparaître immédiatement, et sa valeur doit engager la réponse).
  const [customStep, setCustomStep] = useState<StepId | null>(null)

  const set = <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K] | undefined) =>
    setAnswers(a => ({ ...a, [key]: value }))

  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["age", "hasCapital"]
    if (answers.hasCapital) base.push("capital")
    base.push("monthly", "project", "duration", "envelope")
    if (asksRetirementAge(answers.project ?? null)) base.push("retirementAge")
    base.push("risk", "name")
    return base
  }, [answers.hasCapital, answers.project])

  const [stepIdx, setStepIdx] = useState(0)
  const step = steps[stepIdx]
  const isLast = step === "name"

  // Le nom par défaut suit les réponses (recalculé à chaque arrivée sur l'écran nom).
  const defaultName = useMemo(
    () => defaultSimulationName({ project: answers.project ?? null, duration: answers.duration ?? 25 }),
    [answers.project, answers.duration],
  )

  const answered = (s: StepId): boolean => {
    switch (s) {
      case "age":
        return typeof answers.age === "number"
      case "hasCapital":
        return typeof answers.hasCapital === "boolean"
      case "capital":
        return typeof answers.capital === "number"
      case "monthly":
        return typeof answers.monthly === "number"
      case "project":
        return answers.project !== undefined
      case "duration":
        return typeof answers.duration === "number"
      case "envelope":
        return answers.envelope !== undefined
      case "retirementAge":
        return typeof answers.retirementAge === "number"
      case "risk":
        return answers.risk !== undefined
      case "name":
        return true
    }
  }

  const next = () => {
    if (isLast) {
      const complete: WizardAnswers = {
        age: answers.age ?? 30,
        hasCapital: answers.hasCapital ?? false,
        capital: answers.hasCapital ? (answers.capital ?? 0) : 0,
        monthly: answers.monthly ?? 250,
        project: answers.project ?? null,
        duration: answers.duration ?? 25,
        envelope: answers.envelope ?? "auto",
        retirementAge: answers.retirementAge ?? null,
        risk: answers.risk ?? "equilibre",
      }
      onComplete(complete, name.trim() === "" ? defaultName : name.trim())
      return
    }
    if (!answered(step)) return
    setStepIdx(i => Math.min(i + 1, steps.length - 1))
  }

  const back = () => setStepIdx(i => Math.max(i - 1, 0))

  const pick = (s: StepId, value: unknown) => {
    set(s as keyof WizardAnswers, value as never)
    if (s === "hasCapital" && value === false) {
      // « Non » → pas de montant : on enchaîne sur la suite.
      setStepIdx(i => Math.min(i + 1, steps.length - 1))
    }
  }

  const recommendedDuration = answers.project !== undefined ? recommendDuration(answers.project ?? null) : null
  const recommendedEnvelope =
    answers.duration !== undefined ? recommendEnvelope(answers.project ?? null, answers.duration) : null

  const optionClass = (selected: boolean, recommended: boolean) =>
    cn(
      "relative w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 active:scale-[0.99]",
      selected
        ? "border-primary/60 bg-primary/10 shadow-gold"
        : recommended
          ? "border-primary/40 bg-primary/[0.04]"
          : "border-border hover:border-primary/40 hover:bg-glass-hover",
    )

  const CustomAmountInput = ({ label, onCommit }: { label: string; onCommit: (v: number) => void }) => (
    <div className="mt-2">
      <label className="sr-only" htmlFor="wizard-custom-amount">
        {label}
      </label>
      <input
        id="wizard-custom-amount"
        type="number"
        inputMode="numeric"
        min={0}
        value={customAmount}
        onChange={e => {
          setCustomAmount(e.target.value)
          onCommit(Number(e.target.value))
        }}
        placeholder={tr("Autre montant")}
        className="w-full rounded-xl border border-border bg-surface-50/40 px-4 py-3 text-sm font-bold text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr("Nouvelle simulation — questionnaire guidé")}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-surface/95 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg">
        {/* En-tête : progression + fermeture (le questionnaire n'est pas piégeant,
            contrairement au tutoriel — on peut annuler, rien n'est créé). */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-dim">
            {tr("Question {current} sur {total}", { current: stepIdx + 1, total: steps.length })}
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label={tr("Fermer le questionnaire")}
            title={tr("Fermer le questionnaire")}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-glass-hover transition-colors"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        {/* Barre de progression */}
        <div className="h-1.5 rounded-full bg-border/70 overflow-hidden mb-6" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-light via-primary to-primary-dark transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-3xl shadow-premium-lg p-6 sm:p-8"
          >
            {step === "age" && (
              <>
                <StepTitle title={tr("Quel âge avez-vous ?")} sub={tr("Cela nous aide à estimer votre horizon.")} />
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  {AGE_CHOICES.map(age => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => pick("age", age)}
                      className={cn(optionClass(answers.age === age, false), "flex items-center justify-between")}
                    >
                      <span className="text-sm font-bold text-text">
                        {age} {tr("ans")}
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomStep("age")}
                    className={cn(optionClass(customStep === "age", false), "col-span-2")}
                  >
                    <span className="text-sm font-bold text-text">{tr("Autre")}</span>
                  </button>
                </div>
                {customStep === "age" && (
                  <div className="mt-2">
                    <label className="sr-only" htmlFor="wizard-age-custom">
                      {tr("Votre âge")}
                    </label>
                    <input
                      id="wizard-age-custom"
                      type="number"
                      inputMode="numeric"
                      min={15}
                      max={90}
                      value={customAmount}
                      onChange={e => {
                        setCustomAmount(e.target.value)
                        set("age", Number(e.target.value))
                      }}
                      placeholder={tr("Votre âge")}
                      className="w-full rounded-xl border border-border bg-surface-50/40 px-4 py-3 text-sm font-bold text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}
              </>
            )}

            {step === "hasCapital" && (
              <>
                <StepTitle
                  title={tr("Avez-vous de l'argent épargné disponible pour investir ?")}
                  sub={tr("Capital déjà constitué : livret, compte courant, assurance-vie…")}
                />
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  {[true, false].map(oui => (
                    <button
                      key={String(oui)}
                      type="button"
                      onClick={() => pick("hasCapital", oui)}
                      className={cn(optionClass(answers.hasCapital === oui, false), "py-4")}
                    >
                      <span className="text-sm font-bold text-text">
                        {oui ? tr("Oui") : tr("Non, je pars de zéro")}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "capital" && (
              <>
                <StepTitle
                  title={tr("Combien pouvez-vous investir dès maintenant ?")}
                  sub={tr("Un ordre de grandeur suffit.")}
                />
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  {CAPITAL_CHOICES.map(cap => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => {
                        set("capital", cap)
                        setCustomStep(null)
                      }}
                      className={cn(optionClass(answers.capital === cap, false), "flex items-center justify-between")}
                    >
                      <span className="text-sm font-bold text-text mono">{fmtCurrency(cap)}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomStep("capital")}
                    className={cn(optionClass(customStep === "capital", false), "col-span-2")}
                  >
                    <span className="text-sm font-bold text-text">{tr("Autre montant")}</span>
                  </button>
                </div>
                {customStep === "capital" && (
                  <CustomAmountInput label={tr("Montant à investir")} onCommit={v => set("capital", v)} />
                )}
              </>
            )}

            {step === "monthly" && (
              <>
                <StepTitle
                  title={tr("Combien pouvez-vous épargner chaque mois ?")}
                  sub={tr("Ce que vous pouvez mettre de côté sans vous priver.")}
                />
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  {MONTHLY_CHOICES.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        set("monthly", m)
                        setCustomStep(null)
                      }}
                      className={cn(optionClass(answers.monthly === m, false), "flex items-center justify-between")}
                    >
                      <span className="text-sm font-bold text-text mono">{fmtCurrency(m)}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCustomStep("monthly")}
                    className={cn(optionClass(customStep === "monthly", false), "col-span-2")}
                  >
                    <span className="text-sm font-bold text-text">{tr("Autre montant")}</span>
                  </button>
                </div>
                {customStep === "monthly" && (
                  <CustomAmountInput label={tr("Épargne mensuelle")} onCommit={v => set("monthly", v)} />
                )}
              </>
            )}

            {step === "project" && (
              <>
                <StepTitle
                  title={tr("Pour quel projet souhaitez-vous investir ?")}
                  sub={tr("Le projet fixe un horizon conseillé — ajustable à l'étape suivante.")}
                />
                <div className="grid grid-cols-1 gap-2.5 mt-5">
                  {PROJECT_OPTIONS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        pick("project", p.id)
                        set("duration", recommendDuration(p.id))
                      }}
                      className={cn(
                        optionClass(answers.project === p.id, false),
                        "flex items-start justify-between gap-3",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-bold text-text">{tr(p.label)}</span>
                        <span className="block text-[11px] text-text-dim mt-0.5">{tr(p.desc)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "duration" && (
              <>
                <StepTitle
                  title={tr("Pendant combien d'années ?")}
                  sub={tr("L'horizon conseillé pour votre projet est indiqué d'une étoile.")}
                />
                <div className="grid grid-cols-4 gap-2 mt-5">
                  {DURATION_CHOICES.map(d => {
                    const rec = recommendedDuration !== null && d === recommendedDuration
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set("duration", d)}
                        className={cn(optionClass(answers.duration === d, rec), "py-3.5 text-center")}
                      >
                        <span className="block text-sm font-bold text-text">{d}</span>
                        <span className="block text-[10px] text-text-dim">{tr("ans")}</span>
                        {rec && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-primary-light via-primary to-primary-dark shadow-gold flex items-center justify-center">
                            <Star size={10} className="btn-gold-text fill-current" aria-hidden />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {step === "envelope" && (
              <>
                <StepTitle
                  title={tr("Où souhaitez-vous placer cet argent ?")}
                  sub={tr(
                    "L'étoile marque la meilleure option pour votre horizon — « Je ne sais pas » laisse l'app choisir.",
                  )}
                />
                <div className="grid grid-cols-1 gap-2.5 mt-5">
                  {(["pea", "av", "cto", "per"] as EnvelopeType[]).map(env => {
                    const cfg = ENVELOPE_CONFIGS.find(c => c.id === env)
                    const rec = recommendedEnvelope === env
                    return (
                      <button
                        key={env}
                        type="button"
                        onClick={() => set("envelope", env)}
                        className={cn(
                          optionClass(answers.envelope === env, rec),
                          "flex items-start justify-between gap-3",
                        )}
                      >
                        <span>
                          <span className="block text-sm font-bold text-text">
                            {cfg ? tr(cfg.name) : env}
                            {rec && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-primary align-middle">
                                <Star size={10} className="fill-primary" aria-hidden /> {tr("Recommandé")}
                              </span>
                            )}
                          </span>
                          <span className="block text-[11px] text-text-dim mt-0.5">{cfg ? tr(cfg.desc) : ""}</span>
                        </span>
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => set("envelope", "auto")}
                    className={cn(optionClass(answers.envelope === "auto", false))}
                  >
                    <span className="block text-sm font-bold text-text">{tr("Je ne sais pas — recommandez-moi")}</span>
                    <span className="block text-[11px] text-text-dim mt-0.5">
                      {tr("L'app choisit la meilleure enveloppe pour votre horizon.")}
                    </span>
                  </button>
                </div>
              </>
            )}

            {step === "retirementAge" && (
              <>
                <StepTitle
                  title={tr("À quel âge voulez-vous arrêter de travailler ?")}
                  sub={tr("L'app estime la durée pendant laquelle votre épargne devra vous faire vivre.")}
                />
                <div className="grid grid-cols-3 gap-2.5 mt-5">
                  {RETIREMENT_AGE_CHOICES.map(age => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => set("retirementAge", age)}
                      className={cn(optionClass(answers.retirementAge === age, false), "py-3.5 text-center")}
                    >
                      <span className="text-sm font-bold text-text">
                        {age} {tr("ans")}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "risk" && (
              <>
                <StepTitle
                  title={tr("Comment réagiriez-vous si votre épargne baissait temporairement ?")}
                  sub={tr("Le marché monte et descend : votre confort face aux variations guide la projection.")}
                />
                <div className="grid grid-cols-1 gap-2.5 mt-5">
                  {RISK_OPTIONS.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => set("risk", r.id)}
                      className={cn(
                        optionClass(answers.risk === r.id, r.id === "equilibre"),
                        "flex items-start justify-between gap-3",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-bold text-text">
                          {tr(r.label)}
                          {r.id === "equilibre" && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-primary align-middle">
                              <Star size={10} className="fill-primary" aria-hidden /> {tr("Recommandé")}
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-text-dim mt-0.5">{tr(r.desc)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "name" && (
              <>
                <StepTitle
                  title={tr("Nommez votre simulation")}
                  sub={tr("Retrouvez-la plus tard dans l'onglet « Mes simulations ».")}
                />
                <div className="mt-5">
                  <label htmlFor="wizard-sim-name" className="sr-only">
                    {tr("Nom de la simulation")}
                  </label>
                  <input
                    id="wizard-sim-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={defaultName}
                    className="w-full rounded-xl border border-border bg-surface-50/40 px-4 py-3 text-sm font-bold text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {/* Récapitulatif : la valeur promise, résultat d'abord. */}
                <div className="mt-4 rounded-xl border border-border/70 bg-surface-50/40 p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Wallet size={16} aria-hidden />
                  </div>
                  <div className="min-w-0 text-[11px] text-text-muted leading-snug">
                    {tr("Capital initial")} {fmtCurrency(answers.hasCapital ? (answers.capital ?? 0) : 0)} ·{" "}
                    {tr("versement")} {fmtCurrency(answers.monthly ?? 0)}/{tr("mois")} · {answers.duration ?? 25}{" "}
                    {tr("ans")} ·{" "}
                    {answers.envelope === "auto"
                      ? tr("enveloppe recommandée")
                      : tr(ENVELOPE_CONFIGS.find(c => c.id === answers.envelope)?.name ?? "")}
                  </div>
                </div>
              </>
            )}

            {/* Pied : Retour / Suivant (ou « Voir mon résultat » sur la dernière étape). */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={back}
                disabled={stepIdx === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[11px] font-bold text-text-muted hover:text-text hover:bg-glass-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} aria-hidden /> {tr("Retour")}
              </button>
              {isLast ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-primary-light via-primary to-primary-dark btn-gold-text text-[12px] font-extrabold shadow-gold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  {tr("Voir mon résultat")}
                  <ArrowRight size={14} aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  disabled={!answered(step)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 text-[12px] font-extrabold transition-all duration-150 hover:bg-primary/20 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed"
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

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <header>
      <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-text">{title}</h2>
      <p className="text-[11.5px] text-text-muted leading-relaxed mt-1.5">{sub}</p>
    </header>
  )
}
