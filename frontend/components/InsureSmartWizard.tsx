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
import { SimpleDatePicker } from "@/components/ui/SimpleDatePicker";
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
  premiumCost?: number;
  triggers: {
    lri?: { threshold: number; payout: number };
    eri?: { threshold: number; payout: number };
  };
  riskScore: "LOW" | "MEDIUM" | "HIGH";
  periods?: any[];
  max_payout?: number;
  period_breakdown?: any[];
  yearly_results?: any[];
  coverage_score?: number;
  payout_stability_score?: number;
  coverage_penalty?: number;
  periods_with_no_payouts?: number;
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
      const pollStatus = async () => {
        try {
          const { data: statusData } = await apiClient.get(`/api/insure-smart/status/${taskId}`);
          if (["PENDING", "Pending", "STARTED"].includes(statusData.status)) {
            setTimeout(pollStatus, 1500);
          } else if (statusData.status === "SUCCESS") {
            // Map backend result to UI format and add id
            const results = (statusData.result || []).map((r: any, idx: number) => ({
              ...r,
              id: String(idx + 1),
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
      };
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

  // Add a helper to clear optimization state
  const clearOptimizationState = () => {
    setOptimizationResults([]);
    setError(null);
    setIsOptimizing(false);
    setSelectedResult(null);
  };

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
                              <SimpleDatePicker
                                label="Start Date *"
                                value={period.startDate}
                                onChange={(value) => updateCoveragePeriod(period.id, "startDate", value)}
                                placeholder="Select start date"
                              />
                            </div>
                            <div className="space-y-2">
                              <SimpleDatePicker
                                label="End Date *"
                                value={period.endDate}
                                onChange={(value) => updateCoveragePeriod(period.id, "endDate", value)}
                                placeholder="Select end date"
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
              <Button variant="outline" onClick={() => { clearOptimizationState(); setCurrentStep(1); }}>
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
                  Run optimization to find the best trigger values and payout structure based on 30 years of historical weather data
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {/* Configuration Cards - Horizontal Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {optimizationResults.map((result, index) => (
                        <Card
                          key={result.id}
                          className={`cursor-pointer transition-all ${
                            selectedResult === result.id
                              ? "ring-2 ring-green-500 border-green-500 bg-green-50"
                              : "hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedResult(result.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Option {index + 1}</CardTitle>
                              <Badge className={getRiskScoreColor(result.riskScore)}>{result.riskScore}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600">Loss Ratio</p>
                                <p className="font-semibold text-lg">{(result.lossRatio * 100).toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Premium Rate</p>
                                <p className="font-semibold text-lg">{(result.premiumRate * 100).toFixed(1)}%</p>
                              </div>
                              </div>
                              <div>
                              <p className="text-gray-600 text-sm">Premium Cost</p>
                              <p className="font-semibold text-xl text-green-600">{result.premiumCost !== undefined ? `$${Number(result.premiumCost).toFixed(2)}` : '-'}</p>
                            </div>
                            {selectedResult === result.id && (
                              <Badge variant="default" className="w-full justify-center">
                                Selected
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {/* Detailed Analysis - Shows when a configuration is selected */}
                    {selectedResult && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-1 w-8 bg-green-500 rounded"></div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            Configuration Analysis - Option {optimizationResults.findIndex((r) => r.id === selectedResult) + 1}
                          </h2>
                        </div>
                        {(() => {
                          const selected = optimizationResults.find((r) => r.id === selectedResult)
                          if (!selected) return null
                          return (
                            <div className="grid gap-6">
                              {/* Premium Calculation Result */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Premium Calculation Result</CardTitle>
                                  <CardDescription>Key financial metrics for this configuration</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                      <p className="text-sm text-green-700 font-medium mb-1">Premium Rate</p>
                                      <p className="text-2xl font-bold text-green-600">{selected.premiumRate ? (selected.premiumRate * 100).toFixed(2) + '%' : '-'}</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                                      <p className="text-sm text-orange-700 font-medium mb-1">Maximum Payout</p>
                                      <p className="text-2xl font-bold text-orange-600">{selected.max_payout !== undefined ? `$${Number(selected.max_payout).toFixed(2)}` : '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                      <p className="text-sm text-gray-700 font-medium mb-1">Expected Payout</p>
                                      <p className="text-2xl font-bold text-gray-900">{selected.expectedPayout !== undefined ? `$${Number(selected.expectedPayout).toFixed(2)}` : '-'}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              {/* Trigger Configuration */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Trigger Configuration</CardTitle>
                                  <CardDescription>Individual trigger details by coverage period</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {selected.periods && selected.periods.length > 0 ? (
                                      selected.periods.map((period: any, idx: number) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-2 bg-white">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              {getPerilIcon(
                                                period.perils.length === 2 ? 'BOTH' : period.perils[0]?.peril_type
                                              )}
                                              <span className="font-medium">Period {idx + 1}</span>
                                              <Badge variant="outline">
                                                {period.perils.length === 2
                                                  ? 'Both (LRI + ERI)'
                                                  : getPerilLabel(period.perils[0]?.peril_type)}
                                              </Badge>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              {/* If you have start/end dates, show them here. Otherwise, show day-of-year as fallback */}
                                              {coveragePeriods[idx]?.startDate && coveragePeriods[idx]?.endDate
                                                ? `${coveragePeriods[idx].startDate} to ${coveragePeriods[idx].endDate}`
                                                : `Day ${period.start_day + 1} to ${period.end_day + 1}`}
                                            </div>
                                          </div>
                            <div className="space-y-3">
                                            {period.perils.map((peril: any, perilIdx: number) => (
                                              <div
                                                key={perilIdx}
                                                className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2"
                                              >
                                                <div className="flex items-center gap-2 mb-2">
                                                  {peril.peril_type === 'LRI' ? (
                                                    <TrendingDown className="h-4 w-4 text-gray-600" />
                                                  ) : (
                                                    <TrendingUp className="h-4 w-4 text-gray-600" />
                                                  )}
                                                  <span className="font-medium text-gray-900">
                                                    {peril.peril_type === 'LRI' ? 'Low Rainfall Trigger' : 'High Rainfall Trigger'}
                                                  </span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                                                  <div>
                                                    <p className="text-gray-600">Trigger</p>
                                                    <p className="font-semibold">
                                                      {peril.peril_type === 'LRI' ? '≤' : '≥'} {Number(peril.trigger).toFixed(0)}mm
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-gray-600">Duration Days</p>
                                                    <p className="font-semibold">{peril.duration}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-gray-600">Unit Payout</p>
                                                    <p className="font-semibold">${peril.unit_payout !== undefined ? Number(peril.unit_payout).toFixed(2) : '-'}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-gray-600">Max Payout</p>
                                                    <p className="font-semibold">${peril.max_payout !== undefined ? Number(peril.max_payout).toFixed(0) : '-'}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                </div>
                            </div>
                                      ))
                                    ) : (
                                      <div className="text-center text-gray-400 py-4">No trigger configuration data available.</div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                              {/* Historical Trigger Events */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Historical Trigger Events</CardTitle>
                                  <CardDescription>30-year analysis of trigger activations and payouts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {/* Quick facts row */}
                                  {selected.yearly_results && selected.yearly_results.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600">Total Events</p>
                                        <p className="text-lg font-bold">{selected.yearly_results.length}</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600">Triggered Years</p>
                                        <p className="text-lg font-bold text-red-600">{
                                          selected.yearly_results.filter((yr: any) =>
                                            yr.periods.some((p: any) => p.trigger_met)
                                          ).length
                                        }</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600">Trigger Rate</p>
                                        <p className="text-lg font-bold text-green-600">{
                                          (
                                            (selected.yearly_results.filter((yr: any) =>
                                              yr.periods.some((p: any) => p.trigger_met)
                                            ).length / selected.yearly_results.length) * 100
                                          ).toFixed(0)
                                        }%</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-sm text-gray-600">Avg. Payout</p>
                                        <p className="text-lg font-bold">${
                                          (selected.yearly_results.reduce((acc: number, yr: any) => acc + yr.total_payout, 0) /
                                            selected.yearly_results.length).toFixed(0)
                                        }</p>
                                      </div>
                                    </div>
                                  )}
                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="max-h-80 overflow-y-auto">
                                      <table className="w-full">
                                        <thead className="bg-gray-50 sticky top-0">
                                          <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Index Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trigger</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payout</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                          {selected.yearly_results && selected.yearly_results.length > 0 ? (
                                            selected.yearly_results.map((yr: any, yIdx: number) => (
                                              yr.periods.map((period: any, periodIdx: number) => (
                                                period.perils.map((peril: any, perilIdx: number) => (
                                                  <tr key={`${yIdx}-${periodIdx}-${perilIdx}`}>
                                                    <td className="px-4 py-3 text-sm font-medium">{yr.year}</td>
                                                    <td className="px-4 py-3 text-sm">Period {periodIdx + 1}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                      <Badge variant="outline" className="text-xs">
                                                        {peril.peril_type === 'LRI' ? 'Low Rainfall' : 'High Rainfall'}
                                                      </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{peril.peril_type === 'LRI' ? `≤${peril.trigger}` : `≥${peril.trigger}`}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                      {peril.payout > 0 ? (
                                                        <span className="font-semibold text-green-600">${Number(peril.payout).toFixed(2)}</span>
                                                      ) : (
                                                        <span className="text-gray-400">$0.00</span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))
                                              ))
                                            ))
                                          ) : (
                                            <tr><td colSpan={5} className="text-center text-gray-400 py-4">No historical trigger event data available.</td></tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )
                        })()}
                    </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => { clearOptimizationState(); setCurrentStep(2); }}>
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
