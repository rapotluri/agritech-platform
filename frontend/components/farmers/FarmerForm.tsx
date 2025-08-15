"use client"

import React, { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateInput } from "@/components/ui/date-input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { LocationSelector } from "./LocationSelector"
import { PlotManager } from "./PlotManager"
import { useCreateFarmer, useUpdateFarmer } from "@/lib/hooks"
import type { FarmerWithPlots, PlotFormData } from "@/lib/database.types"

// Form schema based on the database schema
const farmerFormSchema = z.object({
  // Personal Information
  english_name: z.string().min(1, "English name is required"),
  sex: z.enum(["male", "female", "other"]),
  phone: z.string().min(1, "Phone number is required"),
  national_id: z.string().min(1, "National ID is required"),
  dob: z.date().optional(),
  enrolment_date: z.date().default(() => new Date()),
  
  // Location Information
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  commune: z.string().min(1, "Commune is required"),
  village: z.string().optional(),
  
  // Bank Details
  bank_account_usd: z.string().optional(),
  bank_account_khr: z.string().optional(),
  
  // KYC Status
  kyc_status: z.enum(["pending", "verified", "rejected"]).default("pending"),
  kyc_notes: z.string().optional(),
})

export type FarmerFormData = z.infer<typeof farmerFormSchema>

interface FarmerFormProps {
  farmer?: FarmerWithPlots // For edit mode
  onSuccess: () => void
  onCancel: () => void
  showPlotManagement?: boolean // Control whether to show plot management section
}

export function FarmerForm({ farmer, onSuccess, onCancel, showPlotManagement = true }: FarmerFormProps) {
  const [plots, setPlots] = useState<PlotFormData[]>([])
  
  const isEditMode = !!farmer
  const createFarmerMutation = useCreateFarmer()
  const updateFarmerMutation = useUpdateFarmer()

  const form = useForm<FarmerFormData>({
    resolver: zodResolver(farmerFormSchema),
    defaultValues: {
      english_name: farmer?.english_name || "",
      sex: farmer?.sex || "male",
      phone: farmer?.phone || "",
      national_id: farmer?.national_id || "",
      dob: farmer?.dob ? new Date(farmer.dob) : undefined,
      enrolment_date: farmer?.enrolment_date ? new Date(farmer.enrolment_date) : new Date(),
      province: farmer?.province || "",
      district: farmer?.district || "",
      commune: farmer?.commune || "",
      village: farmer?.village || "",
      bank_account_usd: farmer?.bank_account_usd || "",
      bank_account_khr: farmer?.bank_account_khr || "",
      kyc_status: farmer?.kyc_status || "pending",
      kyc_notes: "",
    },
  })

  // Initialize plots for edit mode
  useEffect(() => {
    if (isEditMode && farmer?.plots) {
      // Convert database plots to form plots
      const formPlots = farmer.plots.map(plot => ({
        province: plot.province,
        district: plot.district,
        commune: plot.commune,
        village: plot.village || "",
        location_lat: plot.location_lat,
        location_long: plot.location_long,
        crop: plot.crop,
        area_ha: plot.area_ha,
      }))
      setPlots(formPlots)
    }
  }, [isEditMode, farmer])

  const onSubmit = async (data: FarmerFormData) => {
    try {
      if (isEditMode && farmer) {
        // Update existing farmer
        await updateFarmerMutation.mutateAsync({
          id: farmer.id,
          updates: {
            english_name: data.english_name,
            sex: data.sex,
            phone: data.phone,
            national_id: data.national_id,
            dob: data.dob?.toISOString().split('T')[0],
            enrolment_date: data.enrolment_date.toISOString().split('T')[0],
            province: data.province,
            district: data.district,
            commune: data.commune,
            village: data.village || null,
            bank_account_usd: data.bank_account_usd || null,
            bank_account_khr: data.bank_account_khr || null,
            kyc_status: data.kyc_status,
          }
        })
      } else {
        // Create new farmer
        await createFarmerMutation.mutateAsync({
          farmerData: {
            english_name: data.english_name,
            sex: data.sex,
            phone: data.phone,
            national_id: data.national_id,
            dob: data.dob?.toISOString().split('T')[0] || null,
            enrolment_date: data.enrolment_date.toISOString().split('T')[0],
            province: data.province,
            district: data.district,
            commune: data.commune,
            village: data.village || null,
            bank_account_usd: data.bank_account_usd || null,
            bank_account_khr: data.bank_account_khr || null,
            kyc_status: data.kyc_status,
          },
          plots: showPlotManagement ? plots : []
        })
      }
      
      onSuccess()
    } catch (error) {
      console.error("Error submitting farmer data:", error)
      // Error handling is done in the mutation hooks
    }
  }

  const isSubmitting = createFarmerMutation.isPending || updateFarmerMutation.isPending

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

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
        onWheel={(e) => {
          // Allow scroll events to propagate to Select dropdowns
          const target = e.target as HTMLElement;
          const listbox = target.closest('[role="listbox"]');
          if (listbox) {
            e.stopPropagation();
          }
        }}
      >
        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about the farmer</CardDescription>
          </CardHeader>
          <CardContent 
            className="space-y-4"
            onWheel={(e) => {
              // Check if we're scrolling inside a Select dropdown
              const target = e.target as HTMLElement;
              const listbox = target.closest('[role="listbox"]');
              if (listbox) {
                e.stopPropagation();
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="english_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>English Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="national_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter national ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date of birth"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enrolment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date *</FormLabel>
                    <FormControl>
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select enrollment date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
            <CardDescription>Farmer&apos;s residential address</CardDescription>
          </CardHeader>
          <CardContent 
            className="space-y-4"
            onWheel={(e) => {
              // Check if we're scrolling inside a Select dropdown
              const target = e.target as HTMLElement;
              const listbox = target.closest('[role="listbox"]');
              if (listbox) {
                e.stopPropagation();
              }
            }}
          >
            <div className="space-y-2">
              <Label>Location *</Label>
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
                  <FormLabel>Village</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter village name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Bank Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>Optional bank account information</CardDescription>
          </CardHeader>
          <CardContent 
            className="space-y-4"
            onWheel={(e) => {
              // Check if we're scrolling inside a Select dropdown
              const target = e.target as HTMLElement;
              const listbox = target.closest('[role="listbox"]');
              if (listbox) {
                e.stopPropagation();
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bank_account_usd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>USD Account</FormLabel>
                    <FormControl>
                      <Input placeholder="USD account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bank_account_khr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KHR Account</FormLabel>
                    <FormControl>
                      <Input placeholder="KHR account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* KYC Status Section */}
        <Card>
          <CardHeader>
            <CardTitle>KYC Status</CardTitle>
            <CardDescription>Know Your Customer verification status</CardDescription>
          </CardHeader>
          <CardContent 
            className="space-y-4"
            onWheel={(e) => {
              // Check if we're scrolling inside a Select dropdown
              const target = e.target as HTMLElement;
              const listbox = target.closest('[role="listbox"]');
              if (listbox) {
                e.stopPropagation();
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kyc_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select KYC status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="kyc_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add notes about KYC verification..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Plot Management Section - Only show when enabled */}
        {showPlotManagement && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Plot Management</CardTitle>
                <CardDescription>Manage farmer&apos;s agricultural plots</CardDescription>
              </CardHeader>
              <CardContent>
                <PlotManager plots={plots} onPlotsChange={setPlots} />
              </CardContent>
            </Card>

            <Separator />
          </>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update Farmer" : "Add Farmer"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
