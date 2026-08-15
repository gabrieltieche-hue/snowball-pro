import { useState } from "react"
import { CalendarRange, ChevronDown } from "lucide-react"
import { deflationFactor } from "../../engine"
import { useLang } from "../../i18n"
import { cn } from "../../utils/cn"
import { SectionHeader } from "../shared/SectionHeader"
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
  const { tr, lang, fmtCompact } = useLang()
  const [open, setOpen] = useState(false)
  // Le capital initial est un flux de départ que les lignes annuelles
  // n'incluent pas : sans lui, le total « Versements » du calendrier différait
  // de la carte « Total épargné » (qui compte investiNom = capital initial +
  // épargne mensuelle). La ligne « Capital initial » réconcilie les deux et
  // remplace la ligne de base redondante (année 0 : zéro flux, zéro croissance)
  // (audit v5.6.3 — BUG #6).
  const initialCapital =
    rows.length > 0 ? Math.max(0, (rows[0]?.investedNom ?? 0) - (rows[0]?.annualContribution ?? 0)) : 0
  const flows: FlowLine[] = [
    ...(initialCapital > 0
      ? [{ year: 0, date: tr("Aujourd'hui"), versements: initialCapital, frais: 0, impots: 0, net: initialCapital }]
      : []),
    ...rows
      .filter(r => r.year > 0)
      .map(r => {
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
      }),
  ]

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
        aria-controls="cashflow-calendar-content"
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-glass-hover transition-colors"
      >
        <SectionHeader
          bare
          level="card"
          icon={CalendarRange}
          title={tr("Calendrier des flux")}
          className="flex-1 min-w-0"
        />
        <ChevronDown size={14} className={cn("text-text-dim transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div id="cashflow-calendar-content" className="px-5 pb-5 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { label: tr("Année"), align: "left" },
                    { label: tr("Date"), align: "left" },
                    { label: tr("Versements"), align: "right" },
                    { label: tr("Frais"), align: "right" },
                    { label: tr("Impôt théorique"), align: "right" },
                    { label: tr("Capital net"), align: "right" },
                  ].map(h => (
                    <th
                      key={h.label}
                      className={`text-[10px] font-bold uppercase tracking-wider text-text-dim py-2 px-3 whitespace-nowrap ${
                        h.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flows.map((row, i) => (
                  /* M16 — zéros en neutre (le rouge ne signale que des frais/
                      impôts réellement payés) + montants alignés à droite +
                      zebra léger. */
                  <tr
                    key={`${row.year}-${i}`}
                    className="border-b border-border/30 hover:bg-glass transition-colors odd:bg-glass/40"
                  >
                    <td className="py-2 px-3 text-text-dim whitespace-nowrap">
                      {row.year === 0
                        ? tr("Capital initial")
                        : lang === "en"
                          ? `Year ${row.year}`
                          : `Année ${row.year}`}
                    </td>
                    <td className="py-2 px-3 text-text-dim whitespace-nowrap">{row.date}</td>
                    <td className="py-2 px-3 mono text-text text-right">{fmtCompact(row.versements)}</td>
                    <td className={`py-2 px-3 mono text-right ${row.frais > 0 ? "text-danger" : "text-text-dim"}`}>
                      {fmtCompact(row.frais)}
                    </td>
                    <td className={`py-2 px-3 mono text-right ${row.impots > 0 ? "text-danger" : "text-text-dim"}`}>
                      {fmtCompact(row.impots)}
                    </td>
                    <td className="py-2 px-3 mono text-primary font-semibold text-right">{fmtCompact(row.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-100/40">
                  <td className="py-2 px-3 text-[10px] font-bold text-text" colSpan={2}>
                    {tr("Totaux")}
                  </td>
                  <td className="py-2 px-3 mono text-[11px] font-bold text-text text-right">
                    {fmtCompact(totals.versements)}
                  </td>
                  <td
                    className={`py-2 px-3 mono text-[11px] font-bold text-right ${totals.frais > 0 ? "text-danger" : "text-text-dim"}`}
                  >
                    {fmtCompact(totals.frais)}
                  </td>
                  {/* Les impôts sont « si liquidation cette année » — leur somme
                      n'a pas de sens (non cumulable, audit) : on affiche « — »
                      au lieu d'un total trompeur. */}
                  <td
                    title={tr(
                      "Impôts non cumulables : somme théorique si liquidation chaque année — pas un impôt réel",
                    )}
                    className="py-2 px-3 mono text-[11px] font-bold text-text-dim text-right"
                  >
                    —
                  </td>
                  <td className="py-2 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-[10px] text-text-dim italic mt-2">
            {tr(
              "« Versements » = capital initial (ligne « Départ ») + épargne mensuelle. Les impôts correspondent à l'impôt théorique si le portefeuille était liquidé à chaque date ; ils ne sont pas des impôts cumulés réellement payés et ne deviennent dus qu'à la revente — leur total n'est donc pas affiché (non cumulable). Seuls les versements et les frais se cumulent.",
            )}
          </p>
        </div>
      )}
    </div>
  )
}
