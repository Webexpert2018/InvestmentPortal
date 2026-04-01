'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function DocuSignCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams?.get('code');
    
    if (!code) {
      setStatus('error');
      setError('No authorization code found in the URL. Please try again.');
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await apiClient.getDocuSignToken(code);
        
        if (response.accessToken && response.accountId) {
          localStorage.setItem('ds_access_token', response.accessToken);
          localStorage.setItem('ds_account_id', response.accountId);
          localStorage.setItem('ds_user_name', response.userName || '');
          
          setStatus('success');
          
          // Redirect back to invest page after a short delay
          setTimeout(() => {
            router.push('/dashboard/invest');
          }, 2000);
        } else {
          throw new Error('Invalid token response from server');
        }
      } catch (err: any) {
        console.error('DocuSign callback error:', err);
        setStatus('error');
        // If the backend sent a detailed error (from our BadRequestException)
        const detailedError = err.message;
        const subError = err.error || '';
        const details = err.details ? JSON.stringify(err.details) : '';
        
        setError(`${detailedError}${subError ? ` (${subError})` : ''} ${details ? `- ${details}` : ''}`);
      }
    };

    exchangeToken();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-helvetica">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#FBCB4B]" />
            <h1 className="text-xl font-bold text-[#1F1F1F]">Connecting to DocuSign</h1>
            <p className="text-sm text-gray-500">Please wait while we finalize your authorization...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="text-xl font-bold text-[#1F1F1F]">Connected Successfully!</h1>
            <p className="text-sm text-gray-500">Redirecting you back to the Investment Portal...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="text-xl font-bold text-[#1F1F1F]">Authorization Failed</h1>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/dashboard/invest')}
              className="mt-6 rounded-full bg-[#FBCB4B] px-8 py-2.5 text-sm font-bold text-[#1F1F1F] hover:bg-[#F9B800] transition-all"
            >
              Back to Invest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
