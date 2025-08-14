"use client"

import React, { useState, useMemo } from "react"
import { UploadIcon, DownloadIcon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchFilters } from "@/components/farmers/SearchFilters"
import { FarmerTable, type Farmer } from "@/components/farmers/FarmerTable"
import { FarmerDialog } from "@/components/farmers/FarmerDialog"
import { mockFarmers, filterFarmers, sortFarmers } from "@/components/farmers/mockData"


export default function FarmersPage() {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedCommune, setSelectedCommune] = useState("")
  const [selectedKYCStatus, setSelectedKYCStatus] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState("all")


  // State for table functionality
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<keyof Farmer | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Filter and sort farmers
  const filteredFarmers = useMemo(() => {
    let filtered = filterFarmers(
      mockFarmers,
      searchQuery,
      selectedProvince,
      selectedDistrict,
      selectedCommune,
      selectedKYCStatus,
      selectedProduct
    )

    if (sortColumn) {
      filtered = sortFarmers(filtered, sortColumn, sortDirection)
    }

    return filtered
  }, [
    searchQuery,
    selectedProvince,
    selectedDistrict,
    selectedCommune,
    selectedKYCStatus,
    selectedProduct,

    sortColumn,
    sortDirection
  ])

  // Handle location change
  const handleLocationChange = (province: string, district: string, commune: string) => {
    setSelectedProvince(province)
    setSelectedDistrict(district)
    setSelectedCommune(commune)
  }

  // Handle sorting
  const handleSort = (column: keyof Farmer, direction: "asc" | "desc") => {
    setSortColumn(column)
    setSortDirection(direction)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedProvince("")
    setSelectedDistrict("")
    setSelectedCommune("")
    setSelectedKYCStatus("all")
    setSelectedProduct("all")

    setSelectedFarmers([])
  }

  // Calculate stats
  const totalFarmers = mockFarmers.length
  const activeEnrollments = mockFarmers.filter(f => f.kycStatus === "verified").length
  const pendingKYC = mockFarmers.filter(f => f.kycStatus === "pending").length
  const totalPlots = mockFarmers.reduce((sum, f) => sum + f.plotsCount, 0)
  const recentEnrollments = mockFarmers.filter(f => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return f.enrolmentDate >= thirtyDaysAgo
  }).length

  return (
    <div className="p-8 space-y-8">
      {/* 1.1 Page Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmer Management</h1>
          <p className="text-gray-600 mt-2">Manage farmer enrollments and profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <FarmerDialog />
          <Button variant="outline">
            <UploadIcon className="h-5 w-5 mr-2" />
            Batch Upload
          </Button>
          <Button variant="outline">
            <DownloadIcon className="h-5 w-5 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* 1.4 Quick Stats Cards (Future - Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFarmers}</div>
            <p className="text-xs text-muted-foreground">
              +{recentEnrollments} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              {((activeEnrollments / totalFarmers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingKYC}</div>
            <p className="text-xs text-muted-foreground">
              {((pendingKYC / totalFarmers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plots</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlots}</div>
            <p className="text-xs text-muted-foreground">
              {(totalPlots / totalFarmers).toFixed(1)} per farmer
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Enrollments</CardTitle>
            <div className="h-4 w-4 rounded-full bg-purple-100" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 1.2 Search & Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
                     <SearchFilters
             searchQuery={searchQuery}
             onSearchChange={setSearchQuery}
             selectedProvince={selectedProvince}
             selectedDistrict={selectedDistrict}
             selectedCommune={selectedCommune}
             onLocationChange={handleLocationChange}
             selectedKYCStatus={selectedKYCStatus}
             onKYCStatusChange={setSelectedKYCStatus}
             selectedProduct={selectedProduct}
             onProductChange={setSelectedProduct}

             onClearFilters={clearFilters}
           />
        </CardContent>
      </Card>

      {/* 1.3 Farmer Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Farmer Directory</CardTitle>
            {selectedFarmers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedFarmers.length} farmer{selectedFarmers.length !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
                 <CardContent>
           <FarmerTable
             farmers={filteredFarmers}
             selectedFarmers={selectedFarmers}
             onSelectionChange={setSelectedFarmers}
             onSort={handleSort}
             sortColumn={sortColumn}
             sortDirection={sortDirection}
           />
           
           {filteredFarmers.length === 0 && (
             <div className="text-center py-12">
               <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900 mb-2">No farmers found</h3>
               <p className="text-gray-600 mb-4">
                 Try adjusting your search criteria or filters
               </p>
               <Button onClick={clearFilters} variant="outline">
                 Clear All Filters
               </Button>
             </div>
           )}
         </CardContent>
      </Card>
    </div>
  )
}
