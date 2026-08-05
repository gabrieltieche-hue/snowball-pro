import { Coins, HelpCircle, Landmark, Lightbulb, Percent, Settings2, TrendingUp } from "lucide-react"
import { HelpTip } from "../shared/HelpTip"
import { EnvelopeSelector } from "../Forms/EnvelopeSelector"
import { ExpenseForm } from "../Forms/ExpenseForm"
import { SnapshotPanel } from "./SnapshotPanel"
import { CollapsibleSection } from "../shared/CollapsibleSection"
import { SegmentedControl } from "../shared/SegmentedControl"
import { SliderInput } from "../shared/SliderInput"
import { Toggle } from "../shared/Toggle"
import { fmtCurrency, fmtTaxPercent, getHistoricalDataset, getTaxRules, pfuRate, validateInputs } from "../../engine"
import type { ValidationError } from "../../engine"
import type { SavedSnapshot, SimulationInputs, YearRow } from "../../types"

interface SidebarProps {
  inputs: SimulationInputs
  rows: YearRow[]
  scenarioLabel?: string
  snapshots: SavedSnapshot[]
  onSaveSnapshot: () => void
  onLoadSnapshot: (id: string) => void
  onRemoveSnapshot: (id: string) => void
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

export function Sidebar({
  inputs,
  rows,
  scenarioLabel,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onRemoveSnapshot,
  updateInput,
}: SidebarProps) {
  const lastRow = rows[rows.length - 1]
  // Les deux échelles sont TOUJOURS affichées côte à côte : le montant qui
  // sera sur le compte (euros courants) et son pouvoir d'achat en euros
  // d'aujourd'hui. Le toggle ne fait plus que choisir laquelle est mise en
  // avant — il ne cache plus jamais la valeur du compte (demande utilisateur).
  const displayNominal = lastRow ? lastRow.nominal : 0
  const displayReal = lastRow ? lastRow.real : 0
  const historical = getHistoricalDataset(inputs.historicalIndex)
  // Règles fiscales de l'année des inputs (défaut : année courante) — tous les
  // taux affichés ici en dérivent, aucun chiffre codé en dur (v6, taxRules.ts).
  const rules = getTaxRules(inputs.taxYear)

  const validationErrors = validateInputs(inputs)
  const fieldError = (field: keyof SimulationInputs): ValidationError | undefined =>
    validationErrors.find(e => e.field === field && e.severity === "error")
  const fieldWarning = (field: keyof SimulationInputs): ValidationError | undefined =>
    validationErrors.find(e => e.field === field && e.severity === "warning")
  return (
    <aside className="glass rounded-3xl p-5 sm:p-6 shadow-premium overflow-hidden">
      {/* I1 — plus de lg:sticky : la sidebar (2 200 px dépliée) dépassait la
          hauteur d'écran et épinglait ses sections basses sous le pli pendant
          tout le scroll. Elle suit désormais le document. */}
      {/* La marque vit dans l'en-tête global — ici, un simple repère de
          section + le badge de scénario en mode comparaison. */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">
          <span className="w-1 h-4 rounded-full bg-primary shrink-0" aria-hidden />
          Réglages
        </div>
        {scenarioLabel && (
          <span className="text-[10px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
            {scenarioLabel}
          </span>
        )}
      </div>

      {/* Bases */}
      <CollapsibleSection title="Votre épargne" icon={<Coins size={12} />}>
        <SliderInput
          label="Capital de départ (€)"
          id="capital-initial"
          value={inputs.capitalInitial}
          min={0}
          max={200000}
          step={1000}
          hardMin={0}
          hardMax={100000000}
          error={fieldError("capitalInitial")?.message}
          warning={fieldWarning("capitalInitial")?.message}
          onChange={v => updateInput("capitalInitial", v)}
        />
        <SliderInput
          label="Épargne mensuelle (€)"
          id="monthly-payment"
          value={inputs.monthlyPayment}
          min={0}
          max={10000}
          step={50}
          hardMin={0}
          hardMax={200000}
          error={fieldError("monthlyPayment")?.message}
          warning={fieldWarning("monthlyPayment")?.message}
          onChange={v => updateInput("monthlyPayment", v)}
        />
        {/* La carte « Rendement de la bourse » (échelle 10,07 → 8,22 → 5,99 et
            Fisher) a rejoint le panneau « Pourquoi ces chiffres ? » en bas de
            la sidebar (v6) : c'est un contenu pédagogique de qualité, mais il
            n'appartient plus au chemin de réglages — il s'ouvre à la demande. */}
        <SliderInput
          label="Durée (années)"
          id="duration"
          value={inputs.duration}
          min={1}
          max={50}
          step={1}
          hardMin={1}
          hardMax={80}
          error={fieldError("duration")?.message}
          warning={fieldWarning("duration")?.message}
          onChange={v => updateInput("duration", v)}
        />
      </CollapsibleSection>

      {/* Pourquoi ces chiffres ? — le contenu pédagogique (rendements,
          volatilité, Fisher) vit ici, replié par défaut (v6). Contenu intégral
          conservé depuis la carte « Rendement de la bourse » de la v5.7. */}
      <CollapsibleSection title="Pourquoi ces chiffres ?" icon={<HelpCircle size={12} />} defaultOpen={false}>
        <div className="rounded-xl border border-primary/25 bg-primary/8 px-3.5 py-3 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(212,175,55,0.14),transparent_60%)] pointer-events-none"
            aria-hidden
          />
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-primary shrink-0" />
            <span className="text-[11px] font-bold text-text leading-tight">Rendement de la bourse (MSCI World)</span>
          </div>
          {/* Les trois étages de l'échelle : chaque ligne déduit UNE chose. */}
          <dl className="mt-2 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[10px] text-text-muted">Brut (moyenne des années)</dt>
              <dd className="mono text-[11px] font-bold text-text">
                {(historical.avgReturn * 100).toFixed(2).replace(".", ",")} %/an
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-[10px] text-text-muted">Composé (krachs inclus)</dt>
              <dd className="mono text-[11px] font-bold text-text">
                {(historical.compoundedReturn * 100).toFixed(2).replace(".", ",")} %/an
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t border-primary/15 pt-1.5">
              <dt className="text-[10px] text-text-muted">Réel (après inflation 2,1 %)</dt>
              <dd className="mono text-[11px] font-extrabold text-primary">
                {(historical.netReturn * 100).toFixed(2).replace(".", ",")} %/an
              </dd>
            </div>
          </dl>
          <p className="text-[9.5px] text-text-muted mt-2 leading-relaxed">
            Pourquoi 10,07 % → 5,99 % ? Chaque ligne retire <strong className="text-text">une seule</strong> chose :{" "}
            <strong className="text-text">la volatilité</strong> (les mauvaises années -37 %, -33 %… réduisent le
            gain composé) puis <strong className="text-text">l'inflation</strong> (2,1 %/an). Le Simulateur applique
            la ligne 1 chaque année (courbe lissée, sans krachs) : son rendement réel est donc plus favorable que la
            référence historique — voir « Après inflation ».
          </p>
          <p className="text-[9px] text-text-dim mt-1.5 leading-relaxed border-t border-primary/10 pt-1.5">
            Pourquoi pas 6,12 % (8,22 − 2,1) ? C'est une approximation : la formule exacte (Fisher) est{" "}
            <span className="mono">(1 + 8,22 %) ÷ (1 + 2,1 %) − 1 = 5,99 %</span> — l'inflation rogne aussi vos gains,
            pas seulement votre capital de départ.
          </p>
        </div>
      </CollapsibleSection>

      {/* Paramètres avancés */}
      <CollapsibleSection title="Paramètres avancés" icon={<Settings2 size={12} />}>
        <SliderInput
          label="Augmentation de votre épargne (%/an)"
          id="indexation"
          value={inputs.indexation * 100}
          min={0}
          max={10}
          step={0.1}
          hardMin={0}
          hardMax={50}
          suffix="Votre épargne mensuelle augmente chaque année"
          error={fieldError("indexation")?.message}
          warning={fieldWarning("indexation")?.message}
          onChange={v => updateInput("indexation", v / 100)}
        />
        {/* Les 3 modes d'inflation (Personnalisée/Historique/Cyclique) ont été
            supprimés : l'inflation est toujours le taux personnalisé du
            curseur (défaut 2,1 %/an), librement modifiable. */}
        <SliderInput
          label="Inflation annuelle (%)"
          id="inflation"
          value={inputs.inflation * 100}
          min={0}
          max={10}
          step={0.1}
          hardMin={-10}
          hardMax={100}
          allowNegative
          suffix="défaut 2,1 %/an — taux personnalisé"
          error={fieldError("inflation")?.message}
          warning={fieldWarning("inflation")?.message}
          onChange={v => updateInput("inflation", v / 100)}
        />
        <SliderInput
          label="Simulations Monte Carlo"
          id="mc-runs"
          value={inputs.mcRuns}
          min={100}
          max={10000}
          step={100}
          hardMin={100}
          hardMax={10000}
          suffix="nombre de scénarios testés (Monte Carlo & Rente)"
          error={fieldError("mcRuns")?.message}
          warning={fieldWarning("mcRuns")?.message}
          onChange={v => updateInput("mcRuns", Math.round(v))}
        />
        <Toggle
          checked={inputs.showReal}
          onChange={v => updateInput("showReal", v)}
          label="Euros d'aujourd'hui"
          sub="Met en avant le pouvoir d'achat — la valeur sur le compte reste affichée partout"
        />
      </CollapsibleSection>

      {/* Enveloppe fiscale */}
      <CollapsibleSection title="Compte d'investissement" icon={<Landmark size={12} />}>
        <EnvelopeSelector value={inputs.envelope} onChange={v => updateInput("envelope", v)} />
        {inputs.envelope === "pea" && (
          <div className="mt-3 animate-fade-in">
            <SliderInput
              label="Années de détention du PEA"
              id="pea-years"
              value={inputs.peaYearsHeld}
              min={0}
              max={30}
              step={1}
              hardMin={0}
              hardMax={50}
              suffix={
                inputs.peaYearsHeld < 5
                  ? `moins de 5 ans : PFU ${fmtTaxPercent(pfuRate(rules))}`
                  : `au-delà de 5 ans : taux réduit (${fmtTaxPercent(rules.socialRate)})`
              }
              onChange={v => updateInput("peaYearsHeld", v)}
            />
          </div>
        )}
        {inputs.envelope === "av" && (
          <div className="mt-3 animate-fade-in">
            <SliderInput
              label="Années de détention de l'AV"
              id="av-years"
              value={inputs.avYearsHeld}
              min={0}
              max={30}
              step={1}
              hardMin={0}
              hardMax={50}
              suffix="au-delà de 8 ans : abattement annuel"
              onChange={v => updateInput("avYearsHeld", v)}
            />
          </div>
        )}
        {inputs.envelope === "cto" && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {/* PFU : terme dur pour un débutant — une ligne d'explication au
                survol, sans alourdir le libellé (v6). */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
                Fiscalité du CTO
              </span>
              <HelpTip
                text={`PFU : Prélèvement Forfaitaire Unique — ${fmtTaxPercent(pfuRate(rules))} sur les gains (${fmtTaxPercent(
                  rules.socialRate,
                )} de prélèvements sociaux + ${fmtTaxPercent(rules.pfuIncomeRate)} d'impôt sur le revenu), sans barème.`}
              />
            </div>
            <SegmentedControl
              value={inputs.ctoTaxMode}
              onChange={v => updateInput("ctoTaxMode", v)}
              ariaLabel="Fiscalité du CTO"
              options={[
                { id: "pfu", label: `PFU ${fmtTaxPercent(pfuRate(rules))}`, sub: "impôt unique" },
                { id: "bareme", label: "Barème", sub: `${fmtTaxPercent(rules.socialRate)} + impôt à votre TMI` },
              ]}
            />
          </div>
        )}
        {(inputs.envelope === "per" || (inputs.envelope === "cto" && inputs.ctoTaxMode === "bareme")) && (
          <div className="mt-3 animate-fade-in">
            <SliderInput
              label="Tranche marginale d'imposition (%)"
              id="tmi"
              value={inputs.tmi * 100}
              min={0}
              max={45}
              step={1}
              hardMin={0}
              hardMax={45}
              suffix={
                inputs.envelope === "per"
                  ? "Versements déduits à ce taux ; sortie : versements imposés à votre TMI (sans abattement de 10 %), gains au PFU"
                  : "Impôt appliqué à vos gains CTO (barème)"
              }
              error={fieldError("tmi")?.message}
              warning={fieldWarning("tmi")?.message}
              onChange={v => updateInput("tmi", v / 100)}
            />
          </div>
        )}
        {/* La fiscalité en couple (plafond PEA doublé) ne concerne QUE le PEA :
            elle n'apparaît plus sur les autres comptes (CTO, AV, PER, BRUT). */}
        {inputs.envelope === "pea" && (
          <div className="mt-3">
            <Toggle
              checked={inputs.taxCouple}
              onChange={v => updateInput("taxCouple", v)}
              label="Fiscalité en couple"
              sub="Plafond de versements PEA doublé (300 000 €)"
            />
          </div>
        )}
      </CollapsibleSection>

      {/* La crise synthétique a été supprimée (Option A) : les krachs réels
          (2000, 2008, 2022…) sont déjà dans les rendements rejoués par toutes
          les simulations — en simuler un les compterait deux fois. */}

      {/* Frais */}
      <CollapsibleSection title="Frais" icon={<Percent size={12} />}>
        <ExpenseForm inputs={inputs} updateInput={updateInput} />
      </CollapsibleSection>

      {/* Insight */}
      <div className="mb-5 glass-gold rounded-2xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb size={13} className="text-primary shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">Votre projet</span>
        </div>
        <p className="text-xs leading-relaxed text-text-muted">
          Projection sur <strong className="text-text">{inputs.duration} ans</strong>. Capital final :{" "}
          <strong className="text-primary">{fmtCurrency(displayNominal)}</strong> sur le compte (fin de projet) ·{" "}
          <strong className="text-primary">{fmtCurrency(displayReal)}</strong> en euros d'aujourd'hui.
          {inputs.indexation > 0 && <> Votre épargne augmente de {(inputs.indexation * 100).toFixed(0)} %/an.</>} Les
          rendements rejoués sont ceux du MSCI World (1970–2025).
        </p>
      </div>

      {/* Snapshots */}
      <SnapshotPanel
        snapshots={snapshots}
        onSave={onSaveSnapshot}
        onLoad={onLoadSnapshot}
        onRemove={onRemoveSnapshot}
      />
    </aside>
  )
}
