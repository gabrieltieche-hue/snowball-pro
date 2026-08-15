import { motion } from "framer-motion"
import { useLang } from "../../i18n"
import type { YearRow } from "../../types"

interface AmortissementTableProps {
  rows: YearRow[]
}

export function AmortissementTable({ rows }: AmortissementTableProps) {
  const { tr, lang, fmtCompact } = useLang()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            {[
              { label: tr("Année"), align: "left" },
              { label: tr("Épargné"), align: "right" },
              { label: tr("Gains bourse"), align: "right" },
              { label: tr("Capital"), align: "right" },
              { label: tr("En € d'aujourd'hui"), align: "right" },
              { label: tr("Frais"), align: "right" },
              { label: tr("Après impôt théorique"), align: "right" },
            ].map(h => (
              <th
                key={h.label}
                className={`text-[10px] font-bold uppercase tracking-wider text-text-dim py-2.5 px-3 whitespace-nowrap ${
                  h.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.year}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.005 }}
              className="border-b border-border/30 hover:bg-glass transition-colors odd:bg-glass/40"
            >
              <td className="py-2 px-3 text-text-dim whitespace-nowrap">
                {lang === "en" ? `Year ${row.year}` : `Année ${row.year}`}
              </td>
              <td className="py-2 px-3 mono text-text text-right">{fmtCompact(row.investedNom)}</td>
              <td className="py-2 px-3 mono text-primary font-semibold text-right">{fmtCompact(row.interestsNom)}</td>
              <td className="py-2 px-3 mono text-text font-semibold text-right">{fmtCompact(row.nominal)}</td>
              <td className="py-2 px-3 mono text-warning text-right">{fmtCompact(row.real)}</td>
              <td className={`py-2 px-3 mono text-right ${row.fees > 0 ? "text-danger" : "text-text-dim"}`}>
                {fmtCompact(row.fees)}
              </td>
              <td className="py-2 px-3 mono text-accent text-right">{fmtCompact(row.taxNet)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
