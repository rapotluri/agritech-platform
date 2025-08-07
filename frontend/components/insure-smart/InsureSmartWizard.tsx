"use client";

import { useState } from "react";
import provincesCommunesData from "../../data/cambodia_provinces_communes.json";
import apiClient from "@/lib/apiClient";
import { Product, CoveragePeriod, OptimizationResult } from "./types";
import InsureSmartHeader from "./InsureSmartHeader";
import ProductDetailsStep from "./ProductDetailsStep";
import CoveragePeriodsStep from "./CoveragePeriodsStep";
import OptimizationStep from "./OptimizationStep";
import TermSheetStep from "./TermSheetStep";
import { TrendingDown, TrendingUp, Zap } from "lucide-react";

const provincesCommunes = provincesCommunesData as Record<string, string[]>;
const provinceKeys = Object.keys(provincesCommunes);

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
          }
        } catch {
          setIsOptimizing(false);
        }
      };
      pollStatus();
    } catch {
      setIsOptimizing(false);
    }
  };

  const getStepProgress = () => (currentStep / 4) * 100;

  const canProceedToStep2 = (): boolean => {
    return !!(product.name && product.province && product.commune && product.sumInsured && product.premiumCap);
  };

  const canProceedToStep3 = (): boolean => {
    return !!(
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
    setIsOptimizing(false);
    setSelectedResult(null);
  };

  // Handle step navigation
  const handleStepNavigation = (targetStep: number) => {
    // Only allow navigation to accessible steps
    if (targetStep > currentStep) {
      return; // Don't allow navigation to future steps
    }

    // Clear optimization results when navigating to previous steps
    if (targetStep < currentStep && optimizationResults.length > 0) {
      clearOptimizationState();
    }

    setCurrentStep(targetStep);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <InsureSmartHeader currentStep={currentStep} getStepProgress={getStepProgress} onStepClick={handleStepNavigation} />
        
        {/* Step 1: Product Details */}
        {currentStep === 1 && (
          <ProductDetailsStep
            product={product}
            setProduct={setProduct}
            provinceKeys={provinceKeys}
            communeOptions={communeOptions}
            handleProvinceChange={handleProvinceChange}
            canProceedToStep2={canProceedToStep2}
            onNext={() => setCurrentStep(2)}
          />
        )}
        
        {/* Step 2: Coverage Periods */}
        {currentStep === 2 && (
          <CoveragePeriodsStep
            coveragePeriods={coveragePeriods}
            addCoveragePeriod={addCoveragePeriod}
            updateCoveragePeriod={updateCoveragePeriod}
            removeCoveragePeriod={removeCoveragePeriod}
            canProceedToStep3={canProceedToStep3}
            onBack={() => { clearOptimizationState(); setCurrentStep(1); }}
            onNext={() => setCurrentStep(3)}
            getPerilIcon={getPerilIcon}
            getPerilLabel={getPerilLabel}
          />
        )}
        
        {/* Step 3: Product Design */}
        {currentStep === 3 && (
          <OptimizationStep
            product={product}
            coveragePeriods={coveragePeriods}
            optimizationResults={optimizationResults}
            isOptimizing={isOptimizing}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            runOptimization={runOptimization}
            clearOptimizationState={clearOptimizationState}
            onBack={() => { clearOptimizationState(); setCurrentStep(2); }}
            onNext={() => setCurrentStep(4)}
            getRiskScoreColor={getRiskScoreColor}
            getPerilIcon={getPerilIcon}
            getPerilLabel={getPerilLabel}
          />
        )}
        
        {/* Step 4: Term Sheet */}
        {currentStep === 4 && (
          <TermSheetStep
            product={product}
            coveragePeriods={coveragePeriods}
            selectedResult={selectedResult}
            optimizationResults={optimizationResults}
            onBack={() => setCurrentStep(3)}
            getPerilIcon={getPerilIcon}
            getPerilLabel={getPerilLabel}
          />
        )}
      </div>
    </div>
  );
}
