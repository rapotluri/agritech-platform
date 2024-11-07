"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "./form"
import { Control, FieldValues } from "react-hook-form"

export interface CheckboxProps<T extends FieldValues> {
  control: Control<T>
  name: string
  label: string
  items: { id: string; label: string }[]
}

const CheckboxForm = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & CheckboxProps<any>


>(({ control, name, className, label,items, ...props }, ref) => (


  <FormField
    control={control}
    name={name}
    render={() => (
      <FormItem>
        <div className={cn("mb-4", className)}>
              <FormLabel className="text-base">{label}</FormLabel>
              {
              items.map((item) => (
                <FormField
                  key={item.id}
                  control={control}
                  name={name}
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row m-2 items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                        <CheckboxPrimitive.Root
                          className={cn(
                            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className
                          )}
                          checked={field.value?.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const updatedValue = field.value || []; // Ensure field.value is an array
                            if (checked) {
                              field.onChange([
                                ...updatedValue,
                                item.id,
                              ]);
                            } else {
                              field.onChange(
                                updatedValue.filter(
                                  (value: string) => value !== item.id
                                )
                              );
                            }
                          }}


                          {...props}

                          {...field}
                          ref={ref}
                        >
                          <CheckboxPrimitive.Indicator
                            className={cn("flex items-center justify-center text-current")}

                          >
                            <Check className="h-4 w-4" />
                          </CheckboxPrimitive.Indicator>
                        </CheckboxPrimitive.Root>
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
      </FormItem >

    )}
  />
))
CheckboxForm.displayName = CheckboxPrimitive.Root.displayName

export { CheckboxForm }