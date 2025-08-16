"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AssignmentSteps } from "@/components/insure-smart/AssignmentSteps"
import { AssignmentSummary } from "@/components/insure-smart/AssignmentSummary"
import { useProduct } from "@/lib/hooks"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function ProductAssignmentPage() {
  const params = useParams()
  const productId = params.id as string
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<Record<string, string[]>>({})
  const [totalSteps] = useState(2) // Only implementing Steps 1-2

  const { data: product, isLoading: productLoading, error: productError } = useProduct(productId)

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
  }

  const handleFarmerSelection = (farmerIds: string[]) => {
    setSelectedFarmers(farmerIds)
    // Clear plot selections when farmers change
    setSelectedPlots({})
  }

  const handlePlotSelection = (farmerId: string, plotIds: string[]) => {
    setSelectedPlots(prev => ({
      ...prev,
      [farmerId]: plotIds
    }))
  }

  const getTotalPlotsSelected = () => {
    return Object.values(selectedPlots).reduce((total, plotIds) => total + plotIds.length, 0)
  }



  if (productLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h1>
          <p className="text-gray-600 mb-4">Unable to load product information.</p>
          <Link href="/protected/operations-dashboard/products">
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assign Product to Farmers</h1>
          <p className="text-gray-600 mt-2">
            Select farmers and plots for {product.name}
          </p>
        </div>
        <Link href={`/protected/operations-dashboard/products/${productId}`}>
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Product
          </Button>
        </Link>
      </div>

      {/* Product Context Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <p className="text-sm font-medium text-gray-500">Product Name</p>
               <p className="text-lg font-semibold">{product.name}</p>
             </div>
             <div>
               <p className="text-sm font-medium text-gray-500">Crop Type</p>
               <p className="text-lg font-semibold">{product.crop}</p>
             </div>
             <div>
               <p className="text-sm font-medium text-gray-500">Status</p>
               <p className="text-lg font-semibold capitalize">{product.status}</p>
             </div>
             <div>
               <p className="text-sm font-medium text-gray-500">Coverage Period</p>
               <p className="text-lg font-semibold">
                 {new Date(product.coverage_start_date).toLocaleDateString()} - {new Date(product.coverage_end_date).toLocaleDateString()}
               </p>
             </div>
             <div>
               <p className="text-sm font-medium text-gray-500">Region</p>
               <p className="text-lg font-semibold">
                 {(() => {
                   if (typeof product.region === 'string') {
                     return product.region
                   } else if (product.region && typeof product.region === 'object') {
                     // Handle JSONB region object
                     const region = product.region as any
                     if (region.province && region.district && region.commune) {
                       return `${region.province}, ${region.district}, ${region.commune}`
                     } else if (region.province && region.district) {
                       return `${region.province}, ${region.district}`
                     } else if (region.province) {
                       return region.province
                     } else if (Array.isArray(region)) {
                       return region.join(', ')
                     }
                   }
                   return 'Region not specified'
                 })()}
               </p>
             </div>
             <div>
               <p className="text-sm font-medium text-gray-500">Premium Cost</p>
               <p className="text-lg font-semibold text-green-600">
                 {(() => {
                   // Get premium cost from product triggers.optimizationConfig.premiumCost
                   if (product.triggers && typeof product.triggers === 'object') {
                     const triggers = product.triggers as any
                     if (triggers.optimizationConfig && triggers.optimizationConfig.premiumCost) {
                       return `$${triggers.optimizationConfig.premiumCost}/ha`
                     }
                   }
                   // Fallback if premium cost is not available
                   return 'Premium cost not specified'
                 })()}
               </p>
             </div>
           </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Farmer Selection</span>
          <span>Plot Selection</span>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Assignment Steps */}
        <div className="lg:col-span-3">
          <AssignmentSteps
            currentStep={currentStep}
            onStepChange={handleStepChange}
            selectedFarmers={selectedFarmers}
            selectedPlots={selectedPlots}
            onFarmerSelection={handleFarmerSelection}
            onPlotSelection={handlePlotSelection}
          />
        </div>

        {/* Assignment Summary */}
        <div className="lg:col-span-1">
          <AssignmentSummary
            selectedFarmers={selectedFarmers}
            selectedPlots={selectedPlots}
            totalPlots={getTotalPlotsSelected()}
            totalArea={0}
            currentStep={currentStep}
            onContinue={() => {
              if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
