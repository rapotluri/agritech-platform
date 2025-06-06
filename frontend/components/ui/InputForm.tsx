import * as React from "react"

import { cn } from "@/lib/utils"
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "./form"
import { Control, FieldValues } from "react-hook-form"
export interface InputProps<T extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  control: Control<T>
  name: string
  label?: string
}

const InputForm = React.forwardRef<HTMLInputElement, InputProps<any>>(
  ({ className, type, control, name, label, ...props }, ref) => {
    return (

      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <input
                type={type}
                className={cn(
                  "flex flex-col h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  className
                )}
                {...field}
                ref={ref}
                {...props}
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

    )
  }
)
InputForm.displayName = "Input"

export { InputForm }