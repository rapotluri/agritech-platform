"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash } from 'lucide-react';
import { Input } from "./ui/input";



const dataTypes = ["Temperature", "Precipitation"];

export default function ProductForm() {
    const cropTypes = ["Rice", "Maize", "Wheat", "Soybean", "Cotton"];
    const coverageTypes = ["Drought", "Excess Rainfall"];
    const [phases, setPhases] = useState([{ name: '', length: '', sos: '' }]);
    const [indexes, setIndexes] = useState([{ type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '' }]);
    const form = useForm(); // Initialize the form


    // Function to handle adding a new phase
    const addPhase = () => {
      setPhases([...phases, { name: '', length: '', sos: '' }]);
    };
      // Function to delete a phase
    const deletePhase = (index:number) => {
        const updatedPhases = phases.filter((_, i) => i !== index);
        setPhases(updatedPhases);
    };
    const addIndex = () => {
        setIndexes([...indexes, { type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '' }]);
    }
    const deleteIndex = (index:number) => {
        const updatedIndexes = indexes.filter((_, i) => i !== index);
        setIndexes(updatedIndexes);
    }

    const onSubmit = (values:any) => {
      // Handle form submission
      console.log(values);
    };
    

    return (
        <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
                    control={form.control}
                    name="dataType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Crop Type</FormLabel>
                            <Select onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Crop type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {cropTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
        />


          {/* Total Growing Duration */}
          <FormField
            control={form.control}
            name="growingDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Growing Duration (days)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter duration" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phases */}
          <FormItem>
      <h3 className="font-medium mb-2">Phases</h3>
      {phases.map((phase, index) => (
        <div className="flex gap-2 items-center" key={index}>
          <FormControl>
            <Input 
              placeholder="Phase name" 
              value={phase.name} 
            />
          </FormControl>
          <FormControl>
            <Input 
              placeholder="Length (days)" 
              type="number" 
              value={phase.length} 
            />
          </FormControl>
          <FormControl>
            <Input 
              placeholder="SoS + X (days)" 
              type="number" 
              value={phase.sos} 
            />
          </FormControl>
          <Button variant="destructive" onClick={() => deletePhase(index)}><Trash className="w-4 h-4"/></Button>
        </div>
      ))}
      <Button variant="outline" className="mt-2" onClick={addPhase}>Add Phase</Button>
    </FormItem>

          {/* Indexes */}
          <FormItem>
            <h3 className="font-medium mb-2">Indexes</h3>
            <FormControl>
                <Select>
                <option>Select index type</option>
                </Select>
            </FormControl>
            {indexes.map((index, idx) => (
            <div className="w-full p-6 border border-gray-300 shadow-md rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> 
              <FormControl>
                <Input 
                  placeholder="Trigger (mm)" 
                  type="number" 
                  value={index.trigger} 
                />
              </FormControl>
              <FormControl>
                <Input 
                  placeholder="Exit (mm)" 
                  type="number" 
                  value={index.exit} 
                />
              </FormControl>
              <FormControl>
                <Input 
                  placeholder="Daily cap (mm)" 
                  type="number" 
                  value={index.dailyCap} 
                />
              </FormControl>
              <FormControl>
                <Input 
                  placeholder="Unit Payout (USD)" 
                  type="number" 
                  value={index.unitPayout} 
                />
              </FormControl>
              <FormControl>
                <Input 
                  placeholder="Max Payout (USD)" 
                  type="number" 
                  value={index.maxPayout} 
                />
              </FormControl>
              <div className="col-span-1 flex justify-end">
                <Button variant="destructive" onClick={() => deleteIndex(idx)} className="w-12 mr-0">
                    <Trash className="w-4 h-4" /> {/* Responsive icon */}
                </Button>
              </div>
              </div>
              </div>
            ))}
            <Button variant="outline" className="col-span-1 mr-0" onClick={addIndex}>Add Index</Button>
          
            </FormItem>
          {/* Coverage Type */}
          <FormField
                    control={form.control}
                    name="dataType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Coverage Type</FormLabel>
                            <Select onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Coverage type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {coverageTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />



          {/* Premium Calculation */}
          <h3 className="font-medium">Premium Calculation</h3>
          <div className="mt-4 p-4  text-center rounded-lg">
            <span className="text-2xl font-bold">$100.00 USD</span>
          </div>

          {/* Save Product Button */}
          <Button type="submit" className="w-full mt-4" variant="agro" color="green">
            Save Product
          </Button>
        </form>
      </Form>

    );
}
