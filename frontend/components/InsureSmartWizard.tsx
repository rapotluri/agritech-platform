"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectForm } from "@/components/ui/SelectForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Plus, Trash2, TrendingDown, TrendingUp, Zap, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import provincesCommunesData from "../data/cambodia_provinces_communes.json";
import apiClient from "@/lib/apiClient";

const provincesCommunes = provincesCommunesData as Record<string, string[]>;
const provinceKeys = Object.keys(provincesCommunes);

interface Product {
  name: string;
  province: string;
  commune: string;
  cropDuration: string;
  sumInsured: string;
  premiumCap: string;
  notes: string;
}

interface CoveragePeriod {
  id: string;
  startDate: string;
  endDate: string;
  perilType: "LRI" | "ERI" | "BOTH";
}

interface OptimizationResult {
  id: string;
  lossRatio: number;
  expectedPayout: number;
  premiumRate: number;
  premiumCost: number;
  triggers: {
    lri?: { threshold: number; payout: number };
    eri?: { threshold: number; payout: number };
  };
  riskScore: "LOW" | "MEDIUM" | "HIGH";
}

export default function InsureSmartWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [product, setProduct] = useState<Product>({
    name: "",
    province: provinceKeys[0] || "",
    commune: provincesCommunes[provinceKeys[0]]?.[0] || "",
    cropDuration: "",
    sumInsured: "",
    premiumCap: "",
    notes: "",
  });
  const [coveragePeriods, setCoveragePeriods] = useState<CoveragePeriod[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update commune options when province changes
  const handleProvinceChange = (province: string) => {
    setProduct((prev) => ({
      ...prev,
      province,
      commune: provincesCommunes[province]?.[0] || "",
    }));
  };

  const addCoveragePeriod = () => {
    const newPeriod: CoveragePeriod = {
      id: Date.now().toString(),
      startDate: "",
      endDate: "",
      perilType: "LRI",
    };
    setCoveragePeriods([...coveragePeriods, newPeriod]);
  };

  const updateCoveragePeriod = (id: string, field: keyof CoveragePeriod, value: string) => {
    setCoveragePeriods((periods) =>
      periods.map((period) => (period.id === id ? { ...period, [field]: value } : period)),
    );
  };

  const removeCoveragePeriod = (id: string) => {
    setCoveragePeriods((periods) => periods.filter((period) => period.id !== id));
  };

  const runOptimization = async () => {
    setIsOptimizing(true);
    setError(null);
    setOptimizationResults([]);
    setSelectedResult(null);
    try {
      const payload = {
        product: {
          productName: product.name,
          province: product.province,
          commune: product.commune,
          cropDuration: product.cropDuration,
          sumInsured: product.sumInsured,
          premiumCap: product.premiumCap,
          notes: product.notes,
        },
        periods: coveragePeriods.map((p) => ({
          startDate: p.startDate,
          endDate: p.endDate,
          perilType: p.perilType === "BOTH" ? "Both" : p.perilType,
        })),
      };
      const { data } = await apiClient.post("/api/insure-smart/optimize", payload);
      const taskId = data.task_id;
      if (!taskId) throw new Error("No task_id received from backend");
      // Poll for result
      async function pollStatus() {
        try {
          const { data: statusData } = await apiClient.get(`/api/insure-smart/status/${taskId}`);
          if (["PENDING", "Pending", "STARTED"].includes(statusData.status)) {
            setTimeout(pollStatus, 1500);
          } else if (statusData.status === "SUCCESS") {
            // Map backend result to UI format
            const results = (statusData.result || []).map((r: any, idx: number) => ({
              id: String(idx + 1),
              lossRatio: r.lossRatio,
              expectedPayout: r.expectedPayout,
              premiumRate: r.premiumRate,
              premiumCost: r.premiumCost,
              triggers: r.triggers,
              riskScore: r.riskLevel,
            }));
            setOptimizationResults(results);
            setIsOptimizing(false);
          } else {
            setIsOptimizing(false);
            setError(`Optimization failed: ${statusData.result || "Unknown error"}`);
          }
        } catch (err) {
          setIsOptimizing(false);
          setError("Error checking optimization status. Please try again.");
        }
      }
      pollStatus();
    } catch (err: any) {
      setIsOptimizing(false);
      setError(err.message || "Failed to start optimization. Please try again.");
    }
  };

  const getStepProgress = () => (currentStep / 3) * 100;

  const canProceedToStep2 = () => {
    return product.name && product.province && product.commune && product.sumInsured && product.premiumCap;
  };

  const canProceedToStep3 = () => {
    return (
      coveragePeriods.length > 0 &&
      coveragePeriods.every((period) => period.startDate && period.endDate && period.perilType)
    );
  };

  const getPerilIcon = (peril: string) => {
    switch (peril) {
      case "LRI":
        return <TrendingDown className="h-4 w-4" />;
      case "ERI":
        return <TrendingUp className="h-4 w-4" />;
      case "BOTH":
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
      case "BOTH":
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

  // Province/commune options
  const communeOptions = provincesCommunes[product.province] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {/* <img src="/images/accurrate-logo.png" alt="AccuRate" className="h-10" /> */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">InsureSmart</h1>
              <p className="text-gray-600">Weather Insurance Product Designer</p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep} of 3</span>
              <span>{Math.round(getStepProgress())}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span className={currentStep >= 1 ? "text-green-600 font-medium" : ""}>Product Details</span>
              <span className={currentStep >= 2 ? "text-green-600 font-medium" : ""}>Coverage Periods</span>
              <span className={currentStep >= 3 ? "text-green-600 font-medium" : ""}>Optimization</span>
            </div>
          </div>
        </div>
        {/* Step 1: Product Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Create New Product
              </CardTitle>
              <CardDescription>Define the high-level details for your weather insurance product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., July Rice Crop – Kampong Speu"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Select value={product.province} onValueChange={handleProvinceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinceKeys.map((prov) => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="commune">Commune/Location *</Label>
                  <Select value={product.commune} onValueChange={(value) => setProduct({ ...product, commune: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {communeOptions.map((commune) => (
                        <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropDuration">Total Crop Duration</Label>
                  <Input
                    id="cropDuration"
                    placeholder="e.g., 120 days"
                    value={product.cropDuration}
                    onChange={(e) => setProduct({ ...product, cropDuration: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Optional - for reference only</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sumInsured">Total Sum Insured (USD) *</Label>
                  <Input
                    id="sumInsured"
                    type="number"
                    placeholder="250"
                    value={product.sumInsured}
                    onChange={(e) => setProduct({ ...product, sumInsured: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premiumCap">Total Premium Cap (USD) *</Label>
                  <Input
                    id="premiumCap"
                    type="number"
                    placeholder="10"
                    value={product.premiumCap}
                    onChange={(e) => setProduct({ ...product, premiumCap: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  placeholder="Optional notes for internal use..."
                  value={product.notes}
                  onChange={(e) => setProduct({ ...product, notes: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToStep2()}
                >
                  Next: Add Coverage Periods
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Step 2: Coverage Periods */}
        {currentStep === 2 && (
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
              <CardContent>
                {coveragePeriods.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No coverage periods added yet</p>
                    <Button onClick={addCoveragePeriod}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Coverage Period
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coveragePeriods.map((period, index) => (
                      <Card key={period.id} className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Period {index + 1}</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCoveragePeriod(period.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Start Date *</Label>
                              <Input
                                type="date"
                                value={period.startDate}
                                onChange={(e) => updateCoveragePeriod(period.id, "startDate", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date *</Label>
                              <Input
                                type="date"
                                value={period.endDate}
                                onChange={(e) => updateCoveragePeriod(period.id, "endDate", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Peril Type *</Label>
                              <Select
                                value={period.perilType}
                                onValueChange={(value) => updateCoveragePeriod(period.id, "perilType", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                                  <SelectItem value="BOTH">
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-4 w-4" />
                                      Both (LRI + ERI)
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {period.startDate && period.endDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {getPerilIcon(period.perilType)}
                              <span>
                                {getPerilLabel(period.perilType)} coverage from {period.startDate} to {period.endDate}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addCoveragePeriod} className="w-full bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Period
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back: Product Details
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3()}
              >
                Next: Optimize Product
              </Button>
            </div>
          </div>
        )}
        {/* Step 3: Optimization */}
        {currentStep === 3 && (
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
                {error && <div className="text-red-600 mb-4">{error}</div>}
                {optimizationResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="bg-green-50 p-6 rounded-lg">
                        <h3 className="font-semibold text-green-900 mb-2">Ready to Optimize</h3>
                        <p className="text-green-700 text-sm mb-4">
                          Product: {product.name}
                          <br />
                          Location: {product.commune}
                          <br />
                          Coverage Periods: {coveragePeriods.length}
                          <br />
                          Budget: ${product.sumInsured} (Premium Cap: ${product.premiumCap})
                        </p>
                      </div>
                      {isOptimizing ? (
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
                        Found {optimizationResults.length} optimized configurations that meet your criteria
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {optimizationResults.map((result, index) => (
                        <Card
                          key={result.id}
                          className={`cursor-pointer transition-all ${
                            selectedResult === result.id
                              ? "ring-2 ring-green-500 border-green-500"
                              : "hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedResult(result.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Configuration {index + 1}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge className={getRiskScoreColor(result.riskScore)}>{result.riskScore} RISK</Badge>
                                {selectedResult === result.id && <Badge variant="default">Selected</Badge>}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">Loss Ratio</p>
                                <p className="text-lg font-semibold">{(result.lossRatio * 100).toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Expected Payout</p>
                                <p className="text-lg font-semibold">${result.expectedPayout}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Premium Rate</p>
                                <p className="text-lg font-semibold">{(result.premiumRate * 100).toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Premium Cost</p>
                                <p className="text-lg font-semibold">
                                  ${product.sumInsured && result.premiumRate ? (Number.parseFloat(product.sumInsured) * result.premiumRate).toFixed(2) : "-"}
                                </p>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900">Trigger Values & Payouts</h4>
                              <div className="grid gap-3">
                                {result.triggers.lri && (
                                  <div className="flex items-center justify-between bg-green-50 p-3 rounded">
                                    <div className="flex items-center gap-2">
                                      <TrendingDown className="h-4 w-4 text-red-600" />
                                      <span className="text-sm font-medium">Low Rainfall Trigger</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-600">≤ {result.triggers.lri.threshold}mm</p>
                                      <p className="font-semibold">${result.triggers.lri.payout} payout</p>
                                    </div>
                                  </div>
                                )}
                                {result.triggers.eri && (
                                  <div className="flex items-center justify-between bg-green-50 p-3 rounded">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-medium">High Rainfall Trigger</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-600">≥ {result.triggers.eri.threshold}mm</p>
                                      <p className="font-semibold">${result.triggers.eri.payout} payout</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back: Coverage Periods
              </Button>
              {optimizationResults.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline">Save as Draft</Button>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={!selectedResult}>
                    Finalize Product
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
