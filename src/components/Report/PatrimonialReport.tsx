import { useMemo } from "react"
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  computeKPIs,
  computeTaxBreakdown,
  deflationFactor,
  ENVELOPE_CONFIGS,
  fmtDecimal,
  getHistoricalDataset,
} from "../../engine"
import { useLang } from "../../i18n"
import { buildShareUrl } from "../../utils/urlState"
import { buildEquitySeries } from "../Charts/EquityChart"
import type { SimulationInputs, YearRow } from "../../types"

interface PatrimonialReportProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

const SCENARIO_LABELS = { prudent: "Prudent", central: "Central", optimiste: "Optimiste" } as const

const GOLD = "#b8960f"
const GRAY = "#9ca3af"
const DARK = "#1f2937"
const REAL = "#334155"

const fmtRate = (r: number, lang: "fr" | "en" = "fr"): string => `${fmtDecimal(r * 100, 2, lang)} %`

/**
 * Rapport patrimonial de synthèse — la vue « Enregistrer en PDF ».
 *
 * Imprimable et autonome : contrairement à l'app (tokens clair/sombre), ce
 * rapport utilise UNIQUEMENT une palette claire figée (Tailwind + hex) pour
 * rendre exactement pareil sur papier et à l'écran, quel que soit le thème
 * actif. Il est monté à la demande (au clic « Rapport PDF »), rendu hors-écran
 * (794 px ≈ A4 à 96 dpi, pour que Recharts mesure correctement son conteneur),
 * puis seul affiché à l'impression via la classe `.report-print-only`
 * (cf. index.css) — le shell de l'app est masqué (`@media print`).
 *
 * Contenu : page de garde + héro du résultat, graphique de projection,
 * fiscalité, détail année par année et méthodologie — le parcours bancaire
 * promis (PISTES V6.1 — idée 2 validée).
 */
export function PatrimonialReport({ rows, inputs }: PatrimonialReportProps) {
  const { tr, lang, fmtCurrency, fmtCompact } = useLang()
  const lastRow = rows[rows.length - 1]
  const kpis = useMemo(() => computeKPIs(rows, inputs), [rows, inputs])
  const historical = getHistoricalDataset(inputs.historicalIndex)
  // Graphique : échelle EUROS COURANTS (ce qui sera réellement sur le compte),
  // avec la courbe du pouvoir d'achat en pointillés — le rapport montre les
  // deux, comme toute l'app. (useMemo placé AVANT l'early-return : les hooks
  // doivent être appelés dans le même ordre à chaque rendu — règle des hooks.)
  const chartData = useMemo(() => {
    const series = buildEquitySeries(rows, false, inputs.envelope)
    return rows.map((r, i) => ({ ...series[i], réel: Math.round(r.real) }))
  }, [rows, inputs.envelope])
  if (!lastRow) return null

  const { showReal, envelope } = inputs
  const endYear = lastRow.date.split(" ")[1]?.replace(".", "")
  const envelopeCfg = ENVELOPE_CONFIGS.find(e => e.id === envelope)
  const scenarioRate =
    inputs.returnScenario === "prudent"
      ? historical.netReturn
      : inputs.returnScenario === "optimiste"
        ? historical.avgReturn
        : historical.compoundedReturn

  // Même décomposition que le héro de l'app : l'échelle mise en avant suit le
  // toggle « Euros d'aujourd'hui », l'autre échelle reste affichée.
  const total = showReal ? lastRow.real : lastRow.nominal
  const invested = showReal ? lastRow.investedReal : lastRow.investedNom
  const growth = Math.max(0, total - invested)
  const growthPct = total > 0 ? (growth / total) * 100 : 0
  const investedPct = total > 0 ? Math.max(0, 100 - growthPct) : 100
  const ratio = invested > 0 ? total / invested : null
  const secondary = showReal
    ? { amount: lastRow.nominal, label: tr("sur le compte") + (endYear ? ` ${tr("en")} ${endYear}` : "") }
    : { amount: lastRow.real, label: tr("en euros d'aujourd'hui") }

  // Fiscalité : MÊME appel que le FiscalPanel de l'app (une seule doctrine).
  const taxInfo = computeTaxBreakdown(
    lastRow.interestsNom,
    inputs.envelope,
    inputs.envelope === "pea"
      ? inputs.peaYearsHeld
      : inputs.envelope === "av"
        ? inputs.avYearsHeld + inputs.duration
        : inputs.duration,
    inputs.taxCouple,
    lastRow.investedNom,
    { tmi: inputs.tmi, ctoTaxMode: inputs.ctoTaxMode, taxYear: inputs.taxYear },
  )
  const exitTax = Math.max(0, taxInfo.totalTax)
  const taxLines: { label: string; value: number; strong?: boolean }[] = [
    { label: "Gains avant impôts (brut)", value: taxInfo.grossGains },
  ]
  if (taxInfo.contributionsTax > 0)
    taxLines.push({ label: "Impôt sur versements PER déduits", value: taxInfo.contributionsTax })
  if (taxInfo.socialCharges > 0) taxLines.push({ label: "Cotisations sociales", value: taxInfo.socialCharges })
  if (taxInfo.incomeTax > 0) taxLines.push({ label: "Impôt sur le revenu", value: taxInfo.incomeTax })
  taxLines.push({ label: "Total impôt théorique", value: exitTax, strong: true })
  taxLines.push({ label: "Gains après impôts", value: taxInfo.netGains, strong: true })

  const generatedAt = new Date()
  const locale = lang === "en" ? "en-US" : "fr-FR"
  const dateLabel = generatedAt.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
  const timeLabel = generatedAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })

  const params: { label: string; value: string }[] = [
    { label: tr("Capital de départ"), value: fmtCurrency(inputs.capitalInitial) },
    { label: tr("Épargne mensuelle"), value: `${fmtCurrency(inputs.monthlyPayment)}/${tr("mois")}` },
    { label: tr("Durée"), value: `${inputs.duration} ${tr("ans")}` },
    { label: tr("Enveloppe"), value: envelopeCfg?.name ?? "—" },
    {
      label: tr("Scénario de rendement"),
      value: `${tr(SCENARIO_LABELS[inputs.returnScenario])} · ${fmtRate(scenarioRate, lang)} ${tr("brut/an")}`,
    },
    { label: tr("Inflation"), value: fmtRate(inputs.inflation, lang) },
  ]

  // MÊMES DONNÉES que SummaryStats (une seule doctrine) : l'app les montre en
  // panneau titré « Votre capital en détail », le rapport en grille de cartes
  // imprimables — même échelle mise en avant (grand chiffre), l'autre en
  // sous-titre. Le facteur de déflation est le helper partagé du moteur.
  const factor = deflationFactor(lastRow)
  const netAfterTax = lastRow.taxNet
  const taxAmount = Math.max(0, lastRow.nominal - lastRow.taxNet)
  const kpiCards: { label: string; value: string; sub: string; tone: string; subStrong?: boolean }[] = [
    {
      label: tr(showReal ? "Valeur réelle finale" : "Valeur brute finale"),
      value: fmtCurrency(showReal ? lastRow.real : lastRow.nominal),
      sub: fmtCurrency(showReal ? lastRow.nominal : lastRow.real),
      tone: GOLD,
    },
    {
      label: tr("Net fiscal ({env})", { env: envelopeCfg?.shortLabel ?? "BRUT" }),
      value: fmtCurrency(showReal ? netAfterTax * factor : netAfterTax),
      sub: fmtCurrency(showReal ? netAfterTax : netAfterTax * factor),
      tone: GOLD,
    },
    {
      label: tr("Impôt théorique"),
      value: fmtCurrency(showReal ? taxAmount * factor : taxAmount),
      sub: tr("à la liquidation"),
      tone: "#b91c1c",
    },
    {
      label: tr("Total épargné"),
      value: fmtCurrency(showReal ? lastRow.investedReal : lastRow.investedNom),
      // Gains en or (même traitement que le panneau de l'app v6.9.0) : la
      // statistique la plus motivante n'est plus une légende grise.
      sub: `${tr("Gains de la bourse :")} +${fmtCurrency(
        Math.max(
          0,
          (showReal ? lastRow.real : lastRow.nominal) - (showReal ? lastRow.investedReal : lastRow.investedNom),
        ),
      )}`,
      tone: GRAY,
      subStrong: true,
    },
  ]

  return (
    <div className="report-print-only" aria-hidden="true">
      {/* ============ PAGE DE GARDE ============ */}
      <section className="report-page relative bg-white text-gray-900 p-10">
        <div className="flex items-center justify-between border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#e8d5a3] via-[#d4af37] to-[#b8960f] flex items-center justify-center text-xs font-extrabold text-white">
              SP
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-tight">
                SNOWBALL <span className="text-[#b8960f]">PRO</span>
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-[0.22em]">{tr("Simulateur patrimonial")}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-right leading-snug">
            {tr("Rapport généré le")} {dateLabel} {tr("à")} {timeLabel}
            <br />
            {tr("Simulation non contractuelle")}
          </p>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8960f] mt-10">
          {tr("Rapport patrimonial de synthèse")}
        </p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight mt-1">{tr("Votre patrimoine estimé")}</h2>

        {/* Héro — le « nombre magique » */}
        <p className="font-mono text-5xl font-extrabold tracking-tight mt-8 leading-none">{fmtCurrency(total)}</p>
        <p className="text-xs text-gray-500 mt-2">
          {showReal ? tr("en euros d'aujourd'hui (pouvoir d'achat)") : secondary.label} —{" "}
          <span className="text-gray-400">
            {fmtCurrency(secondary.amount)} {secondary.label}
          </span>
        </p>

        {/* Décomposition épargné / croissance */}
        {total > 0 && (
          <div className="mt-8">
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
              <div className="h-full" style={{ width: `${investedPct}%`, background: GRAY }} />
              {growth > 0 && <div className="h-full" style={{ width: `${growthPct}%`, background: GOLD }} />}
            </div>
            <div className="flex items-center justify-between gap-3 mt-2.5 text-[11px]">
              <span className="text-gray-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: GRAY }} />
                {tr("Épargné :")} <strong className="text-gray-900 font-mono">{fmtCurrency(invested)}</strong>
              </span>
              {growth > 0 && (
                <span className="text-gray-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: GOLD }} />
                  {tr("Croissance :")} <strong className="text-gray-900 font-mono">{fmtCurrency(growth)}</strong>
                </span>
              )}
            </div>
            {growth > 0 && ratio && (
              <p className="text-xs text-gray-600 mt-3">
                {tr("La croissance de la bourse représente")} <strong>{growthPct.toFixed(0)} %</strong>{" "}
                {tr("de votre capital final — votre épargne est multipliée par")}{" "}
                <strong>~{fmtDecimal(ratio, 1, lang)}</strong>.
              </p>
            )}
          </div>
        )}

        {/* Paramètres clés */}
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mt-10 mb-3">
          {tr("Paramètres de la simulation")}
        </h3>
        <div className="grid grid-cols-3 gap-x-6 gap-y-3">
          {params.map(p => (
            <div key={p.label} className="border-l-2 pl-3" style={{ borderColor: GOLD }}>
              <p className="text-[9px] uppercase tracking-wider text-gray-400">{p.label}</p>
              <p className="text-xs font-bold text-gray-900 mt-0.5">{p.value}</p>
            </div>
          ))}
        </div>

        <p className="absolute bottom-0 left-0 right-0 text-[9px] text-gray-400 text-center py-4">
          {tr("Snowball Pro — snowball-pro.vercel.app · Données 100 % locales, aucun chiffre ne quitte votre appareil")}
        </p>
      </section>

      {/* ============ SYNTHÈSE + PROJECTION + FISCALITÉ ============ */}
      <section className="bg-white text-gray-900 p-10">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b8960f]">{tr("Synthèse")}</p>
            <h2 className="font-display text-xl font-extrabold tracking-tight mt-0.5">
              {tr("Projection sur {n} ans", { n: inputs.duration })}
            </h2>
          </div>
          <p className="text-[10px] text-gray-400">
            {endYear ? tr("Projection jusqu'en {year}", { year: endYear }) : ""} · {tr("scénario")}{" "}
            {tr(SCENARIO_LABELS[inputs.returnScenario])}
          </p>
        </div>

        {/* Cartes clés */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {kpiCards.map(card => (
            <div key={card.label} className="rounded-xl border border-gray-200 p-4">
              <p className="text-[9px] uppercase tracking-wider text-gray-400">{card.label}</p>
              <p className="font-mono text-lg font-extrabold mt-1.5" style={{ color: card.tone }}>
                {card.value}
              </p>
              <p
                className={`text-[9px] mt-1 ${card.subStrong ? "font-semibold" : "text-gray-400"}`}
                style={card.subStrong ? { color: GOLD } : undefined}
              >
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Rendements mesurés */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: tr("Rendement net / an (XIRR)"), value: `${fmtDecimal(kpis.xirr, 2, lang)} %` },
            { label: tr("Rendement réel / an"), value: `${fmtDecimal(kpis.realReturn, 2, lang)} %` },
            { label: tr("Capital multiplié par"), value: `× ${fmtDecimal(kpis.capitalMultiple, 1, lang)}` },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5 flex items-center justify-between gap-3"
            >
              <p className="text-[9px] uppercase tracking-wider text-gray-400">{s.label}</p>
              <p className="font-mono text-sm font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Graphique de projection */}
        <div className="mt-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
            {tr("Projection de votre capital (euros courants)")}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="report-grad-investi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GRAY} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={GRAY} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="report-grad-gains" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: DARK, fontSize: 10 }}
                  interval="preserveEnd"
                  minTickGap={28}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: DARK, fontSize: 10 }}
                  tickFormatter={(v: number) => fmtCompact(v)}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                        {payload.map((entry, i) => (
                          <p key={i} className="flex items-center justify-between gap-4 text-[11px] py-0.5">
                            <span className="text-gray-500">{entry.name}</span>
                            <strong className="font-mono text-gray-900">{fmtCurrency(entry.value as number)}</strong>
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="investi"
                  name={tr("Argent épargné")}
                  stackId="1"
                  stroke={GRAY}
                  strokeWidth={2}
                  fill="url(#report-grad-investi)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="gains"
                  name={tr("Gains (bourse)")}
                  stackId="1"
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#report-grad-gains)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="réel"
                  name={tr("Pouvoir d'achat")}
                  stroke={REAL}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: GRAY }} />{" "}
              {tr("Argent épargné")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: GOLD }} />{" "}
              {tr("Gains (bourse)")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0 border-t-2 border-dashed inline-block" style={{ borderColor: REAL }} />{" "}
              {tr("Pouvoir d'achat")}
            </span>
          </div>
        </div>

        {/* Fiscalité */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
              {tr("Fiscalité — {env}", { env: envelopeCfg?.name ?? "CTO" })}
            </h3>
            <div className="rounded-xl border border-gray-200 p-4 space-y-1.5">
              {taxLines.map(line => (
                <div key={line.label} className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-gray-600">{line.label}</span>
                  <span className={`font-mono text-xs font-semibold text-gray-900 ${line.strong ? "text-sm" : ""}`}>
                    {fmtCurrency(line.value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{tr("Part des gains prise par les impôts")}</span>
                <span className="font-mono text-xs font-bold text-[#b91c1c]">
                  {fmtDecimal(
                    (exitTax / Math.max(1, taxInfo.grossGains + (taxInfo.taxableContributions ?? 0))) * 100,
                    1,
                  )}
                  %
                </span>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-2 leading-snug">
              {tr(
                "Estimation : ces impôts supposent une liquidation totale aujourd'hui. Les gains latents ne sont taxés qu'à la revente réelle.",
              )}
            </p>
          </div>

          {/* Détail année par année */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
              {tr("Détail année par année")}
            </h3>
            {/* Pas de max-height : le rapport est invisible à l'écran et la
                table DOIT s'imprimer intégralement (un max-h clipperait le
                détail annuel dans le PDF — trouvé en revue adverse). */}
            <div className="report-table rounded-xl border border-gray-200">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-[9px] uppercase tracking-wider text-gray-400">
                    <th className="px-2.5 py-2 font-bold">{tr("Année")}</th>
                    <th className="px-2.5 py-2 font-bold text-right">{tr("Versé")}</th>
                    <th className="px-2.5 py-2 font-bold text-right">{tr("Intérêts")}</th>
                    <th className="px-2.5 py-2 font-bold text-right">{tr("Capital (€)")}</th>
                    <th className="px-2.5 py-2 font-bold text-right">{tr("Pouvoir d'achat")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.year} className="border-t border-gray-100">
                      <td className="px-2.5 py-1.5 font-semibold text-gray-700">{r.year}</td>
                      <td className="px-2.5 py-1.5 font-mono text-right text-gray-600">{fmtCompact(r.investedNom)}</td>
                      <td className="px-2.5 py-1.5 font-mono text-right text-gray-600">{fmtCompact(r.interestsNom)}</td>
                      <td className="px-2.5 py-1.5 font-mono font-bold text-right text-gray-900">
                        {fmtCompact(r.nominal)}
                      </td>
                      <td className="px-2.5 py-1.5 font-mono text-right text-gray-500">{fmtCompact(r.real)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Méthodologie + mentions */}
        <div className="mt-10 rounded-xl bg-gray-50 border border-gray-100 p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">{tr("Méthodologie")}</h3>
          <ul className="text-[10px] text-gray-600 space-y-1.5 leading-relaxed">
            <li>
              • <strong className="text-gray-900">{tr("100 ans d'histoire boursière réelle")}</strong> (S&amp;P 500
              1926–1969 + MSCI World 1970–2025). {tr("La projection applique le scénario")}{" "}
              <strong className="text-gray-900">{tr(SCENARIO_LABELS[inputs.returnScenario])}</strong> :{" "}
              <strong className="text-gray-900">
                {fmtRate(scenarioRate, lang)} {tr("brut/an")}
              </strong>{" "}
              {tr("(courbe lissée, sans hasard).")}
            </li>
            <li>
              • <strong className="text-gray-900">{tr("Fiscalité française appliquée")}</strong> ({" "}
              {envelopeCfg?.name ?? "CTO"}) :{" "}
              {tr("prélèvements sociaux, PFU ou barème progressif, abattements — règles 2026.")}
            </li>
            <li>
              •{" "}
              <strong className="text-gray-900">
                {tr("Inflation de {rate}/an", { rate: fmtRate(inputs.inflation, lang) })}
              </strong>{" "}
              {tr(
                "retirée pour l'échelle « euros d'aujourd'hui » (formule de Fisher, jamais une simple soustraction).",
              )}
            </li>
            <li>
              • <strong className="text-gray-900">{tr("Robustesse du plan")}</strong> : {tr("jusqu'à")}{" "}
              {inputs.mcRuns.toLocaleString(locale)} {tr("scénarios Monte Carlo rééchantillonnés")} ({" "}
              {tr("onglet « Robustesse de votre plan »")}){" "}
              {tr("et garde-fous dynamiques (Guyton–Klinger) pour la rente.")}
            </li>
          </ul>
          <p className="text-[9px] text-gray-400 mt-3 border-t border-gray-200 pt-3 leading-snug">
            {tr(
              "Simulation indicative et non contractuelle — ne constitue pas un conseil financier. Les résultats dépendent des hypothèses saisies (capital, épargne, durée, frais, scénario). Données 100 % locales.",
            )}
          </p>
        </div>

        {/* Pied de rapport (boucle virale — v6.13.0) : chaque rapport imprimé
            ou exporté devient une publicité pour l'outil. Le lien de scénario
            permet de reproduire le calcul d'un clic. */}
        <div className="mt-8 pt-5 border-t border-gray-200 flex items-start justify-between gap-6 flex-wrap">
          <div className="text-[9px] text-gray-500 leading-snug">
            <p className="font-display text-[11px] font-extrabold tracking-tight">
              SNOWBALL <span className="text-[#b8960f]">PRO</span>
            </p>
            <p className="mt-1 max-w-[280px]">
              {tr("Créé avec Snowball Pro — simulez gratuitement votre propre projet d'épargne :")}
            </p>
            <p className="font-mono mt-0.5">https://snowball-pro.vercel.app</p>
          </div>
          <div className="text-[9px] text-gray-500 max-w-[340px] leading-snug">
            <p className="font-bold text-gray-700 mb-1">{tr("Votre scénario partageable :")}</p>
            <p className="font-mono break-all">{buildShareUrl(inputs)}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
