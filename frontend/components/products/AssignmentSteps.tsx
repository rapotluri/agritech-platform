"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FarmerSelector } from "./FarmerSelector"
import { PlotSelector } from "./PlotSelector"
import { AssignmentSummaryStep } from "./AssignmentSummaryStep"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AssignmentStepsProps {
  currentStep: number
  onStepChange: (step: number) => void
  selectedFarmers: string[]
  selectedPlots: Record<string, string[]>
  onFarmerSelection: (farmerIds: string[]) => void
  onPlotSelection: (farmerId: string, plotIds: string[]) => void
  onPlotDataUpdate: (farmerId: string, plots: any[]) => void
  onFarmerDataUpdate: (farmerId: string, farmer: any) => void
  assignmentConfirmed: boolean
  onAssignmentConfirmed: (confirmed: boolean) => void
  product: any
  plotData: Record<string, any[]>
  farmerData: Record<string, any>
  premiumRate: number
}

export function AssignmentSteps({
  currentStep,
  onStepChange,
  selectedFarmers,
  selectedPlots,
  onFarmerSelection,
  onPlotSelection,
  onPlotDataUpdate,
  onFarmerDataUpdate,
  assignmentConfirmed,
  onAssignmentConfirmed,
  product,
  plotData,
  farmerData,
  premiumRate
}: AssignmentStepsProps) {

  const handleNext = () => {
    if (currentStep === 1 && selectedFarmers.length > 0) {
      onStepChange(2)
    } else if (currentStep === 2 && Object.values(selectedPlots).some(plots => plots.length > 0)) {
      onStepChange(3)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1)
    }
  }

  const canProceedToNext = () => {
    if (currentStep === 1) {
      return selectedFarmers.length > 0
    }
    if (currentStep === 2) {
      return Object.values(selectedPlots).some(plots => plots.length > 0)
    }
    return false
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <FarmerSelector
            selectedFarmers={selectedFarmers}
            onSelectionChange={onFarmerSelection}
            onFarmerDataUpdate={onFarmerDataUpdate}
          />
        )
      case 2:
        return (
          <PlotSelector
            selectedFarmers={selectedFarmers}
            selectedPlots={selectedPlots}
            onPlotSelection={onPlotSelection}
            onPlotDataUpdate={onPlotDataUpdate}
          />
        )
      case 3:
        return (
          <AssignmentSummaryStep
            selectedFarmers={selectedFarmers}
            selectedPlots={selectedPlots}
            plotData={plotData}
            farmerData={farmerData}
            premiumRate={premiumRate}
            product={product}
            assignmentConfirmed={assignmentConfirmed}
            onAssignmentConfirmed={onAssignmentConfirmed}
          />
        )
      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Step 1: Select Farmers"
      case 2:
        return "Step 2: Select Plots"
      case 3:
        return "Step 3: Review & Confirm Assignment"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Search and select farmers who will be enrolled in this product"
      case 2:
        return "Choose which plots to include for each selected farmer"
      case 3:
        return "Review assignment details and confirm to create enrollments"
      default:
        return ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{getStepTitle()}</CardTitle>
        <p className="text-gray-600">{getStepDescription()}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < 3 && (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
