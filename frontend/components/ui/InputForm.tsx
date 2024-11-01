"use client"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { Input } from "./input";

interface InputFormProps extends React.ComponentPropsWithoutRef<"input"> {
    control: any;
    name: string;
    placeholder: string;
    classname?: string;
    label?: string;
    values?: any;
    handleChange?: any;
  
  }


export function InputForm({ control, classname, name, placeholder, label,type, values,handleChange }: InputFormProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={
        () => (
        <FormItem className={cn(classname)}>
          <FormLabel>{label}</FormLabel>
            <FormControl>
            <Input 
            placeholder={placeholder} 
            type={type} 
            value={values}
            onChange={handleChange}
            />
            </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

  )
}