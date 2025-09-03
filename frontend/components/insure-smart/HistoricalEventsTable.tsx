import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizationResult } from "./types";

interface HistoricalEventsTableProps {
  selected: OptimizationResult;
  dataType?: "precipitation" | "temperature";
}

export default function HistoricalEventsTable({ selected, dataType = "precipitation" }: HistoricalEventsTableProps) {
  if (!selected.yearly_results || selected.yearly_results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historical Trigger Events</CardTitle>
          <CardDescription>30-year analysis of trigger activations and payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-4">No historical trigger event data available.</div>
        </CardContent>
      </Card>
    );
  }

  const triggeredYears = selected.yearly_results.filter((yr: any) =>
    yr.periods.some((p: any) =>
      p.perils.some((peril: any) => peril.trigger_met)
    )
  ).length;
  const totalYears = selected.yearly_results.length;
  const triggerRate = totalYears > 0 ? Math.round((triggeredYears / totalYears) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historical Trigger Events</CardTitle>
        <CardDescription>30-year analysis of trigger activations and payouts</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quick facts row */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Triggered Years</p>
            <p className="text-lg font-bold text-red-600">{triggeredYears}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Trigger Rate</p>
            <p className="text-lg font-bold text-green-600">{triggerRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Avg. Payout</p>
            <p className="text-lg font-bold">
              ${(selected.yearly_results.reduce((acc: number, yr: any) => acc + yr.total_payout, 0) /
                selected.yearly_results.length).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Index Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trigger</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    {dataType === "temperature" ? "Actual Temperature" : "Actual Rainfall"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selected.yearly_results
                  .filter((yr: any) =>
                    yr.periods.some((p: any) =>
                      p.perils.some((peril: any) => peril.trigger_met)
                    )
                  )
                  .map((yr: any, yIdx: number) => (
                    yr.periods.map((period: any, periodIdx: number) => (
                      period.perils.map((peril: any, perilIdx: number) => (
                        <tr key={`${yIdx}-${periodIdx}-${perilIdx}`}>
                          <td className="px-4 py-3 text-sm font-medium">{yr.year}</td>
                          <td className="px-4 py-3 text-sm">Period {periodIdx + 1}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {peril.peril_type === 'LRI' ? 'Low Rainfall' : 
                               peril.peril_type === 'ERI' ? 'High Rainfall' :
                               peril.peril_type === 'LTI' ? 'Low Temperature' : 
                               'High Temperature'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {peril.peril_type === 'LRI' || peril.peril_type === 'LTI' ? `≤${Math.round(peril.trigger)}` : `≥${Math.round(peril.trigger)}`}
                            {peril.peril_type === 'LRI' || peril.peril_type === 'ERI' ? 'mm' : '°C'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(peril.actual_rainfall !== undefined && peril.actual_rainfall !== null) || 
                             (peril.actual_temperature !== undefined && peril.actual_temperature !== null) || 
                             (peril.actual_value !== undefined && peril.actual_value !== null)
                              ? Number(peril.actual_rainfall || peril.actual_temperature || peril.actual_value).toFixed(2) 
                              : '-'}
                            {dataType === "temperature" ? '°C' : 'mm'}
                          </td>
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
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
