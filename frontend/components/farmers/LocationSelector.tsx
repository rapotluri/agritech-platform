"use client"

import * as React from "react"
import cambodiaLocationData from "../../data/cambodia_locations.json"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface LocationSelectorProps {
  province: string
  district: string
  commune: string
  onProvinceChange: (province: string) => void
  onDistrictChange: (district: string) => void
  onCommuneChange: (commune: string) => void
  className?: string
  disabled?: boolean
  fieldType?: "province" | "district" | "commune" // Single field mode
}

interface LocationData {
  [province: string]: {
    [district: string]: string[]
  }
}

export function LocationSelector({
  province,
  district,
  commune,
  onProvinceChange,
  onDistrictChange,
  onCommuneChange,
  className,
  disabled = false,
  fieldType,
}: LocationSelectorProps) {
  const [locationData, setLocationData] = React.useState<LocationData>({})
  const [provinces, setProvinces] = React.useState<string[]>([])
  const [districts, setDistricts] = React.useState<string[]>([])
  const [communes, setCommunes] = React.useState<string[]>([])

  // Load location data
  React.useEffect(() => {
    // Use the imported JSON data directly
    const data = cambodiaLocationData as LocationData
    setLocationData(data)
    setProvinces(Object.keys(data))
  }, [])

  // Memoize districts to prevent unnecessary updates
  const currentDistricts = React.useMemo(() => {
    if (province && locationData[province]) {
      return Object.keys(locationData[province])
    }
    return []
  }, [province, locationData])

  // Memoize communes to prevent unnecessary updates
  const currentCommunes = React.useMemo(() => {
    if (province && district && locationData[province]?.[district]) {
      return locationData[province][district]
    }
    return []
  }, [province, district, locationData])

  // Update districts when province changes
  React.useEffect(() => {
    setDistricts(currentDistricts)
  }, [currentDistricts])

  // Update communes when district changes
  React.useEffect(() => {
    setCommunes(currentCommunes)
  }, [currentCommunes])

  // Reset dependent fields when they become invalid
  React.useEffect(() => {
    if (district && currentDistricts.length > 0 && !currentDistricts.includes(district)) {
      onDistrictChange('')
    }
  }, [district, currentDistricts, onDistrictChange])

  React.useEffect(() => {
    if (commune && currentCommunes.length > 0 && !currentCommunes.includes(commune)) {
      onCommuneChange('')
    }
  }, [commune, currentCommunes, onCommuneChange])

  const handleProvinceChange = (value: string) => {
    onProvinceChange(value)
  }

  const handleDistrictChange = (value: string) => {
    onDistrictChange(value)
  }

  const handleCommuneChange = (value: string) => {
    onCommuneChange(value)
  }

  // Single field mode - render only the specified field
  if (fieldType === "province") {
    return (
      <Select value={province} onValueChange={handleProvinceChange} disabled={disabled}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select province" />
        </SelectTrigger>
        <SelectContent>
          {provinces.map((prov) => (
            <SelectItem key={prov} value={prov}>
              {prov}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (fieldType === "district") {
    return (
      <Select value={district} onValueChange={handleDistrictChange} disabled={disabled || !province}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select district" />
        </SelectTrigger>
        <SelectContent>
          {districts.map((dist) => (
            <SelectItem key={dist} value={dist}>
              {dist}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (fieldType === "commune") {
    return (
      <Select value={commune} onValueChange={handleCommuneChange} disabled={disabled || !district}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select commune" />
        </SelectTrigger>
        <SelectContent>
          {communes.map((com) => (
            <SelectItem key={com} value={com}>
              {com}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Multi-field mode - render all fields together (backwards compatibility)
  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={province} onValueChange={handleProvinceChange} disabled={disabled}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Province *" />
        </SelectTrigger>
        <SelectContent>
          {provinces.map((prov) => (
            <SelectItem key={prov} value={prov}>
              {prov}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={district} onValueChange={handleDistrictChange} disabled={disabled || !province}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="District *" />
        </SelectTrigger>
        <SelectContent>
          {districts.map((dist) => (
            <SelectItem key={dist} value={dist}>
              {dist}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={commune} onValueChange={handleCommuneChange} disabled={disabled || !district}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Commune *" />
        </SelectTrigger>
        <SelectContent>
          {communes.map((com) => (
            <SelectItem key={com} value={com}>
              {com}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
