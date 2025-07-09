"use client"

import { format } from "date-fns"
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Label } from "./label"
import { ModernCalendar } from "@/components/ui/ModernCalendar"

interface SimpleDatePickerProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function SimpleDatePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
}: SimpleDatePickerProps) {
  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined

  const handleDateSelect = (date: Date) => {
    // Create a date string in local timezone to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    onChange(`${year}-${month}-${day}`)
  }

  return (
    <div className="flex flex-col">
      {label && <Label className="mb-2">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            {selectedDate ? (
              format(selectedDate, "PPP")
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border bg-white" align="start">
          <ModernCalendar
            selected={selectedDate}
            onSelect={handleDateSelect}
            fromYear={1900}
            toYear={2100}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 