'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Mail, ShieldAlert, Award, FileText, BadgeCheck, DollarSign, PieChart, Activity, Download, Eye, Filter, ArrowUpDown, X } from 'lucide-react';
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
  const [selectedDocType, setSelectedDocType] = useState<string>('ALL');
  const [typeSortOrder, setTypeSortOrder] = useState<'asc' | 'desc' | null>(null);

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

  const handleViewDoc = (docId: string | number) => {
    const token = localStorage.getItem('token');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    window.open(`${apiClient.getApiUrl()}/documents/old-investor/file/${docId}/view${tokenParam}`, '_blank');
  };

  const handleDownloadDoc = (docId: string | number) => {
    const token = localStorage.getItem('token');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    window.open(`${apiClient.getApiUrl()}/documents/old-investor/file/${docId}/download${tokenParam}`, '_blank');
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
        {(() => {
          const docTypeCounts = (documents || []).reduce((acc: Record<string, number>, doc: any) => {
            const type = doc.document_type || 'Tax Document';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});

          const uniqueDocTypes = Object.keys(docTypeCounts);

          let displayedDocs = (documents || []).filter((doc: any) => {
            if (selectedDocType === 'ALL') return true;
            const type = doc.document_type || 'Tax Document';
            return type.toLowerCase() === selectedDocType.toLowerCase();
          });

          if (typeSortOrder) {
            displayedDocs = [...displayedDocs].sort((a: any, b: any) => {
              const typeA = (a.document_type || 'Tax Document').toLowerCase();
              const typeB = (b.document_type || 'Tax Document').toLowerCase();
              if (typeA < typeB) return typeSortOrder === 'asc' ? -1 : 1;
              if (typeA > typeB) return typeSortOrder === 'asc' ? 1 : -1;
              return 0;
            });
          }

          return (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 mt-8">
              <div className="border-b border-gray-50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 font-goudy">
                    Legacy Investor Documents
                  </h3>
                  <span className="inline-flex items-center justify-center bg-blue-50 text-[#1F3B6E] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                    {displayedDocs.length} of {documents.length} Document(s)
                  </span>
                </div>

                {documents && documents.length > 0 && uniqueDocTypes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      Filter:
                    </span>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="text-xs font-semibold bg-gray-50 border border-gray-200 text-[#1F3B6E] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1F3B6E]/20 cursor-pointer"
                    >
                      <option value="ALL">All Document Types ({documents.length})</option>
                      {uniqueDocTypes.map((type) => (
                        <option key={type} value={type}>
                          {type} ({docTypeCounts[type]})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Filter Tabs Pills */}
              {documents && documents.length > 0 && uniqueDocTypes.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDocType('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${selectedDocType === 'ALL'
                      ? 'bg-[#1F3B6E] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                      }`}
                  >
                    All ({documents.length})
                  </button>
                  {uniqueDocTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedDocType(type)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${selectedDocType === type
                        ? 'bg-[#1F3B6E] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                        }`}
                    >
                      <span>{type}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${selectedDocType === type ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                        {docTypeCounts[type]}
                      </span>
                    </button>
                  ))}
                  {selectedDocType !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedDocType('ALL')}
                      className="text-xs text-[#1F3B6E] hover:text-[#162a4f] font-semibold flex items-center gap-1 ml-2 underline"
                    >
                      <X className="h-3.5 w-3.5" /> Reset Filter
                    </button>
                  )}
                </div>
              )}

              {displayedDocs && displayedDocs.length > 0 ? (
                <div className="overflow-x-auto max-h-[540px] overflow-y-auto border border-gray-100/80 rounded-2xl">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-white shadow-xs z-10">
                      <tr className="border-b border-gray-100 bg-white">
                        <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">No.</th>
                        <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">Document Name</th>
                        <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (typeSortOrder === null) setTypeSortOrder('asc');
                              else if (typeSortOrder === 'asc') setTypeSortOrder('desc');
                              else setTypeSortOrder(null);
                            }}
                            className="flex items-center gap-1.5 hover:text-gray-700 focus:outline-none font-semibold group"
                            title="Click to sort by Document Type"
                          >
                            <span>Type</span>
                            <ArrowUpDown className={`h-3.5 w-3.5 ${typeSortOrder ? 'text-amber-600 font-bold' : 'text-gray-400 opacity-60 group-hover:opacity-100'}`} />
                            {typeSortOrder && (
                              <span className="text-[10px] text-amber-600 lowercase font-bold">({typeSortOrder})</span>
                            )}
                          </button>
                        </th>
                        <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Tax Year</th>
                        <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Uploaded Date</th>
                        <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {displayedDocs.map((doc: any, idx: number) => (
                        <tr
                          key={doc.id || idx}
                          onClick={() => handleViewDoc(doc.id)}
                          className="hover:bg-amber-50/30 cursor-pointer transition-colors group"
                        >
                          <td className="py-4 text-sm font-medium text-gray-400 text-left">
                            #{idx + 1}
                          </td>
                          <td className="py-4 text-left text-sm font-semibold text-[#1F3B6E] pl-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadDoc(doc.id);
                                }}
                                className="p-1 rounded hover:bg-amber-100/60 transition-colors focus:outline-none"
                                title="Download Document"
                              >
                                <FileText className="h-4 w-4 text-amber-500 hover:text-amber-600 shrink-0 transition-transform active:scale-95" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDoc(doc.id);
                                }}
                                className="flex items-center gap-1.5 hover:text-[#162a4f] hover:underline focus:outline-none text-left"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4 text-gray-400 group-hover:text-[#1F3B6E] shrink-0 transition-colors" />
                                <span className="truncate max-w-xs">{doc.file_name}</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-left text-sm font-medium pl-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocType(doc.document_type || 'Tax Document');
                              }}
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedDocType === (doc.document_type || 'Tax Document')
                                ? 'bg-[#1F3B6E]/10 text-[#1F3B6E] border border-[#1F3B6E]/20 font-bold shadow-sm'
                                : 'bg-gray-50 text-gray-700 hover:bg-[#1F3B6E]/5 hover:text-[#1F3B6E] border border-gray-200/60'
                                }`}
                              title={`Click to filter by ${doc.document_type || 'Tax Document'}`}
                            >
                              <span>{doc.document_type || 'Tax Document'}</span>
                            </button>
                          </td>
                          <td className="py-4 text-center text-sm font-medium text-gray-700">
                            {doc.tax_year || 'N/A'}
                          </td>
                          <td className="py-4 text-center text-sm text-gray-600">
                            {formatDate(doc.created_at)}
                          </td>
                          <td className="py-4 text-right pr-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDoc(doc.id);
                              }}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1F3B6E] hover:bg-[#162a4f] active:bg-[#0f1d38] rounded-xl shadow-sm hover:shadow transition-all duration-200"
                              title="Download Document"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500 font-medium">
                    No documents matching type "{selectedDocType}".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedDocType('ALL')}
                    className="mt-2 text-xs font-bold text-[#1F3B6E] hover:underline"
                  >
                    Show All Documents ({documents.length})
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
