interface SectionTitleProps {
  children: React.ReactNode
  icon?: React.ElementType
}

export function SectionTitle({ children, icon: Icon }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-text-dim mt-6 mb-4 pb-2 border-b border-border">
      {Icon && <Icon size={12} />}
      {children}
    </div>
  )
}
