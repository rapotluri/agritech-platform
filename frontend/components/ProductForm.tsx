"use client";

import { Key, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { Trash, Loader2 } from 'lucide-react';
import { InputForm } from "./ui/InputForm";
import { SelectForm } from "./ui/SelectForm";
import { CalendarForm } from "./ui/CalendarForm";
import apiClient from "@/lib/apiClient";
import { SimpleTooltip } from "./ui/tooltip";

type PremiumResponse = {
  status: string;
  premium: {
    rate: number;
    etotal: number;
    max_payout: number;
  };
  phase_analysis: {
    [phase: string]: {
      indexes: {
        [index: string]: {
          average_payout_percentage: number;
          total_payout: number;
          max_payout: number;
          min_payout: number;
        };
      };
      total_contribution: number;
    };
  };
  risk_metrics: {
    years_analyzed: number;
    payout_years: number;
    payout_probability: number;
    average_annual_payout: number;
    max_annual_payout: number;
    min_annual_payout: number;
  };
  yearly_analysis: Array<{
    year: number;
    total_payout: number;
    triggers: Array<{
      phase: string;
      index_type: string;
      rainfall: number;
      trigger_value: number;
      payout: number;
    }>;
  }>;
};

// Add this type for task status response
type TaskResponse = {
  task_id: string;
  status: string;
  result?: PremiumResponse;  // Use the existing PremiumResponse type
};

// Update the component props
interface ProductFormProps {
  setPremiumResponse: (response: PremiumResponse | null) => void;
}

// Create zod schema
const formSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  commune: z.string().min(1, "Commune is required"),
  cropType: z.string().min(1, "Crop type is required"),
  coverageType: z.string().min(1, "Coverage type is required"),
  growingDuration: z.string().min(1, "Growing duration is required"),
  plantingDate: z.any(),
  weatherDataPeriod: z.string().min(1, "Weather data period is required"),
  phases: z.array(
    z.object({
      phaseName: z.string().min(1, "Phase name is required"),
      length: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Length must be a positive number"),
      sosStart: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Start must be a non-negative number"),
      sosEnd: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "End must be a positive number")
    })
  ).refine(phases => {
    // Check phases follow each other correctly
    for (let i = 0; i < phases.length; i++) {
      const currentPhase = phases[i];
      
      // Check if end date = start date + length - 1
      if (Number(currentPhase.sosStart) + Number(currentPhase.length) - 1 !== Number(currentPhase.sosEnd)) {
        return false;
      }
      
      // Check if this phase starts after previous phase ends
      if (i > 0 && Number(phases[i].sosStart) !== Number(phases[i-1].sosEnd) + 1) {
        return false;
      }
    }
    return true;
  }, "Phases must follow each other continuously with correct lengths"),
  indexes: z.array(
    z.object({
      type: z.string().optional(),
      trigger: z.string().optional(),
      exit: z.string().optional(),
      dailyCap: z.string().optional(),
      unitPayout: z.string().optional(),
      maxPayout: z.string().optional(),
      consecutiveDays: z.string().optional(),
      phases: z.array(z.string()).optional()
    })
  )
});

export default function ProductForm({ setPremiumResponse }: ProductFormProps) {
  const cropTypes = ["Rice", "Maize", "Wheat", "Soybean", "Cotton"];
  const coverageTypes = ["Drought", "Excess Rainfall"];
  const indexTypes = ["Excess Rainfall", "Drought"];
  const communes = [
    "KaohChiveang", "PeamAek", "PreaekKhpob", "PreaekLuong", "PreaekNorint",
    "PreyChas", "SamraongKnong", "BayDamram", "ChaengMeanChey", "ChheuTeal",
    "KantueuMuoy", "KantueuPir", "PhnumSampov", "Snoeng", "TaKream",
    "ChomkarSomraong", "KdolDounTeav", "OMal", "OuChar", "PrekPreahSdach",
    "Rottanak", "SlaKet", "SvayPor", "TuolTaEk", "WatKor",
    "AmpilPramDaeum", "Bavel", "BoeungPram", "KdolTaHaen", "KhlaengMeas",
    "KhnachRomeas", "Lvea", "PreyKhpos", "BoengReang", "Kamrieng",
    "OuDa", "TaKrei", "TaSaen", "Trang", "ChhnalMoan",
    "DounBa", "Hab", "KaosKrala", "PreahPhos", "Thipakdei",
    "Chrey_x", "Kakaoh", "Kear", "Moung", "PreySvay",
    "PreyTouch", "RobasMongkol", "RuesseiKrang", "TaLoas", "BarangThleak",
    "Bour", "OuRumduol", "PechChenda", "PhnumProek", "AndaeukHaeb",
    "PhlovMeas", "ReaksmeiSongha", "Sdau", "Traeng", "Basak",
    "MukhReah", "PreaekChik", "PreyTralach", "SdokPravoek", "KampongLpov",
    "MeanChey", "OuSamril", "Samlout", "Sung", "TaSanh",
    "TaTaok", "AngkorBan", "ChreySeima", "SampovLun", "Santepheap",
    "SereiMeanChey", "TaSda", "AnlongVil", "KampongPreah", "KampongPrieng",
    "Norea", "OuDambangMuoy", "OuDambangPir", "ReangKesei", "Roka",
    "TaPon", "VaotTaMuem", "AnlongRun", "BansayTraeng", "BoengPring",
    "Chrey_y", "ChrouySdau", "KoukKhmum", "OuTaKi", "RungChrey",
    "TaMeun", "TaPung", "TonléSap"
  ];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phases: [
        { phaseName: "Early", length: "61", sosStart: "0", sosEnd: "60" },
        { phaseName: "Middle", length: "60", sosStart: "61", sosEnd: "120" },
        { phaseName: "Late", length: "60", sosStart: "121", sosEnd: "180" }
      ],
      indexes: [
        { type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '', consecutiveDays: '', phases: ["Early", "Middle", "Late"] }
      ]
    }
  });

  const { control, watch, setValue,getValues, formState } = form;
  const { fields: phases, append: addPhase, remove: removePhase } = useFieldArray({
    control,
    name: "phases"
  });
  const { fields: indexes, append: addIndex, remove: removeIndex } = useFieldArray({
    control,
    name: "indexes"
  });

  // Watch for changes in phases
  const watchedPhases = watch("phases");
  
  useEffect(() => {
    // Batch updates to prevent multiple re-renders
    const updates: { (): void; (): void; }[] = [];
    
    watchedPhases.forEach((phase, index) => {
      // Skip if no length or start
      if (!phase.length || !phase.sosStart) return;  
      
      const start = Number(phase.sosStart);
      const length = Number(phase.length);
      
      if (!isNaN(start) && !isNaN(length) && length > 0) {
        // Calculate end date
        const end = start + length - 1;
        const currentEnd = getValues(`phases.${index}.sosEnd`);
        
        if (currentEnd !== end.toString()) {
          updates.push(() => setValue(`phases.${index}.sosEnd`, end.toString()));
        }
  
        // Update next phase start date if there is one
        if (index < watchedPhases.length - 1) {
          const nextStart = getValues(`phases.${index + 1}.sosStart`);
          if (nextStart !== (end + 1).toString()) {
            updates.push(() => setValue(`phases.${index + 1}.sosStart`, (end + 1).toString()));
          }
        }
      }
    });
    
    // Apply all updates at once
    updates.forEach(update => update());
    
  }, [watchedPhases, setValue, getValues]);

  const [isCalculating, setIsCalculating] = useState(false);

  const onSubmit = async (data: any) => {
    setIsCalculating(true);
    try {
      if (data.plantingDate instanceof Date) {
        data.plantingDate = data.plantingDate.toISOString().split('T')[0];
      }

      // Initial request to start calculation
      const response = await apiClient.post('/api/premium/calculate', data);

      if (response.status !== 200) {
        throw new Error('Failed to calculate premium');
      }

      const taskId = response.data.task_id;

      // Poll for task completion
      const pollInterval = setInterval(async () => {
        try {
          const taskResponse = await apiClient.get<TaskResponse>(`/api/tasks/${taskId}`);
          
          if (taskResponse.data.status === 'SUCCESS' && taskResponse.data.result) {
            clearInterval(pollInterval);
            setPremiumResponse(taskResponse.data.result);
            setIsCalculating(false);
          } else if (taskResponse.data.status === 'FAILURE') {
            clearInterval(pollInterval);
            throw new Error('Premium calculation failed');
          }
        } catch (error) {
          clearInterval(pollInterval);
          console.error('Error checking task status:', error);
          setPremiumResponse(null);
          setIsCalculating(false);
        }
      }, 2000); // Poll every 2 seconds

      // Clean up interval if component unmounts
      return () => clearInterval(pollInterval);

    } catch (error) {
      console.error('Error calculating premium:', error);
      setPremiumResponse(null);
      setIsCalculating(false);
    }
  };

  // Add a convenience function to create a new phase with proper values
  const handleAddPhase = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const phases = watchedPhases;
    if (phases.length === 0) {
      // First phase starts at 0
      addPhase({ phaseName: "", length: "", sosStart: "0", sosEnd: "" });
    } else {
      // New phase starts after the last phase ends
      const lastPhase = phases[phases.length - 1];
      const nextStart = lastPhase.sosEnd ? (Number(lastPhase.sosEnd) + 1).toString() : "0";
      addPhase({ phaseName: "", length: "", sosStart: nextStart, sosEnd: "" });
    }
  };

  // Add a function to handle phase removal and adjust subsequent phases
  const handleRemovePhase = (index: number) => {
    // If we're removing a phase that's not the last one, we need to adjust the start days of later phases
    if (index < watchedPhases.length - 1) {
      // Get the start day of the phase we're removing
      const removedPhaseStart = Number(watchedPhases[index].sosStart);
      const removedPhaseLength = Number(watchedPhases[index].length);
      
      // Remove the phase first
      removePhase(index);
      
      // If there's a previous phase, connect the next phase to it
      if (index > 0) {
        const prevPhaseEnd = Number(watchedPhases[index-1].sosEnd);
        setValue(`phases.${index}.sosStart`, (prevPhaseEnd + 1).toString());
      }
      
      // Adjust all subsequent phases
      for (let i = index; i < watchedPhases.length - 1; i++) {
        // Recalculate phase start and end
        const currentStart = Number(watchedPhases[i].sosStart);
        const currentLength = Number(watchedPhases[i].length);
        const newStart = i === index ? 
          (index > 0 ? Number(watchedPhases[index-1].sosEnd) + 1 : removedPhaseStart) : 
          Number(watchedPhases[i-1].sosEnd) + 1;
        
        setValue(`phases.${i}.sosStart`, newStart.toString());
        if (currentLength) {
          setValue(`phases.${i}.sosEnd`, (newStart + currentLength - 1).toString());
        }
      }
    } else {
      // If it's the last phase, simply remove it
      removePhase(index);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <SimpleTooltip content="The name of the insurance product">
            <InputForm control={control} name="productName" placeholder="Enter Product Name" label="Product Name" type="string" />
          </SimpleTooltip>  
          
          <SimpleTooltip content="The commune where the crop is grown">
            <SelectForm control={control} name="commune" placeholder="Select Commune" label="Commune">
              {communes.map((commune) => (
                <SelectItem key={commune} value={commune}>
                  {commune}
                </SelectItem>
              ))}
            </SelectForm>
          </SimpleTooltip>

          <SimpleTooltip content="The type of crop for your insurance product">
            <SelectForm control={control} name="cropType" placeholder="Select Crop type" label="Crop Type">
              {cropTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectForm>
          </SimpleTooltip>
          <SimpleTooltip content="The Coverage type for your insurance product">
          <SelectForm control={control} name="coverageType" placeholder="Select Coverage type" label="Coverage Type">
            {coverageTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectForm>
          </SimpleTooltip>
        </div>
        <div className="grid grid-cols-2 gap-4">
        <SimpleTooltip content="The total growing duration for the crop in days">
            <InputForm
              control={control}
              name="growingDuration"
              placeholder="Enter duration"
              label="Total Growing Duration (days)"
              type="number"
            />
          </SimpleTooltip>
          <SimpleTooltip content="The time period used for analysing weather data">
          <SelectForm control={control} name="weatherDataPeriod" placeholder="Select Data Period" label="Weather Data Period">
            <SelectItem value="10">10 years</SelectItem>
            <SelectItem value="20">20 years</SelectItem>
            <SelectItem value="30">30 years</SelectItem>
          </SelectForm>
        </SimpleTooltip>
        </div>

        <h3 className="text-xl font-bold tracking-tight">Weather Data Period</h3>
        <p className="text-md text-muted-foreground">Select Growing Duration and Weather Data Period for risk analysis</p>

          <SimpleTooltip content="The planting date for the crop">
            <div className="mt-3">
          <CalendarForm
            control={control}
            name="plantingDate"
            label="Planting Date"
            placeholder="Select a date"
          />
          </div>
          </SimpleTooltip>

        <h3 className="text-xl font-bold tracking-tight">Phases</h3>
        <p className="text-md text-muted-foreground">Enter Phase Details and Durations for Selected Crop</p>
        
        {/* Display validation error if phases don't align properly */}
        {formState.errors.phases && (
          <div className="text-red-500 text-sm mb-2">
            {formState.errors.phases.message}
          </div>
        )}
        
        {phases.map((item: { id: Key | null | undefined; }, index: number) => (
          <div className="flex gap-2 items-center" key={item.id}>
            <SimpleTooltip content="Name of the crop phase">
              <InputForm 
                control={control} 
                name={`phases.${index}.phaseName`} 
                placeholder="Phase Name" 
                label="Phase Name"
                type="string" 
              />
            </SimpleTooltip>
            <SimpleTooltip content="The length of the phase in days">
              <InputForm 
                control={control} 
                name={`phases.${index}.length`} 
                placeholder="Length (days)" 
                label="Phase Length (days)"
                type="number" 
              />
            </SimpleTooltip>
            <div className="flex items-center gap-2">
            <SimpleTooltip content="The start the phase in days">
              <InputForm 
                control={control} 
                name={`phases.${index}.sosStart`} 
                placeholder="From" 
                type="number" 
                label="Phase Start"
                className="w-24"
                disabled
              />
              </SimpleTooltip>
              <SimpleTooltip content="The end of the phase in days">
              <InputForm 
                control={control} 
                name={`phases.${index}.sosEnd`}
                label="Phase End" 
                placeholder="To" 
                type="number" 
                className="w-24"
                disabled // End date is always calculated
              />
              </SimpleTooltip>
            </div>
            <Button
              className="mt-7"
              type="button"
              variant="destructive" 
              onClick={(e) => {
                e.preventDefault();
                handleRemovePhase(index);
              }}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
        type="button"
          variant="outline" 
          className="mt-2" 
          onClick={handleAddPhase}
        >
          Add Phase
        </Button>

        {/* Indexes */}
        <h3 className="text-xl font-bold tracking-tight">Indexes</h3>
        <p className="text-md text-muted-foreground">Enter Index Details for Insurance Product</p>
        {indexes.map((item, index) => (
          <div className="w-full p-6 border border-gray-300 shadow-md rounded-lg" key={item.id}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SimpleTooltip content="Coverage Type of the Index">
                <SelectForm control={control} name={`indexes.${index}.type`} label="Index Coverage Type" placeholder="Select Index type">
                  {indexTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectForm>
              </SimpleTooltip>
              <SimpleTooltip content="The number of consecutive days for the trigger">
                <InputForm label="Trigger Days" control={control} name={`indexes.${index}.consecutiveDays`} placeholder="Consecutive days for trigger" type="number" />
              </SimpleTooltip>
              <SimpleTooltip content="The rainfall trigger value for the index in mm">
                <InputForm label="Trigger" control={control} name={`indexes.${index}.trigger`} placeholder="Trigger (mm)" type="number" />
              </SimpleTooltip>
              <SimpleTooltip content="The exit trigger value for the index in mm">
                <InputForm label="Exit Trigger" control={control} name={`indexes.${index}.exit`} placeholder="Exit (mm)" type="number" />
              </SimpleTooltip>
              <SimpleTooltip content="The daily capacity for rainfall in mm">
                <InputForm label="Daily Cap" control={control} name={`indexes.${index}.dailyCap`} placeholder="Daily cap (mm)" type="number" />
              </SimpleTooltip>
              <SimpleTooltip content="The unit payout of the index in USD">
                <InputForm label="Unit Payout" control={control} name={`indexes.${index}.unitPayout`} placeholder="Unit Payout (USD)" type="number" />
              </SimpleTooltip>
              <SimpleTooltip content="The max payout of the index in USD">
                <InputForm label="Max Payout" control={control} name={`indexes.${index}.maxPayout`} placeholder="Max Payout (USD)" type="number" />
              </SimpleTooltip>

              <div className="col-span-3 flex justify-center">
                {(phases && phases.length > 0) &&
                  <Button 
                  type="button"
                    variant="destructive" 
                    onClick={(e) => {
                      e.preventDefault();
                      removeIndex(index);
                    }} 
                    className="w-12 mr-0"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                }
              </div>
            </div>
          </div>
        ))}
        <Button 
          variant="outline"
          type="button" 
          className="col-span-1 mr-0" 
          onClick={(e) => {
            e.preventDefault();
            addIndex({ 
              type: '', 
              trigger: '', 
              exit: '', 
              dailyCap: '', 
              unitPayout: '', 
              maxPayout: '', 
              consecutiveDays: '', 
              phases: [] 
            });
          }}
        >
          Add Index
        </Button>


        {/* Calculate Premium Button */}
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          className="w-full" 
          variant="default"
          disabled={isCalculating}
        >
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            'Calculate Premium'
          )}
        </Button>

        {/* Save and Discard Buttons */}
        <div className="flex justify-center items-start space-x-6 mt-8">
          <Button type="submit" className="w-full" variant="agro" color="green">
            Save Product
          </Button>
          <Button 
            type="button" 
            className="w-full" 
            variant="destructive" 
            color="green" 
            onClick={() => {
              form.reset();
              setPremiumResponse(null);
            }}
          >
            Discard Product
          </Button>
        </div>
      </form>
    </Form>
  );
}