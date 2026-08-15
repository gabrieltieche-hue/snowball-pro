import { SliderInput } from "../shared/SliderInput"
import { useLang } from "../../i18n"
import type { SimulationInputs } from "../../types"

interface ExpenseFormProps {
  inputs: SimulationInputs
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

export function ExpenseForm({ inputs, updateInput }: ExpenseFormProps) {
  const { tr, fmtDecimal } = useLang()
  return (
    <div className="space-y-2">
      <SliderInput
        label={tr("Frais du fonds (ETF)")}
        id="fee-etf"
        value={inputs.etfFees * 100}
        min={0}
        max={2}
        step={0.05}
        hardMin={0}
        hardMax={50}
        suffix={`${fmtDecimal(inputs.etfFees * 100, 2)}${tr("/an")}`}
        onChange={v => updateInput("etfFees", v / 100)}
      />
      <SliderInput
        label={tr("Courtage sur chaque versement")}
        id="fee-broker"
        value={inputs.brokerageFees * 100}
        min={0}
        max={1}
        step={0.05}
        hardMin={0}
        hardMax={50}
        suffix={`${fmtDecimal(inputs.brokerageFees * 100, 2)}${tr("% par versement")}`}
        onChange={v => updateInput("brokerageFees", v / 100)}
      />
      <SliderInput
        label={tr("Frais de gestion pilotée")}
        id="fee-manage"
        value={inputs.managementFees * 100}
        min={0}
        max={2}
        step={0.05}
        hardMin={0}
        hardMax={50}
        suffix={`${fmtDecimal(inputs.managementFees * 100, 2)}${tr("/an")}`}
        onChange={v => updateInput("managementFees", v / 100)}
      />
      <SliderInput
        label={tr("Frais de l'assurance-vie")}
        id="fee-insurance"
        value={inputs.insuranceFees * 100}
        min={0}
        max={2}
        step={0.05}
        hardMin={0}
        hardMax={50}
        suffix={`${fmtDecimal(inputs.insuranceFees * 100, 2)}${tr("/an")}`}
        onChange={v => updateInput("insuranceFees", v / 100)}
      />
    </div>
  )
}
