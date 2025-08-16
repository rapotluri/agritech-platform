"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { useFarmers } from "@/lib/hooks"
import { MapPin, Crop, Ruler, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlotSelectorProps {
  selectedFarmers: string[]
  selectedPlots: Record<string, string[]>
  onPlotSelection: (farmerId: string, plotIds: string[]) => void
  onPlotDataUpdate: (farmerId: string, plots: any[]) => void
}

export function PlotSelector({
  selectedFarmers,
  selectedPlots,
  onPlotSelection,
  onPlotDataUpdate
}: PlotSelectorProps) {
  const [expandedFarmers, setExpandedFarmers] = useState<string[]>([])

  // Fetch detailed farmer data with plots
  const { data: farmersResponse, isLoading, error } = useFarmers(
    { 
      // Filter to only selected farmers
      farmerIds: selectedFarmers 
    },
    { column: null, direction: 'asc' },
    { page: 1, limit: 100 }
  )

  const farmers = useMemo(() => farmersResponse?.farmers || [], [farmersResponse?.farmers])

  // Update plot data when farmers data is loaded
  useEffect(() => {
    if (farmers.length > 0) {
      farmers.forEach(farmer => {
        if (farmer.plots) {
          onPlotDataUpdate(farmer.id, farmer.plots)
        }
      })
    }
  }, [farmers, onPlotDataUpdate])



  const handlePlotToggle = (farmerId: string, plotId: string, checked: boolean) => {
    const currentPlots = selectedPlots[farmerId] || []
    let newPlots: string[]

    if (checked) {
      newPlots = [...currentPlots, plotId]
    } else {
      newPlots = currentPlots.filter(id => id !== plotId)
    }

    onPlotSelection(farmerId, newPlots)
  }

  const handleSelectAllPlotsForFarmer = (farmerId: string, checked: boolean) => {
    const farmer = farmers.find(f => f.id === farmerId)
    if (!farmer || !farmer.plots) return

    if (checked) {
      const allPlotIds = farmer.plots.map(p => p.id)
      onPlotSelection(farmerId, allPlotIds)
    } else {
      onPlotSelection(farmerId, [])
    }
  }

  const getPlotCompatibility = () => {
    // This would check if the plot is compatible with the product
    // For now, return true as placeholder
    return true
  }

  const getPlotStatus = () => {
    // This would check if the plot is already assigned to another product
    // For now, return 'available' as placeholder
    return 'available'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'incompatible':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'assigned':
        return <XCircle className="w-4 h-4 text-yellow-600" />
      case 'incompatible':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading farmer plots: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedFarmers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Please select farmers in Step 1 to continue</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plot Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Select which plots to include for each farmer. You can select all plots for a farmer or choose individual plots.
          </p>
        </CardContent>
      </Card>

      {/* Farmers and Plots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selected Farmers & Plots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <Accordion type="multiple" value={expandedFarmers} onValueChange={setExpandedFarmers}>
              {farmers.map((farmer) => {
                const farmerPlots = farmer.plots || []
                const selectedFarmerPlots = selectedPlots[farmer.id] || []
                const totalArea = farmerPlots.reduce((sum, plot) => sum + (plot.area_ha || 0), 0)

                return (
                  <AccordionItem key={farmer.id} value={farmer.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold text-left">{farmer.english_name}</h3>
                            <p className="text-sm text-gray-500 text-left">
                              {farmer.province}, {farmer.district}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{farmerPlots.length} plots</span>
                          <span>{totalArea.toFixed(2)} ha</span>
                          <span className="text-green-600">
                            {selectedFarmerPlots.length} selected
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {/* Select All Plots for this Farmer */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Checkbox
                            id={`select-all-${farmer.id}`}
                            checked={selectedFarmerPlots.length === farmerPlots.length && farmerPlots.length > 0}
                            onCheckedChange={(checked) => handleSelectAllPlotsForFarmer(farmer.id, checked as boolean)}
                          />
                          <label htmlFor={`select-all-${farmer.id}`} className="font-medium">
                            Select All Plots for {farmer.english_name}
                          </label>
                        </div>

                        {/* Individual Plot Selection */}
                        {farmerPlots.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p>No plots available for this farmer</p>
                          </div>
                        ) : (
                                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                            {farmerPlots.map((plot) => {
                              const isSelected = selectedFarmerPlots.includes(plot.id)
                                                             const isCompatible = getPlotCompatibility()
                               const status = getPlotStatus()

                              return (
                                                                 <Card 
                                   key={plot.id} 
                                   className={cn(
                                     "transition-all duration-200 overflow-visible",
                                     isSelected ? "ring-2 ring-green-500 bg-green-50" : "hover:shadow-md"
                                   )}
                                 >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3 gap-3">
                                      <div className="flex-shrink-0 p-1">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handlePlotToggle(farmer.id, plot.id, checked as boolean)}
                                          disabled={!isCompatible}
                                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        />
                                      </div>
                                      <div className="flex-shrink-0">
                                        <Badge className={cn("text-xs", getStatusColor(status))}>
                                          {getStatusIcon(status)}
                                          <span className="ml-1">{status}</span>
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{plot.commune}, {plot.village || 'N/A'}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-sm">
                                        <Crop className="w-4 h-4 text-gray-400" />
                                        <span>{plot.crop}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-sm">
                                        <Ruler className="w-4 h-4 text-gray-400" />
                                        <span>{plot.area_ha} ha</span>
                                      </div>
                                    </div>

                                    {!isCompatible && (
                                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                        Plot incompatible with product requirements
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
