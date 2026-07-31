import { motion } from "framer-motion"
import { cn } from "../../utils/cn"
import { SliderInput } from "../shared/SliderInput"

const CRISIS_PROFILES = [
  { id: "flash-crash", label: "Flash Crash", desc: "-25% en 1 an", color: "#C9A324" },
  { id: "bear-market", label: "Bear Market", desc: "-40% sur 2 ans", color: "#8B3A3A" },
  { id: "long-depression", label: "Dépression Longue", desc: "-55% sur 5 ans", color: "#A84A4A" },
  { id: "stagflation", label: "Stagflation", desc: "-35% sur 4 ans", color: "#B8960F" },
]

interface CrisisSelectorProps {
  profile: string
  amplitude: number
  year: number
  onProfileChange: (v: string) => void
  onAmplitudeChange: (v: number) => void
  onYearChange: (v: number) => void
}

export function CrisisSelector({
  profile,
  amplitude,
  year,
  onProfileChange,
  onAmplitudeChange,
  onYearChange,
}: CrisisSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {CRISIS_PROFILES.map(cp => (
          <motion.button
            key={cp.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onProfileChange(cp.id)}
            className={cn(
              "rounded-xl p-3 border text-left transition-all",
              profile === cp.id ? "border-current bg-opacity-10" : "glass border-border hover:bg-glass-hover",
            )}
            style={profile === cp.id ? { borderColor: cp.color, background: `${cp.color}15` } : undefined}
          >
            <div className="text-xs font-bold" style={{ color: profile === cp.id ? cp.color : "#F5F0E8" }}>
              {cp.label}
            </div>
            <div className="text-[9px] text-text-dim mt-0.5">{cp.desc}</div>
          </motion.button>
        ))}
      </div>
      <SliderInput
        label="Année du choc"
        id="crisis-year"
        value={year}
        min={1}
        max={50}
        step={1}
        onChange={onYearChange}
        color="#8B3A3A"
      />
      <SliderInput
        label="Amplitude (%)"
        id="crisis-amp"
        value={amplitude}
        min={5}
        max={70}
        step={1}
        onChange={onAmplitudeChange}
        color="#8B3A3A"
        suffix={`-${amplitude}% du capital`}
      />
    </div>
  )
}
