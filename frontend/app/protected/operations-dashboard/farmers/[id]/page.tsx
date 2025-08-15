"use client"

import React from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Download, Phone, MapPin, Calendar, User, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
// Future components for farmer details expansion
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// import { ChevronRight, Plus } from "lucide-react"
import { useFarmer, useDeleteFarmer } from "@/lib/hooks"
import { PlotManager } from "@/components/farmers/PlotManager"
import { FarmerDialog } from "@/components/farmers/FarmerDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format, formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const { 
    data: farmer, 
    isLoading: isFarmerLoading, 
    error: farmerError 
  } = useFarmer(params.id)
  
  const deleteFarmerMutation = useDeleteFarmer()
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleDeleteFarmer = async () => {
    if (!farmer) return
    
    try {
      await deleteFarmerMutation.mutateAsync(farmer.id)
      // Navigate back to farmers list after successful deletion
      router.push('/protected/operations-dashboard/farmers')
    } catch (error) {
      console.error('Error deleting farmer:', error)
    }
  }

  // Show loading state
  if (isFarmerLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading farmer profile...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (farmerError || !farmer) {
    notFound()
  }

  const farmerPlots = farmer.plots || []

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
              <h1 className="text-3xl font-bold text-gray-900">{farmer.english_name}</h1>
              <p className="text-gray-600 mt-1">
                Farmer ID: {farmer.id} • Enrolled {formatDistanceToNow(new Date(farmer.enrolment_date), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  disabled={deleteFarmerMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteFarmerMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete farmer{" "}
                    <span className="font-semibold">{farmer?.english_name}</span>{" "}
                    and remove all their data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteFarmer}
                    disabled={deleteFarmerMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteFarmerMutation.isPending ? "Deleting..." : "Delete Farmer"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {farmer.english_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              {/* Basic Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold">{farmer.english_name}</h2>
                  <p className="text-muted-foreground">National ID: {farmer.national_id}</p>
                </div>
                
                {/* Status Badges */}
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="secondary" 
                    className={`border ${getKYCStatusColor(farmer.kyc_status)}`}
                  >
                    KYC: {getKYCStatusLabel(farmer.kyc_status)}
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
                  {farmer.dob && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Born {format(new Date(farmer.dob), "MMM dd, yyyy")}</span>
                    </div>
                  )}
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
                      <p className="font-medium">{farmer.english_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sex</label>
                      <p className="font-medium capitalize">{farmer.sex}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">National ID</label>
                      <p className="font-medium">{farmer.national_id}</p>
                    </div>
                    {farmer.dob && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                        <p className="font-medium">{format(new Date(farmer.dob), "MMM dd, yyyy")}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Enrollment Date</label>
                      <p className="font-medium">{format(new Date(farmer.enrolment_date), "MMMM dd, yyyy")}</p>
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
                        className={`border ${getKYCStatusColor(farmer.kyc_status)}`}
                      >
                        {getKYCStatusLabel(farmer.kyc_status)}
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
                      <p className="font-medium">{farmer.village || "Not specified"}</p>
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
                    <p className="font-medium">{farmer.bank_account_usd || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">KHR Account</label>
                    <p className="font-medium">{farmer.bank_account_khr || "Not provided"}</p>
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
            </div>

            <PlotManager 
              plots={farmerPlots}
              onPlotsChange={() => {
                // This won't be used since we have farmerId - plots will be added directly to database
                console.log('Plot changes handled by database mutations')
              }}
              farmerId={farmer.id}
            />
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
                          Assigned on {format(new Date(farmer.enrolment_date), "MMM dd, yyyy")}
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

      {/* Edit Farmer Dialog */}
      <FarmerDialog
        farmer={farmer}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </TooltipProvider>
  )
}
