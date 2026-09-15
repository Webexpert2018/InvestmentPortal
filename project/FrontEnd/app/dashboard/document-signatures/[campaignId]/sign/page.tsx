'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SignDocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const campaignId = params.campaignId as string;
  const investorId = searchParams.get('investorId');

  useEffect(() => {
    if (!campaignId || !investorId) {
      setError('Invalid link. Missing parameters.');
      return;
    }

    const fetchSigningUrl = async () => {
      try {
        const { data } = await apiClient.get<{ signingUrl: string }>(
          `/document-signatures/${campaignId}/sign-url/${investorId}`
        );
        
        if (data && data.signingUrl) {
          // Redirect to DocuSign
          window.location.href = data.signingUrl;
        } else {
          setError('Could not generate signing URL.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize signing session.');
      }
    };

    fetchSigningUrl();
  }, [campaignId, investorId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Signing Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-[#1F3B6E] text-white px-6 py-2 rounded-lg font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#1F3B6E] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Preparing your document...</h2>
        <p className="text-gray-500">You will be redirected to DocuSign shortly.</p>
      </div>
    </div>
  );
}
