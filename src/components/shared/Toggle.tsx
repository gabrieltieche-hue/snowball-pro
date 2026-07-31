import { motion } from "framer-motion"
import { cn } from "../../utils/cn"

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  sub?: string
}

const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 }

export function Toggle({ checked, onChange, label, sub }: ToggleProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between glass rounded-xl px-4 py-3 cursor-pointer hover:bg-glass-hover transition-colors"
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
    >
      <div>
        <div className="text-xs font-semibold text-text">{label}</div>
        {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
      </div>
      <div
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors duration-300 flex-shrink-0",
          checked ? "bg-primary" : "bg-text-dim/30",
        )}
      >
        <motion.div
          animate={{ x: checked ? 18 : 2 }}
          transition={springConfig}
          className="absolute w-4 h-4 bg-white rounded-full top-0.5 shadow-sm"
        />
      </div>
    </motion.div>
  )
}
