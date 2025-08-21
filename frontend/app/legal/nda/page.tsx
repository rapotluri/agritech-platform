'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { acceptNDAAction } from '@/app/actions';
import { useNDAStatus } from '@/lib/hooks/useNDAStatus';
import { AlertTriangle, FileText, CheckCircle, XCircle, Download } from 'lucide-react';

export default function NDAPage() {
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const router = useRouter();
  const { ndaStatus, loading: statusLoading } = useNDAStatus();

  const NDA_PDF_URL = 'https://igtmbvmsaolqauwnmepk.supabase.co/storage/v1/object/public/nda-documents/NDA_Accurate_v1.pdf';
  const NDA_TITLE = 'NON-DISCLOSURE AND USE LIMITATION AGREEMENT – "ACCURATE"';
  const NDA_VERSION = 'v1.0';

  // Redirect if already accepted - but only if we're CERTAIN
  useEffect(() => {
    if (ndaStatus.hasAccepted && !statusLoading && ndaStatus.acceptedAt) {
      // Only redirect if we have clear evidence of acceptance
      router.push('/protected/operations-dashboard/');
    }
  }, [ndaStatus, statusLoading, router]);



  const handleAccept = async () => {
    if (!isAgreed) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await acceptNDAAction({
        nda_title: NDA_TITLE,
        nda_pdf_url: NDA_PDF_URL,
        nda_sha256: 'nda-accurate-v1-hash' // Placeholder hash
      });
      
      if (result.success) {
        // Redirect to operations dashboard
        router.push('/protected/operations-dashboard/');
      } else {
        setError(result.error || 'Failed to accept NDA');
      }

    } catch (error) {
      console.error('Failed to accept NDA:', error);
      setError('An unexpected error occurred while accepting the NDA');
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="w-full">
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
                  <div className="w-full h-96">
                    <iframe
                      src={`${NDA_PDF_URL}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0"
                      title="NDA Document"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Agreement Section */}
            <div className="p-6">
              {/* Error Display */}
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

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
                  onCheckedChange={(checked) => setIsAgreed(!!checked)}
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
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t bg-white">
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
    </div>
  );
}
