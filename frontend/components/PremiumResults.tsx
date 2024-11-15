import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PremiumResponse } from "@/types/premium";

export function PremiumResults({ data }: { data: PremiumResponse }) {
  return (
    <div className="space-y-6">
      {/* Premium Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Calculation Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-600">Premium Rate</h4>
              <p className="text-2xl font-bold text-green-600">{data.premium.rate.toFixed(2)}%</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-600">Average Risk Rate</h4>
              <p className="text-2xl text-blue-600">{data.premium.etotal.toFixed(2)}%</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-600">Maximum Payout</h4>
              <p className="text-2xl text-orange-600">${data.premium.max_payout.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Phase & Index Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Phase</TableHead>
                <TableHead>Index Type</TableHead>
                <TableHead className="text-right">Average Payout</TableHead>
                <TableHead className="text-right">Total Payout</TableHead>
                <TableHead className="text-right">Max Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.phase_analysis).map(([phase, phaseData]) => (
                Object.entries(phaseData.indexes).map(([index, stats]) => (
                  <TableRow key={`${phase}-${index}`}>
                    <TableCell className="font-medium">{phase}</TableCell>
                    <TableCell>{index}</TableCell>
                    <TableCell className="text-right">{stats.average_payout_percentage.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">${stats.total_payout.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${stats.max_payout.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Risk Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-600">Payout Frequency</h4>
              <p className="text-xl mt-2">{data.risk_metrics.payout_probability.toFixed(2)}%</p>
              <p className="text-sm text-gray-500 mt-1">
                Triggers met in {data.risk_metrics.payout_years} out of {data.risk_metrics.years_analyzed} years
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-600">Annual Payout Statistics</h4>
              <p className="text-xl mt-2">Average: ${data.risk_metrics.average_annual_payout.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Range: ${data.risk_metrics.min_annual_payout.toFixed(2)} - ${data.risk_metrics.max_annual_payout.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-600">Analysis Period</h4>
              <p className="text-xl mt-2">{data.risk_metrics.years_analyzed} Years</p>
              <p className="text-sm text-gray-500 mt-1">Historical data analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Events Card */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Trigger Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Index Type</TableHead>
                  <TableHead className="text-right">Rainfall</TableHead>
                  <TableHead className="text-right">Trigger Value</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.yearly_analysis.map((year) => (
                  year.triggers.map((trigger) => (
                    <TableRow key={`${year.year}-${trigger.phase}-${trigger.index_type}`}>
                      <TableCell>{year.year}</TableCell>
                      <TableCell>{trigger.phase}</TableCell>
                      <TableCell>{trigger.index_type}</TableCell>
                      <TableCell className="text-right">{trigger.rainfall.toFixed(2)}mm</TableCell>
                      <TableCell className="text-right">{trigger.trigger_value.toFixed(2)}mm</TableCell>
                      <TableCell className="text-right">${trigger.payout.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 