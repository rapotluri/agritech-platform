"use client"

import React from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Download, Phone, MapPin, Calendar, User, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, Plus } from "lucide-react"
import { mockFarmers, mockPlots } from "@/components/farmers/mockData"
import { format, formatDistanceToNow } from "date-fns"

interface FarmerProfilePageProps {
  params: {
    id: string
  }
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

export default function FarmerProfilePage({ params }: FarmerProfilePageProps) {
  const farmer = mockFarmers.find(f => f.id === params.id)
  
  if (!farmer) {
    notFound()
  }

  const farmerPlots = mockPlots.filter(plot => plot.farmerId === farmer.id)

  return (
    <TooltipProvider>
      <div className="p-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/protected/operations-dashboard/farmers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Farmers
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{farmer.englishName}</h1>
              <p className="text-gray-600 mt-1">
                Farmer ID: {farmer.id} • Enrolled {formatDistanceToNow(farmer.enrolmentDate, { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {farmer.englishName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              {/* Basic Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold">{farmer.englishName}</h2>
                  <p className="text-muted-foreground">National ID: {farmer.nationalId}</p>
                </div>
                
                {/* Status Badges */}
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="secondary" 
                    className={`border ${getKYCStatusColor(farmer.kycStatus)}`}
                  >
                    KYC: {getKYCStatusLabel(farmer.kycStatus)}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {farmerPlots.length} Plot{farmerPlots.length !== 1 ? 's' : ''}
                  </Badge>
                  {farmer.assignedProduct && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                      {farmer.assignedProduct}
                    </Badge>
                  )}
                </div>
                
                {/* Quick Contact */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{formatPhoneNumber(farmer.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{farmer.province}, {farmer.district}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Born {format(farmer.dob, "MMM dd, yyyy")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plots">Plots ({farmerPlots.length})</TabsTrigger>
            <TabsTrigger value="policies">Policy History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">English Name</label>
                      <p className="font-medium">{farmer.englishName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sex</label>
                      <p className="font-medium capitalize">{farmer.sex}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">National ID</label>
                      <p className="font-medium">{farmer.nationalId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="font-medium">{format(farmer.dob, "MMM dd, yyyy")}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Enrollment Date</label>
                      <p className="font-medium">{format(farmer.enrolmentDate, "MMMM dd, yyyy")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="font-medium">{formatPhoneNumber(farmer.phone)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">KYC Status</label>
                    <div className="mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`border ${getKYCStatusColor(farmer.kycStatus)}`}
                      >
                        {getKYCStatusLabel(farmer.kycStatus)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Province</label>
                      <p className="font-medium">{farmer.province}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">District</label>
                      <p className="font-medium">{farmer.district}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Commune</label>
                      <p className="font-medium">{farmer.commune}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Village</label>
                      <p className="font-medium">{farmer.village}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Bank Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">USD Account</label>
                    <p className="font-medium">{farmer.bankAccountUsd || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">KHR Account</label>
                    <p className="font-medium">{farmer.bankAccountKhr || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plots Tab */}
          <TabsContent value="plots" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Farm Plots</h3>
                <p className="text-muted-foreground">Manage and view all plots owned by this farmer</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Plot
              </Button>
            </div>

            {farmerPlots.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No plots registered</h3>
                    <p className="text-gray-600 mb-4">
                      This farmer has not registered any plots yet.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Plot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {farmerPlots.map((plot, index) => (
                  <Card key={plot.id}>
                    <Collapsible>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
                              <div className="text-left">
                                <CardTitle className="text-base">Plot {index + 1}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {plot.crop} • {plot.areaHa} hectares • {plot.province}, {plot.district}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Location</label>
                              <p className="font-medium">{plot.province}</p>
                              <p className="text-sm text-muted-foreground">{plot.district}, {plot.commune}</p>
                              <p className="text-sm text-muted-foreground">{plot.village}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Crop Type</label>
                              <p className="font-medium">{plot.crop}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Area</label>
                              <p className="font-medium">{plot.areaHa} hectares</p>
                            </div>
                            {plot.locationLat && plot.locationLong && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">GPS Coordinates</label>
                                <p className="font-medium text-xs">{plot.locationLat}, {plot.locationLong}</p>
                              </div>
                            )}
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Created</label>
                              <p className="font-medium">{format(plot.createdAt, "MMM dd, yyyy")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm" className="text-red-600">Delete</Button>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Policy History Tab */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Policy History</CardTitle>
                <p className="text-muted-foreground">Insurance product assignments and policy status</p>
              </CardHeader>
              <CardContent>
                {farmer.assignedProduct ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{farmer.assignedProduct}</h4>
                        <p className="text-sm text-muted-foreground">
                          Assigned on {format(farmer.enrolmentDate, "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No insurance products assigned to this farmer yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <p className="text-muted-foreground">KYC documents and enrollment forms</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Document management will be implemented in Phase 2.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
