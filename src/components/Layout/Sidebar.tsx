import { Calendar, Coins, Landmark, Percent, RefreshCcw, Settings2, TrendingDown, Wallet } from "lucide-react"
import { BacktestSelector } from "../Forms/BacktestSelector"
import { CrisisSelector } from "../Forms/CrisisSelector"
import { EnvelopeSelector } from "../Forms/EnvelopeSelector"
import { ExpenseForm } from "../Forms/ExpenseForm"
import { SectionTitle } from "../shared/SectionTitle"
import { SliderInput } from "../shared/SliderInput"
import { Toggle } from "../shared/Toggle"
import { fmtCurrency } from "../../engine"
import type { CrisisProfile, HistoricalIndex, SimulationInputs, YearRow } from "../../types"

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

interface SidebarProps {
  inputs: SimulationInputs
  rows: YearRow[]
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
  updateInputs: (partial: Partial<SimulationInputs>) => void
}

export function Sidebar({ inputs, rows, updateInput, updateInputs }: SidebarProps) {
  const lastRow = rows[rows.length - 1]
  const displayFinal = lastRow ? (inputs.showReal ? lastRow.real : lastRow.nominal) : 0

  return (
    <aside className="glass rounded-3xl p-5 sm:p-6 shadow-premium lg:sticky lg:top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Wallet size={16} className="text-primary" />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight leading-none">
            SNOWBALL <span className="text-primary">PRO</span>
          </div>
          <div className="text-[9px] text-text-dim mt-1 uppercase tracking-[0.2em]">Simulateur patrimonial</div>
        </div>
      </div>

      {/* Calendrier */}
      <SectionTitle icon={Calendar}>Calendrier</SectionTitle>
      <SliderInput
        label="Mois de début"
        id="start-month"
        value={inputs.startMonth}
        min={0}
        max={11}
        step={1}
        suffix={MONTHS[inputs.startMonth]}
        onChange={v => updateInput("startMonth", v)}
      />

      {/* Bases */}
      <SectionTitle icon={Coins}>Bases de l'investissement</SectionTitle>
      <SliderInput
        label="Capital de départ (€)"
        id="capital-initial"
        value={inputs.capitalInitial}
        min={0}
        max={200000}
        step={1000}
        onChange={v => updateInput("capitalInitial", v)}
      />
      <SliderInput
        label="Versement mensuel (€)"
        id="monthly-payment"
        value={inputs.monthlyPayment}
        min={0}
        max={10000}
        step={50}
        onChange={v => updateInput("monthlyPayment", v)}
      />
      <SliderInput
        label="Rendement annuel (%)"
        id="annual-return"
        value={inputs.annualReturn * 100}
        min={0.1}
        max={20}
        step={0.1}
        suffix={`Taux mensuel : ${((inputs.annualReturn * 100) / 12).toFixed(3)}%`}
        onChange={v => updateInput("annualReturn", v / 100)}
      />
      <SliderInput
        label="Durée (années)"
        id="duration"
        value={inputs.duration}
        min={1}
        max={50}
        step={1}
        onChange={v => updateInput("duration", v)}
      />

      {/* Mode de rendement */}
      <SectionTitle icon={RefreshCcw}>Mode de rendement</SectionTitle>
      <Toggle
        checked={inputs.returnMode === "historical"}
        onChange={v => updateInputs({ returnMode: v ? "historical" : "fixed" })}
        label="Données historiques"
        sub="Rendements réels d'un indice (1995-2025)"
      />
      {inputs.returnMode === "historical" && (
        <div className="mt-3 animate-fade-in">
          <BacktestSelector
            value={inputs.historicalIndex}
            onChange={v => updateInput("historicalIndex", v as HistoricalIndex)}
          />
        </div>
      )}

      {/* Paramètres avancés */}
      <SectionTitle icon={Settings2}>Paramètres avancés</SectionTitle>
      <SliderInput
        label="Indexation des versements (%/an)"
        id="indexation"
        value={inputs.indexation * 100}
        min={0}
        max={10}
        step={0.1}
        suffix="Augmentation annuelle du versement mensuel"
        onChange={v => updateInput("indexation", v / 100)}
      />
      <SliderInput
        label="Inflation annuelle (%)"
        id="inflation"
        value={inputs.inflation * 100}
        min={0}
        max={10}
        step={0.1}
        onChange={v => updateInput("inflation", v / 100)}
      />
      <Toggle
        checked={inputs.showReal}
        onChange={v => updateInput("showReal", v)}
        label="Pouvoir d'achat réel"
        sub="Affiche en euros d'aujourd'hui"
      />

      {/* Enveloppe fiscale */}
      <SectionTitle icon={Landmark}>Enveloppe fiscale</SectionTitle>
      <EnvelopeSelector value={inputs.envelope} onChange={v => updateInput("envelope", v)} />

      {/* Stress test */}
      <SectionTitle icon={TrendingDown}>Stress test — Krach boursier</SectionTitle>
      <Toggle
        checked={inputs.crisisEnabled}
        onChange={v => updateInput("crisisEnabled", v)}
        label="Simuler un krach boursier"
        sub="Applique une chute soudaine du capital"
      />
      {inputs.crisisEnabled && (
        <div className="mt-3 animate-fade-in">
          <CrisisSelector
            profile={inputs.crisisProfile}
            amplitude={inputs.crisisAmplitude}
            year={inputs.crisisYear}
            onProfileChange={v => updateInput("crisisProfile", v as CrisisProfile)}
            onAmplitudeChange={v => updateInput("crisisAmplitude", v)}
            onYearChange={v => updateInput("crisisYear", v)}
          />
        </div>
      )}

      {/* Frais */}
      <SectionTitle icon={Percent}>Frais</SectionTitle>
      <ExpenseForm inputs={inputs} updateInput={updateInput} />

      {/* Insight */}
      <div className="mt-6 glass-gold rounded-2xl p-4 border-l-2 border-[#D4AF37]/50">
        <p className="text-xs leading-relaxed text-text-muted">
          Projection sur <strong className="text-text">{inputs.duration} ans</strong>. Patrimoine final :{" "}
          <strong className="text-primary">{fmtCurrency(displayFinal)}</strong>{" "}
          {inputs.showReal ? "en pouvoir d'achat actuel" : "en valeur nominale"}.
          {inputs.indexation > 0 && (
            <>
              {" "}
              Versements indexés à {(inputs.indexation * 100).toFixed(0)}%/an.
            </>
          )}
          {inputs.crisisEnabled && (
            <span className="text-danger">
              {" "}
              ⚠️ Krach intégré en année {inputs.crisisYear} (-{inputs.crisisAmplitude}%).
            </span>
          )}
        </p>
      </div>
    </aside>
  )
}
