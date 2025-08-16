"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, MapPin, Calculator, DollarSign, FileText, CheckCircle } from "lucide-react"

interface AssignmentSummaryStepProps {
  selectedFarmers: string[]
  selectedPlots: Record<string, string[]>
  plotData: Record<string, any[]>
  farmerData: Record<string, any>
  premiumRate: number
  product: any
  assignmentConfirmed: boolean
  onAssignmentConfirmed: (confirmed: boolean) => void
}

export function AssignmentSummaryStep({
  selectedFarmers,
  selectedPlots,
  plotData,
  farmerData,
  premiumRate,
  product,
  assignmentConfirmed,
  onAssignmentConfirmed
}: AssignmentSummaryStepProps) {
  
  const getTotalAreaSelected = () => {
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
    const area = getTotalAreaSelected()
    return area * premiumRate
  }

  const getTotalSumInsured = () => {
    // For now, using a simple calculation - this could be enhanced based on product configuration
    const area = getTotalAreaSelected()
    // Assuming $1000 per hectare as default sum insured - this should come from product config
    return area * 1000
  }

  const handleCreateEnrollments = () => {
    if (assignmentConfirmed) {
      // TODO: Implement enrollment creation logic
      console.log("Creating enrollments...")
      // This would typically call an API to create the enrollments
    }
  }

  const handleExportSummary = () => {
    // TODO: Implement export functionality
    console.log("Exporting summary...")
  }

  return (
    <div className="space-y-6">
      {/* Assignment Summary Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Assignment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{selectedFarmers.length}</div>
              <div className="text-sm text-blue-600">Farmers</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">
                {Object.values(selectedPlots).reduce((total, plotIds) => total + plotIds.length, 0)}
              </div>
              <div className="text-sm text-green-600">Plots</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calculator className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">{getTotalAreaSelected().toFixed(2)}</div>
              <div className="text-sm text-purple-600">Hectares</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700">${getEstimatedPremium().toFixed(2)}</div>
              <div className="text-sm text-orange-600">Premium</div>
            </div>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-green-600">Premium Rate</div>
                <div className="text-xl font-bold text-green-700">${premiumRate}/ha</div>
              </div>
              <div>
                <div className="text-sm text-green-600">Total Sum Insured</div>
                <div className="text-xl font-bold text-green-700">${getTotalSumInsured().toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-green-600">Total Premium</div>
                <div className="text-xl font-bold text-green-700">${getEstimatedPremium().toFixed(2)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farmer & Plot Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer Name</TableHead>
                <TableHead>Farmer ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Plots</TableHead>
                <TableHead>Area (ha)</TableHead>
                <TableHead>Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedFarmers.map((farmerId) => {
                const farmerPlots = plotData[farmerId] || []
                const selectedFarmerPlots = selectedPlots[farmerId] || []
                const farmerPlotData = farmerPlots.filter(plot => selectedFarmerPlots.includes(plot.id))
                const farmerArea = farmerPlotData.reduce((total, plot) => total + (parseFloat(plot.area_ha) || 0), 0)
                const farmerPremium = farmerArea * premiumRate
                const farmer = farmerData[farmerId]

                return (
                  <TableRow key={farmerId}>
                    <TableCell className="font-medium">
                      {farmer?.english_name || `Farmer ${farmerId.slice(0, 8)}...`}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono">
                      {farmerId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {farmer?.province ? `${farmer.province}, ${farmer.district || ''}`.trim() : 'Location not specified'}
                    </TableCell>
                    <TableCell>{selectedFarmerPlots.length}</TableCell>
                    <TableCell>{farmerArea.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${farmerPremium.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Product Terms Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Product: {product?.name}</p>
              <p>• Crop Type: {product?.crop}</p>
              <p>• Coverage Period: {product?.coverage_start_date && product?.coverage_end_date ? 
                `${new Date(product.coverage_start_date).toLocaleDateString()} - ${new Date(product.coverage_end_date).toLocaleDateString()}` : 
                'Not specified'}</p>
              <p>• Premium Rate: ${premiumRate}/ha</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="assignment-confirmation"
              checked={assignmentConfirmed}
              onCheckedChange={(checked) => onAssignmentConfirmed(checked as boolean)}
            />
            <label
              htmlFor="assignment-confirmation"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm that I have reviewed the assignment details and agree to create enrollments for the selected farmers and plots.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={handleCreateEnrollments}
              disabled={!assignmentConfirmed}
              className="flex-1"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Enrollments
            </Button>
            
            <Button
              onClick={handleExportSummary}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export Summary
            </Button>
          </div>
          
          {!assignmentConfirmed && (
            <p className="text-sm text-amber-600 text-center">
              Please confirm the assignment to enable enrollment creation.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
