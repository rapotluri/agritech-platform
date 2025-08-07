import { Progress } from "@/components/ui/progress";

interface InsureSmartHeaderProps {
  currentStep: number;
  getStepProgress: () => number;
}

export default function InsureSmartHeader({ currentStep, getStepProgress }: InsureSmartHeaderProps) {
  return (
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
          <span>Step {currentStep} of 3</span>
          <span>{Math.round(getStepProgress())}% Complete</span>
        </div>
        <Progress value={getStepProgress()} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500">
          <span className={currentStep >= 1 ? "text-green-600 font-medium" : ""}>Product Details</span>
          <span className={currentStep >= 2 ? "text-green-600 font-medium" : ""}>Coverage Periods</span>
          <span className={currentStep >= 3 ? "text-green-600 font-medium" : ""}>Optimization</span>
          <span className={currentStep >= 4 ? "text-green-600 font-medium" : ""}>Term Sheet</span>
        </div>
      </div>
    </div>
  );
}
