"use client"

import { format } from "date-fns"
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Control, FieldValues, Path } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FormControl, FormField, FormItem, FormLabel } from "./form"
import { ModernCalendar } from "@/components/ui/ModernCalendar"

interface DatePickerProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label?: string
  placeholder?: string
}

export function DatePicker<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Pick a date",
}: DatePickerProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          {label && <FormLabel>{label}</FormLabel>}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border bg-white" align="start">
              <ModernCalendar
                selected={field.value}
                onSelect={field.onChange}
                fromYear={1900}
                toYear={2100}
              />
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  )
}