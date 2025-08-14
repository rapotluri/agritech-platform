"use client"

import * as React from "react"

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
}: LocationSelectorProps) {
  const [locationData, setLocationData] = React.useState<LocationData>({})
  const [provinces, setProvinces] = React.useState<string[]>([])
  const [districts, setDistricts] = React.useState<string[]>([])
  const [communes, setCommunes] = React.useState<string[]>([])

  // Load location data
  React.useEffect(() => {
    const loadLocationData = async () => {
      try {
        const response = await fetch('/data/cambodia_provinces_districts_communes.json')
        const data = await response.json()
        setLocationData(data)
        setProvinces(Object.keys(data))
      } catch (error) {
        console.error('Failed to load location data:', error)
        // Fallback data for development
        const fallbackData = {
          "PhnomPenh": {
            "ChamkarMon": ["BoengKengKang", "Olympic", "PhsarDaeumThkov"],
            "ChbarAmpov": ["ChbarAmpov", "KbalKaoh", "PreaekAeng"]
          },
          "Kandal": {
            "AngkSnuol": ["BaekChan", "ChhakChheuNeang", "DamnakAmpil"],
            "KandalStueng": ["AmpovPrey", "AnlongRomiet", "Barku"]
          }
        }
        setLocationData(fallbackData)
        setProvinces(Object.keys(fallbackData))
      }
    }
    loadLocationData()
  }, [])

  // Update districts when province changes
  React.useEffect(() => {
    if (province && locationData[province]) {
      const provinceDistricts = Object.keys(locationData[province])
      setDistricts(provinceDistricts)
      // Reset district and commune if province changes
      if (!provinceDistricts.includes(district)) {
        onDistrictChange('')
        onCommuneChange('')
      }
    } else {
      setDistricts([])
      setCommunes([])
    }
  }, [province, locationData, district, onDistrictChange, onCommuneChange])

  // Update communes when district changes
  React.useEffect(() => {
    if (province && district && locationData[province]?.[district]) {
      const districtCommunes = locationData[province][district]
      setCommunes(districtCommunes)
      // Reset commune if district changes
      if (!districtCommunes.includes(commune)) {
        onCommuneChange('')
      }
    } else {
      setCommunes([])
    }
  }, [province, district, locationData, commune, onCommuneChange])

  const handleProvinceChange = (value: string) => {
    onProvinceChange(value)
  }

  const handleDistrictChange = (value: string) => {
    onDistrictChange(value)
  }

  const handleCommuneChange = (value: string) => {
    onCommuneChange(value)
  }

           return (
        <div className={cn("flex gap-2", className)}>
          <Select value={province} onValueChange={handleProvinceChange} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Province *" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((prov) => (
                <SelectItem key={prov} value={prov}>
                  {prov.replace(/([A-Z])/g, ' $1').trim()}
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
                  {dist.replace(/([A-Z])/g, ' $1').trim()}
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
                  {com.replace(/([A-Z])/g, ' $1').trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
}
