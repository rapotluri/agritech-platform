"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const getToggleVariants = (variant: "default" | "outline" = "default", size: "default" | "sm" | "lg" = "default") => {
  const variantClasses = {
    default: "bg-background text-foreground hover:bg-muted hover:text-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  }
  
  const sizeClasses = {
    default: "h-10 px-3",
    sm: "h-9 px-2.5",
    lg: "h-11 px-8",
  }
  
  return `${variantClasses[variant]} ${sizeClasses[size]}`
}

const Toggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline"
    size?: "default" | "sm" | "lg"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <button
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      getToggleVariants(variant, size),
      className
    )}
    ref={ref}
    {...props}
  />
))
Toggle.displayName = "Toggle"

export { Toggle, getToggleVariants }
