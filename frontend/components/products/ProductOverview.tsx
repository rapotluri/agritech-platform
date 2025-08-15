"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar,
  MapPin,
  Leaf,
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
            {product.triggers?.optimizationConfig ? (
              <>
                <div className="flex justify-between">
                  <span className="font-medium">Premium Cost:</span>
                  <span>${Number(product.triggers.optimizationConfig.premiumCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Premium Rate:</span>
                  <span>{(Number(product.triggers.optimizationConfig.premiumRate || 0) * 100).toFixed(2)}%</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No pricing terms configured</p>
              </div>
            )}
          </div>
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
