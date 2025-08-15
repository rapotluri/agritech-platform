"use client"

import React, { useState, useMemo } from "react"
import { UploadIcon, DownloadIcon, UsersIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchFilters } from "@/components/farmers/SearchFilters"
import { FarmerTable } from "@/components/farmers/FarmerTable"
import { FarmerDialog } from "@/components/farmers/FarmerDialog"
import { useFarmers, useFarmerStats } from "@/lib/hooks"
import type { FarmerWithPlots, FarmerFilters, FarmerSorting, SortableFarmerColumn } from "@/lib/database.types"


export default function FarmersPage() {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedCommune, setSelectedCommune] = useState("")
  const [selectedKYCStatus, setSelectedKYCStatus] = useState<"all" | "pending" | "verified" | "rejected">("all")
  const [selectedProduct, setSelectedProduct] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // State for table functionality
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<SortableFarmerColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Build filters and sorting objects
  const filters: FarmerFilters = useMemo(() => ({
    searchQuery: searchQuery || undefined,
    province: selectedProvince || undefined,
    district: selectedDistrict || undefined,
    commune: selectedCommune || undefined,
    kycStatus: selectedKYCStatus === "all" ? undefined : selectedKYCStatus,
    product: selectedProduct === "all" ? undefined : selectedProduct,
  }), [searchQuery, selectedProvince, selectedDistrict, selectedCommune, selectedKYCStatus, selectedProduct])

  const sorting: FarmerSorting = useMemo(() => ({
    column: sortColumn,
    direction: sortDirection
  }), [sortColumn, sortDirection])

  const pagination = useMemo(() => ({
    page: currentPage,
    limit: pageSize
  }), [currentPage, pageSize])

  // Fetch farmers data
  const { 
    data: farmersData, 
    isLoading: isFarmersLoading, 
    error: farmersError,
    refetch: refetchFarmers
  } = useFarmers(filters, sorting, pagination)

  // Fetch stats data
  const { 
    data: statsData, 
    isLoading: isStatsLoading 
  } = useFarmerStats()

  // Handle location change
  const handleLocationChange = (province: string, district: string, commune: string) => {
    setSelectedProvince(province)
    setSelectedDistrict(district)
    setSelectedCommune(commune)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle sorting
  const handleSort = (column: SortableFarmerColumn, direction: "asc" | "desc") => {
    setSortColumn(column)
    setSortDirection(direction)
    setCurrentPage(1) // Reset to first page when sorting changes
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
    setCurrentPage(1)
  }

  // Handle KYC status change
  const handleKYCStatusChange = (status: string) => {
    setSelectedKYCStatus(status as "all" | "pending" | "verified" | "rejected")
    setCurrentPage(1)
  }

  // Handle product change
  const handleProductChange = (product: string) => {
    setSelectedProduct(product)
    setCurrentPage(1)
  }

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Get current data
  const farmers = farmersData?.farmers || []
  const totalFarmers = statsData?.totalFarmers || 0
  const activeEnrollments = statsData?.activeEnrollments || 0
  const pendingKYC = statsData?.pendingKYC || 0
  const totalPlots = statsData?.totalPlots || 0
  const recentEnrollments = statsData?.recentEnrollments || 0

  // Loading states
  const isLoading = isFarmersLoading || isStatsLoading

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

      {/* 1.4 Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">--</div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalFarmers}</div>
                <p className="text-xs text-muted-foreground">
                  +{recentEnrollments} this month
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">--</div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{activeEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  {totalFarmers > 0 ? ((activeEnrollments / totalFarmers) * 100).toFixed(1) : 0}% of total
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">--</div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingKYC}</div>
                <p className="text-xs text-muted-foreground">
                  {totalFarmers > 0 ? ((pendingKYC / totalFarmers) * 100).toFixed(1) : 0}% of total
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plots</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-100" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">--</div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalPlots}</div>
                <p className="text-xs text-muted-foreground">
                  {totalFarmers > 0 ? (totalPlots / totalFarmers).toFixed(1) : 0} per farmer
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Enrollments</CardTitle>
            <div className="h-4 w-4 rounded-full bg-purple-100" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-2xl font-bold">--</div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{recentEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </>
            )}
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
            onSearchChange={handleSearchChange}
            selectedProvince={selectedProvince}
            selectedDistrict={selectedDistrict}
            selectedCommune={selectedCommune}
            onLocationChange={handleLocationChange}
            selectedKYCStatus={selectedKYCStatus}
            onKYCStatusChange={handleKYCStatusChange}
            selectedProduct={selectedProduct}
            onProductChange={handleProductChange}
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
          {isFarmersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading farmers...</span>
            </div>
          ) : farmersError ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <UsersIcon className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Error loading farmers</h3>
                <p className="text-gray-600 mb-4">
                  {farmersError.message || "Something went wrong. Please try again."}
                </p>
                <Button onClick={() => refetchFarmers()} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <FarmerTable
                farmers={farmers}
                selectedFarmers={selectedFarmers}
                onSelectionChange={setSelectedFarmers}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
              
              {farmers.length === 0 && !isFarmersLoading && (
                <div className="text-center py-12">
                  <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No farmers found</h3>
                  <p className="text-gray-600 mb-4">
                    {Object.values(filters).some(Boolean) 
                      ? "Try adjusting your search criteria or filters"
                      : "No farmers have been added yet. Start by adding your first farmer."
                    }
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    {Object.values(filters).some(Boolean) ? "Clear All Filters" : "Add First Farmer"}
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {farmersData && farmersData.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((farmersData.page - 1) * pageSize) + 1} to {Math.min(farmersData.page * pageSize, farmersData.total)} of {farmersData.total} farmers
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {farmersData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(farmersData.totalPages, currentPage + 1))}
                      disabled={currentPage === farmersData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
