import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap } from "lucide-react";
import { Product, CoveragePeriod, OptimizationResult } from "./types";
import OptimizationResults from "./OptimizationResults";
import ConfigurationAnalysis from "./ConfigurationAnalysis";
import HistoricalEventsTable from "./HistoricalEventsTable";

interface OptimizationStepProps {
  product: Product;
  coveragePeriods: CoveragePeriod[];
  optimizationResults: OptimizationResult[];
  isOptimizing: boolean;
  selectedResult: string | null;
  setSelectedResult: (id: string | null) => void;
  runOptimization: () => void;
  clearOptimizationState: () => void;
  onBack: () => void;
  onNext: () => void;
  getRiskScoreColor: (score: string) => string;
  getPerilIcon: (peril: string) => React.ReactNode;
  getPerilLabel: (peril: string) => string;
}

export default function OptimizationStep({
  product,
  coveragePeriods,
  optimizationResults,
  isOptimizing,
  selectedResult,
  setSelectedResult,
  runOptimization,
  clearOptimizationState,
  onBack,
  onNext,
  getRiskScoreColor,
  getPerilIcon,
  getPerilLabel,
}: OptimizationStepProps) {
  const selected = optimizationResults.find((r) => r.id === selectedResult);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Product Design
          </CardTitle>
          <CardDescription>
            Design your product by finding the best trigger values and payout structure based on 30 years of historical weather data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {optimizationResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="space-y-4">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Ready to Design</h3>
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
                    <p className="text-gray-600">Designing product...</p>
                    <p className="text-sm text-gray-500">
                      Analyzing 30 years of rainfall data and designing product parameters
                    </p>
                  </div>
                ) : (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={runOptimization} size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Design Product
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Product Design Complete</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Found {optimizationResults.length} optimized configurations that meet your criteria
                </p>
              </div>
              
              {/* Configuration Cards - Horizontal Layout */}
              <OptimizationResults
                optimizationResults={optimizationResults}
                selectedResult={selectedResult}
                setSelectedResult={setSelectedResult}
                getRiskScoreColor={getRiskScoreColor}
              />
              
              {/* Detailed Analysis - Shows when a configuration is selected */}
              {selectedResult && selected && (
                <>
                  <ConfigurationAnalysis
                    selected={selected}
                    coveragePeriods={coveragePeriods}
                    getPerilIcon={getPerilIcon}
                    getPerilLabel={getPerilLabel}
                  />
                  <HistoricalEventsTable selected={selected} />
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => { clearOptimizationState(); onBack(); }}>
          Back: Coverage Periods
        </Button>
        {optimizationResults.length > 0 && (
          <div className="flex justify-end">
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              disabled={!selectedResult}
              onClick={onNext}
            >
              Generate Term Sheet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
