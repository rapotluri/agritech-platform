"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Target,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { ProductWithDetailedEnrollments } from "@/lib/database.types"

interface TriggerConfigurationProps {
  product: ProductWithDetailedEnrollments
}

export function TriggerConfiguration({ product }: TriggerConfigurationProps) {
  // Helper function to get peril label
  const getPerilLabel = (perilType: string) => {
    if (perilType === 'LRI') return 'Low Rainfall Trigger'
    if (perilType === 'ERI') return 'High Rainfall Trigger'
    return 'Unknown Trigger'
  }

  // Helper function to format triggers display
  const formatTriggers = (triggers: any) => {
    if (!triggers) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No triggers configured</p>
          <p className="text-sm">This product doesn&apos;t have any trigger conditions set</p>
        </div>
      )
    }

    // Handle InsureSmart optimization config structure
    if (triggers.optimizationConfig) {
      const config = triggers.optimizationConfig
      const periods = config.periods || []
      
      return (
        <div className="space-y-4">
          {periods.map((period: any, idx: number) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Period {idx + 1}</span>
                <Badge variant="outline">
                  {period.perils.length === 2 ? 'Both (LRI + ERI)' : getPerilLabel(period.perils[0]?.peril_type)}
                </Badge>
                <span className="text-sm text-gray-600">
                  {triggers.coveragePeriods && triggers.coveragePeriods[idx]?.startDate && triggers.coveragePeriods[idx]?.endDate 
                    ? `${triggers.coveragePeriods[idx].startDate} to ${triggers.coveragePeriods[idx].endDate}`
                    : `Day ${period.start_day + 1} to ${period.end_day + 1}`
                  }
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {period.perils.map((peril: any, perilIdx: number) => (
                  <div key={perilIdx} className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      {peril.peril_type === 'LRI' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="font-medium">
                        {getPerilLabel(peril.peril_type)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trigger:</span>
                        <span className="font-medium">
                          {peril.peril_type === 'LRI' ? '≤' : '≥'} {Number(peril.trigger).toFixed(0)}mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{peril.duration} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Payout:</span>
                        <span className="font-medium">
                          ${peril.unit_payout !== undefined ? Number(peril.unit_payout).toFixed(2) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Payout:</span>
                        <span className="font-medium">
                          ${peril.max_payout !== undefined ? Number(peril.max_payout).toFixed(0) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Handle array of triggers (InsureSmart format)
    if (Array.isArray(triggers)) {
      return (
        <div className="space-y-4">
          {triggers.map((trigger: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Trigger {index + 1}</span>
                <Badge variant="outline">
                  {trigger.type || 'Unknown Type'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{trigger.type || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">{trigger.value || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{trigger.duration || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Handle object format triggers
    if (typeof triggers === 'object') {
      return (
        <div className="space-y-4">
          {Object.entries(triggers).map(([key, value]: [string, any], index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                <Badge variant="outline">Configuration</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="space-y-2">
                    {typeof value === 'object' && value !== null ? (
                      Object.entries(value).map(([subKey, subValue]: [string, any], subIndex: number) => (
                        <div key={subIndex} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{subKey.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">
                            {typeof subValue === 'object' ? JSON.stringify(subValue) : String(subValue)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Handle string format
    if (typeof triggers === 'string') {
      return (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Simple Trigger</p>
          <p className="text-sm">{triggers}</p>
        </div>
      )
    }

    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">Unknown Trigger Format</p>
        <p className="text-sm">Unable to display trigger configuration</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <Target className="h-16 w-16 mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trigger Configuration</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Detailed configuration of insurance triggers that determine when payouts are activated 
          based on weather conditions or other criteria.
        </p>
      </div>

      {/* Trigger Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Active Triggers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formatTriggers(product.triggers)}
        </CardContent>
      </Card>

      {/* Trigger Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Triggers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">How Triggers Work</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Triggers monitor specific conditions (rainfall, temperature, etc.)</li>
                <li>• When conditions are met, insurance payouts are activated</li>
                <li>• Multiple triggers can be configured for different coverage periods</li>
                <li>• Each trigger has specific thresholds and payout calculations</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Trigger Types</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">Low Rainfall (LRI) - Triggers when rainfall is below threshold</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">High Rainfall (ERI) - Triggers when rainfall exceeds threshold</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Custom triggers for specific conditions</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
