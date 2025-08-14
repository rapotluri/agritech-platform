"use client"

import * as React from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

import { LocationSelector } from "./LocationSelector"
import { cn } from "@/lib/utils"

interface SearchFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedProvince: string
  selectedDistrict: string
  selectedCommune: string
  onLocationChange: (province: string, district: string, commune: string) => void
  selectedKYCStatus: string
  onKYCStatusChange: (status: string) => void
  selectedProduct: string
  onProductChange: (product: string) => void

  onClearFilters: () => void
  className?: string
}

// Mock insurance products
const INSURANCE_PRODUCTS = [
  "Rice Insurance Premium",
  "Corn Insurance Premium", 
  "Cassava Insurance Premium",
  "Soybean Insurance Premium",
  "Peanut Insurance Premium",
  "Vegetable Insurance Premium"
]

const KYC_STATUSES = [
  { value: "all", label: "All KYC Status" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" }
]

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedProvince,
  selectedDistrict,
  selectedCommune,
  onLocationChange,
  selectedKYCStatus,
  onKYCStatusChange,
  selectedProduct,
  onProductChange,

  onClearFilters,
  className,
}: SearchFiltersProps) {
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchQuery)

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  React.useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  const handleLocationChange = (province: string, district: string, commune: string) => {
    onLocationChange(province, district, commune)
  }

  const hasActiveFilters = selectedProvince || selectedDistrict || selectedCommune || 
                          (selectedKYCStatus && selectedKYCStatus !== "all") || 
                          (selectedProduct && selectedProduct !== "all")

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search farmers by name, national ID, or phone number..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

             {/* Filters Row */}
       <div className="flex flex-col lg:flex-row gap-4">
         {/* Location Filters */}
         <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             <Filter className="h-4 w-4 text-muted-foreground" />
             <span className="text-sm font-medium">Location</span>
           </div>
           <LocationSelector
             province={selectedProvince}
             district={selectedDistrict}
             commune={selectedCommune}
             onProvinceChange={(province) => handleLocationChange(province, "", "")}
             onDistrictChange={(district) => handleLocationChange(selectedProvince, district, "")}
             onCommuneChange={(commune) => handleLocationChange(selectedProvince, selectedDistrict, commune)}
           />
         </div>

         {/* KYC Status */}
         <div className="w-[200px]">
           <Label className="text-sm font-medium block mb-2">KYC Status</Label>
           <Select value={selectedKYCStatus || "all"} onValueChange={onKYCStatusChange}>
             <SelectTrigger className="h-9">
               <SelectValue placeholder="All KYC Status" />
             </SelectTrigger>
             <SelectContent>
               {KYC_STATUSES.map((status) => (
                 <SelectItem key={status.value} value={status.value}>
                   {status.label}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>

         {/* Product Assignment */}
         <div className="w-[200px]">
           <Label className="text-sm font-medium block mb-2">Product</Label>
           <Select value={selectedProduct || "all"} onValueChange={onProductChange}>
             <SelectTrigger className="h-9">
               <SelectValue placeholder="All Products" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Products</SelectItem>
               {INSURANCE_PRODUCTS.map((product) => (
                 <SelectItem key={product} value={product}>
                   {product}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>


       </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="text-sm"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}

// Add Label component if not already imported
const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
)
