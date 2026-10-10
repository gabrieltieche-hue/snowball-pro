import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, BarChart3, Dices, PiggyBank, RefreshCw, Target, TrendingUp } from "lucide-react"
import {
  DEFAULT_INPUTS,
  getHistoricalDataset,
  RECOMMENDED_RETURN_MAX,
  RECOMMENDED_RETURN_MIN,
  solveGoal,
  solveGoalMonteCarloAsync,
} from "../../engine"
import { useLang } from "../../i18n"
import { GoalProgress } from "../Simulation/GoalProgress"
import { SectionHeader } from "../shared/SectionHeader"
import { SliderInput } from "../shared/SliderInput"
import { Toggle } from "../shared/Toggle"
import { cn } from "../../utils/cn"
import type { GoalDifficulty, SimulationInputs, YearRow } from "../../types"

interface GoalTabProps {
  inputs: SimulationInputs
  rows: YearRow[]
  darkMode: boolean
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

const DIFFICULTY_META: Record<GoalDifficulty, { label: string; tone: string }> = {
  easy: { label: "Atteignable (livrets, obligations)", tone: "var(--color-success)" },
  moderate: { label: "Marché actions diversifié", tone: "var(--color-primary)" },
  ambitious: { label: "Très ambitieux", tone: "var(--color-danger)" },
  impossible: { label: "Objectif irréaliste", tone: "var(--color-danger)" },
}

const COMPARISON_RATES = [3, 5, 7, 10, 12]

const SCENARIO_LABELS = { prudent: "Prudent", central: "Central", optimiste: "Optimiste" } as const

/**
 * Libellé de taux sans zéros inutiles : 10 → « 10% », 10.07 → « 10,07% »,
 * 12.5 → « 12,5% » (virgule en français, point en anglais). Audit v5.6.3 :
 * avant, le tableau arrondissait les taux à l'entier (« 10 % ») pendant que
 * le calcul principal utilisait 10,07 % — deux chiffres différents pour la
 * même étiquette. La ligne du taux COURANT affiche sa valeur exacte.
 */
const makeFmtRate =
  (lang: "fr" | "en") =>
  (r: number): string => {
    const s = r.toFixed(2)
    const local = lang === "en" ? s : s.replace(".", ",")
    return `${local.replace(/0+$/, "").replace(/[.,]$/, "")}%`
  }

export function GoalTab({ inputs, rows, darkMode, updateInput }: GoalTabProps) {
  const { tr, lang, fmtCurrency, fmtDecimal } = useLang()
  const fmtRate = makeFmtRate(lang)
  const historical = getHistoricalDataset(inputs.historicalIndex)
  // Scénario du Simulateur : prudent (réel composé) / central (géométrique) /
  // optimiste (arithmétique) — repris quand « Utiliser mon scénario principal »
  // est actif (paquet 2 : l'objectif inversé part des MÊMES hypothèses).
  const scenarioRate =
    inputs.returnScenario === "prudent"
      ? historical.netReturn
      : inputs.returnScenario === "optimiste"
        ? historical.avgReturn
        : historical.compoundedReturn
  const eff = useMemo(
    () =>
      inputs.goalSync
        ? {
            goalCapital: inputs.capitalInitial,
            goalDuration: inputs.duration,
            goalAnnualReturn: scenarioRate,
            goalPayment: inputs.monthlyPayment,
          }
        : null,
    [inputs.goalSync, inputs.capitalInitial, inputs.duration, inputs.monthlyPayment, scenarioRate],
  )
  const goalResult = useMemo(() => solveGoal({ ...inputs, ...(eff ?? {}) }), [inputs, eff])
  const lastRow = rows[rows.length - 1]
  const difficulty = DIFFICULTY_META[goalResult.difficulty]
  const scenarioRates = [historical.netReturn * 100, historical.compoundedReturn * 100, historical.avgReturn * 100]
  // Affichage TOUJOURS aligné sur le calcul : en mode synchronisé, les textes
  // des cartes citent les valeurs du scénario principal (durée, rendement,
  // épargne, capital) au lieu des réglages de l'onglet Objectif qui restent
  // figés (audit — « 15 ans » à côté d'un calcul à 20 ans).
  const effDuration = eff?.goalDuration ?? inputs.goalDuration
  const effRate = eff?.goalAnnualReturn ?? inputs.goalAnnualReturn
  const effCapital = eff?.goalCapital ?? inputs.goalCapital
  const effPayment = eff?.goalPayment ?? inputs.goalPayment

  // Inversion Monte-Carlo (paquet 2) : versement mensuel pour atteindre
  // l'objectif dans P10/P50/P90 des scénarios — calculé sur le scénario
  // PRINCIPAL (capital, durée, frais, fiscalité), pas sur une calculatrice
  // indépendante.
  const [mcInv, setMcInv] = useState<{ p10: number; p50: number; p90: number } | null>(null)
  const [invRunning, setInvRunning] = useState(false)
  const [invProgress, setInvProgress] = useState(0)
  const invAbortRef = useRef<AbortController | null>(null)
  useEffect(() => () => invAbortRef.current?.abort(), [])

  const handleRunInv = async () => {
    if (invRunning) return
    invAbortRef.current?.abort()
    const controller = new AbortController()
    invAbortRef.current = controller
    setInvRunning(true)
    setInvProgress(0)
    setMcInv(null)
    const base = { ...inputs, mcRuns: 600 }
    const totalIter = 42 // 3 percentiles × 14 itérations
    const out = { p90: 0, p50: 0, p10: 0 }
    try {
      let done = 0
      for (const [pct, key] of [
        [90, "p90"],
        [50, "p50"],
        [10, "p10"],
      ] as const) {
        out[key] = await solveGoalMonteCarloAsync(
          base,
          inputs.goalTarget,
          pct,
          600,
          d => setInvProgress(Math.round(((done + d) / totalIter) * 100)),
          controller.signal,
        )
        done += 14
      }
      setMcInv(out)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
    } finally {
      setInvRunning(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass rounded-3xl p-5 sm:p-6 space-y-6">
        <div>
          <SectionHeader as="h2" level="page" icon={Target} title={tr("Objectif d'épargne")} className="mb-2" />
          <p className="text-xs text-text-muted leading-relaxed max-w-xl">
            {tr(
              "Vous savez combien vous voulez avoir plus tard : l'app calcule combien épargner chaque mois (et quel rendement de la bourse viser) pour y arriver.",
            )}
          </p>
        </div>

        {/* Synchronisation avec le scénario principal (paquet 2) : une seule
            source de vérité — l'objectif inversé part des MÊMES hypothèses
            que le Simulateur (capital, durée, rendement du scénario, épargne). */}
        <Toggle
          checked={inputs.goalSync}
          onChange={v => updateInput("goalSync", v)}
          label={tr("Utiliser mon scénario principal")}
          sub={tr(
            "Reprend le capital, la durée, l'épargne et le rendement (scénario courant) de l'onglet Simulateur — l'objectif n'est plus une calculatrice séparée.",
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <SliderInput
            label={tr("Objectif (€)")}
            id="goal-target"
            value={inputs.goalTarget}
            min={10000}
            max={2000000}
            step={10000}
            color="var(--color-primary)"
            onChange={v => updateInput("goalTarget", v)}
          />
          {eff ? (
            /* Mode synchronisé : les hypothèses viennent du Simulateur — une
                carte récapitulative à la place des 4 curseurs indépendants. */
            <div className="rounded-xl bg-primary/8 border border-primary/20 p-3.5 text-[10px] leading-relaxed text-text-dim self-end">
              <div className="flex items-center gap-1.5 mb-1.5">
                <RefreshCw size={11} className="text-primary shrink-0" />
                <span className="font-bold text-text">{tr("Synchronisé avec le Simulateur")}</span>
              </div>
              {tr("Capital :")} <strong className="mono text-text">{fmtCurrency(inputs.capitalInitial)}</strong> ·{" "}
              {tr("Durée :")} <strong className="mono text-text">{tr("{n} ans", { n: inputs.duration })}</strong> ·{" "}
              {tr("Épargne :")} <strong className="mono text-text">{fmtCurrency(inputs.monthlyPayment)}/mois</strong> ·{" "}
              {tr("Rendement :")} <strong className="mono text-text">{fmtRate(scenarioRate * 100)}/an</strong>{" "}
              {tr("(scénario")} {tr(SCENARIO_LABELS[inputs.returnScenario])})
            </div>
          ) : (
            <>
              <SliderInput
                label={tr("Capital de départ (€)")}
                id="goal-capital"
                value={inputs.goalCapital}
                min={0}
                max={200000}
                step={1000}
                color="var(--color-primary)"
                onChange={v => updateInput("goalCapital", v)}
              />
              <SliderInput
                label={tr("Durée (années)")}
                id="goal-duration"
                value={inputs.goalDuration}
                min={1}
                max={50}
                step={1}
                color="var(--color-primary)"
                onChange={v => updateInput("goalDuration", v)}
              />
              <SliderInput
                label={tr("Rendement de la bourse (% brut)")}
                id="goal-rate"
                value={inputs.goalAnnualReturn * 100}
                min={0.1}
                max={20}
                step={0.1}
                color="var(--color-primary)"
                hardMin={-95}
                hardMax={1000}
                allowNegative
                help={tr(
                  "Rendement BRUT = rendement réel du marché avant inflation (ex. MSCI World : 8,22 %/an brut — scénario Central par défaut). L'inflation est déduite automatiquement par le simulateur, QUE l'affichage soit en euros courants ou en euros d'aujourd'hui — ne saisissez jamais un taux déjà net d'inflation.",
                )}
                suffix={tr("Épargne de référence : {x}/mois", { x: fmtCurrency(inputs.goalPayment) })}
                onChange={v => updateInput("goalAnnualReturn", v / 100)}
              />
              <SliderInput
                label={tr("Épargne mensuelle de référence (€)")}
                id="goal-payment"
                value={inputs.goalPayment}
                min={0}
                max={10000}
                step={50}
                color="var(--color-primary)"
                suffix={tr("utilisée pour calculer le rendement nécessaire")}
                onChange={v => updateInput("goalPayment", v)}
              />
            </>
          )}
        </div>

        {/* Cohérence avec le reste de l'app : rendement TOUJOURS brut, référence
            alignée sur le scénario CENTRAL (8,22 %/an composé), fourchette
            recommandée 7-12 %/an. Ce curseur ne sert QU'à cet onglet (le
            Simulateur/MC/Rente rejouent l'historique réel, Option A). */}
        <p className="text-[10px] text-text-dim leading-snug -mt-4">
          {tr("Rendement")} <strong className="text-text">{tr("brut")}</strong> {tr("(avant inflation) — référence :")}{" "}
          <strong className="text-text">
            {tr("{rate} % brut (scénario Central)", {
              rate: fmtDecimal(DEFAULT_INPUTS.goalAnnualReturn * 100, 2),
            })}
          </strong>{" "}
          {tr(" · taux recommandé :")}{" "}
          {tr("{min} à {max} %/an", {
            min: (RECOMMENDED_RETURN_MIN * 100).toFixed(0),
            max: (RECOMMENDED_RETURN_MAX * 100).toFixed(0),
          })}
        </p>

        {/* Résultats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 border-2 border-primary/40 bg-primary/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
              <PiggyBank size={12} aria-hidden /> {tr("Épargne mensuelle nécessaire")}
            </p>
            <p className="mono text-3xl font-extrabold text-text mb-2">
              {goalResult.pmtPerMonth !== null && goalResult.pmtPerMonth > 0
                ? fmtCurrency(goalResult.pmtPerMonth)
                : "—"}
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {tr("Pour atteindre")} <strong className="text-text">{fmtCurrency(inputs.goalTarget)}</strong> {tr("en")}{" "}
              <strong className="text-text">{tr("{n} ans", { n: effDuration })}</strong> {tr("avec un rendement de")}{" "}
              <strong className="text-text">{fmtRate(effRate * 100)}</strong>/an
              {effCapital > 0 && ` ${tr("et un capital de départ de")} ${fmtCurrency(effCapital)}`}
              {inputs.goalSync && ` ${tr("(hypothèses du scénario principal)")}`}.
            </p>
            {goalResult.pmtPerMonth !== null && goalResult.pmtPerMonth > 0 && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-[11px] text-text-muted ${darkMode ? "bg-white/5" : "bg-black/5"}`}
              >
                {tr("Total épargné :")}{" "}
                <strong className="text-text">{fmtCurrency(goalResult.totalInvested ?? 0)}</strong> —{" "}
                {tr("Gains de la bourse :")}{" "}
                <strong className="text-primary">{fmtCurrency(goalResult.totalGains ?? 0)}</strong>
              </div>
            )}
          </div>

          <div className="card-subtle rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} aria-hidden />{" "}
              {tr("Rendement nécessaire ({x}/mois d'épargne)", { x: fmtCurrency(effPayment) })}
            </p>
            <p className="mono text-3xl font-extrabold text-text mb-2">
              {goalResult.requiredRate !== null ? `${fmtDecimal(goalResult.requiredRate, 2)}%` : tr("Impossible")}
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {tr("Rendement de la bourse nécessaire chaque année pour obtenir")}{" "}
              <strong className="text-text">{fmtCurrency(inputs.goalTarget)}</strong> {tr("en")}{" "}
              <strong className="text-text">{tr("{n} ans", { n: effDuration })}</strong> {tr("en épargnant")}{" "}
              <strong className="text-text">{fmtCurrency(effPayment)}/mois</strong>
              {effCapital > 0 && ` ${tr("avec un capital initial de")} ${fmtCurrency(effCapital)}`}.
            </p>
            <div className={`mt-3 flex items-center gap-2 p-2.5 rounded-lg ${darkMode ? "bg-white/5" : "bg-black/5"}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: difficulty.tone }} />
              <span className="text-[11px] text-text-muted">{tr(difficulty.label)}</span>
            </div>
          </div>
        </div>

        {/* Progression */}
        <GoalProgress current={lastRow?.nominal ?? 0} target={inputs.goalTarget} />

        {/* Tableau comparatif */}
        <div className="glass rounded-2xl p-5 border border-border">
          <SectionHeader
            as="h3"
            level="card"
            icon={BarChart3}
            title={tr("Comparaison des scénarios")}
            sub={tr("objectif : {goal}", { goal: fmtCurrency(inputs.goalTarget) })}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { label: tr("Rendement/an"), align: "right" },
                    { label: tr("Épargne /mois"), align: "right" },
                    { label: tr("Total épargné"), align: "right" },
                    { label: tr("Gains de la bourse"), align: "right" },
                    { label: tr("Part de l'objectif épargnée"), align: "left" },
                  ].map(h => (
                    <th
                      key={h.label}
                      className={`text-[10px] font-bold uppercase tracking-wider text-text-dim py-2.5 px-3 whitespace-nowrap ${
                        h.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Le taux COURANT du curseur est toujours dans le tableau avec
                    sa valeur exacte (10,07 % et pas « 10 % ») : le montant de
                    la carte principale se retrouve à l'identique dans la ligne
                    correspondante (audit v5.6.3 — avant, deux chiffres pour la
                    même étiquette). Les 3 taux de scénario (prudent / central /
                    optimiste du Simulateur) sont inclus avec un badge (paquet 2). */}
                {(() => {
                  // Déduplication sur la valeur ARRONDIE (audit) : 10,07 (taux
                  // courant) et 10,0655 (moyenne arithmétique) s'affichaient en
                  // deux lignes « 10,07 % ← Optimiste » avec des montants
                  // différents — une seule ligne par taux affiché. FIRST WINS :
                  // le taux COURANT est inséré en premier, c'est SA valeur
                  // exacte qui reste (le montant de la carte principale se
                  // retrouve à l'identique dans la ligne correspondante).
                  const seen = new Set<string>()
                  const dedup: number[] = []
                  for (const rr of [(eff?.goalAnnualReturn ?? inputs.goalAnnualReturn) * 100]
                    .concat(COMPARISON_RATES)
                    .concat(scenarioRates)) {
                    const key = rr.toFixed(2)
                    if (!seen.has(key)) {
                      seen.add(key)
                      dedup.push(rr)
                    }
                  }
                  return dedup.sort((a, b) => a - b)
                })().map(rr => {
                  const res = solveGoal({ ...inputs, goalAnnualReturn: rr / 100 })
                  if (res.pmtPerMonth === null || res.pmtPerMonth <= 0) return null
                  const isCurrent = Math.abs((eff?.goalAnnualReturn ?? inputs.goalAnnualReturn) * 100 - rr) < 0.01
                  const scenarioId = (Object.keys(SCENARIO_LABELS) as (keyof typeof SCENARIO_LABELS)[]).find(
                    s =>
                      Math.abs(
                        historical[
                          s === "prudent" ? "netReturn" : s === "optimiste" ? "avgReturn" : "compoundedReturn"
                        ] *
                          100 -
                          rr,
                      ) < 0.01,
                  )
                  const gains = res.totalGains ?? 0
                  const totalPaid = res.totalInvested ?? 0
                  return (
                    <tr
                      key={rr}
                      className={cn(
                        "border-b border-border/30",
                        isCurrent && "bg-primary/10",
                        !isCurrent && "odd:bg-glass/40",
                      )}
                    >
                      <td className={cn("py-2.5 px-3 font-bold text-right", isCurrent ? "text-primary" : "text-text")}>
                        {fmtRate(rr)}
                        {isCurrent && " ←"}
                        {scenarioId && (
                          <span
                            className={cn(
                              "ml-1.5 text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded align-middle",
                              scenarioId === inputs.returnScenario
                                ? "bg-primary/15 text-primary"
                                : "bg-glass text-text-dim",
                            )}
                          >
                            {tr(SCENARIO_LABELS[scenarioId])}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 mono text-primary font-semibold text-right">
                        {fmtCurrency(res.pmtPerMonth)}
                      </td>
                      <td className="py-2.5 px-3 mono text-text text-right">{fmtCurrency(totalPaid)}</td>
                      <td
                        className={cn(
                          "py-2.5 px-3 mono font-semibold text-right",
                          gains > 0 ? "text-primary" : gains < 0 ? "text-danger" : "text-text-dim",
                        )}
                      >
                        {gains > 0 ? "+" : ""}
                        {fmtCurrency(gains)}
                      </td>
                      <td className="py-2.5 px-3 text-text-dim">
                        {tr("{pct}% de l'objectif provient de votre épargne", {
                          pct: inputs.goalTarget > 0 ? Math.round((totalPaid / inputs.goalTarget) * 100) : 0,
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inversion Monte-Carlo (paquet 2) : le versement qui permet
            d'atteindre l'objectif selon la période de bourse — calculé sur le
            scénario PRINCIPAL (capital, durée, frais, fiscalité). */}
        <div className="glass rounded-2xl p-5 border border-border">
          <SectionHeader
            as="h3"
            level="card"
            icon={Dices}
            title={tr("Versement nécessaire selon la bourse (Monte Carlo)")}
            sub={tr("objectif : {goal} — {n} ans, capital {capital}", {
              goal: fmtCurrency(inputs.goalTarget),
              n: inputs.duration,
              capital: fmtCurrency(inputs.capitalInitial),
            })}
          />
          <p className="text-[10px] text-text-dim leading-relaxed max-w-2xl">
            {tr(
              "Combien faut-il épargner chaque mois pour atteindre l'objectif selon la période de bourse ? Le calcul rejoue",
            )}{" "}
            {600} {tr("scénarios rééchantillonnés à chaque itération, avec")}{" "}
            <strong className="text-text">{tr("vos")}</strong> {tr("frais,")}{" "}
            <strong className="text-text">{tr("votre")}</strong> {tr("fiscalité et")}{" "}
            <strong className="text-text">{tr("votre")}</strong> {tr("capital de départ")} (
            {fmtCurrency(inputs.capitalInitial)}).
          </p>
          {!mcInv && (
            <button
              type="button"
              onClick={handleRunInv}
              disabled={invRunning}
              className={cn(
                "mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors",
                invRunning
                  ? "bg-text-dim/20 text-text-dim cursor-not-allowed"
                  : "btn-shine bg-gradient-to-r from-primary to-primary-light btn-gold-text shadow-gold hover:from-primary-light hover:to-primary",
              )}
            >
              <Dices size={13} />{" "}
              {invRunning
                ? tr("Calcul... {progress}%", { progress: invProgress })
                : tr("Calculer le versement pour P10 / P50 / P90")}
            </button>
          )}
          {invRunning && (
            <div className="mt-3 space-y-1.5 max-w-md">
              <div className="h-1.5 rounded-full bg-text-dim/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-200"
                  style={{ width: `${invProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-text-dim mono">
                {tr("{progress}% — 3 percentiles × 14 itérations (P90 → P50 → P10)", { progress: invProgress })}
              </p>
            </div>
          )}
          {mcInv && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
              {[
                {
                  key: "p90" as const,
                  label: tr("Bonne période (P90)"),
                  value: mcInv.p90,
                  tone: "var(--color-success)",
                  desc: tr("1 cas sur 10 fait encore mieux — le minimum si la bourse vous sourit"),
                },
                {
                  key: "p50" as const,
                  label: tr("Cas médian (P50)"),
                  value: mcInv.p50,
                  tone: "var(--color-primary)",
                  desc: tr("1 fois sur 2 mieux, 1 fois sur 2 moins bien — le versement honnête"),
                },
                {
                  key: "p10" as const,
                  label: tr("Période difficile (P10)"),
                  value: mcInv.p10,
                  tone: "var(--color-danger)",
                  desc: tr("1 cas sur 10 fait encore moins bien — pour réussir même dans les pires cas"),
                },
              ].map(card => (
                <div
                  key={card.key}
                  className="card-subtle rounded-2xl p-4"
                  style={{ borderColor: `color-mix(in srgb, ${card.tone} 30%, transparent)` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.tone }}>
                    {card.label}
                  </p>
                  <p className="mono text-lg font-bold text-text mt-1.5">
                    {fmtCurrency(card.value)} {tr("/mois")}
                  </p>
                  <p className="text-[10px] text-text-dim mt-1.5 leading-snug">{card.desc}</p>
                  {/* Audit : « P90 à 0 € » n'est pas une erreur — le capital de
                      départ suffit déjà dans ce scénario favorable. */}
                  {card.value === 0 && (
                    <p className="text-[9px] text-success mt-1.5 leading-snug">
                      ✓ {tr("Votre capital de départ suffit déjà dans ce scénario — aucun versement nécessaire.")}
                    </p>
                  )}
                </div>
              ))}
              <div className="sm:col-span-3 rounded-xl bg-primary/8 border border-primary/20 px-3.5 py-2.5 flex items-start gap-2">
                <AlertTriangle size={12} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-dim leading-relaxed">
                  {tr("Le versement")} <strong className="text-text">P50</strong>{" "}
                  {tr(
                    "est votre meilleure cible : dans la moitié des scénarios il suffit, dans l'autre moitié il manque un peu. Le versement",
                  )}{" "}
                  <strong className="text-text">P10</strong>{" "}
                  {tr(
                    "garantit l'objectif même dans les pires périodes — c'est le « budget sécurité ». Recalculez après avoir changé vos paramètres.",
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
