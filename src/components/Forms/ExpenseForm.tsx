import { SliderInput } from "../shared/SliderInput"
import type { SimulationInputs } from "../../types"

interface ExpenseFormProps {
  inputs: SimulationInputs
  updateInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
}

export function ExpenseForm({ inputs, updateInput }: ExpenseFormProps) {
  return (
    <div className="space-y-2">
      <SliderInput
        label="Frais du fonds (ETF)"
        id="fee-etf"
        value={inputs.etfFees * 100}
        min={0}
        max={2}
        step={0.05}
        suffix={`${(inputs.etfFees * 100).toFixed(2)}%/an`}
        onChange={v => updateInput("etfFees", v / 100)}
      />
      <SliderInput
        label="Frais du courtier"
        id="fee-broker"
        value={inputs.brokerageFees * 100}
        min={0}
        max={1}
        step={0.05}
        suffix={`${(inputs.brokerageFees * 100).toFixed(2)}%/an`}
        onChange={v => updateInput("brokerageFees", v / 100)}
      />
      <SliderInput
        label="Frais de gestion pilotée"
        id="fee-manage"
        value={inputs.managementFees * 100}
        min={0}
        max={2}
        step={0.05}
        suffix={`${(inputs.managementFees * 100).toFixed(2)}%/an`}
        onChange={v => updateInput("managementFees", v / 100)}
      />
      <SliderInput
        label="Frais de l'assurance-vie"
        id="fee-insurance"
        value={inputs.insuranceFees * 100}
        min={0}
        max={2}
        step={0.05}
        suffix={`${(inputs.insuranceFees * 100).toFixed(2)}%/an`}
        onChange={v => updateInput("insuranceFees", v / 100)}
      />
    </div>
  )
}
