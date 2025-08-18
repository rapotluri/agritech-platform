"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, MapPin, Calculator, CheckCircle } from "lucide-react"

interface AssignmentSummaryProps {
  selectedFarmers: string[]
  selectedPlots: Record<string, string[]>
  totalPlots: number
  plotData: Record<string, any[]> // Add plot data to calculate actual areas
  premiumRate: number // Add premium rate from product
  currentStep: number
  assignmentConfirmed: boolean
}

export function AssignmentSummary({
  selectedFarmers,
  selectedPlots,
  totalPlots,
  plotData,
  premiumRate,
  currentStep,
  assignmentConfirmed
}: AssignmentSummaryProps) {
  const getTotalAreaSelected = () => {
    // Calculate actual area from selected plot data
    let totalArea = 0
    Object.entries(selectedPlots).forEach(([farmerId, plotIds]) => {
      const farmerPlots = plotData[farmerId] || []
      plotIds.forEach(plotId => {
        const plot = farmerPlots.find(p => p.id === plotId)
        if (plot && plot.area_ha) {
          totalArea += parseFloat(plot.area_ha)
        }
      })
    })
    return totalArea
  }

  const getEstimatedPremium = () => {
    // Calculate based on actual area and product premium rate
    const area = getTotalAreaSelected()
    return area * premiumRate
  }

  const getStepStatus = (step: number) => {
    if (step < currentStep) {
      return "completed"
    }
    if (step === currentStep) {
      return "current"
    }
    return "pending"
  }

  const getStepIcon = (step: number) => {
    const status = getStepStatus(step)
    
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "current":
        return <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{step}</span>
        </div>
      case "pending":
        return <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-600 text-xs font-bold">{step}</span>
        </div>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            {getStepIcon(1)}
            <div className="flex-1">
              <div className="font-medium">Farmer Selection</div>
              <div className="text-sm text-gray-500">
                {selectedFarmers.length > 0 
                  ? `${selectedFarmers.length} farmers selected`
                  : "No farmers selected"
                }
              </div>
            </div>
            {getStepStatus(1) === "completed" && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Complete
              </Badge>
            )}
          </div>

          <Separator />

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            {getStepIcon(2)}
            <div className="flex-1">
              <div className="font-medium">Plot Selection</div>
              <div className="text-sm text-gray-500">
                {totalPlots > 0 
                  ? `${totalPlots} plots selected`
                  : "No plots selected"
                }
              </div>
            </div>
            {getStepStatus(2) === "completed" && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Complete
              </Badge>
            )}
          </div>

          <Separator />

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            {getStepIcon(3)}
            <div className="flex-1">
              <div className="font-medium">Review & Confirm</div>
              <div className="text-sm text-gray-500">
                {assignmentConfirmed 
                  ? "Assignment confirmed"
                  : "Review and confirm assignment"
                }
              </div>
            </div>
            {getStepStatus(3) === "completed" && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Complete
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selection Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Farmers Count */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Selected Farmers</div>
              <div className="font-semibold text-lg">{selectedFarmers.length}</div>
            </div>
          </div>

          {/* Plots Count */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Selected Plots</div>
              <div className="font-semibold text-lg">{totalPlots}</div>
            </div>
          </div>

          {/* Total Area */}
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Total Area</div>
              <div className="font-semibold text-lg">{getTotalAreaSelected().toFixed(2)} ha</div>
            </div>
          </div>

          <Separator />

          {/* Estimated Premium */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Estimated Total Premium</div>
            <div className="text-2xl font-bold text-green-700">
              ${getEstimatedPremium().toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Based on selected area and product rates
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Step 1:</strong> Search and select farmers who meet your criteria. 
              Only verified farmers are shown by default.
            </p>
            <p>
              <strong>Step 2:</strong> Choose which plots to include for each farmer. 
              You can select all plots or individual ones.
            </p>
            <p>
              <strong>Step 3:</strong> Review assignment details and confirm to create enrollments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
