"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { InputForm } from "@/components/ui/InputForm";
import { SelectForm } from "@/components/ui/SelectForm";
import { DatePicker } from "@/components/ui/datepicker";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import provincesCommunesData from "../data/cambodia_provinces_communes.json";

const provincesCommunes = provincesCommunesData as Record<string, string[]>;

const productSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  province: z.string().min(1, "Province is required"),
  commune: z.string().min(1, "Commune is required"),
  cropDuration: z.string().optional(),
  sumInsured: z.string().min(1, "Sum insured is required"),
  premiumCap: z.string().min(1, "Premium cap is required"),
  notes: z.string().optional(),
});

const periodSchema = z.object({
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  perilType: z.enum(["LRI", "ERI", "Both"]),
});

const wizardSteps = ["Product Details", "Coverage Periods", "Optimization"];

// Initialize useForm hooks ONCE at the top level
const defaultProductValues = {
  productName: "",
  province: Object.keys(provincesCommunes)[0],
  commune: provincesCommunes[Object.keys(provincesCommunes)[0]][0],
  cropDuration: "",
  sumInsured: "",
  premiumCap: "",
  notes: "",
};
const defaultPeriodsValues = { periods: [] };

export default function InsureSmartWizard() {
  const [step, setStep] = useState(0);
  const [productForm, setProductForm] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  // useForm hooks are only called once
  const productFormMethods = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: defaultProductValues,
    mode: "onChange",
  });
  const periodsFormMethods = useForm({
    defaultValues: defaultPeriodsValues,
    mode: "onChange",
  });
  const { control: periodsControl } = periodsFormMethods;
  const { fields, append, remove } = useFieldArray({
    control: periodsControl,
    name: "periods",
  });

  // Step 1: Product Details UI
  function ProductDetailsStep({ formMethods }: { formMethods: typeof productFormMethods }) {
    const province = formMethods.watch("province");
    return (
      <Form {...formMethods}>
        <form
          className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-green-100 p-12 space-y-8"
          onSubmit={formMethods.handleSubmit((data) => {
            setProductForm(data);
            setStep(1);
          })}
        >
          <h2 className="text-2xl font-bold text-green-700 mb-2">Create New Product</h2>
          <p className="text-gray-500 mb-6">Define the high-level details for your weather insurance product</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputForm control={formMethods.control} name="productName" label="Product Name *" placeholder="e.g., July Rice Crop – Kampong Speu" />
            <SelectForm control={formMethods.control} name="commune" label="Commune/Location *" placeholder="Select commune">
              {provincesCommunes[province].map((commune) => (
                <SelectItem key={commune} value={commune}>{commune}</SelectItem>
              ))}
            </SelectForm>
            <SelectForm control={formMethods.control} name="province" label="Province *" placeholder="Select province">
              {Object.keys(provincesCommunes).map((prov) => (
                <SelectItem key={prov} value={prov}>{prov}</SelectItem>
              ))}
            </SelectForm>
            <InputForm control={formMethods.control} name="cropDuration" label="Total Crop Duration" placeholder="e.g., 120 days" />
            <InputForm control={formMethods.control} name="sumInsured" label="Total Sum Insured (USD) *" placeholder="250" />
            <InputForm control={formMethods.control} name="premiumCap" label="Total Premium Cap (USD) *" placeholder="10" />
          </div>
          <InputForm control={formMethods.control} name="notes" label="Notes" placeholder="Optional notes for internal use..." />
          <div className="flex justify-end">
            <Button type="submit" className="w-full md:w-auto">Next: Add Coverage Periods</Button>
          </div>
        </form>
      </Form>
    );
  }

  // Step 2: Coverage Periods UI
  function CoveragePeriodsStep({ formMethods }: { formMethods: typeof periodsFormMethods }) {
    return (
      <Form {...formMethods}>
        <form
          className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-green-100 p-12 space-y-8"
          onSubmit={formMethods.handleSubmit((data) => {
            setPeriods(data.periods);
            setStep(2);
          })}
        >
          <h2 className="text-2xl font-bold text-green-700 mb-2">Add Coverage Periods</h2>
          <p className="text-gray-500 mb-6">Define risk windows within your crop duration. Each period represents a time window where weather risk is evaluated.</p>
          {fields.length === 0 && (
            <div className="flex flex-col items-center py-10">
              <span className="text-5xl text-gray-300 mb-4">📅</span>
              <div className="text-gray-400 mb-4">No coverage periods added yet</div>
              <Button type="button" onClick={() => append({ startDate: undefined, endDate: undefined, perilType: "LRI" })}>
                + Add First Coverage Period
              </Button>
            </div>
          )}
          {fields.map((field, idx) => (
            <div key={field.id} className="border rounded-lg p-6 mb-8 bg-green-50 w-full">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-green-700 text-lg">Period {idx + 1}</span>
                <Button type="button" variant="destructive" size="sm" onClick={() => remove(idx)}>
                  Remove
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <DatePicker control={formMethods.control} name={`periods.${idx}.startDate`} label="Start Date *" />
                <DatePicker control={formMethods.control} name={`periods.${idx}.endDate`} label="End Date *" />
                <SelectForm control={formMethods.control} name={`periods.${idx}.perilType`} label="Peril Type *" placeholder="Select peril type">
                  <SelectItem value="LRI">Low Rainfall (LRI)</SelectItem>
                  <SelectItem value="ERI">High Rainfall (ERI)</SelectItem>
                  <SelectItem value="Both">Both (LRI + ERI)</SelectItem>
                </SelectForm>
              </div>
            </div>
          ))}
          {fields.length > 0 && (
            <Button type="button" variant="outline" onClick={() => append({ startDate: undefined, endDate: undefined, perilType: "LRI" })}>
              + Add Another Period
            </Button>
          )}
          <div className="flex justify-between mt-8">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back: Product Details
            </Button>
            <Button type="submit" disabled={fields.length === 0}>
              Next: Optimize Product
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  // Step 3: Optimization UI (mock results)
  function OptimizationStep() {
    function runOptimization() {
      setOptimizing(true);
      setTimeout(() => {
        setResults([
          {
            lossRatio: 0.85,
            expectedPayout: 212.5,
            premiumRate: 0.04,
            premiumCost: 16.0,
            triggers: [
              { type: "Low Rainfall", value: "≤ 75mm", payout: "$150" },
              { type: "High Rainfall", value: "≥ 200mm", payout: "$100" },
            ],
            riskLevel: "MEDIUM RISK",
          },
          {
            lossRatio: 0.78,
            expectedPayout: 195,
            premiumRate: 0.038,
            premiumCost: 15.2,
            triggers: [
              { type: "Low Rainfall", value: "≤ 80mm", payout: "$125" },
              { type: "High Rainfall", value: "≥ 180mm", payout: "$125" },
            ],
            riskLevel: "LOW RISK",
          },
          {
            lossRatio: 0.92,
            expectedPayout: 230,
            premiumRate: 0.042,
            premiumCost: 16.8,
            triggers: [
              { type: "Low Rainfall", value: "≤ 70mm", payout: "$175" },
              { type: "High Rainfall", value: "≥ 220mm", payout: "$75" },
            ],
            riskLevel: "HIGH RISK",
          },
        ]);
        setOptimizing(false);
      }, 2000);
    }
    return (
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-green-100 p-12 space-y-8">
        <h2 className="text-2xl font-bold text-green-700 mb-2">Product Optimization</h2>
        <p className="text-gray-500 mb-6">Run optimization to find the best trigger values and payout structure based on 30 years of historical weather data</p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
          <div className="font-semibold text-blue-700 mb-1">Ready to Optimize</div>
          <div className="text-gray-700 text-sm">
            <div>Product: <span className="font-semibold">{productForm?.productName}</span></div>
            <div>Location: <span className="font-semibold">{productForm?.commune?.toLowerCase()}</span></div>
            <div>Coverage Periods: <span className="font-semibold">{periods.length}</span></div>
            <div>Budget: <span className="font-semibold">${productForm?.sumInsured} (Premium Cap: ${productForm?.premiumCap})</span></div>
          </div>
        </div>
        {!results ? (
          <div className="flex flex-col items-center">
            <Button onClick={runOptimization} disabled={optimizing} className="mb-4">
              {optimizing ? "Optimizing..." : "Run Optimization"}
            </Button>
            {optimizing && <div className="text-gray-500 text-sm">Running optimization, please wait...</div>}
          </div>
        ) : (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-green-700 font-semibold">
              Optimization Complete<br />Found {results.length} optimized configurations that meet your criteria
            </div>
            {results.map((result, idx) => (
              <div key={idx} className="mb-6 border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">Configuration {idx + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${result.riskLevel.includes('LOW') ? 'bg-green-100 text-green-800' : result.riskLevel.includes('MEDIUM') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{result.riskLevel}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                  <div>
                    <div className="text-gray-500 text-xs">Loss Ratio</div>
                    <div className="font-bold text-green-700 text-lg">{(result.lossRatio * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Expected Payout</div>
                    <div className="font-bold text-blue-700 text-lg">${result.expectedPayout.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Premium Rate</div>
                    <div className="font-bold text-green-700 text-lg">{(result.premiumRate * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Premium Cost</div>
                    <div className="font-bold text-green-700 text-lg">${result.premiumCost.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="font-semibold mb-1">Trigger Values & Payouts</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.triggers.map((t: any, i: number) => (
                      <div key={i} className={`rounded p-2 ${t.type.includes('Low') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        <span className="font-semibold">{t.type} Trigger:</span> {t.value} <span className="font-semibold">{t.payout} payout</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back: Coverage Periods
              </Button>
              <Button onClick={() => alert('Finalize Product (not implemented)')}>Finalize Product</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Progress bar
  const progress = ((step + 1) / 3) * 100;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-br from-green-50 to-white py-8">
      <div className="w-full max-w-4xl mb-8">
        <div className="flex items-center mb-2">
          <span className="text-3xl font-extrabold text-green-700 mr-3">InsureSmart</span>
          <span className="text-gray-500 text-lg">Weather Insurance Product Designer</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Step {step + 1} of 3</span>
          <span className="text-sm text-gray-500">{progress.toFixed(0)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded mb-4">
          <div className="h-2 bg-green-500 rounded transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex space-x-8 mb-6">
          {wizardSteps.map((title, idx) => (
            <button
              key={title}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${step === idx ? 'border-green-600 text-green-700' : 'border-transparent text-gray-400'}`}
              onClick={() => idx < step ? setStep(idx) : undefined}
              disabled={idx > step}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
      {step === 0 && <div className="w-full max-w-4xl"><ProductDetailsStep formMethods={productFormMethods} /></div>}
      {step === 1 && <div className="w-full max-w-4xl"><CoveragePeriodsStep formMethods={periodsFormMethods} /></div>}
      {step === 2 && <div className="w-full max-w-4xl"><OptimizationStep /></div>}
    </div>
  );
} 