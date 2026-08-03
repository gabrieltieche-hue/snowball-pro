import { Coins, Landmark, Percent, Settings2, TrendingUp, Wallet } from "lucide-react"
import { EnvelopeSelector } from "../Forms/EnvelopeSelector"
import { ExpenseForm } from "../Forms/ExpenseForm"
import { SnapshotPanel } from "./SnapshotPanel"
import { CollapsibleSection } from "../shared/CollapsibleSection"
import { SegmentedControl } from "../shared/SegmentedControl"
import { SliderInput } from "../shared/SliderInput"
import { Toggle } from "../shared/Toggle"
import { fmtCurrency, getHistoricalDataset, validateInputs } from "../../engine"
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
  const historicalPeriod =
    historical.years.length > 0
      ? `${historical.name} · ${historical.years[0]?.year}–${historical.years[historical.years.length - 1]?.year}`
      : historical.name

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
      {/* Logo */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-extrabold tracking-tight leading-none whitespace-nowrap">
              SNOWBALL <span className="text-primary">PRO</span>
            </div>
            <div className="text-[10px] text-text-dim mt-1 uppercase tracking-[0.2em] truncate">
              Simulateur patrimonial
            </div>
          </div>
          {scenarioLabel && (
            <span className="text-[10px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
              {scenarioLabel}
            </span>
          )}
        </div>
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
          error={fieldError("monthlyPayment")?.message}
          warning={fieldWarning("monthlyPayment")?.message}
          onChange={v => updateInput("monthlyPayment", v)}
        />
        {/* Option A : plus de curseur de rendement ni de mode « taux défini ».
            Le Simulateur (comme Monte Carlo et la Rente) rejoue TOUJOURS les
            rendements réels du MSCI World 1970-2025 — les krachs réels (2000,
            2008, 2022…) et les bull markets sont rejoués, pas simulés. */}
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-primary" />
            <span className="text-xs font-bold text-text">MSCI World — historique réel</span>
          </div>
          <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
            Moyenne de la série :{" "}
            <strong className="text-text">{(historical.avgReturn * 100).toFixed(2).replace(".", ",")} %/an brut</strong> ·{" "}
            <strong className="text-text">{(historical.netReturn * 100).toFixed(2).replace(".", ",")} %/an</strong> net
            d'inflation
          </p>
          <p className="text-[10px] text-text-dim mt-1 leading-snug">
            Simulateur, Monte Carlo et Rente rejouent les rendements réels{" "}
            {historicalPeriod.replace(`${historical.name} · `, "")} — pas de taux défini, pas de crise
            simulée.
          </p>
        </div>
        <SliderInput
          label="Durée (années)"
          id="duration"
          value={inputs.duration}
          min={1}
          max={50}
          step={1}
          error={fieldError("duration")?.message}
          warning={fieldWarning("duration")?.message}
          onChange={v => updateInput("duration", v)}
        />
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
              suffix={
                inputs.peaYearsHeld < 5
                  ? "moins de 5 ans : PFU 30 %"
                  : "au-delà de 5 ans : taux réduit (17,2 %)"
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
              suffix="au-delà de 8 ans : abattement annuel"
              onChange={v => updateInput("avYearsHeld", v)}
            />
          </div>
        )}
        {inputs.envelope === "cto" && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <SegmentedControl
              value={inputs.ctoTaxMode}
              onChange={v => updateInput("ctoTaxMode", v)}
              ariaLabel="Fiscalité du CTO"
              options={[
                { id: "pfu", label: "PFU 30 %", sub: "impôt unique" },
                { id: "bareme", label: "Barème", sub: "17,2 % + impôt à votre TMI" },
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
              suffix={
                inputs.envelope === "per"
                  ? "Versements déduits à ce taux ; sortie taxée à TMI − 10 %"
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
      <div className="mb-5 glass-gold rounded-2xl p-4 border-l-2 border-primary/50">
        <p className="text-xs leading-relaxed text-text-muted">
          Projection sur <strong className="text-text">{inputs.duration} ans</strong>. Capital final :{" "}
          <strong className="text-primary">{fmtCurrency(displayNominal)}</strong> sur le compte (fin de projet) ·{" "}
          <strong className="text-primary">{fmtCurrency(displayReal)}</strong> en euros d'aujourd'hui.
          {inputs.indexation > 0 && <> Votre épargne augmente de {(inputs.indexation * 100).toFixed(0)} %/an.</>}{" "}
          Les rendements rejoués sont ceux du MSCI World (1970–2025).
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
