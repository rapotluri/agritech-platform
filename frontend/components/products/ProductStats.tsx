"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CubeIcon, 
  CheckCircleIcon, 
  DocumentIcon, 
  UsersIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from "@heroicons/react/24/outline"

interface ProductStatsData {
  totalProducts: number
  activeProducts: number
  draftProducts: number
  productsWithEnrollments: number
  trends?: {
    totalProductsTrend?: number
    activeProductsTrend?: number
    draftProductsTrend?: number
    productsWithEnrollmentsTrend?: number
  }
}

interface ProductStatsProps {
  data?: ProductStatsData
  isLoading?: boolean
}

export function ProductStats({ data, isLoading }: ProductStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      title: "Total Products Created",
      value: data?.totalProducts || 0,
      trend: data?.trends?.totalProductsTrend,
      icon: CubeIcon,
      color: "blue",
      description: "All time products"
    },
    {
      title: "Active Products",
      value: data?.activeProducts || 0,
      trend: data?.trends?.activeProductsTrend,
      icon: CheckCircleIcon,
      color: "green",
      description: "Live status products"
    },
    {
      title: "Draft Products",
      value: data?.draftProducts || 0,
      trend: data?.trends?.draftProductsTrend,
      icon: DocumentIcon,
      color: "yellow",
      description: "Pending completion"
    },
    {
      title: "Products with Enrollments",
      value: data?.productsWithEnrollments || 0,
      trend: data?.trends?.productsWithEnrollmentsTrend,
      icon: UsersIcon,
      color: "purple",
      description: "Active assignments"
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          icon: "text-blue-600 bg-blue-100",
          trend: "text-blue-600"
        }
      case "green":
        return {
          icon: "text-green-600 bg-green-100",
          trend: "text-green-600"
        }
      case "yellow":
        return {
          icon: "text-yellow-600 bg-yellow-100",
          trend: "text-yellow-600"
        }
      case "purple":
        return {
          icon: "text-purple-600 bg-purple-100",
          trend: "text-purple-600"
        }
      default:
        return {
          icon: "text-gray-600 bg-gray-100",
          trend: "text-gray-600"
        }
    }
  }

  const TrendIndicator = ({ trend }: { trend?: number }) => {
    if (trend === undefined || trend === 0) return null
    
    const isPositive = trend > 0
    const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon
    
    return (
      <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendIcon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{trend.toFixed(1)}%
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const colorClasses = getColorClasses(stat.color)
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                {stat.trend !== undefined && (
                  <TrendIndicator trend={stat.trend} />
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
