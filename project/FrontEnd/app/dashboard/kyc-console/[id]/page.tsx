'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';

interface PageProps {
  params: { id: string };
}

export default function KYCProfilePage({ params }: PageProps) {
  const router = useRouter();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Mock profile data
  const profile = {
    name: 'James Mango',
    joinedDate: 'Jan 25, 2026',
    email: 'demo@gmail.com',
    phone: '(+1) 4589 6992',
    taxId: '56235895656',
    dob: 'Oct 25, 1977',
    accountType: 'Roth IRA',
    address: '123 Market St. Suite 450 San Francisco, CA 94103(415) 555-0199',
    photo: '/images/profile.jpg'
  };

  const documents = [
    {
      name: 'Subscription Agreement.pdf',
      date: 'Dec 20, 2025 at 05:30 AM'
    },
    {
      name: 'W-9 Form.pdf',
      date: 'Dec 20, 2025 at 05:30 AM'
    },
    {
      name: 'Investor Questionnaire.pdf',
      date: 'Dec 20, 2025 at 05:30 AM'
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Profile Information</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side - Photo */}
            <div className="flex-shrink-0">
              <div className="w-64 h-80 bg-gray-200 rounded-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white text-4xl font-bold">
                    JM
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Details */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                  <p className="text-gray-500">Joined date: {profile.joinedDate}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <Button
                    onClick={() => setShowAssignModal(true)}
                    className="bg-[#FCD34D] text-gray-900 hover:bg-[#FDE68A] font-semibold px-6"
                  >
                    Assign Relations Associate
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    className="bg-red-600 text-white hover:bg-red-700 font-semibold px-6"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => setShowApproveModal(true)}
                    className="bg-green-600 text-white hover:bg-green-700 font-semibold px-6"
                  >
                    Approve
                  </Button>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Email</label>
                  <p className="text-gray-900 font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Phone Number</label>
                  <p className="text-gray-900 font-medium">{profile.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Tax ID</label>
                  <p className="text-gray-900 font-medium">{profile.taxId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Date of Birth</label>
                  <p className="text-gray-900 font-medium">{profile.dob}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Account Type</label>
                  <p className="text-gray-900 font-medium">{profile.accountType}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500 mb-1 block">Address</label>
                  <p className="text-gray-900 font-medium">{profile.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* KYC Documents Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">KYC Document</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate">{doc.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{doc.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assign Relations Associate Modal */}
        {showAssignModal && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowAssignModal(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Assign Investment Relations Associate</h3>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Select an investment relations associate to manage this investor's KYC documents and communication.
                </p>
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Investment Relations Associate</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white text-gray-500">
                    <option>Select investment relations associate</option>
                    <option>John Smith</option>
                    <option>Sarah Johnson</option>
                    <option>Michael Brown</option>
                    <option>Emily Davis</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignModal(false)}
                    className="px-6 border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#FCD34D] text-gray-900 hover:bg-[#FDE68A] px-6 font-semibold"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Reject Request Modal */}
        {showRejectModal && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowRejectModal(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Reject Request</h3>
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to reject this request?<br />
                  You may add a note explaining the reason.
                </p>
                <div className="mb-6">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    maxLength={1000}
                    placeholder="Enter reason"
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none"
                  />
                  <div className="text-right text-sm text-gray-400 mt-1">
                    {rejectReason.length}/1000
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="px-8 border-gray-300 text-gray-700"
                  >
                    No
                  </Button>
                  <Button
                    className="bg-[#FCD34D] text-gray-900 hover:bg-[#FDE68A] px-8 font-semibold"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                  >
                    Yes
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Approve Request Modal */}
        {showApproveModal && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowApproveModal(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Approve Request</h3>
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-8">
                  Are you sure you want to approve this request?<br />
                  Once approved, the action will be processed and the investor will be notified.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowApproveModal(false)}
                    className="px-8 border-gray-300 text-gray-700"
                  >
                    No
                  </Button>
                  <Button
                    className="bg-[#FCD34D] text-gray-900 hover:bg-[#FDE68A] px-8 font-semibold"
                    onClick={() => setShowApproveModal(false)}
                  >
                    Yes
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
