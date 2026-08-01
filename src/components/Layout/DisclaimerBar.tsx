import { AlertTriangle } from "lucide-react"

interface DisclaimerBarProps {
  fiscalYear?: number
}

export function DisclaimerBar({ fiscalYear = new Date().getFullYear() }: DisclaimerBarProps) {
  return (
    <div className="text-[9px] text-text-dim text-center py-3 px-4 leading-relaxed border-t border-border mt-4">
      <AlertTriangle size={10} className="inline mr-1 text-warning" />
      Les simulations présentées sont hypothétiques et ne constituent pas un conseil financier. Les performances passées
      ne garantissent pas les résultats futurs. Les calculs utilisent des modèles mathématiques simplifiés et les impôts
      sont une <strong>estimation</strong> fondée sur les règles fiscales de {fiscalYear} (liquidation théorique).{" "}
      Consultez un conseiller financier pour des décisions d'investissement. Vos données sont enregistrées{" "}
      <strong>localement dans votre navigateur</strong> (localStorage) et ne quittent jamais votre appareil.
    </div>
  )
}
