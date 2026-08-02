import { Coins, Landmark, Percent, RefreshCcw, Settings2, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { CrisisSelector } from "../Forms/CrisisSelector"
import { EnvelopeSelector } from "../Forms/EnvelopeSelector"
import { ExpenseForm } from "../Forms/ExpenseForm"
import { SnapshotPanel } from "./SnapshotPanel"
import { CollapsibleSection } from "../shared/CollapsibleSection"
import { SegmentedControl } from "../shared/SegmentedControl"
import { SliderInput } from "../shared/SliderInput"
import { Toggle } from "../shared/Toggle"
import { fmtCurrency, getHistoricalDataset, validateInputs } from "../../engine"
import type { ValidationError } from "../../engine"
import type { CrisisProfile, ReturnMode, SavedSnapshot, SimulationInputs, YearRow } from "../../types"

interface SidebarProps {
  inputs: SimulationInputs
  rows: YearRow[]
  scenarioLabel?: string
  snapshots: SavedSnapshot[]
  onSaveSnapshot: () => void
  onLoadSnapshot: (id: string) => void
  onRemoveSnapshot: (id: string) => void
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
  updateInputs: (partial: Partial<SimulationInputs>) => void
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
  updateInputs,
}: SidebarProps) {
  const lastRow = rows[rows.length - 1]
  const displayFinal = lastRow ? (inputs.showReal ? lastRow.real : lastRow.nominal) : 0
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

  // Ménage UX v5.3 : deux modes seulement. « Taux défini » reprend le
  // rendement annuel saisi dans « Votre épargne » (le demander deux fois était
  // redondant) ; « Historique » rejoue les vrais rendements du MSCI World
  // (sélecteur d'indices supprimé — seul le MSCI World reste). Le mode
  // « Aléatoire » (gaussien ± volatilité) a été supprimé de l'interface.
  const RETURN_MODES: { id: ReturnMode; label: string; sub: string }[] = [
    { id: "fixed", label: "Taux défini", sub: "reprend le rendement annuel ci-dessus" },
    { id: "historical", label: "Historique", sub: `réel : ${historical.name}` },
  ]
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
        <SliderInput
          label="Rendement annuel de la bourse (%)"
          id="annual-return"
          value={inputs.annualReturn * 100}
          min={0.1}
          max={20}
          step={0.1}
          suffix={`Soit ${((inputs.annualReturn * 100) / 12).toFixed(3)} % par mois`}
          error={fieldError("annualReturn")?.message}
          warning={fieldWarning("annualReturn")?.message}
          onChange={v => updateInput("annualReturn", v / 100)}
        />
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

      {/* Mode de rendement */}
      <CollapsibleSection title="Comment évolue la bourse ?" icon={<RefreshCcw size={12} />}>
        <SegmentedControl
          value={inputs.returnMode}
          onChange={v => updateInputs({ returnMode: v })}
          ariaLabel="Mode d'évolution de la bourse"
          options={RETURN_MODES}
        />
        {inputs.returnMode === "historical" && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-3 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-primary" />
              <span className="text-xs font-bold text-text">MSCI World</span>
            </div>
            <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
              Moyenne arithmétique des 50 dernières années :{" "}
              <strong className="text-text">{(historical.avgReturn * 100).toFixed(2).replace(".", ",")} %/an</strong>{" "}
              (brut) · <strong className="text-text">{(historical.netReturn * 100).toFixed(2).replace(".", ",")} %/an</strong>{" "}
              net d'inflation
            </p>
            <p className="text-[10px] text-text-dim mt-1 leading-snug">
              Chiffres de référence officiels · série rejouée {historicalPeriod.replace(`${historical.name} · `, "")}
            </p>
          </div>
        )}
        {/* Les dividendes s'appliquent dans TOUS les modes (le moteur les
            verse chaque mois quelle que soit la façon dont évolue la bourse) :
            le contrôle reste accessible hors du mode historique. */}
        {inputs.returnMode !== "historical" && (
          <div className="mt-3 space-y-3 animate-fade-in">
            <SliderInput
              label="Rendement des dividendes (%)"
              id="dividend-yield"
              value={inputs.dividendYield * 100}
              min={0}
              max={8}
              step={0.1}
              suffix="versés chaque mois puis réinvestis"
              error={fieldError("dividendYield")?.message}
              warning={fieldWarning("dividendYield")?.message}
              onChange={v => updateInput("dividendYield", v / 100)}
            />
          </div>
        )}
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
          sub="Affiche les montants corrigés de l'inflation"
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
                { id: "bareme", label: "Barème", sub: "TMI + abattement 40 % dividendes" },
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

      {/* Stress test */}
      <CollapsibleSection title="Et si la bourse s'effondrait ?" icon={<TrendingDown size={12} />}>
        <Toggle
          checked={inputs.crisisEnabled}
          onChange={v => updateInput("crisisEnabled", v)}
          label="Simuler un krach boursier"
          sub="Simule une chute brutale de la bourse"
        />
        {inputs.crisisEnabled && (
          <div className="mt-3 animate-fade-in">
            <CrisisSelector
              profile={inputs.crisisProfile}
              amplitude={inputs.crisisAmplitude}
              year={inputs.crisisYear}
              maxYear={inputs.duration}
              warning={fieldWarning("crisisYear")?.message}
              onProfileChange={v => updateInput("crisisProfile", v as CrisisProfile)}
              onAmplitudeChange={v => updateInput("crisisAmplitude", v)}
              onYearChange={v => updateInput("crisisYear", v)}
            />
            {inputs.returnMode === "historical" && (
              <p className="text-[10px] text-warning mt-2 leading-snug">
                En mode historique, les krachs réels de l'indice sont déjà rejoués : la crise synthétique ne
                s'applique pas (cohérent avec Monte Carlo &amp; Rente).
              </p>
            )}
          </div>
        )}
      </CollapsibleSection>

      {/* Frais */}
      <CollapsibleSection title="Frais" icon={<Percent size={12} />}>
        <ExpenseForm inputs={inputs} updateInput={updateInput} />
      </CollapsibleSection>

      {/* Insight */}
      <div className="mb-5 glass-gold rounded-2xl p-4 border-l-2 border-primary/50">
        <p className="text-xs leading-relaxed text-text-muted">
          Projection sur <strong className="text-text">{inputs.duration} ans</strong>. Capital final :{" "}
          <strong className="text-primary">{fmtCurrency(displayFinal)}</strong>{" "}
          {inputs.showReal ? "en euros d'aujourd'hui" : "en euros bruts (inflation non déduite)"}.
          {inputs.indexation > 0 && <> Votre épargne augmente de {(inputs.indexation * 100).toFixed(0)} %/an.</>}
          {inputs.crisisEnabled && inputs.returnMode !== "historical" && inputs.crisisYear <= inputs.duration && (
            <span className="text-danger">
              {" "}
              ⚠️ Chute de la bourse en année {inputs.crisisYear} (-{inputs.crisisAmplitude}%).
            </span>
          )}
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
