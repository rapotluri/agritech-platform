"use client"

import { useState } from "react";
import ProductForm from "./ProductForm";
import { PremiumResults } from "./PremiumResults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PremiumResponse } from "@/types/premium";

export default function ProductCreation() {
  const [premiumResponse, setPremiumResponse] = useState<PremiumResponse | null>(null);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm setPremiumResponse={setPremiumResponse} />
        </CardContent>
      </Card>

      {/* Results Card */}
      <div className="sticky top-6">
        {premiumResponse ? (
          <Card>
            <CardHeader>
              <CardTitle>Premium Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <PremiumResults data={premiumResponse} />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Premium Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                Fill out the form and calculate premium to see results
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
