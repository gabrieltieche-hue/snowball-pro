import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/utils/cn"

type ButtonVariant = "default" | "secondary" | "ghost" | "outline" | "danger"
type ButtonSize = "sm" | "md" | "lg" | "icon"

const variants: Record<ButtonVariant, string> = {
  default: "border-primary/30 bg-primary text-[#04100b] shadow-[0_0_28px_rgba(0,242,145,0.18)] hover:bg-primary/90",
  secondary: "border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.09]",
  ghost: "border-transparent bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
  outline: "border-white/12 bg-transparent text-slate-200 hover:bg-white/[0.06]",
  danger: "border-rose-400/30 bg-rose-500/16 text-rose-200 hover:bg-rose-500/22",
}

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-10 px-4 text-xs",
  lg: "h-12 px-5 text-sm",
  icon: "h-9 w-9 p-0",
}

export function Button({
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-semibold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
