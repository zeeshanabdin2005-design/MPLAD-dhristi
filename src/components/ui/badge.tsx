import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-blue-600 text-slate-900 hover:bg-blue-700": variant === "default",
          "border-transparent bg-slate-100 text-slate-100 hover:bg-slate-200": variant === "secondary",
          "border-transparent bg-red-500/20 text-red-400 border-red-500/30": variant === "destructive",
          "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30": variant === "success",
          "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30": variant === "warning",
          "text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
