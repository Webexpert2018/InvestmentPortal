'use client';

import { useState } from 'react';
import { ChevronLeft, MoreVertical, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function FundOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'bankDetails'>(
    tabParam === 'documents' ? 'documents' : 
    tabParam === 'bankDetails' ? 'bankDetails' : 'overview'
  );
  const [fund, setFund] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeDocDropdown, setActiveDocDropdown] = useState<string | null>(null);
  const [showDocDeleteModal, setShowDocDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const { user } = useAuth();
  const isInvestor = user?.role === 'investor';

  // Performance Chart State
  const [timeframe, setTimeframe] = useState(12);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);

  useEffect(() => {
    if (tabParam === 'documents') {
      setActiveTab('documents');
    } else if (tabParam === 'overview') {
      setActiveTab('overview');
    } else if (tabParam === 'bankDetails') {
      setActiveTab('bankDetails');
    }
  }, [tabParam]);

  useEffect(() => {
    if (params.id) {
      fetchFundDetails();
      fetchDocuments();
    }
  }, [params.id]);

  useEffect(() => {
    fetchPerformance();
  }, [timeframe]);

  const fetchPerformance = async () => {
    setIsPerformanceLoading(true);
    try {
      const data = await apiClient.getPerformance(timeframe);
      const formattedData = data.map((item: any) => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
        fullDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }));
      setPerformanceData(formattedData);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsPerformanceLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await apiClient.getFundDocuments(params.id as string);
      setDocuments(data);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const fetchFundDetails = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getFundById(params.id as string);
      setFund(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch fund details');
    } finally {
      setIsLoading(false);
    }
  };

  const getFullImageUrl = (imagePath: string | null | undefined): string | undefined => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/images/') || imagePath.startsWith('/documents/')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowDropdown(false);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.deleteFund(params.id as string);
      toast.success('Fund deleted successfully');
      router.push('/dashboard/funds');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete fund');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const downloadUrl = apiClient.getDocumentDownloadUrl(docId);
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Could not download document. Please try again.');
    }
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
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-gray-600">
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <div className="bg-white p-8 rounded-lg text-center">
            <p className="text-gray-500">Fund not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 bg-[#F9FAFB] min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 group"
            title="Go back"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{fund.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fund Details</p>
          </div>

          {!isInvestor && (
            <div className="ml-auto">
              <Button
                onClick={() => router.push(`/dashboard/funds/${params.id}/documents/upload`)}
                className="bg-[#FCD34D] hover:bg-[#fbbf24] text-[#1F3B6E] px-6 py-2 rounded-full font-bold flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Upload Doc.
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 font-medium transition-colors relative ${activeTab === 'overview' ? 'text-[#1F3B6E]' : 'text-gray-600'
                }`}
            >
              Fund Overview
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FCD34D]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 font-medium transition-colors relative ${activeTab === 'documents' ? 'text-[#1F3B6E]' : 'text-gray-600'
                }`}
            >
              Documents
              {activeTab === 'documents' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FCD34D]" />
              )}
            </button>
            {!isInvestor && (
              <button
                onClick={() => setActiveTab('bankDetails')}
                className={`pb-3 font-medium transition-colors relative ${activeTab === 'bankDetails' ? 'text-[#1F3B6E]' : 'text-gray-600'
                  }`}
              >
                Wire Instructions
                {activeTab === 'bankDetails' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FCD34D]" />
                )}
              </button>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-start gap-8">
                {/* Left Side - Image */}
                <div className="flex-shrink-0">
                  {fund.image ? (
                    <img
                      src={getFullImageUrl(fund.image) || ''}
                      alt={fund.name}
                      className="w-[450px] h-[280px] object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-[450px] h-[280px] bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center rounded-lg">
                      <span className="text-4xl font-bold text-white opacity-20">No Image</span>
                    </div>
                  )}
                </div>

                {/* Right Side - Fund Details */}
                <div className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-500 mb-1">Start Date: {formatDate(fund.startDate)}</p>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-bold text-gray-900">{fund.name}</h2>
                      {!isInvestor && (
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${fund.status === 'Active' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                          fund.status === 'Closed' ? 'bg-[#FFEBEE] text-[#C62828]' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                          {fund.status || 'Active'}
                        </span>
                      )}
                    </div>

                    {!isInvestor && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>

                        {showDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/dashboard/funds/${params.id}/edit`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={handleDelete}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fund Strategy */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Fund Strategy</h3>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                      {fund.description || 'No strategy defined for this fund.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Note Section */}
            {fund.note && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Note</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 font-medium italic">
                    (Private note visible only to you)
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {fund.note}
                  </p>
                </div>
              </div>
            )}


            {/* Performance Overview */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-900">Performance Overview</h3>
                <select 
                  value={timeframe}
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#FCD34D] bg-white cursor-pointer"
                >
                  <option value={12}>Last year</option>
                  <option value={9}>Last 9 months</option>
                  <option value={6}>Last 6 months</option>
                  <option value={3}>Last 3 months</option>
                </select>
              </div>
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">
                  ${performanceData.length > 0 ? performanceData[performanceData.length - 1].value.toFixed(2) : '124.50'}
                </p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  Last {timeframe} months <span className="ml-1">
                    {performanceData.length > 1 ? (
                      ((performanceData[performanceData.length - 1].value - performanceData[0].value) / performanceData[0].value * 100).toFixed(1)
                    ) : '+5.2'}%
                  </span>
                </p>
              </div>
              
              <div className="h-[300px] w-full mt-4">
                {isPerformanceLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E]"></div>
                  </div>
                ) : performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="100%">
                          <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FCD34D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="formattedDate" 
                        axisLine={false}
                        tickLine={false}
                        tick={{fontSize: 12, fill: '#9CA3AF'}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{fontSize: 12, fill: '#9CA3AF'}}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <RechartsTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">{payload[0].payload.fullDate}</p>
                                <p className="text-sm font-bold text-[#1F3B6E]">
                                  NAV: ${typeof payload[0].value === 'number' ? payload[0].value.toFixed(2) : payload[0].value}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#F59E0B" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#performanceGradient)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">No performance data available for this period</p>
                    <p className="text-xs text-gray-400 mt-1">Start adding NAV entries to see the graph</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bankDetails' && !isInvestor && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 font-goudy">Custodian Wire Instructions</h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600">
                These are the wire transfer instructions associated with this fund. Use these details for all incoming investments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                  <p className="font-medium text-gray-900">{fund.bankName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Account Number</p>
                  <p className="font-medium text-gray-900 text-lg tracking-wider">{fund.accountNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Routing Number (ABA)</p>
                  <p className="font-medium text-gray-900">{fund.routingNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Beneficiary Name</p>
                  <p className="font-medium text-gray-900">{fund.beneficiaryName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bank Address</p>
                  <p className="font-medium text-gray-900 leading-relaxed whitespace-pre-line">
                    {fund.bankAddress || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto pb-20 custom-scrollbar">
              <div className="min-h-[400px]">
                <table className="w-full relative">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">File Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Document Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tax Year</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">AV Scan Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Uploaded Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{doc.file_name}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {doc.document_type}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{doc.tax_year || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          Clean
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{formatDate(doc.uploaded_at)}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDocDropdown(activeDocDropdown === doc.id ? null : doc.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </button>
                          {activeDocDropdown === doc.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveDocDropdown(null)}
                              />
                              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <Link
                                  href={`/dashboard/funds/${params.id}/documents/${doc.id}`}
                                  className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                                  onClick={() => setActiveDocDropdown(null)}
                                >
                                  View
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownload(doc.id, doc.file_name);
                                    setActiveDocDropdown(null);
                                  }}
                                  className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  Download
                                </button>
                                {!isInvestor && (
                                  <>
                                    <Link
                                      href={`/dashboard/funds/${params.id}/documents/${doc.id}/edit`}
                                      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      Edit
                                    </Link>
                                    <button
                                      onClick={() => {
                                        setDocToDelete(doc);
                                        setShowDocDeleteModal(true);
                                        setActiveDocDropdown(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No documents found for this fund.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] p-8 max-w-[520px] w-full mx-4 relative shadow-2xl border-none">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-6 right-6 text-[#9FA3A9] hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-goudy text-[28px] text-[#1F1F1F] font-normal mb-4">Delete Fund</h2>
            <div className="space-y-3 mb-10">
              <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                Are you sure you want to delete this fund?
              </p>
              <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                This action cannot be undone and will permanently remove the fund from the platform.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="h-[46px] min-w-[130px] rounded-full bg-[#FFF5E9] hover:bg-[#FFEBD4] text-[#4B4B4B] border-none text-[15px] font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="h-[46px] min-w-[150px] rounded-full bg-[#FFD64B] hover:bg-[#FFCC21] text-[#4B4B4B] border-none shadow-sm text-[15px] font-bold"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {showDocDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] p-8 max-w-[520px] w-full mx-4 relative shadow-2xl border-none">
            <button
              onClick={() => setShowDocDeleteModal(false)}
              className="absolute top-6 right-6 text-[#9FA3A9] hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-goudy text-[28px] text-[#1F1F1F] font-normal mb-4">Delete Document</h2>
            <div className="space-y-3 mb-10">
              <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                Are you sure you want to delete <span className="font-bold text-[#1F1F1F]">&quot;{docToDelete?.file_name}&quot;</span>?
              </p>
              <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                This action cannot be undone and will permanently remove the document from the fund.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDocDeleteModal(false)}
                className="h-[46px] min-w-[130px] rounded-full bg-[#FFF5E9] hover:bg-[#FFEBD4] text-[#4B4B4B] border-none text-[15px] font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await apiClient.deleteDocument(docToDelete.id);
                    toast.success('Document deleted successfully');
                    fetchDocuments();
                  } catch (error: any) {
                    toast.error(error.message || 'Failed to delete document');
                  } finally {
                    setShowDocDeleteModal(false);
                  }
                }}
                className="h-[46px] min-w-[150px] rounded-full bg-[#FFD64B] hover:bg-[#FFCC21] text-[#4B4B4B] border-none shadow-sm text-[15px] font-bold"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
