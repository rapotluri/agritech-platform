"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Copy, 
  Archive, 
  Users, 
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ProductWithDetailedEnrollments } from "@/lib/database.types"

interface ProductHeaderProps {
  product: ProductWithDetailedEnrollments
}

export function ProductHeader({ product }: ProductHeaderProps) {
  const router = useRouter()

  // Calculate metrics
  const totalEnrollments = product.enrollments?.length || 0
  const activeEnrollments = product.enrollments?.filter((e: any) => e.status === 'active').length || 0
  const totalSumInsured = product.enrollments?.reduce((sum: number, e: any) => sum + (e.sum_insured || 0), 0) || 0
  const totalPremium = product.enrollments?.reduce((sum: number, e: any) => sum + (e.premium || 0), 0) || 0

  const handleCopyId = () => {
    navigator.clipboard.writeText(product.id)
    toast.success("Product ID copied to clipboard")
  }

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    toast.info("Duplicate functionality coming soon")
  }

  const handleArchive = () => {
    // TODO: Implement archive functionality
    toast.info("Archive functionality coming soon")
  }

  const handleAssign = () => {
    router.push(`/protected/operations-dashboard/products/${product.id}/assign`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/protected/operations-dashboard">Operations Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/protected/operations-dashboard/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product Title and Status */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <Badge className={getStatusColor(product.status)}>
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>ID: {product.id.slice(0, 8)}...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyId}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <span>•</span>
            <span>Last modified: {new Date(product.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button onClick={handleAssign} className="bg-green-600 hover:bg-green-700">
            <Users className="h-4 w-4 mr-2" />
            Assign to Farmers
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                {product.status === 'archived' ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{activeEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sum Insured</p>
                <p className="text-2xl font-bold text-gray-900">${totalSumInsured.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Premium</p>
                <p className="text-2xl font-bold text-gray-900">${totalPremium.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
