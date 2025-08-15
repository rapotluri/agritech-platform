import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { Product } from "./types";

interface ProductDetailsStepProps {
  product: Product;
  setProduct: (product: Product) => void;
  provinceKeys: string[];
  districtOptions: string[];
  communeOptions: string[];
  handleProvinceChange: (province: string) => void;
  handleDistrictChange: (district: string) => void;
  canProceedToStep2: () => boolean;
  onNext: () => void;
}

export default function ProductDetailsStep({
  product,
  setProduct,
  provinceKeys,
  districtOptions,
  communeOptions,
  handleProvinceChange,
  handleDistrictChange,
  canProceedToStep2,
  onNext,
}: ProductDetailsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Create New Product
        </CardTitle>
        <CardDescription>Define the high-level details for your weather insurance product</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              placeholder="e.g., July Rice Crop – Kampong Speu"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province *</Label>
            <Select value={product.province} onValueChange={handleProvinceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinceKeys.map((prov) => (
                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="district">District *</Label>
            <Select value={product.district} onValueChange={handleDistrictChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districtOptions.map((district) => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="commune">Commune/Location *</Label>
            <Select value={product.commune} onValueChange={(value) => setProduct({ ...product, commune: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select commune" />
              </SelectTrigger>
              <SelectContent>
                {communeOptions.map((commune) => (
                  <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cropDuration">Total Crop Duration</Label>
            <Input
              id="cropDuration"
              placeholder="e.g., 120 days"
              value={product.cropDuration}
              onChange={(e) => setProduct({ ...product, cropDuration: e.target.value })}
            />
            <p className="text-xs text-gray-500">Optional - for reference only</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="sumInsured">Total Sum Insured (USD) *</Label>
            <Input
              id="sumInsured"
              type="number"
              placeholder="250"
              value={product.sumInsured}
              onChange={(e) => setProduct({ ...product, sumInsured: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="premiumCap">Total Premium Cap (USD) *</Label>
            <Input
              id="premiumCap"
              type="number"
              placeholder="10"
              value={product.premiumCap}
              onChange={(e) => setProduct({ ...product, premiumCap: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            placeholder="Optional notes for internal use..."
            value={product.notes}
            onChange={(e) => setProduct({ ...product, notes: e.target.value })}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex justify-end">
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={onNext}
            disabled={!canProceedToStep2()}
          >
            Next: Add Coverage Periods
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
