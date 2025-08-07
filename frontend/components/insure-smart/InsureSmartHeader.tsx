import { Progress } from "@/components/ui/progress";

interface InsureSmartHeaderProps {
  currentStep: number;
  getStepProgress: () => number;
  onStepClick: (step: number) => void;
}

export default function InsureSmartHeader({ currentStep, getStepProgress, onStepClick }: InsureSmartHeaderProps) {
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
          <span>Step {currentStep} of 4</span>
          <span>{Math.round(getStepProgress())}% Complete</span>
        </div>
        <Progress value={getStepProgress()} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500">
          <span 
            className={`${currentStep >= 1 ? "text-green-600 font-medium" : ""} ${currentStep >= 1 ? "cursor-pointer hover:underline hover:text-green-700 transition-colors" : ""}`}
            onClick={() => currentStep >= 1 && onStepClick(1)}
          >
            Product Details
          </span>
          <span 
            className={`${currentStep >= 2 ? "text-green-600 font-medium" : ""} ${currentStep >= 2 ? "cursor-pointer hover:underline hover:text-green-700 transition-colors" : ""}`}
            onClick={() => currentStep >= 2 && onStepClick(2)}
          >
            Coverage Periods
          </span>
          <span 
            className={`${currentStep >= 3 ? "text-green-600 font-medium" : ""} ${currentStep >= 3 ? "cursor-pointer hover:underline hover:text-green-700 transition-colors" : ""}`}
            onClick={() => currentStep >= 3 && onStepClick(3)}
          >
            Product Design
          </span>
          <span 
            className={`${currentStep >= 4 ? "text-green-600 font-medium" : ""} ${currentStep >= 4 ? "cursor-pointer hover:underline hover:text-green-700 transition-colors" : ""}`}
            onClick={() => currentStep >= 4 && onStepClick(4)}
          >
            Term Sheet
          </span>
        </div>
      </div>
    </div>
  );
}
