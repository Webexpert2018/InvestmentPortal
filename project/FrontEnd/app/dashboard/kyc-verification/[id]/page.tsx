'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, X, ChevronDown, FileText, Download, Shield, Mail, Phone, Calendar, User, MapPin, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';

const formatPhoneDisplay = (phoneStr: string | null | undefined): string => {
  if (!phoneStr) return '';
  const COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];
  const matchedCode = COUNTRY_CODES.find(code => {
    const prefix = code.split(' ')[0];
    return phoneStr.startsWith(prefix) || phoneStr.startsWith(code);
  });
  if (!matchedCode) return phoneStr;
  let prefix = matchedCode;
  let localNumber = '';
  if (phoneStr.startsWith(matchedCode)) {
    prefix = matchedCode;
    localNumber = phoneStr.slice(matchedCode.length).trim();
  } else {
    const cleanPrefix = matchedCode.split(' ')[0];
    if (phoneStr.startsWith(cleanPrefix)) {
      prefix = matchedCode;
      localNumber = phoneStr.slice(cleanPrefix.length).trim();
    }
  }
  let digits = localNumber.replace(/\D/g, '');
  if (prefix.includes('+1')) {
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
  } else if (prefix.includes('+91')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
  } else if (prefix.includes('+44')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('44')) {
      digits = digits.slice(2);
    }
  }
  const isUK = prefix.includes('+44');
  const maxDigits = isUK ? 11 : 10;
  if (digits.length > maxDigits) {
    digits = digits.slice(0, maxDigits);
  }
  let formatted = '';
  if (digits.length === 0) {
    formatted = '';
  } else if (digits.length <= 3) {
    formatted = `(${digits}`;
  } else if (digits.length <= 6) {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 11)}`;
  }
  return `${prefix} ${formatted}`.trim();
};

export default function AdminKycVerificationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [investorData, setInvestorData] = useState<any>(null);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssociate, setSelectedAssociate] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [irStaffList, setIrStaffList] = useState<any[]>([]);
  const [irLoading, setIrLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const getDocTypeName = (type: string) => {
    switch (type) {
      case 'tax_return_y1': return 'Tax Return (Year 1)';
      case 'tax_return_y2': return 'Tax Return (Year 2)';
      case 'balance_sheet': return 'Balance Sheet / Net Worth';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profile, docs] = await Promise.all([
          apiClient.getUserById(params.id),
          apiClient.getInvestorDocuments(params.id)
        ]);
        setInvestorData(profile);
        setKycDocuments(docs);
      } catch (err) {
        console.error('Failed to fetch investor data:', err);
        toast.error('Failed to load verification profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await apiClient.updateKycStatus(params.id, newStatus);
      toast.success(`KYC ${newStatus} successfully`);
      const profile = await apiClient.getUserById(params.id);
      setInvestorData(profile);
    } catch (err) {
      toast.error(`Failed to ${newStatus} KYC`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3B6E]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!investorData) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">Investor not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[#1F3B6E] font-medium underline">Go Back</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 font-helvetica">
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/kyc-console')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Profile Information</h1>
        </div>

        {/* Top Header Summary Profile Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-50/40 via-white to-gray-50/40 rounded-2xl border border-amber-100/60 shadow-xs">
          {/* Left: Avatar & Name/Joined Date */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-200/80 shadow-xs overflow-hidden bg-amber-100 shrink-0 flex items-center justify-center">
              {investorData.profileImageUrl ? (
                <Image
                  src={investorData.profileImageUrl.startsWith('http')
                    ? investorData.profileImageUrl
                    : `${BASE_URL}${investorData.profileImageUrl.startsWith('/') ? '' : '/'}${investorData.profileImageUrl}`}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#FCD34D] flex items-center justify-center text-[#1F1F1F] text-xl sm:text-2xl font-extrabold tracking-tight">
                  {(investorData.firstName?.[0] || '') + (investorData.lastName?.[0] || '')}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] leading-tight truncate">
                {investorData.firstName} {investorData.lastName}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                Joined date: <span className="text-gray-800 font-semibold">{new Date(investorData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          {/* Top Right: Action Buttons in one single line */}
          <div className="flex items-center justify-start sm:justify-end gap-2 overflow-x-auto max-w-full pb-1 shrink-0">
            <button
              onClick={async () => {
                setShowAssignModal(true);
                setSelectedAssociate(investorData.assignedIrId || '');
                setIrLoading(true);
                try {
                  const res = await apiClient.getStaff('investor_relations', 1, 100);
                  setIrStaffList(res.data || []);
                } catch (err) {
                  console.error('Failed to fetch IR staff:', err);
                } finally {
                  setIrLoading(false);
                }
              }}
              className="h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs shrink-0 bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent"
            >
              {investorData.assignedIrId ? 'Change Investor Relation' : 'Assign Investor Relation'}
            </button>
            <button
              onClick={() => handleStatusUpdate('rejected')}
              className="h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs shrink-0 bg-red-500 text-white hover:bg-red-600 border-transparent"
            >
              Reject
            </button>
            <button
              onClick={() => handleStatusUpdate('approved')}
              className="h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 border-transparent"
            >
              Approve
            </button>
          </div>
        </div>

        {/* Details Card Section */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider pb-2 border-b border-gray-100">
            Personal & Account Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Email</span>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(investorData.email || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-bold text-gray-900 truncate block hover:text-[#2A4474] hover:underline cursor-pointer transition-colors"
                title="Click to compose email in Gmail"
              >
                {investorData.email}
              </a>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
              <p
                onClick={() => {
                  if (investorData.phone) {
                    navigator.clipboard.writeText(investorData.phone);
                    toast.success('Phone number copied to clipboard');
                  }
                }}
                className="text-xs sm:text-sm font-bold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors block"
                title="Click to copy phone number"
              >
                {formatPhoneDisplay(investorData.phone) || 'Not set'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Tax ID</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{investorData.taxId || 'Not set'}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Date of Birth</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                {investorData.dob ? new Date(investorData.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Account Type</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{investorData.accountType || 'Personal Account'}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Investor Relation</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{investorData.assignedIrName || 'Not assigned'}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Accountant</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900">{investorData.assignedAccountantName || 'Not assigned'}</p>
            </div>

            <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 space-y-0.5 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Address</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900 leading-relaxed">
                {investorData.addressLine1 || investorData.addressLine2 || investorData.city || investorData.state || investorData.zipCode ? (
                  `${investorData.addressLine1 || ''}${investorData.addressLine2 ? `, ${investorData.addressLine2}` : ''}${investorData.city ? `, ${investorData.city}` : ''}${investorData.state ? `, ${investorData.state}` : ''}${investorData.zipCode ? ` ${investorData.zipCode}` : ''}`
                ) : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* KYC Documents Section */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider pb-2 border-b border-gray-100">
            KYC Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kycDocuments.filter((doc: any) => ['tax_return_y1', 'tax_return_y2', 'balance_sheet'].includes(doc.document_type)).length > 0 ? (
              kycDocuments
                .filter((doc: any) => ['tax_return_y1', 'tax_return_y2', 'balance_sheet'].includes(doc.document_type))
                .map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/60 rounded-xl border border-gray-100 hover:border-amber-200 transition-all shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="p-2.5 bg-red-50 rounded-xl shrink-0">
                        <FileText className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <span className="block text-xs font-bold text-gray-900 truncate" title={getDocTypeName(doc.document_type)}>
                          {getDocTypeName(doc.document_type)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium block truncate" title={doc.file_name}>
                          {doc.file_name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const viewUrl = `${apiClient.getApiUrl()}/documents/${doc.id}/view?token=${encodeURIComponent(token || '')}`;
                            window.open(viewUrl, '_blank');
                          } catch (err) {
                            console.error('View error:', err);
                            toast.error('Failed to view document');
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#1F3B6E] hover:bg-white rounded-lg transition-all"
                        title="View"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const response = await fetch(`${apiClient.getApiUrl()}/documents/${doc.id}/download`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (!response.ok) throw new Error('Download failed');
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.file_name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error('Download error:', err);
                            toast.error('Failed to download document');
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#1F3B6E] hover:bg-white rounded-lg transition-all"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 italic">No KYC documents uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Investor Relation Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1F1F1F]">
                    {investorData.assignedIrId ? 'Change Investor Relation' : 'Assign Investor Relation'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Select an Investor Relation to manage this investor's KYC verification.
                  </p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1">Investor Relation</label>
                <div className="relative">
                  <select
                    value={selectedAssociate}
                    onChange={(e) => setSelectedAssociate(e.target.value)}
                    disabled={irLoading}
                    className="w-full px-6 py-4 bg-[#F9FAFB] border border-transparent rounded-2xl text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:bg-white transition-all font-bold cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{irLoading ? 'Loading associates...' : 'Select Associate'}</option>
                    {irStaffList.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>{staff.full_name} ({staff.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-4 text-sm font-bold text-[#6B7280] bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setAssigning(true);
                      await apiClient.assignInvestorRelations(params.id, selectedAssociate || null);
                      toast.success(investorData.assignedIrId ? 'Investor Relation updated successfully' : 'Investor Relation assigned successfully');
                      const profile = await apiClient.getUserById(params.id);
                      setInvestorData(profile);
                      setShowAssignModal(false);
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to assign');
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  disabled={assigning}
                  className="flex-1 py-4 bg-[#FCD34D] text-[#1F2937] text-sm font-bold rounded-2xl hover:bg-[#FBD24E] shadow-lg shadow-yellow-100 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {investorData.assignedIrId ? 'Updating...' : 'Assigning...'}
                    </>
                  ) : (investorData.assignedIrId ? 'Change' : 'Assign')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
