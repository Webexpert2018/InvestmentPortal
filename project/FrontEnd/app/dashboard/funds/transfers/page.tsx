'use client';

import { useState, useEffect, Suspense } from 'react';
import { Plus, ArrowRightLeft, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';

function FundTransfersContent() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleSigningCompletion = async () => {
      const success = searchParams?.get('success');
      const error = searchParams?.get('error');

      if (success === 'true') {
        router.replace('/dashboard/funds/transfers');
        toast.success('Transfer document signed successfully!', { id: 'signing_complete' });
      } else if (error) {
        router.replace('/dashboard/funds/transfers');
        toast.error('Error processing signed document', { id: 'signing_complete' });
      }
      
      fetchTransfers();
    };

    handleSigningCompletion();
  }, [searchParams, router]);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getFundTransfers();
      setTransfers(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch fund transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-[#059669] bg-[#ECFDF5]';
      case 'PENDING_SIGNATURE':
        return 'text-[#D97706] bg-[#FEF3C7]';
      case 'FAILED':
        return 'text-[#DC2626] bg-[#FEF2F2]';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-1 font-goudy tracking-tight">Fund Transfers</h1>
            <p className="text-gray-500 font-medium">Manage and track person-to-person and fund-to-fund transfers.</p>
          </div>
          <Link href="/dashboard/funds/transfers/new">
            <Button className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-7 py-3 rounded-full font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              New Transfer
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F8FAFC] border-b border-gray-100 text-[#64748B] font-semibold">
                <tr>
                  <th className="px-6 py-4">Transfer Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">From</th>
                  <th className="px-6 py-4">To</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Units</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Loading transfers...
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                          <ArrowRightLeft className="w-6 h-6 text-gray-400" />
                        </div>
                        <p>No transfers found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {transfer.transfer_type === 'PERSON_TO_PERSON' ? 'Person to Person' : 'Fund to Fund'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{transfer.from_investor_name}</span>
                          <span className="text-xs text-gray-500">{transfer.from_fund_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{transfer.to_investor_name || transfer.from_investor_name}</span>
                          <span className="text-xs text-gray-500">{transfer.to_fund_name || transfer.from_fund_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        ${parseFloat(transfer.investment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {parseFloat(transfer.units).toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(transfer.status)}`}>
                          {transfer.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {transfer.status === 'COMPLETED' && transfer.document_url ? (
                          <a
                            href={`http://localhost:3001/api/fund-transfers/${transfer.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-[#2A6CB5] hover:bg-[#EFF6FF] transition-colors"
                            title="View Document"
                          >
                            <FileText className="w-5 h-5" />
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function FundTransfersPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-8 text-center text-gray-500">Loading...</div></DashboardLayout>}>
      <FundTransfersContent />
    </Suspense>
  );
}
