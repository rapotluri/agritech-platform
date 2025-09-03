// Data mappers to transform Manual Builder and InsureSmart data to Product schema

import type { PremiumResponse } from '@/types/premium'
import type { Product, CoveragePeriod, OptimizationResult } from '@/components/insure-smart/types'

/**
 * Maps Manual Builder form data and premium results to Product schema
 * @param formData - The form data from ProductForm (react-hook-form values)
 * @param premiumResponse - The calculated premium response
 * @returns Product data ready for database insertion
 */
export function mapManualBuilderToProduct(
  formData: any,
  premiumResponse: PremiumResponse
): {
  name: string
  crop?: string
  data_type: string[]
  region: any
  status: 'draft' | 'live'
  triggers: any
  coverage_start_date: string
  coverage_end_date: string
  terms: any
} {
  // Calculate coverage window from phases
  const phases = formData.indexes || []
  let coverageStartDate = formData.plantingDate
  let coverageEndDate = formData.plantingDate

  if (phases.length > 0) {
    // Find earliest start date and latest end date
    const sortedPhases = phases.sort((a: any, b: any) => 
      new Date(a.phaseStartDate).getTime() - new Date(b.phaseStartDate).getTime()
    )
    
    coverageStartDate = sortedPhases[0].phaseStartDate
    coverageEndDate = sortedPhases[sortedPhases.length - 1].phaseEndDate
  }

  // Ensure dates are in ISO format
  const formatDate = (date: any): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    if (typeof date === 'string') {
      return date.split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  }

  // Transform indexes/phases to InsureSmart-compatible triggers format
  const triggers = {
    // Convert phases to coverage periods
    coveragePeriods: phases.map((phase: any, index: number) => ({
      id: (index + 1).toString(),
      startDate: formatDate(phase.phaseStartDate),
      endDate: formatDate(phase.phaseEndDate),
      perilType: phase.type === 'Drought' ? 'LRI' : phase.type === 'Excess Rainfall' ? 'ERI' : 'LRI'
    })),
    
    // Create optimization config structure
    optimizationConfig: {
      id: 'manual-builder',
      premiumRate: premiumResponse.premium.rate / 100, // Convert percentage to decimal
      premiumCost: premiumResponse.premium.max_payout,
      periods: phases.map((phase: any) => {
        // Calculate day offsets from planting date
        const plantingDate = new Date(formatDate(formData.plantingDate))
        const startDate = new Date(formatDate(phase.phaseStartDate))
        const endDate = new Date(formatDate(phase.phaseEndDate))
        
        const startDay = Math.floor((startDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))
        const endDay = Math.floor((endDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          start_day: Math.max(0, startDay),
          end_day: Math.max(1, endDay),
          perils: [{
            peril_type: phase.type === 'Drought' ? 'LRI' : phase.type === 'Excess Rainfall' ? 'ERI' : 'LRI',
            trigger: parseFloat(phase.trigger) || 0,
            duration: parseInt(phase.consecutiveDays) || 1,
            unit_payout: parseFloat(phase.unitPayout) || 0,
            max_payout: parseFloat(phase.maxPayout) || 0,
            // Manual Builder specific fields for compatibility
            exit: parseFloat(phase.exit) || 0,
            dailyCap: parseFloat(phase.dailyCap) || 0,
            consecutiveDays: parseInt(phase.consecutiveDays) || 1
          }]
        }
      })
    },
    
    // Product-level configuration
    sumInsured: parseFloat(formData.sumInsured) || premiumResponse.premium.max_payout || 0,
    premiumCap: parseFloat(formData.premiumCap) || premiumResponse.premium.max_payout || 0,
    
    // Manual Builder compatibility fields
    coverageType: formData.coverageType,
    weatherDataPeriod: formData.weatherDataPeriod
  }

  // Transform premium response to terms
  const terms = {
    premiumRate: premiumResponse.premium.rate,
    averageRiskRate: premiumResponse.premium.etotal,
    maxPayout: premiumResponse.premium.max_payout,
    phaseAnalysis: premiumResponse.phase_analysis,
    riskMetrics: premiumResponse.risk_metrics,
    yearlyAnalysis: premiumResponse.yearly_analysis,
    growingDuration: formData.growingDuration,
    plantingDate: formatDate(formData.plantingDate)
  }

  // Create region object
  const region = {
    province: formData.province,
    district: formData.district || '',
    commune: formData.commune
  }

  return {
    name: formData.productName,
    crop: formData.cropType || '',
    data_type: ['precipitation'], // Manual Builder defaults to precipitation
    region,
    status: 'live', // Manual Builder creates live products by default
    triggers,
    coverage_start_date: formatDate(coverageStartDate),
    coverage_end_date: formatDate(coverageEndDate),
    terms
  }
}

/**
 * Maps InsureSmart data to Product schema
 * @param product - The product data from InsureSmart
 * @param coveragePeriods - The coverage periods from InsureSmart
 * @param selectedResult - The selected optimization result
 * @param optimizationResults - All optimization results (used only to find the selected one)
 * @param status - Whether to save as draft or live
 * @returns Product data ready for database insertion
 */
export function mapInsureSmartToProduct(
  product: Product,
  coveragePeriods: CoveragePeriod[],
  selectedResult: string | null,
  optimizationResults: OptimizationResult[],
  status: 'draft' | 'live' = 'live'
): {
  name: string
  crop?: string
  data_type: string[]
  region: any
  status: 'draft' | 'live'
  triggers: any
  coverage_start_date: string
  coverage_end_date: string
  terms: any
} {
  const selectedOptimization = optimizationResults.find(r => r.id === selectedResult)

  // Calculate coverage window from periods
  let coverageStartDate = new Date().toISOString().split('T')[0]
  let coverageEndDate = new Date().toISOString().split('T')[0]

  if (coveragePeriods.length > 0) {
    const sortedPeriods = coveragePeriods.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    
    coverageStartDate = sortedPeriods[0].startDate
    coverageEndDate = sortedPeriods[sortedPeriods.length - 1].endDate
  }

  // Transform coverage periods to triggers format
  const triggers = {
    coveragePeriods: coveragePeriods.map(period => ({
      id: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
      perilType: period.perilType
    })),
    optimizationConfig: selectedOptimization ? {
      id: selectedOptimization.id,
      premiumRate: selectedOptimization.premiumRate,
      premiumCost: selectedOptimization.premiumCost,
      periods: selectedOptimization.periods
    } : null,
    sumInsured: parseFloat(product.sumInsured) || 0,
    premiumCap: parseFloat(product.premiumCap) || 0
  }

  // Create terms from optimization results and product data
  const terms = {
    cropDuration: product.cropDuration,
    notes: product.notes,
    selectedOptimizationResult: selectedOptimization,
    premiumRate: selectedOptimization?.premiumRate || 0,
    premiumCost: selectedOptimization?.premiumCost || 0,
    riskScore: selectedOptimization?.riskScore || 'UNKNOWN'
  }

  // Create region object
  const region = {
    province: product.province,
    district: product.district,
    commune: product.commune
  }

  return {
    name: product.name,
    crop: '', // InsureSmart doesn't specify crop type currently
    data_type: [product.dataType], // Map dataType to data_type array
    region,
    status,
    triggers,
    coverage_start_date: coverageStartDate,
    coverage_end_date: coverageEndDate,
    terms
  }
}

/**
 * Helper function to validate that all required data is present for product creation
 * @param productData - The product data to validate
 * @returns Array of validation errors, empty if valid
 */
export function validateProductData(productData: {
  name: string
  crop?: string
  data_type: string[]
  region: any
  status: 'draft' | 'live'
  triggers: any
  coverage_start_date: string
  coverage_end_date: string
  terms: any
}): string[] {
  const errors: string[] = []

  if (!productData.name || productData.name.trim().length === 0) {
    errors.push('Product name is required')
  }

  if (!productData.region || (!productData.region.province && !productData.region.commune)) {
    errors.push('Region information (province/commune) is required')
  }

  if (!productData.coverage_start_date || !productData.coverage_end_date) {
    errors.push('Coverage dates are required')
  }

  if (new Date(productData.coverage_end_date) <= new Date(productData.coverage_start_date)) {
    errors.push('Coverage end date must be after start date')
  }

  if (!productData.triggers) {
    errors.push('Trigger configuration is required')
  }

  if (!productData.terms) {
    errors.push('Product terms are required')
  }

  if (!productData.data_type || productData.data_type.length === 0) {
    errors.push('Data type is required')
  }

  return errors
}
