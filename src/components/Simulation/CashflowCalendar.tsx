import { useState } from "react"
import { CalendarRange, ChevronDown } from "lucide-react"
import { deflationFactor, fmtCompact } from "../../engine"
import { cn } from "../../utils/cn"
import type { YearRow } from "../../types"

interface CashflowCalendarProps {
  rows: YearRow[]
  /** Affichage en euros d'aujourd'hui : les flux sont déflatés (même échelle
   *  que les cartes du haut — audit v5.2.2). */
  showReal?: boolean
}

interface FlowLine {
  year: number
  date: string
  versements: number
  frais: number
  impots: number
  net: number
}

export function CashflowCalendar({ rows, showReal = false }: CashflowCalendarProps) {
  const [open, setOpen] = useState(false)
  const flows: FlowLine[] = rows.map(r => {
    // Déflation PAR ANNÉE : chaque flux est converti avec le facteur de
    // l'année où il a eu lieu (real/nominal de cette ligne), pas un facteur
    // unique de fin de projection.
    const factor = showReal ? deflationFactor(r) : 1
    return {
      year: r.year,
      date: r.date,
      versements: r.annualContribution * factor,
      frais: r.fees * factor,
      // Impôts de LIQUIDATION (exit tax = nominal − taxNet), MÊME base que la
      // carte « Impôts », le camembert, le graphique et le panneau fiscal.
      impots: Math.max(0, r.nominal - r.taxNet) * factor,
      net: r.taxNet * factor,
    }
  })

  const totals = flows.reduce(
    (acc, f) => ({
      versements: acc.versements + f.versements,
      frais: acc.frais + f.frais,
      impots: acc.impots + f.impots,
    }),
    { versements: 0, frais: 0, impots: 0 },
  )

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-glass-hover transition-colors"
      >
        <span className="text-xs font-bold flex items-center gap-2">
          <CalendarRange size={13} className="text-primary" /> Calendrier des flux
        </span>
        <ChevronDown size={14} className={cn("text-text-dim transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Année", "Date", "Versements", "Frais", "Impôts", "Capital net"].map(h => (
                    <th
                      key={h}
                      className="text-[10px] font-bold uppercase tracking-wider text-text-dim py-2 px-3 text-left whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flows.map(row => (
                  <tr key={row.year} className="border-b border-border/30 hover:bg-glass transition-colors">
                    <td className="py-2 px-3 text-text-dim whitespace-nowrap">Année {row.year}</td>
                    <td className="py-2 px-3 text-text-dim whitespace-nowrap">{row.date}</td>
                    <td className="py-2 px-3 mono text-text">{fmtCompact(row.versements)}</td>
                    <td className="py-2 px-3 mono text-danger">{fmtCompact(row.frais)}</td>
                    <td className="py-2 px-3 mono text-danger">{fmtCompact(row.impots)}</td>
                    <td className="py-2 px-3 mono text-primary font-semibold">{fmtCompact(row.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="py-2 px-3 text-[10px] font-bold text-text" colSpan={2}>
                    Totaux
                  </td>
                  <td className="py-2 px-3 mono text-[11px] font-bold text-text">{fmtCompact(totals.versements)}</td>
                  <td className="py-2 px-3 mono text-[11px] font-bold text-danger">{fmtCompact(totals.frais)}</td>
                  <td className="py-2 px-3 mono text-[11px] font-bold text-danger">{fmtCompact(totals.impots)}</td>
                  <td className="py-2 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-[10px] text-text-dim italic mt-2">
            Les impôts cumulés sont une estimation de liquidation théorique (fiscalité de l'année courante) — ils ne
            sont réellement dus qu'à la revente.
          </p>
        </div>
      )}
    </div>
  )
}
