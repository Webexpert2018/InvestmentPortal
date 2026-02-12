'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft } from 'lucide-react';

export default function FundingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('transactions');

  // Mock data - in real app, fetch based on params.id
  const fundData = {
    fundName: 'ABC Fund Details',
    currentValue: '$94,571',
    unitsHeld: '841.05',
    currentNav: '$112.45',
    totalGainLoss: '+12,571',
    gainLossPercent: '+15.33%',
    costBasis: '$82,000',
    unrealizedGain: '$12,571',
    percentReturn: '+15.33%',
    inceptionDate: 'Jul 22, 2024',
  };

  const transactions = [
    { id: 1, date: 'Jan 18, 2025', type: 'Subscription', amount: '$50,000.00', units: 200, status: 'Completed' },
    { id: 2, date: 'Jan 18, 2025', type: 'Subscription', amount: '$50,000.00', units: 200, status: 'Completed' },
    { id: 3, date: 'Jan 18, 2025', type: 'Subscription', amount: '$50,000.00', units: 200, status: 'Pending' },
  ];

  const documents = [
    { id: 1, name: 'Subscription Agreement — Signed - Feb 12, 2025' },
    { id: 2, name: 'K-1 Tax Document — 2024' },
    { id: 3, name: 'Quarterly Statement — Q4 2024' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600';
      case 'Pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
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
            <p className="text-2xl font-bold text-green-600">{fundData.totalGainLoss}</p>
            <p className="text-sm text-green-600 mt-1">{fundData.gainLossPercent}</p>
          </div>
        </div>

        {/* Performance Overview and Your Holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Overview - 2/3 width */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1F1F1F]">Performance Overview</h2>
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FCD34D]">
                <option>Last year</option>
                <option>Last 6 months</option>
                <option>Last 3 months</option>
                <option>Last month</option>
              </select>
            </div>
            
            {/* Chart Placeholder */}
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                {/* Y-axis labels */}
                <text x="10" y="20" className="text-xs fill-gray-400">$1000</text>
                <text x="10" y="60" className="text-xs fill-gray-400">$800</text>
                <text x="10" y="100" className="text-xs fill-gray-400">$600</text>
                <text x="10" y="140" className="text-xs fill-gray-400">$400</text>
                <text x="10" y="180" className="text-xs fill-gray-400">$200</text>
                <text x="10" y="200" className="text-xs fill-gray-400">$0</text>

                {/* Chart line with gradient area */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#FCD34D" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                
                {/* Area under the curve */}
                <path
                  d="M 50,140 L 80,120 L 110,110 L 140,100 L 170,95 L 200,80 L 230,70 L 260,85 L 290,95 L 320,90 L 350,100 L 380,110 L 410,105 L 440,95 L 470,85 L 500,90 L 530,100 L 560,110 L 560,200 L 50,200 Z"
                  fill="url(#chartGradient)"
                />
                
                {/* Chart line */}
                <path
                  d="M 50,140 L 80,120 L 110,110 L 140,100 L 170,95 L 200,80 L 230,70 L 260,85 L 290,95 L 320,90 L 350,100 L 380,110 L 410,105 L 440,95 L 470,85 L 500,90 L 530,100 L 560,110"
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth="2"
                />

                {/* X-axis labels */}
                <text x="50" y="215" className="text-xs fill-gray-400">Jan</text>
                <text x="110" y="215" className="text-xs fill-gray-400">Feb</text>
                <text x="170" y="215" className="text-xs fill-gray-400">Mar</text>
                <text x="230" y="215" className="text-xs fill-gray-400">Apr</text>
                <text x="290" y="215" className="text-xs fill-gray-400">May</text>
                <text x="350" y="215" className="text-xs fill-gray-400">Jun</text>
                <text x="410" y="215" className="text-xs fill-gray-400">Jul</text>
                <text x="470" y="215" className="text-xs fill-gray-400">Aug</text>
                <text x="530" y="215" className="text-xs fill-gray-400">Sep</text>
              </svg>
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
                <p className="text-lg font-semibold text-[#1F1F1F]">{fundData.unrealizedGain}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">% Return:</p>
                <p className="text-lg font-semibold text-green-600">{fundData.percentReturn}</p>
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
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-700">{document.name}</td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
                                <circle cx="2" cy="2" r="2" />
                                <circle cx="2" cy="8" r="2" />
                                <circle cx="2" cy="14" r="2" />
                              </svg>
                            </button>
                            <button className="px-3 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors">
                              View Document
                            </button>
                            <button className="px-3 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors">
                              Download
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
              <div className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  The Physician BTC Fund provides exposure to institutional-grade Bitcoin strategies designed specifically for physicians and medical professionals.
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                  <li>Long-term BTC exposure</li>
                  <li>Optimized for tax-advantaged accounts</li>
                  <li>Low operational friction</li>
                </ul>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
