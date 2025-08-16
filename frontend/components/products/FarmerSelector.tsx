"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFarmers } from "@/lib/hooks"
import { Search, Users, MapPin, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

interface FarmerSelectorProps {
  selectedFarmers: string[]
  onSelectionChange: (farmerIds: string[]) => void

}

interface FarmerFilters {
  searchQuery: string
  province: string
  district: string
  commune: string
  kycStatus: 'all' | 'pending' | 'verified' | 'rejected'
}

export function FarmerSelector({
  selectedFarmers,
  onSelectionChange
}: FarmerSelectorProps) {
  const [filters, setFilters] = useState<FarmerFilters>({
    searchQuery: "",
    province: "all",
    district: "all",
    commune: "all",
    kycStatus: "all" // Default to all KYC statuses
  })

  const [sorting] = useState({ column: null, direction: 'asc' as 'asc' | 'desc' })
  const [pagination, setPagination] = useState({ page: 1, limit: 20 })

  const { data: farmersResponse, isLoading, error } = useFarmers(filters, sorting, pagination)
  const farmers = farmersResponse?.farmers || []

  // Get unique values for filter dropdowns
  const provinces = Array.from(new Set(farmers.map(f => f.province))).sort()
  const districts = Array.from(new Set(farmers.map(f => f.district))).sort()

  const handleFarmerToggle = (farmerId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFarmers, farmerId])
    } else {
      onSelectionChange(selectedFarmers.filter(id => id !== farmerId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(farmers.map(f => f.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleFilterChange = (key: keyof FarmerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      province: "all",
      district: "all",
      commune: "all",
      kycStatus: "all"
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getKYCStatusLabel = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified"
      case "pending":
        return "Pending"
      case "rejected":
        return "Rejected"
      default:
        return "Unknown"
    }
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 9) {
      return `+855 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
    }
    return phone
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading farmers: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Farmers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, phone, or ID..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

                         {/* Province Filter */}
             <div>
               <Select value={filters.province} onValueChange={(value) => handleFilterChange('province', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Province" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Provinces</SelectItem>
                   {provinces.map(province => (
                     <SelectItem key={province} value={province}>{province}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             {/* District Filter */}
             <div>
               <Select value={filters.district} onValueChange={(value) => handleFilterChange('district', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="District" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Districts</SelectItem>
                   {districts.map(district => (
                     <SelectItem key={district} value={district}>{district}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

                         {/* KYC Status Filter */}
             <div>
               <Select value={filters.kycStatus} onValueChange={(value) => handleFilterChange('kycStatus', value)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="verified">Verified Only</SelectItem>
                   <SelectItem value="pending">Pending</SelectItem>
                   <SelectItem value="rejected">Rejected</SelectItem>
                   <SelectItem value="all">All Statuses</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Farmers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Available Farmers</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedFarmers.length === farmers.length && farmers.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm text-gray-600">
                Select All ({farmers.length})
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : farmers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No farmers found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Plots</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmers.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFarmers.includes(farmer.id)}
                          onCheckedChange={(checked) => handleFarmerToggle(farmer.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{farmer.english_name}</div>
                          <div className="text-sm text-gray-500">ID: {farmer.national_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatPhoneNumber(farmer.phone)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">
                            <div>{farmer.province}</div>
                            <div className="text-gray-500">{farmer.district}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", getKYCStatusColor(farmer.kyc_status))}>
                          {getKYCStatusLabel(farmer.kyc_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{farmer.plots?.length || 0} plots</div>
                          <div className="text-gray-500">
                            {farmer.plots?.reduce((total, plot) => total + (plot.area_ha || 0), 0).toFixed(2)} ha
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
