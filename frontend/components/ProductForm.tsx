"use client";

import { Key, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { Trash, Loader2 } from 'lucide-react';
import { InputForm } from "./ui/InputForm";
import { SelectForm } from "./ui/SelectForm";
import { CheckboxForm } from "./ui/CheckboxForm";
import { CalendarForm } from "./ui/CalendarForm";
import apiClient from "@/lib/apiClient";

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

// Update the component props
interface ProductFormProps {
  setPremiumResponse: (response: PremiumResponse | null) => void;
}

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
    defaultValues: {
      phases: [
        { phaseName: "Early", length: "", sosStart: "0", sosEnd: "60" },
        { phaseName: "Middle", length: "", sosStart: "61", sosEnd: "120" },
        { phaseName: "Late", length: "", sosStart: "121", sosEnd: "180" }
      ],
      indexes: [
        { type: '', trigger: '', exit: '', dailyCap: '', unitPayout: '', maxPayout: '', consecutiveDays: '', phases: ["Early", "Middle", "Late"] }
      ]
    }
  });

  const { control, watch } = form;
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
    // This will trigger whenever phases change
  }, [watchedPhases]);

  const [isCalculating, setIsCalculating] = useState(false);

  const onSubmit = async (data: any) => {
    setIsCalculating(true);
    try {
      if (data.plantingDate instanceof Date) {
        data.plantingDate = data.plantingDate.toISOString().split('T')[0];
      }

      const response = await apiClient.post('/api/premium/calculate', data);

      if (response.status !== 200) {
        throw new Error('Failed to calculate premium');
      }

      setPremiumResponse(response.data);
    } catch (error) {
      console.error('Error calculating premium:', error);
      setPremiumResponse(null);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4">
        <InputForm control={control} name="productName" placeholder="Enter Product Name" label="Product Name" type="string" />
        
        {/* Commune Dropdown */}
        <SelectForm control={control} name="commune" placeholder="Select Commune" label="Commune">
          {communes.map((commune) => (
            <SelectItem key={commune} value={commune}>
              {commune}
            </SelectItem>
          ))}
        </SelectForm>

        <SelectForm control={control} name="cropType" placeholder="Select Crop type" label="Crop Type">
          {cropTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectForm>
        <div className="flex items-start space-x-3">
          <InputForm
            control={control}
            className="flex flex-col"
            name="growingDuration"
            placeholder="Enter duration"
            label="Total Growing Duration (days)"
            type="number"
          />
          <CalendarForm
            control={control}
            name="plantingDate"
            label="Planting Date"
            placeholder="Select a date"
          />
        </div>
        <h3 className="font-medium mb-2">Weather Data Period</h3>
        <SelectForm control={control} name="weatherDataPeriod" placeholder="Select Data Period" label="Weather Data Period">
          <SelectItem value="10">10 years</SelectItem>
          <SelectItem value="20">20 years</SelectItem>
          <SelectItem value="30">30 years</SelectItem>
        </SelectForm>
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
            <div className="flex items-center gap-2">
              <InputForm 
                control={control} 
                name={`phases.${index}.sosStart`} 
                placeholder="From" 
                type="number" 
                className="w-24"
              />
              <span>to</span>
              <InputForm 
                control={control} 
                name={`phases.${index}.sosEnd`} 
                placeholder="To" 
                type="number" 
                className="w-24"
              />
            </div>
            <Button 
              variant="destructive" 
              onClick={(e) => {
                e.preventDefault();
                removePhase(index)
              }}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button 
          variant="outline" 
          className="mt-2" 
          onClick={(e) => {
            e.preventDefault();
            addPhase({ phaseName: "", length: "", sosStart: "", sosEnd: "" })
          }}
        >
          Add Phase
        </Button>

        {/* Indexes */}
        <h3 className="font-medium mb-2">Indexes</h3>
        {indexes.map((item, index) => (
          <div className="w-full p-6 border border-gray-300 shadow-md rounded-lg" key={item.id}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SelectForm control={control} name={`indexes.${index}.type`} placeholder="Select Index type">
                {indexTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectForm>
              <InputForm control={control} name={`indexes.${index}.consecutiveDays`} placeholder="Consecutive days for trigger" type="number" />
              <InputForm control={control} name={`indexes.${index}.trigger`} placeholder="Trigger (mm)" type="number" />
              <InputForm control={control} name={`indexes.${index}.exit`} placeholder="Exit (mm)" type="number" />
              <InputForm control={control} name={`indexes.${index}.dailyCap`} placeholder="Daily cap (mm)" type="number" />
              <InputForm control={control} name={`indexes.${index}.unitPayout`} placeholder="Unit Payout (USD)" type="number" />
              <InputForm control={control} name={`indexes.${index}.maxPayout`} placeholder="Max Payout (USD)" type="number" />
              <div className="col-span-3">
                <CheckboxForm 
                  control={control} 
                  name={`indexes.${index}.phases`} 
                  label="Apply to Phases" 
                  items={watchedPhases.map(phase => ({ id: phase.phaseName, label: phase.phaseName }))} 
                />
              </div>  

              <div className="col-span-3 flex justify-center">
                {(phases && phases.length > 0) &&
                  <Button 
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

        <SelectForm control={control} name="coverageType" placeholder="Select Coverage type" label="Coverage Type">
          {coverageTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectForm>

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