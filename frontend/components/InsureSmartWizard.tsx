"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { SelectForm } from "@/components/ui/SelectForm";
import { DatePicker } from "@/components/ui/datepicker";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import provincesCommunesData from "../data/cambodia_provinces_communes.json";
import apiClient from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form";
import { FormItem } from "@/components/ui/form";
import { FormLabel } from "@/components/ui/form";
import { FormControl } from "@/components/ui/form";
import { FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Plus, Trash2, TrendingDown, TrendingUp, Zap, CheckCircle } from "lucide-react";
import React from "react";

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

export default function InsureSmartWizard() {
  const [step, setStep] = useState(0);
  const [optimizing, setOptimizing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  
  // Separate state for each step
  const [productData, setProductData] = useState<any>(null);
  const [periodsData, setPeriodsData] = useState<any[]>([]);

  // Define default values as plain strings (never undefined/null)
  const provinceKeys = Object.keys(provincesCommunes);
  const defaultProvince = provinceKeys[0] || "";
  const defaultCommune = (provincesCommunes[defaultProvince] && provincesCommunes[defaultProvince][0]) || "";

  const defaultProductValues = {
    productName: "",
    province: defaultProvince,
    commune: defaultCommune,
    cropDuration: "",
    sumInsured: "",
    premiumCap: "",
    notes: "",
  };

  const defaultPeriodsValues = {
    periods: [],
  };

  // Separate form instances for each step
  const productForm = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: defaultProductValues,
    mode: "onChange",
  });

  const periodsForm = useForm({
    defaultValues: { periods: periodsData },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray<any>({
    control: periodsForm.control,
    name: "periods",
  });

  // Function to clear results when navigating back
  const clearResults = () => {
    setResults(null);
    setOptimizing(false);
  };

  const getStepProgress = () => {
    return ((step + 1) / 3) * 100;
  };

  const getPerilIcon = (peril: string) => {
    switch (peril) {
      case "LRI":
        return <TrendingDown className="h-4 w-4" />;
      case "ERI":
        return <TrendingUp className="h-4 w-4" />;
      case "Both":
        return <Zap className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPerilLabel = (peril: string) => {
    switch (peril) {
      case "LRI":
        return "Low Rainfall";
      case "ERI":
        return "High Rainfall";
      case "Both":
        return "Both (LRI + ERI)";
      default:
        return peril;
    }
  };

  const getRiskScoreColor = (score: string) => {
    switch (score) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Step 1: Product Details UI
  function ProductDetailsStep() {
    const province = productForm.watch("province");
    
    const handleSubmit = useCallback((data: any) => {
      setProductData(data);
      setStep(1);
    }, []);

    // If productData exists (navigating back), reset the form with it
    // This effect runs only when productData changes and step is 0
    // (prevents reset on every render)
    useEffect(() => {
      if (step === 0 && productData) {
        productForm.reset(productData);
      }
    }, [step, productData, productForm]);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Create New Product
          </CardTitle>
          <CardDescription>Define the high-level details for your weather insurance product</CardDescription>
        </CardHeader>
        <Form {...productForm}>
          <form onSubmit={productForm.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormField
                    control={productForm.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., July Rice Crop – Kampong Speu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <SelectForm control={productForm.control} name="province" label="Province *" placeholder="Select province">
                    {Object.keys(provincesCommunes).map((prov) => (
                      <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                    ))}
                  </SelectForm>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <SelectForm control={productForm.control} name="commune" label="Commune/Location *" placeholder="Select commune">
                    {provincesCommunes[province].map((commune) => (
                      <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                    ))}
                  </SelectForm>
                </div>
                <div className="space-y-2">
                  <FormField
                    control={productForm.control}
                    name="cropDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Crop Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 120 days" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">Optional - for reference only</p>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormField
                    control={productForm.control}
                    name="sumInsured"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Sum Insured (USD) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="250" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={productForm.control}
                    name="premiumCap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Premium Cap (USD) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FormField
                  control={productForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Optional notes for internal use..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Next: Add Coverage Periods
                </Button>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    );
  }

  // Step 2: Coverage Periods UI
  function CoveragePeriodsStep() {
    const handleSubmit = useCallback((data: any) => {
      setPeriodsData(data.periods);
      setStep(2);
    }, []);

    // If periodsData exists (navigating back), reset the form with it
    useEffect(() => {
      if (step === 1 && periodsData && periodsData.length > 0) {
        periodsForm.reset({ periods: periodsData });
      }
    }, [step, periodsData, periodsForm]);
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Add Coverage Periods
            </CardTitle>
            <CardDescription>
              Define risk windows within your crop duration. Each period represents a time window where weather risk
              is evaluated.
            </CardDescription>
          </CardHeader>
          <Form {...periodsForm}>
            <form onSubmit={periodsForm.handleSubmit(handleSubmit)}>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No coverage periods added yet</p>
                    <Button type="button" onClick={() => append({ startDate: undefined, endDate: undefined, perilType: "LRI" })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Coverage Period
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Period {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <FormLabel>Start Date *</FormLabel>
                              <DatePicker control={periodsForm.control} name={`periods.${index}.startDate` as any} />
                            </div>
                            <div className="space-y-2">
                              <FormLabel>End Date *</FormLabel>
                              <DatePicker control={periodsForm.control} name={`periods.${index}.endDate` as any} />
                            </div>
                            <div className="space-y-2">
                              <FormLabel>Peril Type *</FormLabel>
                              <SelectForm control={periodsForm.control} name={`periods.${index}.perilType`} placeholder="Select peril type">
                                <SelectItem value="LRI">
                                  <div className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4" />
                                    Low Rainfall (LRI)
                                  </div>
                                </SelectItem>
                                <SelectItem value="ERI">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    High Rainfall (ERI)
                                  </div>
                                </SelectItem>
                                <SelectItem value="Both">
                                  <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Both (LRI + ERI)
                                  </div>
                                </SelectItem>
                              </SelectForm>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button type="button" variant="outline" onClick={() => append({ startDate: undefined, endDate: undefined, perilType: "LRI" })} className="w-full bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Period
                    </Button>
                  </div>
                )}
              </CardContent>
            </form>
          </Form>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => {
            clearResults();
            setStep(0);
          }}>
            Back: Product Details
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={periodsForm.handleSubmit(handleSubmit)}
            disabled={fields.length === 0}
          >
            Next: Optimize Product
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Optimization UI (integrated with backend)
  function OptimizationStep() {
    async function runOptimization() {
      setOptimizing(true);
      setResults(null);
      try {
        // Use the stored data from previous steps
        const payload = {
          product: productData,
          periods: periodsData,
        };
        // POST to backend
        const { data } = await apiClient.post("/api/insure-smart/optimize", payload);
        const taskId = data.task_id;
        if (!taskId) {
          throw new Error("No task_id received from backend");
        }
        // Poll for result
        async function pollStatus() {
          try {
            const { data: statusData } = await apiClient.get(`/api/insure-smart/status/${taskId}`);
            if (statusData.status === "PENDING" || statusData.status === "Pending" || statusData.status === "STARTED") {
              setTimeout(pollStatus, 1500);
            } else if (statusData.status === "SUCCESS") {
              setResults(statusData.result);
              setOptimizing(false);
            } else {
              setOptimizing(false);
              alert(`Optimization failed: ${statusData.result || 'Unknown error'}`);
            }
          } catch (error) {
            setOptimizing(false);
            alert("Error checking optimization status. Please try again.");
          }
        }
        pollStatus();
      } catch (err) {
        setOptimizing(false);
        alert("Failed to start optimization. Please try again.");
      }
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Product Optimization
            </CardTitle>
            <CardDescription>
              Run optimization to find the best trigger values and payout structure based on 30 years of historical
              weather data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="text-center py-8">
                <div className="space-y-4">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Ready to Optimize</h3>
                    <p className="text-green-700 text-sm mb-4">
                      Product: {productData?.productName}
                      <br />
                      Location: {productData?.commune?.toLowerCase()}
                      <br />
                      Coverage Periods: {periodsData?.length}
                      <br />
                      Budget: ${productData?.sumInsured} (Premium Cap: ${productData?.premiumCap})
                    </p>
                  </div>

                  {optimizing ? (
                    <div className="space-y-4">
                      <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-600">Running optimization...</p>
                      <p className="text-sm text-gray-500">
                        Analyzing 30 years of rainfall data and testing thousands of combinations
                      </p>
                    </div>
                  ) : (
                    <Button className="bg-green-600 hover:bg-green-700" onClick={runOptimization} size="lg">
                      <Zap className="h-4 w-4 mr-2" />
                      Run Optimization
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Optimization Complete</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Found {results.length} optimized configurations that meet your criteria
                  </p>
                </div>

                <div className="grid gap-4">
                  {results.map((result: any, index: number) => {
                    if (result.error) {
                      return (
                        <Card key={index} className="bg-red-50 border-red-200">
                          <CardContent>
                            <p className="text-red-700 font-semibold">Error: {result.error}</p>
                          </CardContent>
                        </Card>
                      );
                    }
                    return (
                      <Card key={index} className="cursor-pointer transition-all hover:border-gray-300">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Configuration {index + 1}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge className={getRiskScoreColor(result.riskLevel)}>{result.riskLevel} RISK</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Loss Ratio</p>
                              <p className="text-lg font-semibold">
                                {typeof result.lossRatio === 'number' ? `${(result.lossRatio * 100).toFixed(1)}%` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Expected Payout</p>
                              <p className="text-lg font-semibold">
                                {typeof result.expectedPayout === 'number' ? `$${result.expectedPayout.toFixed(2)}` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Premium Rate</p>
                              <p className="text-lg font-semibold">
                                {typeof result.premiumRate === 'number' ? `${(result.premiumRate * 100).toFixed(1)}%` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Premium Cost</p>
                              <p className="text-lg font-semibold">
                                {typeof result.premiumCost === 'number' ? `$${result.premiumCost.toFixed(2)}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <Separator className="my-4" />
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Trigger Values & Payouts</h4>
                            <div className="grid gap-3">
                              {result.triggers && result.triggers.map((t: any, i: number) => (
                                <div key={i} className="flex items-center justify-between bg-green-50 p-3 rounded">
                                  <div className="flex items-center gap-2">
                                    {t.type && t.type.includes('Low') ? (
                                      <TrendingDown className="h-4 w-4 text-red-600" />
                                    ) : (
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                    )}
                                    <span className="text-sm font-medium">{t.type} Trigger</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">{t.value}</p>
                                    <p className="font-semibold">{t.payout} payout</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* --- BEGIN: Trigger Details Table --- */}
                          <div className="mt-6">
                            <h4 className="font-medium text-gray-900 mb-2">Trigger Details</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm border rounded">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-3 py-2 text-left font-semibold">Period</th>
                                    <th className="px-3 py-2 text-left font-semibold">Peril</th>
                                    <th className="px-3 py-2 text-left font-semibold">Trigger</th>
                                    <th className="px-3 py-2 text-left font-semibold">Duration (days)</th>
                                    <th className="px-3 py-2 text-left font-semibold">Unit Payout</th>
                                    <th className="px-3 py-2 text-left font-semibold">Max Payout</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.periods && result.periods.map((period: any, pIdx: number) => (
                                    period.perils.map((peril: any, perilIdx: number) => (
                                      <tr key={pIdx + '-' + perilIdx} className="border-t">
                                        <td className="px-3 py-2">{period.period_name || `Period ${pIdx + 1}`}</td>
                                        <td className="px-3 py-2">{peril.peril_type === 'LRI' ? 'Low Rainfall' : 'High Rainfall'}</td>
                                        <td className="px-3 py-2">{peril.peril_type === 'LRI' ? `≤ ${peril.trigger}` : `≥ ${peril.trigger}`}</td>
                                        <td className="px-3 py-2">{peril.duration}</td>
                                        <td className="px-3 py-2">{typeof peril.unit_payout === 'number' ? `$${peril.unit_payout.toFixed(2)} / mm` : 'N/A'}</td>
                                        <td className="px-3 py-2">{typeof peril.max_payout === 'number' ? `$${peril.max_payout.toFixed(0)}` : 'N/A'}</td>
                                      </tr>
                                    ))
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          {/* --- END: Trigger Details Table --- */}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => {
            clearResults();
            setStep(1);
          }}>
            Back: Coverage Periods
          </Button>
          {results && results.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline">Save as Draft</Button>
              <Button className="bg-green-600 hover:bg-green-700">
                Finalize Product
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">InsureSmart</h1>
              <p className="text-gray-600">Weather Insurance Product Designer</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {step + 1} of 3</span>
              <span>{Math.round(getStepProgress())}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span className={step >= 0 ? "text-green-600 font-medium" : ""}>Product Details</span>
              <span className={step >= 1 ? "text-green-600 font-medium" : ""}>Coverage Periods</span>
              <span className={step >= 2 ? "text-green-600 font-medium" : ""}>Optimization</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 0 && <ProductDetailsStep />}
        {step === 1 && <CoveragePeriodsStep />}
        {step === 2 && <OptimizationStep />}
      </div>
    </div>
  );
} 