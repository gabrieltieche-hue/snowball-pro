import { motion } from "framer-motion"
import {
  Calendar,
  Coins,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  RefreshCcw,
  Settings2,
  TrendingDown,
  Wallet,
} from "lucide-react"
import { BacktestSelector } from "../Forms/BacktestSelector"
import { CrisisSelector } from "../Forms/CrisisSelector"
import { EnvelopeSelector } from "../Forms/EnvelopeSelector"
import { ExpenseForm } from "../Forms/ExpenseForm"
import { SnapshotPanel } from "./SnapshotPanel"
import { SectionTitle } from "../shared/SectionTitle"
import { SliderInput } from "../shared/SliderInput"
import { Toggle } from "../shared/Toggle"
import { fmtCurrency, getHistoricalDataset } from "../../engine"
import type { CrisisProfile, HistoricalIndex, SavedSnapshot, SimulationInputs, YearRow } from "../../types"

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
  collapsed: boolean
  scenarioLabel?: string
  snapshots: SavedSnapshot[]
  onSaveSnapshot: () => void
  onLoadSnapshot: (id: string) => void
  onRemoveSnapshot: (id: string) => void
  onToggleCollapse: () => void
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
  updateInputs: (partial: Partial<SimulationInputs>) => void
}

export function Sidebar({
  inputs,
  rows,
  collapsed,
  scenarioLabel,
  snapshots,
  onSaveSnapshot,
  onLoadSnapshot,
  onRemoveSnapshot,
  onToggleCollapse,
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

  return (
    <motion.aside
      className="glass rounded-3xl p-5 sm:p-6 shadow-premium lg:sticky lg:top-6 overflow-hidden"
      initial={false}
      animate={{ width: collapsed ? 72 : "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Wallet size={16} className="text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-tight leading-none whitespace-nowrap">
                SNOWBALL <span className="text-primary">PRO</span>
              </div>
              <div className="text-[9px] text-text-dim mt-1 uppercase tracking-[0.2em] truncate">
                Simulateur patrimonial
              </div>
            </div>
          )}
          {!collapsed && scenarioLabel && (
            <span className="text-[9px] mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
              {scenarioLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Déplier le menu" : "Replier le menu"}
          className="p-1.5 rounded-lg text-text-dim hover:bg-glass-hover hover:text-text transition-colors shrink-0"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {!collapsed && (
        <>
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
          <SectionTitle icon={Coins}>Votre épargne</SectionTitle>
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
            label="Épargne mensuelle (€)"
            id="monthly-payment"
            value={inputs.monthlyPayment}
            min={0}
            max={10000}
            step={50}
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
          <SectionTitle icon={RefreshCcw}>Comment évolue la bourse ?</SectionTitle>
          <Toggle
            checked={inputs.returnMode === "historical"}
            onChange={v => updateInputs({ returnMode: v ? "historical" : "fixed" })}
            label="Bourse réelle (historique)"
            sub={`Utilise les performances réelles passées : ${historicalPeriod}`}
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
            label="Augmentation de votre épargne (%/an)"
            id="indexation"
            value={inputs.indexation * 100}
            min={0}
            max={10}
            step={0.1}
            suffix="Votre épargne mensuelle augmente chaque année"
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
            label="Euros d'aujourd'hui"
            sub="Affiche les montants corrigés de l'inflation"
          />

          {/* Enveloppe fiscale */}
          <SectionTitle icon={Landmark}>Compte d'investissement</SectionTitle>
          <EnvelopeSelector value={inputs.envelope} onChange={v => updateInput("envelope", v)} />

          {/* Stress test */}
          <SectionTitle icon={TrendingDown}>Et si la bourse s'effondrait ?</SectionTitle>
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
          <div className="mt-6 glass-gold rounded-2xl p-4 border-l-2 border-primary/50">
            <p className="text-xs leading-relaxed text-text-muted">
              Projection sur <strong className="text-text">{inputs.duration} ans</strong>. Capital final :{" "}
              <strong className="text-primary">{fmtCurrency(displayFinal)}</strong>{" "}
              {inputs.showReal ? "en euros d'aujourd'hui" : "en euros bruts (inflation non déduite)"}.
              {inputs.indexation > 0 && <> Votre épargne augmente de {(inputs.indexation * 100).toFixed(0)} %/an.</>}
              {inputs.crisisEnabled && (
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
        </>
      )}
    </motion.aside>
  )
}
