"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Users,
  MapPin,
  Calendar,
  FileText,
  Download,
  Plus
} from "lucide-react"
import { ProductWithDetailedEnrollments } from "@/lib/database.types"

interface EnrollmentManagerProps {
  product: ProductWithDetailedEnrollments
}

export function EnrollmentManager({ product }: EnrollmentManagerProps) {
  const router = useRouter()

  const enrollments = product.enrollments || []
  
  // Calculate summary metrics
  const totalEnrollments = enrollments.length

  const handleAssign = () => {
    router.push(`/protected/operations-dashboard/products/${product.id}/assign`)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export enrollments')
  }

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

  const formatLocation = (enrollment: any) => {
    if (enrollment.plot) {
      const { province, district, commune } = enrollment.plot
      return `${province}, ${district}, ${commune}`
    }
    if (enrollment.farmer) {
      const { province, district, commune } = enrollment.farmer
      return `${province}, ${district}, ${commune}`
    }
    return 'Location not specified'
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={handleAssign} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Assign to Farmers
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
        
        {/* selectedEnrollments.length > 0 && (
          <div className="text-sm text-gray-600">
            {selectedEnrollments.length} enrollment(s) selected
          </div>
        ) */}
      </div>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Farmer Enrollments ({totalEnrollments})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No enrollments yet</p>
              <p className="text-sm">Start by assigning this product to farmers</p>
              <Button onClick={handleAssign} className="mt-4 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Assign to Farmers
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Plot Details</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Sum Insured</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {enrollment.farmer?.english_name || 'Unknown Farmer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.farmer?.phone || 'No phone'}
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
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(enrollment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${enrollment.premium?.toLocaleString() || '0'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${enrollment.sum_insured?.toLocaleString() || '0'}</div>
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
    </div>
  )
}
