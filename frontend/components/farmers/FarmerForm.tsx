"use client"

import React, { useState, useEffect } from "react"
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

// Form schema based on the database schema
const farmerFormSchema = z.object({
  // Personal Information
  englishName: z.string().min(1, "English name is required"),
  sex: z.enum(["male", "female", "other"]),
  phone: z.string().min(1, "Phone number is required"),
  nationalId: z.string().min(1, "National ID is required"),
  dob: z.date().optional(),
  enrolmentDate: z.date().default(() => new Date()),
  
  // Location Information
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  commune: z.string().min(1, "Commune is required"),
  village: z.string().optional(),
  
  // Bank Details
  bankAccountUsd: z.string().optional(),
  bankAccountKhr: z.string().optional(),
  
  // KYC Status
  kycStatus: z.enum(["pending", "verified", "rejected"]).default("pending"),
  kycNotes: z.string().optional(),
})

export type FarmerFormData = z.infer<typeof farmerFormSchema>

export interface Plot {
  id: string
  province: string
  district: string
  commune: string
  village: string
  locationLat?: number
  locationLong?: number
  crop: string
  areaHa: number
  assignedProduct?: string
}

interface FarmerFormProps {
  farmer?: any // For edit mode
  onSuccess: () => void
  onCancel: () => void
}

export function FarmerForm({ farmer, onSuccess, onCancel }: FarmerFormProps) {
  const [plots, setPlots] = useState<Plot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const isEditMode = !!farmer

  const form = useForm<FarmerFormData>({
    resolver: zodResolver(farmerFormSchema),
    defaultValues: {
      englishName: farmer?.englishName || "",
      sex: farmer?.sex || "male",
      phone: farmer?.phone || "",
      nationalId: farmer?.nationalId || "",
      dob: farmer?.dob ? new Date(farmer.dob) : undefined,
      enrolmentDate: farmer?.enrolmentDate ? new Date(farmer.enrolmentDate) : new Date(),
      province: farmer?.province || "",
      district: farmer?.district || "",
      commune: farmer?.commune || "",
      village: farmer?.village || "",
      bankAccountUsd: farmer?.bankAccountUsd || "",
      bankAccountKhr: farmer?.bankAccountKhr || "",
      kycStatus: farmer?.kycStatus || "pending",
      kycNotes: farmer?.kycNotes || "",
    },
  })

  // Initialize plots for edit mode
  useEffect(() => {
    if (isEditMode && farmer?.plots) {
      setPlots(farmer.plots)
    }
  }, [isEditMode, farmer])

  const onSubmit = async (data: FarmerFormData) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const farmerData = {
        ...data,
        plots: plots,
        id: farmer?.id || `farmer-${Date.now()}`,
        plotsCount: plots.length,
      }
      
      console.log("Submitting farmer data:", farmerData)
      
      // Here you would make the actual API call
      // await createFarmer(farmerData) or await updateFarmer(farmer.id, farmerData)
      
      toast.success(
        isEditMode 
          ? `Farmer ${data.englishName} has been updated successfully!`
          : `Farmer ${data.englishName} has been added successfully!`
      )
      
      onSuccess()
    } catch (error) {
      console.error("Error submitting farmer data:", error)
      toast.error("Failed to save farmer data. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLocationChange = (province: string, district: string, commune: string) => {
    form.setValue("province", province)
    form.setValue("district", district)
    form.setValue("commune", commune)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about the farmer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="englishName"
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
                name="nationalId"
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
                name="enrolmentDate"
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Location *</Label>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankAccountUsd"
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
                name="bankAccountKhr"
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kycStatus"
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
              name="kycNotes"
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

        {/* Plot Management Section */}
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
