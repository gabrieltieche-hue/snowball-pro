import { cn } from "../../utils/cn"

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: "glass" | "glass-strong" | "glass-gold" | "default"
  hover?: boolean
  padding?: "sm" | "md" | "lg"
}

export function Card({ children, className, variant = "glass", hover = false, padding = "md" }: CardProps) {
  const padMap = { sm: "p-4", md: "p-5", lg: "p-6" }
  return (
    <div
      className={cn(
        variant === "glass"
          ? "glass"
          : variant === "glass-strong"
            ? "glass-strong"
            : variant === "glass-gold"
              ? "glass-gold"
              : "",
        "rounded-2xl",
        padMap[padding],
        hover && "hover:bg-glass-hover transition-all duration-300",
        className,
      )}
    >
      {children}
    </div>
  )
}
