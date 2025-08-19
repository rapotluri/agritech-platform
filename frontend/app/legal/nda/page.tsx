'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { acceptNDA } from '@/lib/nda';
import { useNDAStatus } from '@/lib/hooks/useNDAStatus';
import { AlertTriangle, FileText, CheckCircle, XCircle, Download } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function NDAPage() {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<boolean>(false);
  const [useIframe, setUseIframe] = useState<boolean>(true);
  
  const router = useRouter();
  const { ndaStatus, loading: statusLoading } = useNDAStatus();

  const NDA_PDF_URL = 'https://igtmbvmsaolqauwnmepk.supabase.co/storage/v1/object/public/nda-documents/NDA_Accurate_v1.pdf';
  const NDA_TITLE = 'NON-DISCLOSURE AND USE LIMITATION AGREEMENT – "ACCURATE"';
  const NDA_VERSION = 'v1.0';

  // Redirect if already accepted
  useEffect(() => {
    if (ndaStatus.hasAccepted && !statusLoading) {
      router.push('/protected/operations-dashboard/');
    }
  }, [ndaStatus, statusLoading, router]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF Load Error:', error);
    setPdfError(true);
    setUseIframe(true); // Fallback to iframe
  };

  const handleAccept = async () => {
    if (!isAgreed) return;
    
    setIsLoading(true);
    try {
      await acceptNDA({
        nda_title: NDA_TITLE,
        nda_pdf_url: NDA_PDF_URL,
        nda_sha256: '', // Not required as per user
        ip: '', // Will be captured by backend
        user_agent: navigator.userAgent,
        locale: navigator.language || 'en-US'
      });
      
      // Redirect to operations dashboard
      router.push('/protected/operations-dashboard/');
    } catch (error) {
      console.error('Failed to accept NDA:', error);
      // Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    setShowConfirmDialog(true);
  };

  const confirmDecline = () => {
    // Sign out and redirect to sign-in
    // This would typically involve calling your auth service
    router.push('/sign-in');
  };

  const switchToReactPDF = () => {
    setUseIframe(false);
    setPdfError(false);
  };

  const switchToIframe = () => {
    setUseIframe(true);
    setPdfError(false);
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NDA status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center space-x-3">
                         <FileText className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {NDA_TITLE}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Version {NDA_VERSION} • Effective Upon Access and Use of the Platform
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* PDF Viewer Section */}
          <div className="bg-gray-100 p-4">
            <div className="bg-white rounded-lg border overflow-hidden">
                             {/* PDF Viewer Controls */}
               <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                 <span className="text-sm font-medium text-gray-700">Document Viewer</span>
                 <div className="flex space-x-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => window.open(NDA_PDF_URL, '_blank')}
                   >
                     <Download className="h-4 w-4 mr-1" />
                     Download
                   </Button>
                 </div>
               </div>

              {/* PDF Content */}
              <div className="min-h-96">
                {useIframe ? (
                  // Iframe PDF Viewer (Primary)
                  <div className="w-full h-96">
                    <iframe
                      src={`${NDA_PDF_URL}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0"
                      title="NDA Document"
                      onError={() => setPdfError(true)}
                    />
                  </div>
                ) : (
                  // React PDF Viewer (Fallback)
                  <div className="max-h-96 overflow-y-auto p-4">
                    {pdfError ? (
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">PDF viewer failed to load</p>
                        <Button onClick={switchToIframe} variant="outline">
                          Switch to Browser View
                        </Button>
                      </div>
                    ) : (
                      <Document
                        file={NDA_PDF_URL}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                          <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading PDF document...</p>
                          </div>
                        }
                      >
                        <Page 
                          pageNumber={pageNumber} 
                          width={Math.min(window.innerWidth - 200, 700)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    )}
                    
                    {/* PDF Navigation for React PDF */}
                    {!pdfError && numPages > 1 && (
                      <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                          disabled={pageNumber <= 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {pageNumber} of {numPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                          disabled={pageNumber >= numPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Agreement Section */}
          <div className="p-6">
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> By checking the box below, you acknowledge that you have read, 
                understood, and agree to be bound by this Non-Disclosure and Use Limitation Agreement.
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-3 mb-6">
              <Checkbox
                id="nda-agreement"
                checked={isAgreed}
                onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
                className="mt-1"
              />
              <label 
                htmlFor="nda-agreement" 
                className="text-sm leading-relaxed text-gray-700 cursor-pointer"
              >
                I have read, understood, and agree to be bound by this Non-Disclosure and Use Limitation Agreement. 
                I understand that any breach of this Agreement may lead to civil, criminal, or regulatory action.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAccept}
                disabled={!isAgreed || isLoading}
                                 className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Continue
                  </>
                )}
              </Button>

              <Button
                onClick={handleDecline}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                size="lg"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decline Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline NDA Agreement</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline the NDA agreement? This will prevent you from accessing 
              the AccuRate platform and you will be signed out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDecline}>
              Yes, Decline & Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
