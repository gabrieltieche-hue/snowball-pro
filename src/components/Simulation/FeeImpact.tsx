import { useMemo } from "react"
import { Percent } from "lucide-react"
import { runSimulation as reRunSim, deflationFactor } from "../../engine"
import { useLang } from "../../i18n"
import { SectionHeader } from "../shared/SectionHeader"
import type { SimulationInputs, YearRow } from "../../types"

interface FeeImpactProps {
  rows: YearRow[]
  inputs: SimulationInputs
}

export function FeeImpact({ rows, inputs }: FeeImpactProps) {
  const { tr, fmtCurrency } = useLang()
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
      <SectionHeader title={tr("Ce que les frais vous coûtent")} icon={Percent} level="card" />
      <div className="space-y-1.5">
        {/* M17 — zéro en neutre, pas en rouge : des frais nuls ne sont pas un
            problème. Le rouge (token danger, plus de hex hardcodés qui
            s'effaçaient sur fond sombre) ne sert que quand il y a un vrai
            coût. */}
        {[
          { label: tr("Frais débités au total"), value: lastRow.feesLost * factor },
          { label: tr("Capital perdu à cause des frais"), value: feeImpact },
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
          {tr("Sans frais, votre capital final serait de")}{" "}
          <span className="font-bold text-danger">{fmtCurrency(noFeeFinal * factor)}</span> {tr("(au lieu de")}{" "}
          {fmtCurrency(lastRow.nominal * factor)}).
        </div>
      ) : (
        /* M17 — état positif : des frais nuls ne sont pas un problème, c'est
            un bon point. On le dit clairement, et on invite à des frais
            réalistes (les défauts de l'app sont 0,25 % ETF / 0,75 % AV). */
        <div className="text-[10px] text-text-dim">
          🎉 <strong className="text-text">{tr("Aucun frais : votre croissance n'est pas rognée.")}</strong>{" "}
          {tr(
            "Les défauts réalistes sont 0,25 %/an d'ETF et 0,75 %/an d'assurance-vie — réglez-les dans les paramètres pour voir leur coût réel.",
          )}
        </div>
      )}
    </div>
  )
}
