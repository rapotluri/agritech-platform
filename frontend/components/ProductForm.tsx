"use client";

import { Key, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { Trash } from 'lucide-react';
import { InputForm } from "./ui/InputForm";
import { SelectForm } from "./ui/SelectForm";
import { CheckboxForm } from "./ui/CheckboxForm";
import { CalendarForm } from "./ui/CalendarForm";

export default function ProductForm() {
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
              <CheckboxForm 
                control={control} 
                name={`indexes.${index}.phases`} 
                label="Apply to Phases" 
                items={watchedPhases.map(phase => ({ id: phase.phaseName, label: phase.phaseName }))} 
              />

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

        {/* Premium Calculation */}
        <h3 className="font-medium">Premium Calculation</h3>
        <div className="mt-4 p-4 text-center rounded-lg bg-gray-200">
          <span className="text-2xl font-bold">$100.00 USD</span>
        </div>

        {/* Calculate Premium Button */}
        <Button onClick={form.handleSubmit(onSubmit)} className="w-full mt-4" variant="default">
          Calculate Premium
        </Button>

        {/* Save and Discard Buttons */}
        <div className="flex justify-center items-start space-x-6">
          <Button type="submit" className="w-full mt-4" variant="agro" color="green">
            Save Product
          </Button>
          <Button type="button" className="w-full mt-4" variant="destructive" color="green" onClick={() => form.reset()}>
            Discard Product
          </Button>
        </div>
      </form>
    </Form>
  );
}

const onSubmit = async (data: any) => {
  if (data.plantingDate instanceof Date) {
    data.plantingDate = data.plantingDate.toISOString().split('T')[0]; // Convert to "YYYY-MM-DD"
  }
  console.log(data); // Log the data to check the payload
  try {
    const response = await fetch('http://localhost:8000/api/premium/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate premium');
    }

    const result = await response.json();
    console.log('Premium calculation result:', result);
    // Update state or UI with the result as needed
  } catch (error) {
    console.error('Error calculating premium:', error);
    // Handle error appropriately
  }
};