'use client';

import { useState } from 'react';
import { ChevronLeft, MoreVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function FundOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeDocDropdown, setActiveDocDropdown] = useState<number | null>(null);

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowDropdown(false);
  };

  const confirmDelete = () => {
    // Handle delete logic here
    setShowDeleteModal(false);
    router.push('/dashboard/funds');
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-1 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
            Strive Enterprise Fund
          </button>
          <p className="text-xs text-gray-500">Fund Details</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-0 p-5 pb-0 bg-white">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === 'overview' ? 'text-[#1F3B6E]' : 'text-gray-600'
            }`}
          >
            Fund Overview
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FCD34D]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 font-medium transition-colors relative ${
              activeTab === 'documents' ? 'text-[#1F3B6E]' : 'text-gray-600'
            }`}
          >
            Documents
            {activeTab === 'documents' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FCD34D]" />
            )}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-6 mb-6">
              {/* Left Side - Image */}
              <div className="flex-shrink-0">
                <img
                  src="/images/strive_funds.jpg"
                  alt="Strive Enterprise Fund"
                  className="w-80 h-52 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="208"%3E%3Crect width="320" height="208" fill="%23e5e7eb"/%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Right Side - Fund Details */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-end justify-between mb-4">
                  <div className="flex items-end gap-2">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Start Date: Dec 20, 2025</p>
                        <h2 className="text-2xl font-bold text-gray-900">Strive Enterprise Fund</h2>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600">
                      Active
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                </div>

                {/* Fund Strategy */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Fund Strategy</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Strive Enterprise Fund focuses on early to mid-stage technology companies poised for rapid scaling. Our strategy involves identifying disruptive technologies in sectors like AI, fintech, and sustainable energy. We provide not just capital, but also strategic guidance and access to our extensive network to accelerate growth and maximize returns for our investors.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Strive Enterprise Fund focuses on early to mid-stage technology companies poised for rapid scaling. Our strategy involves identifying disruptive technologies in sectors like AI, fintech, and sustainable energy.
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Note</h3>
              <p className="text-xs text-gray-500 italic mb-2">(Private note visible only to you)</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Investor provided an updated proof of address. Initial document was blurry but the new one is clear. All checks passed successfully after re-evaluation. Investor provided an updated proof of address. Initial document was blurry but the new one is clear. All checks passed successfully after re-evaluation. Investor provided an updated proof of address. Initial document was blurry but the new one is clear. All checks passed successfully after re-evaluation.
              </p>
            </div>

            {/* Performance Overview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Performance Overview</h3>
                <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1F3B6E]">
                  <option>Last year</option>
                  <option>Last 6 months</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">$124.50</p>
                <p className="text-sm text-green-600 font-medium">Last 12 months +5.2%</p>
              </div>
              <div className="relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                  <span>$1000</span>
                  <span>$800</span>
                  <span>$600</span>
                  <span>$400</span>
                  <span>$200</span>
                  <span>$0</span>
                </div>
                
                {/* Chart container */}
                <div className="ml-12 h-64">
                  <svg className="w-full h-full" viewBox="0 0 800 256" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="51" x2="800" y2="51" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="102" x2="800" y2="102" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="153" x2="800" y2="153" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="204" x2="800" y2="204" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="255" x2="800" y2="255" stroke="#e5e7eb" strokeWidth="1" />
                    
                    {/* Area gradient */}
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#FCD34D', stopOpacity: 0.4 }} />
                        <stop offset="100%" style={{ stopColor: '#FEF3C7', stopOpacity: 0.05 }} />
                      </linearGradient>
                    </defs>
                    
                    {/* Chart path - area fill */}
                    <path
                      d="M 20,220 L 80,200 L 140,190 L 200,140 L 260,110 L 320,80 L 380,70 L 440,100 L 500,120 L 560,100 L 620,80 L 680,100 L 740,110 L 780,90 L 800,80 L 800,256 L 0,256 Z"
                      fill="url(#chartGradient)"
                    />
                    
                    {/* Chart line */}
                    <path
                      d="M 20,220 L 80,200 L 140,190 L 200,140 L 260,110 L 320,80 L 380,70 L 440,100 L 500,120 L 560,100 L 620,80 L 680,100 L 740,110 L 780,90"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                
                {/* X-axis - Month labels */}
                <div className="ml-12 flex justify-between mt-2 text-xs text-gray-500">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">K-1_2025.pdf</td>
                    <td className="px-6 py-4 text-gray-900">K-1</td>
                    <td className="px-6 py-4 text-gray-900">2025</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600">
                        Clean
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">Dec 26, 2025</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDocDropdown(activeDocDropdown === 1 ? null : 1)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        {activeDocDropdown === 1 && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDocDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/dashboard/funds/${params.id}/documents/1`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View
                              </Link>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Download
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Edit
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">W-9_update.pdf</td>
                    <td className="px-6 py-4 text-gray-900">W-9</td>
                    <td className="px-6 py-4 text-gray-900">2025</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-600">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">Dec 25, 2025</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDocDropdown(activeDocDropdown === 2 ? null : 2)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        {activeDocDropdown === 2 && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDocDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/dashboard/funds/${params.id}/documents/2`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View
                              </Link>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Download
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Edit
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">Statement_Q3.pdf</td>
                    <td className="px-6 py-4 text-gray-900">Statement</td>
                    <td className="px-6 py-4 text-gray-900">2025</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600">
                        Flagged
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">Dec 26, 2025</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDocDropdown(activeDocDropdown === 3 ? null : 3)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        {activeDocDropdown === 3 && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDocDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/dashboard/funds/${params.id}/documents/3`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View
                              </Link>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Download
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Edit
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">Statement_Q3.pdf</td>
                    <td className="px-6 py-4 text-gray-900">Statement</td>
                    <td className="px-6 py-4 text-gray-900">2025</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600">
                        Flagged
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">Dec 26, 2025</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDocDropdown(activeDocDropdown === 4 ? null : 4)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        {activeDocDropdown === 4 && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDocDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/dashboard/funds/${params.id}/documents/4`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View
                              </Link>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Download
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Edit
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-xl w-full mx-4 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Fund</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Are you sure you want to delete this fund?<br />
              This action cannot be undone and will permanently remove the fund from the platform.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 px-8 py-2 rounded-full font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium"
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
