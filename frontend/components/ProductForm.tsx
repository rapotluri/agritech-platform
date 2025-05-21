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
import { DatePicker } from "./ui/datepicker";
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
  province: z.string().min(1, "Province is required"),
  commune: z.string().min(1, "Commune is required"),
  cropType: z.string().min(1, "Crop type is required"),
  coverageType: z.string().min(1, "Coverage type is required"),
  growingDuration: z.string().min(1, "Growing duration is required"),
  plantingDate: z.date({
    required_error: "Planting date is required",
  }),
  weatherDataPeriod: z.string().min(1, "Weather data period is required"),
  indexes: z.array(
    z.object({
      type: z.string().optional(),
      trigger: z.string().optional(),
      exit: z.string().optional(),
      dailyCap: z.string().optional(),
      unitPayout: z.string().optional(),
      maxPayout: z.string().optional(),
      consecutiveDays: z.string().optional(),
      phaseName: z.string().min(1, "Phase name is required"),
      length: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Length must be a positive number"),
      sosStart: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Start must be a non-negative number"),
      sosEnd: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "End must be a positive number")
    })
  ).refine(indexes => {
    // Check phases follow each other correctly
    for (let i = 0; i < indexes.length; i++) {
      const currentIndex = indexes[i];
      
      // Check if end date = start date + length - 1
      if (Number(currentIndex.sosStart) + Number(currentIndex.length) - 1 !== Number(currentIndex.sosEnd)) {
        return false;
      }
      
      // Check if this phase starts after previous phase ends
      if (i > 0 && Number(indexes[i].sosStart) !== Number(indexes[i-1].sosEnd) + 1) {
        return false;
      }
      if (!indexes[i].phaseName || !indexes[i].length || !indexes[i].type || 
        !indexes[i].trigger || !indexes[i].exit || !indexes[i].dailyCap || 
        !indexes[i].unitPayout || !indexes[i].maxPayout || !indexes[i].consecutiveDays) {
          return false;
        }
    }
    return true;
  }, "Phases must follow each other continuously with correct lengths"),
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

  const provinces = [
    "Battambang" // Add more provinces as you add more files
  ];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      province: "Battambang",
      indexes: [
        { type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '', consecutiveDays: '',  phaseName: "Early", length: "", sosStart: "0", sosEnd: "-" },
      ],
      plantingDate: new Date()
    }
  });

  const { control, watch, setValue,getValues, formState } = form;
  const { fields: indexes, append: addIndex, remove: removeIndex } = useFieldArray({
    control,
    name: "indexes"
  });

  // Watch for changes in phases
  const watchedIndexes = watch("indexes");
  
  useEffect(() => {
    // Batch updates to prevent multiple re-renders
    const updates: { (): void; (): void; }[] = [];
    
    watchedIndexes.forEach((phase, index) => {
      // Skip if no length or start
      if (!phase.length || !phase.sosStart) return;  
      
      const start = Number(phase.sosStart);
      const length = Number(phase.length);
      
      if (!isNaN(start) && !isNaN(length) && length > 0) {
        // Calculate end date
        const end = start + length - 1;
        const currentEnd = getValues(`indexes.${index}.sosEnd`);
        
        if (currentEnd !== end.toString()) {
          updates.push(() => setValue(`indexes.${index}.sosEnd`, end.toString(), { shouldValidate: true }));
        }
  
        // Update next phase start date if there is one
        if (index < watchedIndexes.length - 1) {
          const nextStart = getValues(`indexes.${index + 1}.sosStart`);
          if (nextStart !== (end + 1).toString()) {
            updates.push(() => setValue(`indexes.${index + 1}.sosStart`, (end + 1).toString(), { shouldValidate: true }));
          }
        }
      }
    });
    
    // Apply all updates at once
    updates.forEach(update => update());
    
  }, [watchedIndexes, setValue, getValues]);

  const [isCalculating, setIsCalculating] = useState(false);

  const onSubmit = async (data: any) => {
    setIsCalculating(true);
    try {
      // Province and dataType are now always present
      data.dataType = "precipitation";
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
  const handleAddIndex = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const indexes = watchedIndexes;
    if (indexes.length === 0) {
      // First phase starts at 0
      addIndex({ type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '', consecutiveDays: '',  phaseName: "", length: "0", sosStart: "0", sosEnd: "0" },);
      return
    } 
      const lastIndex = indexes[indexes.length - 1];
      if (!lastIndex.phaseName || !lastIndex.length || !lastIndex.type || 
        !lastIndex.trigger || !lastIndex.exit || !lastIndex.dailyCap || 
        !lastIndex.unitPayout || !lastIndex.maxPayout || !lastIndex.consecutiveDays) {
      // Show validation error
      form.setError('indexes', {
        type: 'manual',
        message: 'Please complete all fields in the current index before adding a new one'
      });
      return;
    }
      const nextStart = lastIndex.sosEnd ? (Number(lastIndex.sosEnd) + 1).toString() : "0";
      addIndex({ type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '', consecutiveDays: '',  phaseName: "", length: "", sosStart: nextStart, sosEnd: "0" },);
  };

  // Add a function to handle phase removal and adjust subsequent phases
  const handleRemoveIndex = (index: number) => {
    // If we're removing a phase that's not the last one, we need to adjust the start days of later phases
    if (index < watchedIndexes.length - 1) {
      // Get the start day of the phase we're removing
      const removedPhaseStart = Number(watchedIndexes[index].sosStart);
      
      // Remove the phase first
      removeIndex(index);
      
      // If there's a previous phase, connect the next phase to it
      if (index > 0) {
        const prevPhaseEnd = Number(watchedIndexes[index-1].sosEnd);
        setValue(`indexes.${index}.sosStart`, (prevPhaseEnd + 1).toString());
      }
      
      // Adjust all subsequent phases
      for (let i = index; i < watchedIndexes.length - 1; i++) {
        // Recalculate phase start and end
        const currentLength = Number(watchedIndexes[i].length);
        const newStart = i === index ? 
          (index > 0 ? Number(watchedIndexes[index-1].sosEnd) + 1 : removedPhaseStart) : 
          Number(watchedIndexes[i-1].sosEnd) + 1;
        
        setValue(`indexes.${i}.sosStart`, newStart.toString());
        if (currentLength) {
          setValue(`indexes.${i}.sosEnd`, (newStart + currentLength - 1).toString());
        }
      }
    } else {
      // If it's the last phase, simply remove it
      removeIndex(index);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4">
        {/* First row: Product Name and Coverage Type */}
        <div className="grid grid-cols-2 gap-4">
          <SimpleTooltip content="The name of the insurance product">
            <InputForm control={control} name="productName" placeholder="Enter Product Name" label="Product Name" type="string" />
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
        {/* Second row: Province and Commune */}
        <div className="grid grid-cols-2 gap-4">
          <SimpleTooltip content="The province where the crop is grown">
            <SelectForm control={control} name="province" placeholder="Select Province" label="Province">
              {provinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectForm>
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
        </div>
        {/* Third row: Crop Type and Total Growing Duration */}
        <div className="grid grid-cols-2 gap-4">
          <SimpleTooltip content="The type of crop for your insurance product">
            <SelectForm control={control} name="cropType" placeholder="Select Crop type" label="Crop Type">
              {cropTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectForm>
          </SimpleTooltip>
          <SimpleTooltip content="The total growing duration for the crop in days">
            <InputForm
              control={control}
              name="growingDuration"
              placeholder="Enter duration"
              label="Total Growing Duration (days)"
              type="number"
            />
          </SimpleTooltip>
        </div>

        {/* Weather Data Period section header and description moved here */}
        <h3 className="text-xl font-bold tracking-tight">Weather Data Period</h3>
        <p className="text-md text-muted-foreground">Select Growing Duration and Weather Data Period for risk analysis</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <SimpleTooltip content="The planting date for the crop">
            <DatePicker
              control={control}
              name="plantingDate"
              label="Planting Date"
              placeholder="Select a date"
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

        {/* Indexes */}
        <h3 className="text-xl font-bold tracking-tight">Indexes</h3>
        <p className="text-md text-muted-foreground">Enter Index Details for Insurance Product</p>
        {indexes.map((item: { id: Key | null | undefined; }, index: number) => (
          <div className="w-full p-6 border border-gray-300 shadow-md rounded-lg" key={item.id}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SimpleTooltip content="Name of the crop phase">
              <InputForm 
                control={control} 
                name={`indexes.${index}.phaseName`} 
                placeholder="Phase Name" 
                label="Phase Name"
                type="string" 
              />
            </SimpleTooltip>
            <SimpleTooltip content="The length of the phase in days">
              <InputForm 
                control={control} 
                name={`indexes.${index}.length`} 
                placeholder="Length (days)" 
                label="Phase Length (days)"
                type="number"
                onBlur={(e) => {
                  const length = e.target.value;
                  if (length && !isNaN(Number(length))) {
                    const start = Number(getValues(`indexes.${index}.sosStart`));
                    const end = start + Number(length) - 1;
                    setValue(`indexes.${index}.sosEnd`, end.toString(), { shouldValidate: true });
                    
                    // Update next phase start if it exists
                    if (index < watchedIndexes.length - 1) {
                      setValue(`indexes.${index + 1}.sosStart`, (end + 1).toString(), { shouldValidate: true });
                    }
                  } else {
                    // If length is empty or invalid, set end date to "-"
                    setValue(`indexes.${index}.sosEnd`, "-", { shouldValidate: true });
                    
                    // Update next phase start if it exists
                    if (index < watchedIndexes.length - 1) {
                      setValue(`indexes.${index + 1}.sosStart`, "-", { shouldValidate: true });
                    }
                  }
                }}
              />
            </SimpleTooltip>
            <div className="flex items-center gap-2">
            <SimpleTooltip content="The start the phase in days">
              <InputForm 
                control={control} 
                name={`indexes.${index}.sosStart`} 
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
                name={`indexes.${index}.sosEnd`}
                label="Phase End" 
                placeholder="To" 
                type="number" 
                className="w-24"
                disabled // End date is always calculated
              />
              </SimpleTooltip>
            </div>
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

            </div>
            <Button
              className="mt-7"
              type="button"
              variant="destructive" 
              onClick={(e) => {
                e.preventDefault();
                handleRemoveIndex(index);
              }}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button 
          variant="outline"
          type="button" 
          className="col-span-1 mr-0" 
          onClick={(e) => {
            e.preventDefault();
            handleAddIndex(e);
          }}
        >
          Add Index
        </Button>

        {formState.errors.indexes && (
          <div className="text-red-500 text-sm mb-2">
            {formState.errors.indexes.message}
          </div>
        )}

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