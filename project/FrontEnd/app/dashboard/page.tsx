'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin, Wallet, TrendingUp } from 'lucide-react';
import { formatUSD, formatBTC } from '@/lib/utils/bitcoin';
import  { DashboardLayout }  from '@/components/DashboardLayout';
import Link from 'next/link';


import { MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';

const stats = [
  { name: 'Total Investors', value: '38' },
  { name: 'Pending KYC', value: '7' },
  { name: 'Pending Fundings', value: '5' },
  { name: 'Pending Redemptions', value: '2' },
];

const recentInvestors = [
  {
    id: 1,
    fundName: 'ABC Fund',
    accountType: 'Personal',
    kycStatus: 'Approved',
    fundingStatus: 'Funded',
    kycColor: 'bg-[#F2FAF6] text-[#2A4474]',
  },
  {
    id: 2,
    fundName: 'ABC Fund',
    accountType: 'IRA',
    kycStatus: 'Pending',
    fundingStatus: 'Not Funded',
    kycColor: 'bg-[#FFF9EE] text-[#4B4B4B]',
  },
  {
    id: 3,
    fundName: 'ABC Fund',
    accountType: 'Roth IRA',
    kycStatus: 'Approved',
    fundingStatus: 'Funded',
    kycColor: 'bg-[#F2FAF6] text-[#2A4474]',
  },
  {
    id: 4,
    fundName: 'ABC Fund',
    accountType: 'Corporate',
    kycStatus: 'Rejected',
    fundingStatus: 'Not Funded',
    kycColor: 'bg-[#FEF2F2] text-[#4B4B4B]',
  },
  {
    id: 5,
    fundName: 'ABC Fund',
    accountType: 'Personal',
    kycStatus: 'Approved',
    fundingStatus: 'Funded',
    kycColor: 'bg-[#F2FAF6] text-[#2A4474]',
  },
];

const kycQueue = [
  {
    id: 1,
    title: 'KYC Verification',
    status: 'Pending',
  },
  {
    id: 2,
    title: 'KYC Verification',
    status: 'Pending',
  },
  {
    id: 3,
    title: 'KYC Verification',
    status: 'Pending',
  },
];

const fundingRequests = [
  { id: 1, name: 'Terry Torff', amount: '$25,000.00 - Wire' },
  { id: 2, name: 'Kadin Stanton', amount: '$25,000.00 - Wire' },
  { id: 3, name: 'Emerson Torff', amount: '$25,000.00 - Wire' },
];

const redemptionRequests = [
  { id: 1, name: 'Jaylon George', amount: '1,200 Units (~$12,540)' },
  { id: 2, name: 'Wilson Press', amount: '1,200 Units (~$12,540)' },
  { id: 3, name: 'Emerson Donin', amount: '1,200 Units (~$12,540)' },
];

const bottomSections = [
  { id: 1, title: 'Funding Requests', count: 4, color: 'text-[#FCD34D]' },
  { id: 2, title: 'Redemption Requests', count: 5, color: 'text-blue-500' },
  { id: 3, title: 'Reconciliation Alerts', count: 5, color: 'text-red-500' },
];


export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfolioData, transactionsData] = await Promise.all([
        apiClient.getMyPortfolio(),
        apiClient.getMyTransactions(10)
      ]);
      setPortfolio(portfolioData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
     <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-[#1F1F1F] ">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome Back, Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow-sm rounded-xl p-6 flex flex-col justify-between h-32"
          >
            <dt className="text-sm font-medium text-gray-500 truncate">
              {item.name}
            </dt>
            <dd className="text-3xl font-bold text-[#1F1F1F]">
              {item.value}
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Investors Table */}
        <div className="xl:col-span-2 bg-white shadow-sm rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#1F1F1F] ">
              Recent Investors
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fund Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Funding Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentInvestors.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{person.fundName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{person.accountType}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${person.kycColor}`}>
                        {person.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{person.fundingStatus}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                      <button className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KYC Review Queue */}
        <div className="bg-white shadow-sm rounded-xl p-6 h-fit">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#1F1F1F] ">
              KYC Review Queue
            </h3>
          </div>
          <div className="space-y-6">
            {kycQueue.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-medium text-[#1F1F1F]">{item.title}</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-800">
                      {item.status}
                    </span>
                  </div>
                  <button className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors">
                    Continue KYC
                  </button>
                </div>
                {index < kycQueue.length - 1 && (
                  <div className="h-px bg-gray-50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Funding Requests */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedSection(expandedSection === 1 ? null : 1)}
          >
            <div className="flex items-center space-x-4">
              <span className="text-lg font-bold text-[#FCD34D]">4</span>
              <span className="text-sm font-medium text-gray-700">Funding Requests</span>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedSection === 1 ? 'rotate-180' : ''}`} />
          </div>
          {expandedSection === 1 && (
            <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
              {fundingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.name}</p>
                    <p className="text-xs text-gray-500">{request.amount}</p>
                  </div>
                  <button className="px-4 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 transition-colors">
                    Review Req
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redemption Requests */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedSection(expandedSection === 2 ? null : 2)}
          >
            <div className="flex items-center space-x-4">
              <span className="text-lg font-bold text-blue-500">5</span>
              <span className="text-sm font-medium text-gray-700">Redemption Requests</span>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedSection === 2 ? 'rotate-180' : ''}`} />
          </div>
          {expandedSection === 2 && (
            <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
              {redemptionRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.name}</p>
                    <p className="text-xs text-gray-500">{request.amount}</p>
                  </div>
                  <button className="px-4 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 transition-colors">
                    Review Req
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reconciliation Alerts */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpandedSection(expandedSection === 3 ? null : 3)}
          >
            <div className="flex items-center space-x-4">
              <span className="text-lg font-bold text-red-500">5</span>
              <span className="text-sm font-medium text-gray-700">Reconciliation Alerts</span>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedSection === 3 ? 'rotate-180' : ''}`} />
          </div>
          {expandedSection === 3 && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-6 text-center">
              <p className="text-base font-semibold text-gray-900 mb-1">Nothing pending</p>
              <p className="text-sm text-gray-500">All are currently up to date</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 pb-6 text-center">
        <p className="text-xs text-gray-500">
          © 2022 All Rights Reserved, by
        </p>
        <p className="text-xs text-gray-500">
          Ovalia Capital.
        </p>
      </div>
    </div>
    </DashboardLayout>
  );
}

