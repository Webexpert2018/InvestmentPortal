'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function FundingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('12');
  const [matchedDoc, setMatchedDoc] = useState<any>(null);

  useEffect(() => {
    const fetchInvestmentAndPerformance = async () => {
      try {
        setLoading(true);
        const invData = await apiClient.getInvestmentById(params.id);
        setInvestment(invData);

        if (invData?.user_id) {
          const perfData = await apiClient.getInvestorPerformance(invData.user_id, parseInt(timeRange));
          setPerformanceData(perfData);

          // Dynamically fetch and match document for this investment
          try {
            const token = localStorage.getItem('token');
            if (token) {
              let docs: any[] = [];
              if (user?.role === 'investor') {
                docs = await apiClient.getMyDocuments();
              } else if (user?.role) {
                docs = await apiClient.getInvestorDocuments(invData.user_id);
              } else {
                // Safe fallback: try investor first, then admin/staff endpoint
                try {
                  docs = await apiClient.getMyDocuments();
                } catch {
                  docs = await apiClient.getInvestorDocuments(invData.user_id);
                }
              }

              // Look for a document matching the investment id in name or description
              const match = docs.find((d: any) => 
                d.description?.includes(params.id) || 
                d.file_name?.includes(params.id)
              );
              if (match) {
                setMatchedDoc(match);
              }
            }
          } catch (docError) {
            console.error('Failed to fetch matched document:', docError);
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch details:', error);
        toast.error(error.message || 'Failed to fetch details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInvestmentAndPerformance();
    }
  }, [params.id, timeRange, user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FCD34D]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!investment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-500 font-medium">Investment details not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const costBasisValue = parseFloat(investment.investment_amount || 0);
  const currentValueValue = parseFloat(investment.revised_amount || investment.investment_amount || 0);
  const gainLossValue = currentValueValue - costBasisValue;
  const gainLossPercentVal = costBasisValue > 0 ? (gainLossValue / costBasisValue) * 100 : 0;
  const isGain = gainLossValue >= 0;

  const fundData = {
    fundName: investment.fund_name,
    currentValue: `$${currentValueValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    unitsHeld: parseFloat(investment.estimated_units || 0).toFixed(4),
    currentNav: `$${parseFloat(investment.unit_price || 0).toFixed(2)}`,
    totalGainLoss: `${isGain ? '+' : '-'}$${Math.abs(gainLossValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    gainLossPercent: `${isGain ? '+' : ''}${gainLossPercentVal.toFixed(2)}%`,
    costBasis: `$${costBasisValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    unrealizedGain: `${isGain ? '+' : '-'}$${Math.abs(gainLossValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    percentReturn: `${isGain ? '+' : ''}${gainLossPercentVal.toFixed(2)}%`,
    inceptionDate: new Date(investment.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };

  const transactions = [
    {
      id: investment.id,
      date: new Date(investment.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      type: 'Subscription',
      amount: `$${costBasisValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      units: parseFloat(investment.estimated_units || 0).toFixed(2),
      status: investment.status,
    },
  ];

  const documents = [
    {
      id: 1,
      name: `Subscription Agreement — ${investment.document_signed ? 'Signed' : 'Awaiting Signature'} - ${new Date(investment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    },
  ];

  const getStatusColor = (status: string) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('completed') || s.includes('issued') || s.includes('received')) {
      return 'text-green-600';
    }
    if (s.includes('pending') || s.includes('submitted') || s.includes('awaiting')) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  const tabs = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'documents', label: 'Documents' },
    { id: 'fund-info', label: 'Fund Info' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">{fundData.fundName}</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Current Value</p>
            <p className="text-2xl font-bold text-[#1F1F1F]">{fundData.currentValue}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Units Held</p>
            <p className="text-2xl font-bold text-[#1F1F1F]">{fundData.unitsHeld}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Current NAV</p>
            <p className="text-2xl font-bold text-[#1F1F1F]">{fundData.currentNav}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-2">Total gain/loss</p>
            <p className={`text-2xl font-bold ${isGain ? 'text-green-600' : 'text-red-600'}`}>
              {fundData.totalGainLoss}
            </p>
            <p className={`text-sm ${isGain ? 'text-green-600' : 'text-red-600'} mt-1`}>
              {fundData.gainLossPercent}
            </p>
          </div>
        </div>

        {/* Performance Overview and Your Holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Overview - 2/3 width */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1F1F1F]">Performance Overview</h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FCD34D]"
              >
                <option value="12">Last year</option>
                <option value="6">Last 6 months</option>
                <option value="3">Last 3 months</option>
                <option value="1">Last month</option>
              </select>
            </div>

            {/* Chart */}
            <div className="relative h-64 w-full">
              {performanceData && performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FCD34D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      tickFormatter={(str) => {
                        const date = new Date(str);
                        if (parseInt(timeRange) <= 1) return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
                        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
                      }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                      stroke="#A0A0A0"
                    />
                    <YAxis
                      fontSize={10}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                      axisLine={false}
                      tickLine={false}
                      stroke="#A0A0A0"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-xs text-gray-800">
                              <p className="font-semibold">{new Date(payload[0].payload.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              <p className="text-[#92400E] font-bold mt-1">Current Value: ${parseFloat(payload[0].value as any).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p className="text-gray-400 font-medium">Total Invested: ${parseFloat(payload[0].payload.totalInvested as any).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="currentValue"
                      stroke="#FCD34D"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="totalInvested"
                      stroke="#A0A0A0"
                      fill="none"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400 italic">No performance history data available for this range.</p>
                </div>
              )}
            </div>
          </div>

          {/* Your Holdings - 1/3 width */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#1F1F1F] mb-6">Your Holdings</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Cost basis:</p>
                <p className="text-lg font-semibold text-[#1F1F1F]">{fundData.costBasis}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Unrealized Gain:</p>
                <p className={`text-lg font-semibold ${isGain ? 'text-green-600' : 'text-red-600'}`}>{fundData.unrealizedGain}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">% Return:</p>
                <p className={`text-lg font-semibold ${isGain ? 'text-green-600' : 'text-red-600'}`}>{fundData.percentReturn}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Inception Date:</p>
                <p className="text-lg font-semibold text-[#1F1F1F]">{fundData.inceptionDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-2 px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                      ? 'border-red-500 text-[#1F1F1F]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'transactions' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.date}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.type}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.amount}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.units}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-700 font-medium">{document.name}</td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const token = localStorage.getItem('token');
                                if (investment?.document_signed && matchedDoc) {
                                  const fileUrl = `${apiClient.getApiUrl()}/documents/${matchedDoc.id}/view?token=${encodeURIComponent(token || '')}`;
                                  window.open(fileUrl, '_blank');
                                } else {
                                  // Fallback to blank subscription agreement template if not signed or document vault record not found yet
                                  window.open('/documents/subscription/SA-BWell-Fund.pdf', '_blank');
                                }
                              }}
                              className="px-3 py-1 text-xs font-bold text-[#92400E] bg-[#FEF3C7] hover:bg-[#FDE68A] rounded-full transition-colors"
                            >
                              View Document
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'fund-info' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Fund Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed max-w-3xl whitespace-pre-wrap">
                    {investment.fund_description || "No description provided for this fund."}
                  </p>
                </div>
                {/* {investment.fund_description && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Key Highlights</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-[#1F1F1F] font-semibold">
                      <li>Long-term institutional BTC exposure</li>
                      <li>Optimized for tax-advantaged accounts</li>
                      <li>Low operational friction</li>
                    </ul>
                  </div>
                )} */}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
