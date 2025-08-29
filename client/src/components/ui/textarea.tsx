import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-2xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-base ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 focus-visible:border-blue-400 hover:border-slate-300 transition-all duration-300 hover:shadow-md focus-visible:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-sm hover:bg-white focus-visible:bg-white resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
