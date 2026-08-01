import { motion } from "framer-motion"
import { fmtCompact } from "../../engine"
import type { YearRow } from "../../types"

interface AmortissementTableProps {
  rows: YearRow[]
}

export function AmortissementTable({ rows }: AmortissementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            {["Année", "Épargné", "Gains bourse", "Capital", "En € d'aujourd'hui", "Frais", "Après impôts"].map(h => (
              <th
                key={h}
                className="text-[9px] font-bold uppercase tracking-wider text-text-dim py-2.5 px-3 text-left whitespace-nowrap"
              >
                {h}
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
              className="border-b border-border/30 hover:bg-glass transition-colors"
            >
              <td className="py-2 px-3 text-text-dim whitespace-nowrap">Année {row.year}</td>
              <td className="py-2 px-3 mono text-text">{fmtCompact(row.investedNom)}</td>
              <td className="py-2 px-3 mono text-primary font-semibold">{fmtCompact(row.interestsNom)}</td>
              <td className="py-2 px-3 mono text-text font-semibold">{fmtCompact(row.nominal)}</td>
              <td className="py-2 px-3 mono text-warning">{fmtCompact(row.real)}</td>
              <td className="py-2 px-3 mono text-danger">{fmtCompact(row.fees)}</td>
              <td className="py-2 px-3 mono text-accent">{fmtCompact(row.taxNet)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
