"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Form,
} from "@/components/ui/form";
import {
    SelectItem,
} from "@/components/ui/select";
import { Trash } from 'lucide-react';
import { InputForm } from "./ui/InputForm";
import { SelectForm } from "./ui/SelectForm";


export default function ProductForm() {
    const cropTypes = ["Rice", "Maize", "Wheat", "Soybean", "Cotton"];
    const coverageTypes = ["Drought", "Excess Rainfall"];
    const indexTypes = ["Excess Rainfall","Drought"];
    const [phases, setPhases] = useState([{id: 1,  name: '', length: '', sos: '' }]);
    const [indexes, setIndexes] = useState([{ type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '' }]);
    const form = useForm(); // Initialize the form


    // Function to handle adding a new phase
    const addPhase = (e:any) => {
      e.preventDefault();
      setPhases([...phases, {id: phases.length + 1 ,name: '', length: '', sos: '' }]);
    };
      // Function to delete a phase
    const deletePhase = (e:any,index:number) => {
      e.preventDefault();
      const updatedPhases = phases.filter((_, i) => i !== index);
      setPhases(updatedPhases);
    };
    const addIndex = (e:any) => {
        e.preventDefault();
        setIndexes([...indexes, { type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '' }]);
    }
    const deleteIndex = (e:any,index:number) => {
        e.preventDefault();
        const updatedIndexes = indexes.filter((_, i) => i !== index);
        setIndexes(updatedIndexes);
    }
    const handleInputChange = (id:number,property:string, newValue:any) => {
      setPhases((prevItems) =>
        prevItems.map((item) => (item.id === id ? { ...item, [property]: newValue } : item))
      );
    };

    return (
        <Form {...form}>
        <form className="space-y-4">
        <InputForm control={form.control}  name="productName" placeholder="Enter Product Name" label="Product Name" type="string" />
        <SelectForm control={form.control}  name="cropType" placeholder="Select Crop type" label="Crop Type">
          {
            cropTypes.map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
                  )
                )
          }
        </SelectForm>


          {/* Total Growing Duration */}
          <InputForm control={form.control}  name="growingDuration" placeholder="Enter duration" label="Total Growing Duration (days)" type="number" />

          {/* Phases */}
          <h3 className="font-medium mb-2">Phases</h3>
            {phases.map((phase, index) => (
              <div className="flex gap-2 items-center" key={index}>
                <InputForm  
                  control={form.control} 
                  name={`phaseName_${phase.id}`} 
                  placeholder="Phase Name" 
                  type="string"
                />
                <InputForm  
                  control={form.control} 
                  name={`phaseLength_${phase.id}`} 
                  placeholder="Length (days)" 
                  type="number"
                />
                <InputForm  
                  control={form.control} 
                  name={`sos_${phase.id}`} 
                  placeholder="SoS + X (days)"
                  type="number"
                  />
                <Button variant="destructive" onClick={(e) => deletePhase(e,index)}><Trash className="w-4 h-4"/></Button>
              </div>
      ))}
      <Button variant="outline" className="mt-2" onClick={addPhase}>Add Phase</Button>

          {/* Indexes */}
            <h3 className="font-medium mb-2">Indexes</h3>
            {indexes.map((index, idx) => (
              <div className="w-full p-6 border border-gray-300 shadow-md rounded-lg" key={idx}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectForm control={form.control}  name={`index_${idx}`} placeholder="Select Index type">
                  {
                    indexTypes.map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                          )
                        )
                  }
                </SelectForm>
                <InputForm  
                  control={form.control} 
                  name={`index_${idx}`} 
                  placeholder="Trigger (mm)"
                  type="number"
                />
                <InputForm  
                  control={form.control} 
                  name={`index_${idx}`} 
                  placeholder="Exit (mm)"
                  type="number"
                />
                <InputForm  
                  control={form.control} 
                  name={`index_${idx}`} 
                  placeholder="Daily cap (mm)"
                  type="number"
                />
                                <InputForm  
                  control={form.control} 
                  name={`index_${idx}`} 
                  placeholder="Unit Payout (USD)"
                  type="number"
                />
              <InputForm  
                  control={form.control} 
                  name={`idx_${idx}`} 
                  placeholder="Max Payout (USD)"
                  type="number"
                />

                    <div className="col-span-3 flex justify-center">
                        <Button variant="destructive" onClick={(e) => deleteIndex(e,idx)} className="w-12 mr-0">
                            <Trash className="w-4 h-4" /> {/* Responsive icon */}
                         </Button>
                    </div>
              </div>
              </div>
            ))}
            <Button variant="outline" className="col-span-1 mr-0" onClick={addIndex}>Add Index</Button>

          <SelectForm control={form.control}  name="coverageType" placeholder="Select Coverage type" label="Coverage Type">
          {
            coverageTypes.map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
                  )
                )
          }
        </SelectForm>


          {/* Premium Calculation */}
          <h3 className="font-medium">Premium Calculation</h3>
          <div className="mt-4 p-4  text-center rounded-lg bg-gray-200">
            <span className="text-2xl font-bold">$100.00 USD</span>
          </div>

          {/* Save Product Button */}
          <div className="flex justify-center items-start space-x-6">
          <Button type="submit" className="w-full mt-4" variant="agro" color="green">
            Save Product
          </Button>
          <Button type="submit" className="w-full mt-4" variant="destructive" color="green">
            Discard Product
          </Button>
          </div>
        </form>
      </Form>

    );
}
