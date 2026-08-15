import { AlertTriangle } from "lucide-react"
import { useLang } from "../../i18n"

export function DisclaimerBar() {
  const { tr } = useLang()
  return (
    <div className="text-[10px] text-text-dim text-center py-3 px-4 leading-relaxed border-t border-border mt-4">
      <AlertTriangle size={10} className="inline mr-1 text-warning" />
      {tr("Les simulations présentées sont hypothétiques et ne constituent pas un conseil financier.")}{" "}
      {tr("Les performances passées ne garantissent pas les résultats futurs.")}{" "}
      {tr("Les calculs utilisent des modèles mathématiques simplifiés et les impôts sont une")}{" "}
      <strong>{tr("estimation")}</strong>{" "}
      {tr(
        "fondée sur les règles fiscales en vigueur (liquidation théorique). Consultez un conseiller financier pour des décisions d'investissement.",
      )}{" "}
      {tr("Vos données sont enregistrées")} <strong>{tr("localement dans votre navigateur")}</strong>{" "}
      {tr("(localStorage) et ne quittent jamais votre appareil.")}
    </div>
  )
}
