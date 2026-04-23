'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, X, ChevronDown, FileText, Download, Shield, Mail, Phone, Calendar, User, MapPin, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';

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

        {/* Dedicated Verification Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#F1F1F1] overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Left: Large Profile Image */}
              <div className="w-full lg:w-[350px] shrink-0">
                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
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
                    <Image 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${investorData.firstName}&backgroundColor=FCD34D`} 
                      alt="Placeholder" 
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Right: Detailed Information */}
              <div className="flex-1 space-y-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-bold text-[#1F1F1F] tracking-tight">{investorData.firstName} {investorData.lastName}</h2>
                    <p className="text-gray-500 mt-2 font-medium">Joined date: {new Date(investorData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  
                  {/* Dedicated Action Buttons */}
                  <div className="flex flex-wrap gap-3">
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
                      className="px-6 py-3 bg-[#FCD34D] text-[#1F1F1F] text-sm font-bold rounded-xl hover:bg-[#FBD24E] transition-all shadow-lg shadow-yellow-50 active:scale-95"
                    >
                      Assign Relations Associate
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('rejected')}
                      className="px-8 py-3 bg-[#FF5A5F] text-white text-sm font-bold rounded-xl hover:bg-[#FF4146] transition-all shadow-lg shadow-red-50 active:scale-95"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('approved')}
                      className="px-8 py-3 bg-[#10B981] text-white text-sm font-bold rounded-xl hover:bg-[#059669] transition-all shadow-lg shadow-green-50 active:scale-95"
                    >
                      Approve
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 border-t border-gray-50 pt-10">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</span>
                    <div className="flex items-center gap-2">
                       <Mail className="h-4 w-4 text-gray-400" />
                       <p className="text-base font-bold text-gray-900">{investorData.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</span>
                    <div className="flex items-center gap-2">
                       <Phone className="h-4 w-4 text-gray-400" />
                       <p className="text-base font-bold text-gray-900">{investorData.phone || '(+1) 4589 6992'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tax ID</span>
                    <p className="text-base font-bold text-gray-900">{investorData.taxId || '56235895656'}</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date of Birth</span>
                    <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-gray-400" />
                       <p className="text-base font-bold text-gray-900">{investorData.dob ? new Date(investorData.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 25, 1977'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Type</span>
                    <p className="text-base font-bold text-gray-900">{investorData.accountType || 'Roth IRA'}</p>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</span>
                    <div className="flex items-start gap-2">
                       <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                       <p className="text-base font-bold text-gray-900 max-w-2xl leading-relaxed">
                         {investorData.addressLine1 || '123 Market St. Suite 450 San Francisco, CA 94103'}{investorData.addressLine2 ? `, ${investorData.addressLine2}` : ''}
                         {investorData.city ? `, ${investorData.city}` : ''} {investorData.state ? `, ${investorData.state}` : ''} {investorData.zipCode}
                         {investorData.phone ? ` (${investorData.phone.substring(0,3)}) ${investorData.phone.substring(3)}` : ''}
                       </p>
                    </div>
                  </div>
                </div>

                {/* KYC Documents Section */}
                <div className="space-y-6 pt-10 border-t border-gray-50">
                  <h3 className="text-xl font-bold text-[#1F1F1F]">KYC Document</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kycDocuments.length > 0 ? (
                      kycDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-[#F9FAFB] rounded-2xl border border-gray-100 group hover:border-[#FCD34D] transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-xl">
                              <FileText className="h-7 w-7 text-red-500" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="block text-sm font-bold text-gray-900 truncate pr-2" title={doc.file_name}>{doc.file_name}</span>
                              <span className="text-[12px] text-gray-500 font-medium">
                                {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
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
                              className="p-2 text-gray-400 hover:text-[#1F3B6E] hover:bg-white rounded-lg transition-all"
                              title="View"
                            >
                               <FileText className="h-5 w-5" />
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
                              className="p-2 text-gray-400 hover:text-[#1F3B6E] hover:bg-white rounded-lg transition-all"
                              title="Download"
                            >
                               <Download className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">No documents uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Relation Associate Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1F1F1F]">Assign Relation Associate</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Select a relation associate to manage this investor's KYC verification.
                  </p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1">Relation Associate</label>
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
                      toast.success('Relation Associate assigned successfully');
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
                      Assigning...
                    </>
                  ) : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
