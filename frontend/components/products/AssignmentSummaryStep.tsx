"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, MapPin, Calculator, DollarSign, FileText, CheckCircle, Loader2 } from "lucide-react"
import { TriggerConfiguration } from "./TriggerConfiguration"
import { EnrollmentsService } from "@/lib/supabase"
import { toast } from "sonner"

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
  
  const [isCreatingEnrollments, setIsCreatingEnrollments] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
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
    // Calculate sum insured based on area and product coverage rate
    const area = getTotalAreaSelected()
    
    // Get the sum insured rate from product triggers
    if (product?.triggers && typeof product.triggers === 'object') {
      const triggers = product.triggers as any
      
      // Check if there's a sumInsured value in the triggers
      if (triggers.sumInsured) {
        return area * parseFloat(triggers.sumInsured)
      }
      
      // If no sumInsured, calculate from optimizationConfig periods
      if (triggers.optimizationConfig && triggers.optimizationConfig.periods) {
        const periods = triggers.optimizationConfig.periods
        let totalMaxPayout = 0
        
        // Sum all max_payout values across all periods
        periods.forEach((period: any) => {
          if (period.perils && Array.isArray(period.perils)) {
            period.perils.forEach((peril: any) => {
              if (peril.max_payout) {
                totalMaxPayout += parseFloat(peril.max_payout)
              }
            })
          }
        })
        
        if (totalMaxPayout > 0) {
          return area * totalMaxPayout
        }
      }
    }
    
    // Fallback: use a reasonable default if no configuration found
    const defaultCoverageRate = 800 // $800 per hectare as a reasonable default
    return area * defaultCoverageRate
  }

  const getCurrentSeason = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    
    // Simple season logic - can be enhanced based on your business rules
    if (month >= 6 && month <= 10) {
      return `Wet Season ${year}`
    } else {
      return `Dry Season ${year}`
    }
  }

  const prepareEnrollmentData = () => {
    const enrollments: Array<{
      farmer_id: string
      plot_id: string
      product_id: string
      season: string
      premium: number
      sum_insured: number
      status: 'pending'
    }> = []
    const currentSeason = getCurrentSeason()
    
    Object.entries(selectedPlots).forEach(([farmerId, plotIds]) => {
      const farmerPlots = plotData[farmerId] || []
      
      plotIds.forEach(plotId => {
        const plot = farmerPlots.find(p => p.id === plotId)
        if (plot && plot.area_ha) {
          const area = parseFloat(plot.area_ha)
          const premium = area * premiumRate
          const sumInsured = area * (getTotalSumInsured() / getTotalAreaSelected())
          
          enrollments.push({
            farmer_id: farmerId,
            plot_id: plotId,
            product_id: product.id,
            season: currentSeason,
            premium: premium,
            sum_insured: sumInsured,
            status: 'pending' as const
          })
        }
      })
    })
    
    return enrollments
  }

  const handleCreateEnrollments = async () => {
    if (!assignmentConfirmed) return
    
    try {
      setIsCreatingEnrollments(true)
      
      const enrollmentData = prepareEnrollmentData()
      
      if (enrollmentData.length === 0) {
        toast.error("No valid enrollment data to create")
        return
      }
      
      // Create enrollments in batch
      const createdEnrollments = await EnrollmentsService.createBatchEnrollments(enrollmentData)
      
      toast.success(`Successfully created ${createdEnrollments.length} enrollments!`)
      
      // TODO: Redirect to enrollments page or refresh data
      console.log("Created enrollments:", createdEnrollments)
      
    } catch (error) {
      console.error("Error creating enrollments:", error)
      toast.error("Failed to create enrollments. Please try again.")
    } finally {
      setIsCreatingEnrollments(false)
    }
  }

  const handleExportSummary = async () => {
    try {
      setIsExporting(true)
      
      // Prepare data for export
      const exportData = {
        product: {
          name: product?.name,
          crop: product?.crop,
          coveragePeriod: product?.coverage_start_date && product?.coverage_end_date ? 
            `${new Date(product.coverage_start_date).toLocaleDateString()} - ${new Date(product.coverage_end_date).toLocaleDateString()}` : 
            'Not specified',
          premiumRate: `$${premiumRate}/ha`
        },
        assignment: {
          totalFarmers: selectedFarmers.length,
          totalPlots: Object.values(selectedPlots).reduce((total, plotIds) => total + plotIds.length, 0),
          totalArea: getTotalAreaSelected(),
          totalPremium: getEstimatedPremium(),
          totalSumInsured: getTotalSumInsured()
        },
        farmers: selectedFarmers.map(farmerId => {
          const farmer = farmerData[farmerId]
          const farmerPlots = plotData[farmerId] || []
          const selectedFarmerPlots = selectedPlots[farmerId] || []
          const farmerPlotData = farmerPlots.filter(plot => selectedFarmerPlots.includes(plot.id))
          const farmerArea = farmerPlotData.reduce((total, plot) => total + (parseFloat(plot.area_ha) || 0), 0)
          const farmerPremium = farmerArea * premiumRate
          
          return {
            id: farmerId,
            name: farmer?.english_name || `Farmer ${farmerId.slice(0, 8)}...`,
            location: farmer?.province ? `${farmer.province}, ${farmer.district || ''}`.trim() : 'Location not specified',
            plots: selectedFarmerPlots.length,
            area: farmerArea,
            premium: farmerPremium
          }
        })
      }
      
      // Create and download CSV
      const csvContent = convertToCSV(exportData)
      downloadCSV(csvContent, `assignment-summary-${product?.name}-${new Date().toISOString().split('T')[0]}.csv`)
      
      toast.success("Assignment summary exported successfully!")
      
    } catch (error) {
      console.error("Error exporting summary:", error)
      toast.error("Failed to export summary. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const convertToCSV = (data: any) => {
    const headers = [
      'Product Name', 'Crop Type', 'Coverage Period', 'Premium Rate',
      'Total Farmers', 'Total Plots', 'Total Area (ha)', 'Total Premium ($)', 'Total Sum Insured ($)'
    ]
    
    const productRow = [
      data.product.name,
      data.product.crop,
      data.product.coveragePeriod,
      data.product.premiumRate,
      data.assignment.totalFarmers,
      data.assignment.totalPlots,
      data.assignment.totalArea.toFixed(2),
      data.assignment.totalPremium.toFixed(2),
      data.assignment.totalSumInsured.toFixed(2)
    ]
    
    const farmerHeaders = ['Farmer ID', 'Farmer Name', 'Location', 'Plots', 'Area (ha)', 'Premium ($)']
    
    const csvRows = [
      headers.join(','),
      productRow.join(','),
      '',
      farmerHeaders.join(','),
      ...data.farmers.map((farmer: any) => [
        farmer.id,
        `"${farmer.name}"`,
        `"${farmer.location}"`,
        farmer.plots,
        farmer.area.toFixed(2),
        farmer.premium.toFixed(2)
      ].join(','))
    ]
    
    return csvRows.join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <div className="mt-4 text-xs text-green-700">
              <p><strong>Sum Insured:</strong> Total coverage value based on area and product coverage rate</p>
              <p><strong>Premium:</strong> Total cost based on area and premium rate</p>
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

      {/* Product Triggers */}
      <TriggerConfiguration product={product} />

      {/* Final Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confirmation Checkbox */}
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

          <div className="flex gap-3">
            <Button
              onClick={handleCreateEnrollments}
              disabled={!assignmentConfirmed || isCreatingEnrollments}
              className="flex-1"
              size="lg"
            >
              {isCreatingEnrollments ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Enrollments
                </>
              )}
            </Button>
            
            <Button
              onClick={handleExportSummary}
              disabled={isExporting}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Export Summary
                </>
              )}
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
