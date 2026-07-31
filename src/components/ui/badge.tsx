import type { HTMLAttributes } from "react"
import { cn } from "@/utils/cn"

type BadgeVariant = "default" | "muted" | "success" | "warning" | "danger" | "outline"

const variants: Record<BadgeVariant, string> = {
  default: "border-primary/30 bg-primary/12 text-primary",
  muted: "border-white/10 bg-white/[0.04] text-slate-300",
  success: "border-emerald-400/30 bg-emerald-400/12 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-400/12 text-amber-300",
  danger: "border-rose-400/30 bg-rose-400/12 text-rose-300",
  outline: "border-white/12 bg-transparent text-slate-300",
}

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
