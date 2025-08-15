"use client"

import React from "react"
import { useParams } from "next/navigation"
import { useProduct } from "@/lib/hooks"
import { ProductHeader } from "./ProductHeader"
import { ProductOverview } from "./ProductOverview"
import { TriggerConfiguration } from "./TriggerConfiguration"
import { EnrollmentManager } from "./EnrollmentManager"
import { ProductAnalytics } from "./ProductAnalytics"
import { ConfigurationHistory } from "./ConfigurationHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function ProductDetail() {
  const params = useParams()
  const productId = params.id as string

  const { 
    data: product, 
    isLoading, 
    error 
  } = useProduct(productId)

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load product. Please try again or contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Product Header */}
      <ProductHeader product={product} />

      {/* Product Details Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trigger-config">Trigger Configuration</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="history">Configuration History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProductOverview product={product} />
        </TabsContent>

        <TabsContent value="trigger-config" className="mt-6">
          <TriggerConfiguration product={product} />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <EnrollmentManager product={product} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ProductAnalytics product={product} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ConfigurationHistory product={product} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
