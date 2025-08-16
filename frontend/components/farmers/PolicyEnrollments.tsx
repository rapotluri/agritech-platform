"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Shield
} from "lucide-react"
import { FarmerEnrollment } from "@/lib/database.types"
import { useFarmerEnrollments } from "@/lib/hooks"

interface PolicyEnrollmentsProps {
  farmerId: string
}

export function PolicyEnrollments({ farmerId }: PolicyEnrollmentsProps) {
  const { data: enrollments, isLoading, error } = useFarmerEnrollments(farmerId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p className="text-lg font-medium">Error loading enrollments</p>
            <p className="text-sm">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalEnrollments = enrollments?.length || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLocation = (enrollment: FarmerEnrollment) => {
    if (enrollment.plot) {
      const { province, district, commune } = enrollment.plot
      return `${province}, ${district}, ${commune}`
    }
    return 'Farmer-level coverage'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Policy Enrollments ({totalEnrollments})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalEnrollments === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No policy enrollments yet</p>
                          <p className="text-sm">This farmer hasn&apos;t been enrolled in any insurance products</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Plot Details</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Sum Insured</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments?.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {enrollment.product?.name || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.product?.crop || 'Unknown Crop'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatLocation(enrollment)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {enrollment.plot ? (
                        <div>
                          <div className="font-medium">{enrollment.plot.crop}</div>
                          <div className="text-sm text-gray-500">
                            {enrollment.plot.area_ha} ha
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Farmer-level coverage</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {enrollment.season}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {enrollment.premium?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {enrollment.sum_insured?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(enrollment.status)}>
                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
