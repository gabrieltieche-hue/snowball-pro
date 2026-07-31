import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/utils/cn"

export function Slider({ className, ...props }: SliderPrimitive.SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-slate-950 shadow-[0_0_18px_rgba(0,242,145,0.45)] outline-none transition focus-visible:ring-2 focus-visible:ring-primary/70" />
    </SliderPrimitive.Root>
  )
}
