import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/utils/cn"

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({ className, sideOffset = 8, ...props }: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md border border-white/10 bg-[#080d18]/95 px-3 py-2 text-[11px] text-slate-200 shadow-2xl backdrop-blur-xl",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
