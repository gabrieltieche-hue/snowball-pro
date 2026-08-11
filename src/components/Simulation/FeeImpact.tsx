import { useMemo } from "react"
import { Percent } from "lucide-react"
import { runSimulation as reRunSim, deflationFactor, fmtCurrency } from "../../engine"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs, YearRow } from "../../types"

interface FeeImpactProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

export function FeeImpact({ rows, inputs }: FeeImpactProps) {
  // Hook appelé inconditionnellement (les règles de React l'exigent) : le
  // retour anticipé sans rows vient après.
  const noFeeFinal = useMemo(
    () => reRunSim({ ...inputs, etfFees: 0, brokerageFees: 0, managementFees: 0 }).slice(-1)[0]?.nominal || 0,
    [inputs],
  )
  const lastRow = rows[rows.length - 1]
  if (!lastRow) return null

  // MÊME échelle que les cartes du haut : quand l'affichage est en euros
  // d'aujourd'hui, l'impact des frais est déflaté aussi (audit v5.2.2 — avant,
  // les frais restaient nominaux à côté de cartes réelles).
  const factor = inputs.showReal ? deflationFactor(lastRow) : 1
  const feeImpact = (noFeeFinal - lastRow.nominal) * factor

  return (
    <div className="card-subtle rounded-2xl p-5 space-y-2">
      <SectionHeader title="Ce que les frais vous coûtent" icon={Percent} level="card" />
      <div className="space-y-1.5">
        {/* M17 — zéro en neutre, pas en rouge : des frais nuls ne sont pas un
            problème. Le rouge (token danger, plus de hex hardcodés qui
            s'effaçaient sur fond sombre) ne sert que quand il y a un vrai
            coût. */}
        {[
          { label: "Frais débités au total", value: lastRow.feesLost * factor },
          { label: "Capital perdu à cause des frais", value: feeImpact },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-1">
            <span className="text-[11px] text-text-dim">{item.label}</span>
            <span
              className="mono text-xs font-semibold"
              style={{ color: item.value > 0 ? "var(--color-danger)" : "var(--color-text-dim)" }}
            >
              {fmtCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="h-px bg-border my-2" />
      {feeImpact > 0 ? (
        <div className="text-[10px] text-text-dim">
          Sans frais, votre capital final serait de{" "}
          <span className="font-bold text-danger">{fmtCurrency(noFeeFinal * factor)}</span> (au lieu de{" "}
          {fmtCurrency(lastRow.nominal * factor)}).
        </div>
      ) : (
        <div className="text-[10px] text-text-dim">
          Aucun écart de frais mesurable dans cette projection : les frais sont nuls ou leur effet est arrondi.
        </div>
      )}
    </div>
  )
}
