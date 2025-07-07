"use client"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select"
import { ReactNode } from "react"
import { Control, FieldValues } from "react-hook-form"

interface SelectFormProps<T extends FieldValues> extends React.ComponentPropsWithoutRef<"select"> {
  control: Control<T>;
  name: string;
  children: ReactNode;
  placeholder: string;
  classname?: string;
  label?: string;

}

export function SelectForm({ control, classname, name, placeholder, label, ...props }: SelectFormProps<any>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(classname)}>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {props.children}
            </SelectContent>
            
          </Select>
          
          <FormMessage />
        </FormItem>
      )}
    />

  )
}