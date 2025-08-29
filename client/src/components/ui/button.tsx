import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden active:scale-95 hover:shadow-lg transform-gpu",
  {
    variants: {
      variant: {
        default: "btn-gradient shadow-lg hover:shadow-xl hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:translate-x-[-100%] before:transition-transform before:duration-500 hover:before:translate-x-[100%]",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        outline:
          "btn-outline-glow shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        secondary:
          "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 hover:from-slate-300 hover:to-slate-400 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        ghost: "hover:bg-slate-100 hover:text-slate-800 hover:shadow-md rounded-xl",
        link: "text-slate-700 underline-offset-4 hover:underline hover:text-slate-800 transition-colors",
        premium: "btn-premium shadow-xl hover:shadow-2xl hover:-translate-y-1 relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:via-transparent before:to-transparent before:translate-x-[-100%] before:transition-transform before:duration-700 hover:before:translate-x-[100%]",
        success: "btn-success shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        glass: "bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300 shadow-lg hover:shadow-2xl hover:-translate-y-0.5",
        gradient: "btn-gradient shadow-xl hover:shadow-2xl hover:scale-105 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:transition-transform before:duration-1000 hover:before:translate-x-[100%]"
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base font-bold",
        xl: "h-16 rounded-3xl px-12 text-lg font-bold",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
