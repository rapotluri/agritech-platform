import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { OptimizationResult, CoveragePeriod } from "./types";

interface ConfigurationAnalysisProps {
  selected: OptimizationResult;
  coveragePeriods: CoveragePeriod[];
  getPerilIcon: (peril: string) => React.ReactNode;
  getPerilLabel: (peril: string) => string;
}

export default function ConfigurationAnalysis({
  selected,
  coveragePeriods,
  getPerilIcon,
  getPerilLabel,
}: ConfigurationAnalysisProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-8 bg-green-500 rounded"></div>
        <h2 className="text-xl font-semibold text-gray-900">
          Configuration Analysis - Option {selected.id}
        </h2>
      </div>
      
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
                <p className="text-2xl font-bold text-green-600">
                  {selected.premiumRate ? (selected.premiumRate * 100).toFixed(2) + '%' : '-'}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-sm text-orange-700 font-medium mb-1">Maximum Payout</p>
                <p className="text-2xl font-bold text-orange-600">
                  {selected.max_payout !== undefined ? `$${Number(selected.max_payout).toFixed(2)}` : '-'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-700 font-medium mb-1">Expected Payout</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selected.expectedPayout !== undefined ? `$${Number(selected.expectedPayout).toFixed(2)}` : '-'}
                </p>
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
                              <p className="font-semibold">
                                ${peril.unit_payout !== undefined ? Number(peril.unit_payout).toFixed(2) : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Max Payout</p>
                              <p className="font-semibold">
                                ${peril.max_payout !== undefined ? Number(peril.max_payout).toFixed(0) : '-'}
                              </p>
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
      </div>
    </div>
  );
}
