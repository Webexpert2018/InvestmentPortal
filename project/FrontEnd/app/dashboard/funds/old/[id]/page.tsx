'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Briefcase, DollarSign, Users, Calendar, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function OldFundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [fund, setFund] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOldFundDetails();
    }
  }, [params.id]);

  const fetchOldFundDetails = async () => {
    setIsLoading(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      if (isNaN(fundId)) {
        throw new Error('Invalid fund ID');
      }
      const data = await apiClient.getOldFundById(fundId);
      setFund(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch old fund details');
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
    if (!name) return 'OF';
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

  if (!fund) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <button 
            onClick={() => router.push('/dashboard/funds')} 
            className="mb-4 flex items-center gap-2 text-gray-600 font-semibold"
          >
            <ChevronLeft className="h-5 w-5" /> Back to Funds
          </button>
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-sm">
            <p className="text-gray-500 font-medium">Old platform fund not found</p>
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
              onClick={() => router.push('/dashboard/funds')}
              className="p-1.5 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 group flex items-center gap-1.5 w-fit"
              title="Back to Funds"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm font-semibold text-[#1F3B6E] pr-2">
                Back to Funds
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight truncate font-goudy">
                {fund.projectName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Old Platform Fund &bull; Historical Record</p>
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Main Section (Col span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview / Banner Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4B5563] to-[#9CA3AF] flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {getInitials(fund.projectName)}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                    {fund.status}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-600">
                    {fund.projectType}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 leading-snug font-goudy">
                  {fund.projectName}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This fund represents a legacy investment structure that has been fully closed. Historical performance, capital call contributions, and distributions remain archived for tracking, compliance, and auditing purposes.
                </p>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 font-goudy border-b border-gray-50 pb-3">Fund Financial Summary</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Metric 1 */}
                <div className="flex items-start gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="p-2.5 bg-white rounded-xl text-gray-500 shadow-sm">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Total Capital</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{fund.totalCapital}</p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="flex items-start gap-3.5 p-4 bg-[#1F3B6E]/5 rounded-2xl border border-[#1F3B6E]/10">
                  <div className="p-2.5 bg-white rounded-xl text-[#1F3B6E] shadow-sm">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#1F3B6E]/60 font-semibold uppercase tracking-wider">Distributions To Date</p>
                    <p className="text-lg font-bold text-[#1F3B6E] mt-0.5">{fund.distributionsToDate}</p>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="flex items-start gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="p-2.5 bg-white rounded-xl text-gray-500 shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Total Investors</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{fund.totalInvestors}</p>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="flex items-start gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="p-2.5 bg-white rounded-xl text-gray-500 shadow-sm">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Project ID & Type</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      ID: {fund.projectId} &bull; <span className="uppercase text-sm">{fund.projectType}</span>
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Sidebar Section */}
          <div className="space-y-6">
            
            {/* Timeline Info Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 font-goudy border-b border-gray-50 pb-3">Lifecycle Timeline</h3>
              
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase">Closing Date</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDate(fund.closingDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase">Exit Date</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {fund.exitDate ? formatDate(fund.exitDate) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                  <ShieldCheck className="h-5 w-5 text-[#059669] mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase">Status Verification</p>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium leading-relaxed">
                      All accounts associated with this fund have been finalized, audited, and closed. No further distributions or capital calls will be initiated.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Status Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-[#1F3B6E]" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Database Status</h4>
              </div>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                This old fund is marked as <strong className="text-[#1F3B6E]">{fund.published === 'TRUE' ? 'Published' : 'Unpublished'}</strong> in the database system for administrative tracking, but is restricted from active subscription operations.
              </p>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
