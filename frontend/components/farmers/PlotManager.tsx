"use client"

import React, { useState, useCallback } from "react"
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
import type { PlotFormData, Plot } from "@/lib/database.types"
import { useCreatePlot, useUpdatePlot, useDeletePlot } from "@/lib/hooks"

// Union type for plots - can be either database plots (with id) or form plots (without id)
type ManagedPlot = Plot | PlotFormData

// Plot form schema
const plotFormSchema = z.object({
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  commune: z.string().min(1, "Commune is required"),
  village: z.string().optional(),
  location_lat: z.number().optional(),
  location_long: z.number().optional(),
  crop: z.string().min(1, "Crop type is required"),
  area_ha: z.number().min(0.01, "Area must be greater than 0"),
})

type LocalPlotFormData = z.infer<typeof plotFormSchema>

interface PlotManagerProps {
  plots: ManagedPlot[]
  onPlotsChange: (plots: PlotFormData[]) => void
  farmerId?: string // For creating plots directly in the database
}

// Type guard to check if plot has an ID (database plot)
const isPlotWithId = (plot: ManagedPlot): plot is Plot => {
  return 'id' in plot && 'farmer_id' in plot
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



export function PlotManager({ plots, onPlotsChange, farmerId }: PlotManagerProps) {
  const [activeTab, setActiveTab] = useState("list")
  const [editingPlot, setEditingPlot] = useState<ManagedPlot | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const createPlotMutation = useCreatePlot()
  const updatePlotMutation = useUpdatePlot()
  const deletePlotMutation = useDeletePlot()

  const form = useForm<LocalPlotFormData>({
    resolver: zodResolver(plotFormSchema),
    defaultValues: {
      province: "",
      district: "",
      commune: "",
      village: "",
      crop: "",
      area_ha: 0,
    },
  })

  const handleProvinceChange = useCallback((province: string) => {
    form.setValue("province", province, { shouldValidate: true })
    form.setValue("district", "", { shouldValidate: true })
    form.setValue("commune", "", { shouldValidate: true })
  }, [form])

  const handleDistrictChange = useCallback((district: string) => {
    form.setValue("district", district, { shouldValidate: true })
    form.setValue("commune", "", { shouldValidate: true })
  }, [form])

  const handleCommuneChange = useCallback((commune: string) => {
    form.setValue("commune", commune, { shouldValidate: true })
  }, [form])

  const onSubmit = async (data: LocalPlotFormData) => {
    try {
      if (farmerId && editingPlot && isPlotWithId(editingPlot)) {
        // Update existing plot in database
        await updatePlotMutation.mutateAsync({
          id: editingPlot.id,
          updates: {
            ...data,
            village: data.village || null,
            location_lat: data.location_lat || null,
            location_long: data.location_long || null,
          }
        })
      } else if (farmerId && !editingPlot) {
        // Create new plot in database
        await createPlotMutation.mutateAsync({
          farmer_id: farmerId,
          ...data,
          village: data.village || null,
          location_lat: data.location_lat || null,
          location_long: data.location_long || null,
        })
      } else if (editingPlot && editingIndex !== null) {
        // Update plot in local state (used in farmer form)
        const updatedPlot: PlotFormData = {
          ...data,
          village: data.village || null,
          location_lat: data.location_lat || null,
          location_long: data.location_long || null,
        }
        
        const updatedPlots = plots.map((plot, index) => 
          index === editingIndex ? updatedPlot : plot
        ) as PlotFormData[]
        onPlotsChange(updatedPlots)
      } else {
        // Add new plot to local state (used in farmer form)
        const newPlot: PlotFormData = {
          ...data,
          village: data.village || null,
          location_lat: data.location_lat || null,
          location_long: data.location_long || null,
        }
        onPlotsChange([...plots as PlotFormData[], newPlot])
      }

      // Reset form and switch to list view
      form.reset()
      setEditingPlot(null)
      setEditingIndex(null)
      setActiveTab("list")
    } catch (error) {
      console.error('Error saving plot:', error)
    }
  }

  const handleEditPlot = (plot: ManagedPlot, index: number) => {
    setEditingPlot(plot)
    setEditingIndex(index)
    form.reset({
      province: plot.province,
      district: plot.district,
      commune: plot.commune,
      village: plot.village || "",
      location_lat: plot.location_lat || undefined,
      location_long: plot.location_long || undefined,
      crop: plot.crop,
      area_ha: plot.area_ha,
    })
    setActiveTab("add")
  }

  const handleDeletePlot = async (plotIndex: number) => {
    const plot = plots[plotIndex]
    const plotName = `Plot ${plotIndex + 1} (${plot.crop})`
    
    if (!window.confirm(`Are you sure you want to delete ${plotName}? This action cannot be undone.`)) {
      return
    }
    
    try {
      if (farmerId && isPlotWithId(plot)) {
        // Delete from database
        await deletePlotMutation.mutateAsync({ id: plot.id, farmerId: farmerId })
      } else {
        // Remove from local state (used in farmer form)
        const updatedPlots = plots.filter((_, index) => index !== plotIndex) as PlotFormData[]
        onPlotsChange(updatedPlots)
      }
    } catch (error) {
      console.error('Error deleting plot:', error)
    }
  }

  const handleCancelEdit = () => {
    form.reset()
    setEditingPlot(null)
    setEditingIndex(null)
    setActiveTab("list")
  }

  const formatLocation = (plot: ManagedPlot) => {
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
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Plot {index + 1}</Badge>
                          <Badge variant="secondary">{plot.crop}</Badge>
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
                            <span className="text-muted-foreground">{plot.area_ha} hectares</span>
                          </div>
                          {(plot.location_lat && plot.location_long) && (
                            <div>
                              <span className="font-medium">GPS:</span>{" "}
                              <span className="text-muted-foreground">
                                {plot.location_lat.toFixed(6)}, {plot.location_long.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlot(plot, index)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlot(index)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deletePlotMutation.isPending}
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
                        onProvinceChange={handleProvinceChange}
                        onDistrictChange={handleDistrictChange}
                        onCommuneChange={handleCommuneChange}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Village (Optional)</FormLabel>
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
                        name="location_lat"
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
                        name="location_long"
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
                        name="area_ha"
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


                  </div>

                  <Separator />

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={form.handleSubmit(onSubmit)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={createPlotMutation.isPending || updatePlotMutation.isPending}
                    >
                      {createPlotMutation.isPending || updatePlotMutation.isPending 
                        ? "Saving..." 
                        : editingPlot ? "Update Plot" : "Add Plot"
                      }
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
