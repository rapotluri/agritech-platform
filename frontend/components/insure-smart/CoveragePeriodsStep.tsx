import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { SimpleDatePicker } from "@/components/ui/SimpleDatePicker";
import { CoveragePeriod } from "./types";

interface CoveragePeriodsStepProps {
  coveragePeriods: CoveragePeriod[];
  addCoveragePeriod: () => void;
  updateCoveragePeriod: (id: string, field: keyof CoveragePeriod, value: string) => void;
  removeCoveragePeriod: (id: string) => void;
  canProceedToStep3: () => boolean;
  onBack: () => void;
  onNext: () => void;
  getPerilIcon: (peril: string) => React.ReactNode;
  getPerilLabel: (peril: string, dataType?: string) => string;
  dataType: "precipitation" | "temperature";
}

export default function CoveragePeriodsStep({
  coveragePeriods,
  addCoveragePeriod,
  updateCoveragePeriod,
  removeCoveragePeriod,
  canProceedToStep3,
  onBack,
  onNext,
  getPerilIcon,
  getPerilLabel,
  dataType,
}: CoveragePeriodsStepProps) {
  // Dynamic peril options based on data type
  const getPerilOptions = (dataType: string) => {
    if (dataType === "temperature") {
      return [
        { value: "LTI", label: "Low Temperature (LTI)", icon: <TrendingDown /> },
        { value: "HTI", label: "High Temperature (HTI)", icon: <TrendingUp /> },
        { value: "BOTH", label: "Both (LTI + HTI)", icon: <Zap /> }
      ];
    } else {
      return [
        { value: "LRI", label: "Low Rainfall (LRI)", icon: <TrendingDown /> },
        { value: "ERI", label: "High Rainfall (ERI)", icon: <TrendingUp /> },
        { value: "BOTH", label: "Both (LRI + ERI)", icon: <Zap /> }
      ];
    }
  };

  const perilOptions = getPerilOptions(dataType);

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
                        <label className="text-sm font-medium">Peril Type *</label>
                        <Select
                          value={period.perilType}
                          onValueChange={(value) => updateCoveragePeriod(period.id, "perilType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {perilOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  {option.icon}
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {period.startDate && period.endDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {getPerilIcon(period.perilType)}
                        <span>
                          {getPerilLabel(period.perilType, dataType)} coverage from {period.startDate} to {period.endDate}
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
        <Button variant="outline" onClick={onBack}>
          Back: Product Details
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={onNext}
          disabled={!canProceedToStep3()}
        >
          Next: Optimize Product
        </Button>
      </div>
    </div>
  );
}
