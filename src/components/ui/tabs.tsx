import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/utils/cn"

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex rounded-lg border border-white/10 bg-white/[0.035] p-1 backdrop-blur-xl", className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-100 data-[state=active]:bg-primary/15 data-[state=active]:text-primary",
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("outline-none", className)} {...props} />
}
