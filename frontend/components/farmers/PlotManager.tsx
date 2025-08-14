"use client"

import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { PlusIcon, TrashIcon, MapPinIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LocationSelector } from "./LocationSelector"
import type { Plot } from "./FarmerForm"

// Plot form schema
const plotFormSchema = z.object({
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  commune: z.string().min(1, "Commune is required"),
  village: z.string().min(1, "Village is required"),
  locationLat: z.number().optional(),
  locationLong: z.number().optional(),
  crop: z.string().min(1, "Crop type is required"),
  areaHa: z.number().min(0.01, "Area must be greater than 0"),
  assignedProduct: z.string().optional(),
})

type PlotFormData = z.infer<typeof plotFormSchema>

interface PlotManagerProps {
  plots: Plot[]
  onPlotsChange: (plots: Plot[]) => void
}

// Mock crop types
const cropTypes = [
  "Rice",
  "Corn",
  "Soybeans",
  "Cassava",
  "Sweet Potato",
  "Peanuts",
  "Sesame",
  "Mung Bean",
  "Sugarcane",
  "Vegetables",
  "Fruits",
  "Other"
]

// Mock insurance products
const insuranceProducts = [
  "Weather Index Insurance",
  "Crop Yield Insurance",
  "Multi-Peril Crop Insurance",
  "Livestock Insurance",
  "Equipment Insurance"
]

export function PlotManager({ plots, onPlotsChange }: PlotManagerProps) {
  const [activeTab, setActiveTab] = useState("list")
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null)

  const form = useForm<PlotFormData>({
    resolver: zodResolver(plotFormSchema),
    defaultValues: {
      province: "",
      district: "",
      commune: "",
      village: "",
      crop: "",
      areaHa: 0,
      assignedProduct: "",
    },
  })

  const handleLocationChange = (province: string, district: string, commune: string) => {
    form.setValue("province", province)
    form.setValue("district", district)
    form.setValue("commune", commune)
  }

  const onSubmit = (data: PlotFormData) => {
    const newPlot: Plot = {
      id: editingPlot?.id || `plot-${Date.now()}`,
      ...data,
    }

    if (editingPlot) {
      // Update existing plot
      const updatedPlots = plots.map(plot => 
        plot.id === editingPlot.id ? newPlot : plot
      )
      onPlotsChange(updatedPlots)
    } else {
      // Add new plot
      onPlotsChange([...plots, newPlot])
    }

    // Reset form and switch to list view
    form.reset()
    setEditingPlot(null)
    setActiveTab("list")
  }

  const handleEditPlot = (plot: Plot) => {
    setEditingPlot(plot)
    form.reset({
      province: plot.province,
      district: plot.district,
      commune: plot.commune,
      village: plot.village,
      locationLat: plot.locationLat,
      locationLong: plot.locationLong,
      crop: plot.crop,
      areaHa: plot.areaHa,
      assignedProduct: plot.assignedProduct,
    })
    setActiveTab("add")
  }

  const handleDeletePlot = (plotId: string) => {
    const updatedPlots = plots.filter(plot => plot.id !== plotId)
    onPlotsChange(updatedPlots)
  }

  const handleCancelEdit = () => {
    form.reset()
    setEditingPlot(null)
    setActiveTab("list")
  }

  const formatLocation = (plot: Plot) => {
    const parts = [plot.province, plot.district, plot.commune, plot.village]
      .filter(Boolean)
      .map(part => part.replace(/([A-Z])/g, ' $1').trim())
    return parts.join(", ")
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            Plot List ({plots.length})
          </TabsTrigger>
          <TabsTrigger value="add">
            {editingPlot ? "Edit Plot" : "Add Plot"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {plots.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No plots added</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add the first plot to get started.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => setActiveTab("add")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add First Plot
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {plots.map((plot, index) => (
                <Card key={plot.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Plot {index + 1}</Badge>
                          <Badge variant="secondary">{plot.crop}</Badge>
                          {plot.assignedProduct && (
                            <Badge className="bg-green-100 text-green-800">
                              {plot.assignedProduct}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Location:</span>
                            <br />
                            <span className="text-muted-foreground">
                              {formatLocation(plot)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Area:</span>{" "}
                            <span className="text-muted-foreground">{plot.areaHa} hectares</span>
                          </div>
                          {(plot.locationLat && plot.locationLong) && (
                            <div>
                              <span className="font-medium">GPS:</span>{" "}
                              <span className="text-muted-foreground">
                                {plot.locationLat.toFixed(6)}, {plot.locationLong.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlot(plot)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlot(plot.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                onClick={() => setActiveTab("add")}
                variant="outline"
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Another Plot
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingPlot ? "Edit Plot Details" : "Add New Plot"}
              </CardTitle>
              <CardDescription>
                Enter the details for this agricultural plot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Location Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Plot Location</Label>
                      <p className="text-sm text-muted-foreground">
                        Specify where this plot is located
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Province, District, Commune *</Label>
                      <LocationSelector
                        province={form.watch("province")}
                        district={form.watch("district")}
                        commune={form.watch("commune")}
                        onProvinceChange={(province) => handleLocationChange(province, "", "")}
                        onDistrictChange={(district) => handleLocationChange(form.watch("province"), district, "")}
                        onCommuneChange={(commune) => handleLocationChange(form.watch("province"), form.watch("district"), commune)}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Village *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter village name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="locationLat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                placeholder="e.g., 11.5564"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="locationLong"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                placeholder="e.g., 104.9282"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Crop and Area Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Crop Information</Label>
                      <p className="text-sm text-muted-foreground">
                        Details about what is grown on this plot
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="crop"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Crop Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select crop type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cropTypes.map((crop) => (
                                  <SelectItem key={crop} value={crop}>
                                    {crop}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="areaHa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area (Hectares) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                min="0.01"
                                placeholder="e.g., 2.5"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="assignedProduct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Insurance Product (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select insurance product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No product assigned</SelectItem>
                              {insuranceProducts.map((product) => (
                                <SelectItem key={product} value={product}>
                                  {product}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      {editingPlot ? "Update Plot" : "Add Plot"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
