"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar,
  MapPin,
  Leaf,
  Target,
  DollarSign,
  Shield,
  Clock,
  User
} from "lucide-react"
import { ProductWithDetailedEnrollments } from "@/lib/database.types"

interface ProductOverviewProps {
  product: ProductWithDetailedEnrollments
}

export function ProductOverview({ product }: ProductOverviewProps) {
  // Helper function to format region display
  const formatRegion = (region: any) => {
    if (typeof region === 'string') return region
    if (typeof region === 'object') {
      const parts = []
      if (region.province) parts.push(region.province)
      if (region.district) parts.push(region.district)
      if (region.commune) parts.push(region.commune)
      return parts.join(', ') || 'Not specified'
    }
    return 'Not specified'
  }

  // Helper function to format triggers display
  const formatTriggers = (triggers: any) => {
    if (!triggers) return 'No triggers configured'
    if (typeof triggers === 'string') return triggers
    
    if (Array.isArray(triggers)) {
      return triggers.map((trigger: any, index: number) => {
        let displayValue = trigger.value || 'N/A'
        if (typeof displayValue === 'object' && displayValue !== null) {
          if (displayValue.startDate && displayValue.endDate) {
            displayValue = `${new Date(displayValue.startDate).toLocaleDateString()} - ${new Date(displayValue.endDate).toLocaleDateString()}`
          } else if (displayValue.id) {
            displayValue = `ID: ${displayValue.id}`
          } else {
            displayValue = JSON.stringify(displayValue)
          }
        }
        
        return (
          <div key={index} className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span>{trigger.type || 'Unknown'}: {displayValue}</span>
          </div>
        )
      })
    }
    
    if (typeof triggers === 'object') {
      return Object.entries(triggers).map(([key, value]: [string, any], index: number) => {
        let displayValue = value
        if (typeof value === 'object' && value !== null) {
          if (value.startDate && value.endDate) {
            displayValue = `${new Date(value.startDate).toLocaleDateString()} - ${new Date(value.endDate).toLocaleDateString()}`
          } else if (value.id) {
            displayValue = `ID: ${value.id}`
          } else {
            displayValue = JSON.stringify(value)
          }
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'Yes' : 'No'
        } else if (value === null || value === undefined) {
          displayValue = 'Not set'
        }
        
        return (
          <div key={index} className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span>{key}: {displayValue}</span>
          </div>
        )
      })
    }
    
    return 'Triggers configured'
  }

  // Helper function to format terms display
  const formatTerms = (terms: any) => {
    if (!terms) return 'No terms specified'
    if (typeof terms === 'string') return terms
    
    if (typeof terms === 'object') {
      return Object.entries(terms).map(([key, value]: [string, any], index: number) => {
        // Handle different value types
        let displayValue = value
        if (typeof value === 'object' && value !== null) {
          if (value.startDate && value.endDate) {
            displayValue = `${new Date(value.startDate).toLocaleDateString()} - ${new Date(value.endDate).toLocaleDateString()}`
          } else if (value.id) {
            displayValue = `ID: ${value.id}`
          } else {
            displayValue = JSON.stringify(value)
          }
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'Yes' : 'No'
        } else if (value === null || value === undefined) {
          displayValue = 'Not set'
        }
        
        return (
          <div key={index} className="flex justify-between">
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
            <span>{displayValue}</span>
          </div>
        )
      })
    }
    
    return 'Terms configured'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Product Name</p>
              <p className="text-gray-900">{product.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Crop Type</p>
              <p className="text-gray-900">{product.crop || 'Not specified'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Coverage Region</p>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-gray-500" />
              <p className="text-gray-900">{formatRegion(product.region)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage Start</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-gray-900">
                  {product.coverage_start_date ? new Date(product.coverage_start_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Coverage End</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-gray-900">
                  {product.coverage_end_date ? new Date(product.coverage_end_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Trigger Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {formatTriggers(product.triggers)}
          </div>
          
          {product.triggers && (
            <div className="pt-2">
              <Separator />
              <p className="text-sm text-gray-600 mt-2">
                Triggers determine when insurance payouts are activated based on weather conditions or other criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Terms Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Pricing Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {formatTerms(product.terms)}
          </div>
          
          {!product.terms && (
            <div className="text-center py-4 text-gray-500">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No pricing terms configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status & Lifecycle Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Status & Lifecycle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Status</p>
              <Badge className="mt-1">
                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Product ID</p>
              <p className="text-sm text-gray-900 font-mono">{product.id.slice(0, 8)}...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-gray-900">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Modified</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-gray-900">
                  {new Date(product.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium text-gray-600">Created By</p>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-gray-500" />
              <p className="text-gray-900">User ID: {product.created_by_user_id.slice(0, 8)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
