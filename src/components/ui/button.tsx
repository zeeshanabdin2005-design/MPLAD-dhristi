import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-blue-600 text-slate-900 hover:bg-blue-500": variant === "default",
            "bg-red-500/10 text-red-500 hover:bg-red-500/20": variant === "destructive",
            "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-800": variant === "outline",
            "bg-slate-100 text-slate-100 hover:bg-slate-200": variant === "secondary",
            "hover:bg-slate-100 text-slate-700 hover:text-slate-100": variant === "ghost",
            "text-blue-500 underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
