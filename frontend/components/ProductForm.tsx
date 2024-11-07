"use client";

import { Key} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {Form} from "@/components/ui/form";
import {
    SelectItem,
} from "@/components/ui/select";
import { Trash } from 'lucide-react';
import { InputForm } from "./ui/InputForm";
import { SelectForm } from "./ui/SelectForm";
import { CalendarForm } from "./ui/CalendarForm";
import { CheckboxForm } from "./ui/CheckboxForm";


export default function ProductForm() {
    const cropTypes = ["Rice", "Maize", "Wheat", "Soybean", "Cotton"];
    const coverageTypes = ["Drought", "Excess Rainfall"];
    const indexTypes = ["Excess Rainfall","Drought"];

    const form = useForm({
      defaultValues: 
      {
      phases: [{ phaseName: "Early", length: "", sos: "" },{ phaseName: "Middle", length: "", sos: "" },{ phaseName: "Late", length: "", sos: "" }],
      indexes: [{ type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '',phases:["Early","Middle","Late"] }]
    }
});
    const { control } = form;
    const {
      fields: phases,
      append: addPhase,
      remove: removePhase,
    } = useFieldArray({
      control,
      name: "phases"
    });
    const {
      fields: indexes,
      append: addIndex,
      remove: removeIndex,
    } = useFieldArray({
      control,
      name: "indexes"
    });
  

    return (
        <Form {...form}>
        <form className="space-y-4">
        <InputForm control={control}  name="productName" placeholder="Enter Product Name" label="Product Name" type="string" />
        <SelectForm control={control}  name="cropType" placeholder="Select Crop type" label="Crop Type">
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
        <div className="flex items-start space-x-3">
          <CalendarForm control={control}  name="plantingDate" placeholder="Enter Planting Date" label="Planting Date"/>
          <InputForm control={control} className="flex flex-col"  name="growingDuration" placeholder="Enter duration" label="Total Growing Duration (days)" type="number" />
        </div>
        <h3 className="font-medium mb-2">Weather Data Period</h3>
        <div className="flex items-start space-x-3">
          <CalendarForm control={control}  name="startDate" placeholder="Enter Start Date" label="Start Date"/>
          <CalendarForm control={control}  name="endDate" placeholder="Enter End Date" label="End Date"/>
        </div>
        <h3 className="font-medium mb-2">Phases</h3>
            {phases.map((item: { id: Key | null | undefined; }, index: number) => (
              <div className="flex gap-2 items-center" key={item.id}>
                <InputForm  
                  control={control} 
                  name={`phases.${index}.phaseName`} 
                  placeholder="Phase Name" 
                  type="string"
                />
                <InputForm  
                  control={control} 
                  name={`phases.${index}.length`}  
                  placeholder="Length (days)" 
                  type="number"
                />
                <InputForm  
                  control={control} 
                  name={`phases.${index}.sos`}  
                  placeholder="SoS + X (days)"
                  type="number"
                  />
                <Button variant="destructive" onClick={(e) => {
                  e.preventDefault();
                  removePhase(index)
                  }}><Trash className="w-4 h-4"/></Button>
              </div>
      ))}
      <Button variant="outline" className="mt-2" 
      onClick={(e)=>{
        e.preventDefault();
        addPhase({ phaseName:"",length:"",sos:"" })}
        }>
          Add Phase
          </Button>

          {/* Indexes */}
            <h3 className="font-medium mb-2">Indexes</h3>
            {indexes.map((item,index) => (
              <div className="w-full p-6 border border-gray-300 shadow-md rounded-lg" key={index}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectForm control={control}  name={`indexes.${index}.type`}   placeholder="Select Index type">
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
                  control={control} 
                  name={`indexes.${index}.trigger`}  
                  placeholder="Trigger (mm)"
                  type="number"
                />
                <InputForm  
                  control={control} 
                  name={`indexes.${index}.exit`}  
                  placeholder="Exit (mm)"
                  type="number"
                />
                <InputForm  
                  control={control} 
                  name={`indexes.${index}.dailyCap`}  
                  placeholder="Daily cap (mm)"
                  type="number"
                />
                                <InputForm  
                  control={control} 
                  name={`indexes.${index}.unitPayout`}  
                  placeholder="Unit Payout (USD)"
                  type="number"
                />
              <InputForm  
                  control={control} 
                  name={`indexes.${index}.maxPayout`}  
                  placeholder="Max Payout (USD)"
                  type="number"
                />
                <CheckboxForm control={control}  name={`indexes.${index}.phases`} label="Apply to Phases" items={phases.map(phase => ({ id: phase.phaseName, label: phase.phaseName }))}/>

                    <div className="col-span-3 flex justify-center">
                      { (phases && phases.length > 0) &&
                        <Button variant="destructive" onClick={(e) => {
                            e.preventDefault()
                            removeIndex(index)
                            }
                          } className="w-12 mr-0">
                            <Trash className="w-4 h-4" />
                         </Button>
                      }
                    </div>
              </div>
              </div>
            ))}
            <Button variant="outline" className="col-span-1 mr-0" onClick={(e)=>{
              e.preventDefault();
              addIndex({ type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '',phases:[] })
              }}>
                Add Index
                </Button>

          <SelectForm control={control}  name="coverageType" placeholder="Select Coverage type" label="Coverage Type">
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
          {/* <CheckboxForm control={control}  name="indexPhase" items={items}/> */}
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
