import { motion } from "framer-motion"
import { Landmark, Shield, Briefcase, Wallet, Leaf } from "lucide-react"
import { ENVELOPE_CONFIGS } from "../../engine"
import { cn } from "../../utils/cn"
import type { EnvelopeType } from "../../types"

interface EnvelopeSelectorProps {
  value: EnvelopeType
  onChange: (v: EnvelopeType) => void
}

export function EnvelopeSelector({ value, onChange }: EnvelopeSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ENVELOPE_CONFIGS.map(env => {
        const isActive = value === env.id
        const Icon =
          env.id === "pea"
            ? Landmark
            : env.id === "av"
              ? Shield
              : env.id === "per"
                ? Briefcase
                : env.id === "cto"
                  ? Wallet
                  : Leaf
        return (
          <motion.button
            key={env.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(env.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-2.5 border transition-all duration-200",
              isActive ? "bg-opacity-15 border-current shadow-gold" : "glass border-border hover:bg-glass-hover",
            )}
            style={{
              borderColor: isActive ? env.color : undefined,
              background: isActive ? `color-mix(in srgb, ${env.color} 15%, transparent)` : undefined,
            }}
            aria-label={env.name}
            title={env.desc}
          >
            <Icon size={16} style={{ color: isActive ? env.color : "var(--color-text-muted)" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: isActive ? env.color : "var(--color-text-muted)" }}
            >
              {env.shortLabel}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
