"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateInputProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

export function DateInput({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  disabled = false,
  className,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            // Add error styling when aria-invalid is true
            ariaInvalid && "border-destructive ring-destructive",
            className
          )}
        >
          {value ? value.toLocaleDateString() : placeholder}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto overflow-hidden p-0 z-[100]" 
        align="start"
      >
        <div style={{ pointerEvents: 'auto' }}>
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            disabled={disabled}
            fromYear={1900}
            toYear={2100}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
