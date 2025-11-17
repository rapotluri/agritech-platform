"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import { Search, X } from "lucide-react"
import cambodiaData from "@/data/cambodia_locations.json"

export interface ProductFilters {
  searchQuery?: string
  cropType?: string
  province?: string
  district?: string
  commune?: string
  status?: 'all' | 'draft' | 'live' | 'archived'
  coverageWindowStart?: Date
  coverageWindowEnd?: Date
  dateCreatedStart?: Date
}

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  cropTypes?: string[]
  isLoading?: boolean
}

export function ProductFilters({
  filters,
  onFiltersChange,
  cropTypes = [],
  isLoading = false
}: ProductFiltersProps) {
  
  // Ensure arrays are properly defined and filter out invalid values
  const safeCropTypes = (cropTypes || []).filter(crop => crop && typeof crop === 'string' && crop.trim() !== '')
  
  // Get location data from JSON file
  const provinces = Object.keys(cambodiaData).sort()
  const selectedProvinceData = filters.province ? cambodiaData[filters.province as keyof typeof cambodiaData] : null
  const districts = selectedProvinceData ? Object.keys(selectedProvinceData).sort() : []
  const communes = (selectedProvinceData && filters.district) 
    ? selectedProvinceData[filters.district as keyof typeof selectedProvinceData] || []
    : []
  
  const updateFilter = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    
    // Clear dependent filters when parent changes
    if (key === 'province') {
      newFilters.district = undefined
      newFilters.commune = undefined
    } else if (key === 'district') {
      newFilters.commune = undefined
    }
    
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      status: 'all'
    })
  }

  const hasActiveFilters = 
    filters.searchQuery || 
    filters.cropType || 
    filters.province || 
    filters.district || 
    filters.commune || 
    (filters.status && filters.status !== 'all') ||
    filters.coverageWindowStart || 
    filters.coverageWindowEnd ||
    filters.dateCreatedStart

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="Search products by name, crop, or region..."
          value={filters.searchQuery || ''}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Crop Type Filter */}
        <Select
          value={filters.cropType || 'all'}
          onValueChange={(value) => updateFilter('cropType', value === 'all' ? undefined : value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Crop Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Crops</SelectItem>
            {safeCropTypes.map((crop) => (
              <SelectItem key={crop} value={crop}>
                {crop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Province Filter */}
        <Select
          value={filters.province || 'all'}
          onValueChange={(value) => updateFilter('province', value === 'all' ? undefined : value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* District Filter */}
        <Select
          value={filters.district || 'all'}
          onValueChange={(value) => updateFilter('district', value === 'all' ? undefined : value)}
          disabled={isLoading || !filters.province}
        >
          <SelectTrigger>
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Commune Filter */}
        <Select
          value={filters.commune || 'all'}
          onValueChange={(value) => updateFilter('commune', value === 'all' ? undefined : value)}
          disabled={isLoading || !filters.district}
        >
          <SelectTrigger>
            <SelectValue placeholder="Commune" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Communes</SelectItem>
            {communes.map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => updateFilter('status', value as ProductFilters['status'])}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        <Button
          variant="outline"
          onClick={clearFilters}
          disabled={isLoading || !hasActiveFilters}
          className="flex items-center space-x-2"
        >
          <X className="h-4 w-4" />
          <span>Clear</span>
        </Button>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coverage Window Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Coverage Window</label>
          <div className="flex space-x-2">
            <DateInput
              value={filters.coverageWindowStart}
              onChange={(date) => updateFilter('coverageWindowStart', date)}
              placeholder="Start date"
              disabled={isLoading}
              className="flex-1"
            />
            <DateInput
              value={filters.coverageWindowEnd}
              onChange={(date) => updateFilter('coverageWindowEnd', date)}
              placeholder="End date"
              disabled={isLoading}
              className="flex-1"
            />
          </div>
        </div>

        {/* Date Created */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date Created</label>
          <DateInput
            value={filters.dateCreatedStart}
            onChange={(date) => updateFilter('dateCreatedStart', date)}
            placeholder="Select creation date"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Active filters:</span>
          {filters.searchQuery && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Search: &ldquo;{filters.searchQuery}&rdquo;
            </span>
          )}
          {filters.cropType && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Crop: {filters.cropType}
            </span>
          )}
          {filters.province && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Province: {filters.province}
            </span>
          )}
          {filters.status && filters.status !== 'all' && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Status: {filters.status}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
