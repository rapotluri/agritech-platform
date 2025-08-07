import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizationResult } from "./types";

interface OptimizationResultsProps {
  optimizationResults: OptimizationResult[];
  selectedResult: string | null;
  setSelectedResult: (id: string | null) => void;
  getRiskScoreColor: (score: string) => string;
}

export default function OptimizationResults({
  optimizationResults,
  selectedResult,
  setSelectedResult,
  getRiskScoreColor,
}: OptimizationResultsProps) {
  return (
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
              <CardTitle className="text-lg">
                {result.label || `Option ${index + 1}`}
              </CardTitle>
              <Badge className={getRiskScoreColor(result.riskScore)}>{result.riskScore}</Badge>
            </div>
            {result.description && (
              <p className="text-sm text-gray-600 mt-1">{result.description}</p>
            )}
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
              <p className="font-semibold text-xl text-green-600">
                {result.premiumCost !== undefined ? `$${Number(result.premiumCost).toFixed(2)}` : '-'}
              </p>
              {result.premiumIncrease && (
                <p className="text-sm text-blue-600 mt-1">{result.premiumIncrease}</p>
              )}
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
  );
}
