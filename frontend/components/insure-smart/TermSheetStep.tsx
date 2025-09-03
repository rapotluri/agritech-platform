import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingDown, TrendingUp, Save, Loader2 } from "lucide-react";
import { Product, CoveragePeriod, OptimizationResult } from "./types";
import { useCreateProduct } from "@/lib/hooks";
import { mapInsureSmartToProduct, validateProductData } from "@/lib/productMappers";

interface TermSheetStepProps {
  product: Product;
  coveragePeriods: CoveragePeriod[];
  selectedResult: string | null;
  optimizationResults: OptimizationResult[];
  onBack: () => void;
  getPerilIcon: (peril: string) => React.ReactNode;
  getPerilLabel: (peril: string, dataType?: string) => string;
}

export default function TermSheetStep({
  product,
  coveragePeriods,
  selectedResult,
  optimizationResults,
  onBack,
  getPerilIcon,
  getPerilLabel,
}: TermSheetStepProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const createProductMutation = useCreateProduct();
  const selected = optimizationResults.find((r) => r.id === selectedResult);

  const handleSaveProduct = async (status: 'draft' | 'live') => {
    if (!selected) {
      console.error('No optimization result selected');
      return;
    }

    setIsSaving(true);
    try {
      // Transform the data to match the product schema
      const productData = mapInsureSmartToProduct(
        product,
        coveragePeriods,
        selectedResult,
        optimizationResults,
        status
      );
      
      // Validate the product data
      const validationErrors = validateProductData(productData);
      if (validationErrors.length > 0) {
        console.error('Product validation failed:', validationErrors);
        setIsSaving(false);
        return;
      }

      // Create the product
      await createProductMutation.mutateAsync(productData);
      
      // Navigate back to Product Library
      router.push('/protected/operations-dashboard/products');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No configuration selected for term sheet generation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Insurance Product Term Sheet
          </CardTitle>
          <CardDescription>
            Professional term sheet for your selected configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Term Sheet Preview */}
            <div id="term-sheet-content" className="bg-white border border-gray-200 rounded-lg p-8 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INSURANCE PRODUCT</h1>
                <h2 className="text-2xl font-semibold text-gray-700">TERM SHEET</h2>
              </div>
              
              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">PRODUCT DETAILS</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product Name:</span>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{product.commune}, {product.district}, {product.province}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coverage Periods:</span>
                        <span className="font-medium">{coveragePeriods.length} period(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Crop Duration:</span>
                        <span className="font-medium">{product.cropDuration || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">FINANCIAL TERMS</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sum Insured:</span>
                        <span className="font-medium">${Number(product.sumInsured).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Premium Rate:</span>
                        <span className="font-medium">{(selected.premiumRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Premium Cost:</span>
                        <span className="font-medium">
                          ${selected.premiumCost !== undefined ? Number(selected.premiumCost).toFixed(2) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trigger Configuration */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">TRIGGER CONFIGURATION</h3>
                <div className="space-y-3">
                  {selected.periods && selected.periods.map((period: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {getPerilIcon(period.perils.length === 2 ? 'BOTH' : period.perils[0]?.peril_type)}
                        <span className="font-medium">Period {idx + 1}</span>
                        <Badge variant="outline">
                          {period.perils.length === 2 ? (product.dataType === "temperature" ? 'Both (LTI + HTI)' : 'Both (LRI + ERI)') : getPerilLabel(period.perils[0]?.peril_type, product.dataType)}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {coveragePeriods[idx]?.startDate && coveragePeriods[idx]?.endDate 
                            ? `${coveragePeriods[idx].startDate} to ${coveragePeriods[idx].endDate}`
                            : `Day ${period.start_day + 1} to ${period.end_day + 1}`
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {period.perils.map((peril: any, perilIdx: number) => (
                          <div key={perilIdx} className="bg-gray-50 p-3 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              {peril.peril_type === 'LRI' || peril.peril_type === 'LTI' ? (
                                <TrendingDown className="h-4 w-4 text-gray-600" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="font-medium">
                                {peril.peril_type === 'LRI' ? 'Low Rainfall Trigger' : 
                                 peril.peril_type === 'ERI' ? 'High Rainfall Trigger' :
                                 peril.peril_type === 'LTI' ? 'Low Temperature Trigger' : 
                                 'High Temperature Trigger'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Trigger:</span>
                                <span className="font-medium">
                                  {peril.peril_type === 'LRI' || peril.peril_type === 'LTI' ? '≤' : '≥'} 
                                  {Number(peril.trigger).toFixed(0)}
                                  {peril.peril_type === 'LRI' || peril.peril_type === 'ERI' ? 'mm' : '°C'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{peril.duration} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Unit Payout:</span>
                                <span className="font-medium">
                                  ${peril.unit_payout !== undefined ? Number(peril.unit_payout).toFixed(2) : '-'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Max Payout:</span>
                                <span className="font-medium">
                                  ${peril.max_payout !== undefined ? Number(peril.max_payout).toFixed(0) : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  const element = document.getElementById('term-sheet-content');
                  if (element) {
                    const opt = {
                      margin: 1,
                      filename: `${product.name.replace(/\s+/g, '_')}_term_sheet.pdf`,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                    };
                    // @ts-expect-error - html2pdf.js module import for PDF generation
                    import('html2pdf.js').then(module => {
                      const html2pdf = module.default;
                      html2pdf().set(opt).from(element).save();
                    });
                  }
                }}
              >
                Download PDF
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const element = document.getElementById('term-sheet-content');
                  if (element) {
                    window.print();
                  }
                }}
              >
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back: Product Design
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSaveProduct('draft')}
            disabled={isSaving || createProductMutation.isPending}
          >
            {isSaving && createProductMutation.variables?.status === 'draft' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Draft...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </>
            )}
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleSaveProduct('live')}
            disabled={isSaving || createProductMutation.isPending}
          >
            {isSaving && createProductMutation.variables?.status === 'live' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Finalize Product
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
