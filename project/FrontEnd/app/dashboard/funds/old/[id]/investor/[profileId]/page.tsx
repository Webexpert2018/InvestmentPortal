'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Mail, ShieldAlert, Award, FileText, BadgeCheck, DollarSign, PieChart, Activity, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function OldFundInvestorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [investorData, setInvestorData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.profileId) {
      fetchInvestorDetails();
    }
  }, [params.profileId]);

  const fetchInvestorDetails = async () => {
    setIsLoading(true);
    try {
      const profileId = parseInt(params.profileId as string, 10);
      if (isNaN(profileId)) {
        throw new Error('Invalid parameters');
      }
      const [data, docs] = await Promise.all([
        apiClient.getOldInvestorAllFunds(profileId),
        apiClient.getOldInvestorDocuments(params.profileId as string).catch(() => [])
      ]);
      setInvestorData(data);
      setDocuments(docs || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch investor investment details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'IN';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!investorData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <button 
            onClick={() => router.push(`/dashboard/funds/old/${params.id}`)} 
            className="mb-4 flex items-center gap-2 text-gray-600 font-semibold"
          >
            <ChevronLeft className="h-5 w-5" /> Back to Fund Details
          </button>
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-sm">
            <p className="text-gray-500 font-medium">Investor details not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 bg-[#F9FAFB] min-h-screen">
        {/* Header navigation */}
        <div className="mb-8">
          <div className="mb-4">
            <button
              onClick={() => router.push(`/dashboard/funds/old/${params.id}`)}
              className="p-1.5 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 group flex items-center gap-1.5 w-fit"
              title="Back to Fund Details"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm font-semibold text-[#1F3B6E] pr-2">
                Back to Fund Details
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight truncate font-goudy">
                {investorData.fullName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Legacy Investor Profile &bull; ID: {investorData.profileId}
              </p>
            </div>
          </div>
        </div>

        {/* Investor Summary Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex-shrink-0 flex items-center justify-center text-white font-bold text-3xl shadow-md">
            {getInitials(investorData.fullName)}
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              
              {/* Profile Details */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Investor Details</span>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">{investorData.fullName}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{investorData.email}</span>
                </div>
              </div>

              {/* Total Investments Count */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Investments</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{investorData.totalInvestmentsCount}</span>
                </div>
                <p className="text-sm text-gray-500">Historical count of legacy transactions</p>
              </div>

              {/* Aggregated Total Capital */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Investment</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{investorData.totalInvestment}</span>
                </div>
                <p className="text-sm text-gray-500">Aggregated historical total across all funds</p>
              </div>

              {/* Total Distributed Amount */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Distributed</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#2BB673]">{investorData.totalDistributedAmount}</span>
                </div>
                <p className="text-sm text-gray-500">Total historical return of capital</p>
              </div>

              {/* Aggregated Shares */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Shares Held</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{investorData.totalShares}</span>
                </div>
                <p className="text-sm text-gray-500">Aggregated historical shares across all funds</p>
              </div>

            </div>
          </div>
        </div>

        {/* Investments list Table */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-50 pb-3 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 font-goudy">
              Investments across All Funds
            </h3>
            <span className="inline-flex items-center justify-center bg-blue-50 text-[#1F3B6E] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
              {investorData.investments ? investorData.investments.length : 0} Record(s)
            </span>
          </div>

          {investorData.investments && investorData.investments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">No.</th>
                    <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica pl-3">Fund</th>
                    <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica pl-3">Investor Name</th>
                    <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Investment Amount</th>
                    <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Shares</th>
                    <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Ownership</th>
                    <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Placed On</th>
                    <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Received On</th>
                    <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {investorData.investments.map((inv: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 text-sm font-medium text-gray-400 text-left">
                        #{idx + 1}
                      </td>
                      <td className="py-4 text-left text-sm font-semibold text-[#1F3B6E] pl-3">
                        {inv.projectName}
                      </td>
                      <td className="py-4 text-left text-sm font-medium text-gray-600 pl-3">
                        {inv.investorName || 'N/A'}
                      </td>
                      <td className="py-4 text-right text-sm font-bold text-gray-900">
                        {inv.amount}
                      </td>
                      <td className="py-4 text-right text-sm font-medium text-gray-700">
                        {inv.shares || '0.00'}
                      </td>
                      <td className="py-4 text-right text-sm font-medium text-gray-500">
                        {inv.ownership ? inv.ownership : '0.00%'}
                      </td>
                      <td className="py-4 text-center text-sm text-gray-600">
                        {formatDate(inv.placedOn)}
                      </td>
                      <td className="py-4 text-center text-sm text-gray-600">
                        {formatDate(inv.receivedOn)}
                      </td>
                      <td className="py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 font-medium">No investments found for this investor.</p>
            </div>
          )}
        </div>

        {/* Legacy Documents Section */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 mt-8">
          <div className="border-b border-gray-50 pb-3 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 font-goudy">
              Legacy Investor Documents
            </h3>
            <span className="inline-flex items-center justify-center bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {documents.length} Document(s)
            </span>
          </div>

          {documents && documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">No.</th>
                    <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">Document Name</th>
                    <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">Type</th>
                    <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Tax Year</th>
                    <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Uploaded Date</th>
                    <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map((doc: any, idx: number) => (
                    <tr key={doc.id || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 text-sm font-medium text-gray-400 text-left">
                        #{idx + 1}
                      </td>
                      <td className="py-4 text-left text-sm font-semibold text-[#1F3B6E] pl-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="truncate max-w-xs">{doc.file_name}</span>
                      </td>
                      <td className="py-4 text-left text-sm font-medium text-gray-600 pl-3">
                        {doc.document_type || 'Tax Document'}
                      </td>
                      <td className="py-4 text-center text-sm font-medium text-gray-700">
                        {doc.tax_year || 'N/A'}
                      </td>
                      <td className="py-4 text-center text-sm text-gray-600">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                              window.open(`${apiClient.getApiUrl()}/documents/old-investor/file/${doc.id}/view${tokenParam}`, '_blank');
                            }}
                            className="p-2 text-gray-600 hover:text-[#1F3B6E] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" /> View
                          </button>
                          <button
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                              window.open(`${apiClient.getApiUrl()}/documents/old-investor/file/${doc.id}/download${tokenParam}`, '_blank');
                            }}
                            className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                            title="Download Document"
                          >
                            <Download className="h-4 w-4" /> Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 font-medium">No legacy documents uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
