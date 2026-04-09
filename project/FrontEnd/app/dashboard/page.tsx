'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin, Wallet, TrendingUp } from 'lucide-react';
import { formatUSD, formatBTC } from '@/lib/utils/bitcoin';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';


import { MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { setInvestorKycStatus } from '@/lib/mock/kycStatus';

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

const investorSummaryCards = [
  {
    label: 'Total Invested',
    value: '$2,569.00',
    helper: '↑ 12.5% this quarter',
  },
  {
    label: 'Current Value',
    value: '$281,250',
    helper: '+$31,250',
  },
  {
    label: 'Total Units',
    value: '2,372.88',
    helper: '',
  },
  {
    label: 'Current NAV',
    value: '$118.50',
    helper: 'Per unit',
  },
];

const investorPendingActions = [
  {
    id: 1,
    title: 'KYC Verification',
    description: 'Your identity verification is still pending.',
  },
  {
    id: 2,
    title: 'Upload Funding Proof',
    description: 'Upload documents to confirm your latest investment.',
  },
  {
    id: 3,
    title: 'Sign Documents',
    description: 'Review and e-sign the updated investment documents.',
  },
  {
    id: 4,
    title: 'Update Funding Proof',
    description: 'Provide an updated proof for your latest subscription.',
  },
];

const investorUnreadMessages = [
  { id: 1, name: 'Talan Gouse', preview: "We’ve reviewed your document…", time: '2s ago', count: 5 },
  { id: 2, name: 'Emerson Torff', preview: 'ABC fund document added', time: '3h ago', count: 3 },
  { id: 3, name: 'Phillip Donin', preview: 'Your investment request in ABC Fund is under review…', time: '3h ago', count: 2 },
  { id: 4, name: 'Chance Schleifer', preview: 'Your investment in ABC Fund is confirmed…', time: '3h ago', count: 2 },
  { id: 5, name: 'Gustavo George', preview: 'Your withdrawal request has been processed…', time: '3h ago', count: 2 },
];

const notificationsCommon = [
  { id: 1, title: 'New Document Uploaded', subtitle: 'Dr. Susan Roy uploaded W-9 for review.', time: '2s ago' },
  { id: 2, title: 'Missing Document Reminder Sent', subtitle: 'Reminder sent to ABC Holdings LLC.', time: '2m ago' },
  { id: 3, title: 'Investor Message Received', subtitle: 'Mark Johnson: "Please check my K-1."', time: '3h ago' },
];

const notificationsAccountant = [
  {
    day: 'Today',
    items: [
      {
        id: 1,
        title: 'New Investor Joined',
        subtitle:
          'A new investor has created an account and started the onboarding process. Review their profile.',
        time: '2s ago',
      },
      {
        id: 2,
        title: 'New Fund Request Submitted',
        subtitle: 'Emily Zhou requested a $10,000 redemption from XYZ Fund.',
        time: '2m ago',
      },
      { id: 3, title: 'Investor Message Received', subtitle: 'Mark Johnson: "Please check my K-1."', time: '2h ago' },
    ],
  },
  {
    day: 'Yesterday',
    items: [
      {
        id: 4,
        title: 'New Redemption Request',
        subtitle:
          'John Smith has submitted a new redemption request. Review the request and begin the verification process.',
        time: '15h ago',
      },
      {
        id: 5,
        title: 'New Fund Request Submitted',
        subtitle:
          'A new fund creation request has been submitted. Review the details and approve or reject the request.',
        time: '20h ago',
      },
    ],
  },
];

// User icon assets (placeholders in public/images/user-icon)
const userIcons = [
  '/images/user-icon/user_01.png',
  '/images/user-icon/user_02.png',
  '/images/user-icon/user_03.png',
  '/images/user-icon/user_04.png',
  '/images/user-icon/user_05.png',
  '/images/user-icon/user_06.png',
];


type DashboardRole = 'admin' | 'investor' | 'accountant';

const normalizeDashboardRole = (role?: string | null): DashboardRole => {
  const normalized = role?.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'accountant' || normalized === 'accountants' || normalized === 'account') return 'accountant';
  return 'investor';
};


export default function DashboardPage() {
  const loading = false;
  const { user } = useAuth();

  const [expandedSection, setExpandedSection] = useState<number | null>(1);
  const [investorExpanded, setInvestorExpanded] = useState({
    pending: true,
    messages: true,
    accounts: true,
  });
  const [assignedOpen, setAssignedOpen] = useState<boolean>(true);
  const [messagesOpen, setMessagesOpen] = useState<boolean>(true);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(true);
  const [investorKycStatus, setInvestorKycState] = useState<string>('pending');
  const [activeFundsCount, setActiveFundsCount] = useState(0);
  const [investorStats, setInvestorStats] = useState({
    totalInvested: 0,
    totalUnits: 0,
    currentNav: 0,
    currentValue: 0,
  });

  const investorAccountList = [
    {
      id: 1,
      name: 'Personal Account',
      subtitle: `Total Value: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(investorStats.currentValue)}`,
    },
  ];

  const dashboardRole = normalizeDashboardRole(user?.role);
  const welcomeName = user?.firstName ? user.firstName : dashboardRole[0].toUpperCase() + dashboardRole.slice(1);

  useEffect(() => {
    if (dashboardRole !== 'investor') {
      return;
    }

    if (user?.kycStatus) {
      setInvestorKycState(user.kycStatus);
    }

    const fetchStats = async () => {
      try {
        const [flows, investments, navSummary] = await Promise.all([
          apiClient.getMyFundFlows(),
          apiClient.getMyInvestments(),
          apiClient.getNavSummary(),
        ]);

        setActiveFundsCount(flows.length);

        const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.investment_amount), 0);
        const totalUnits = investments.reduce((sum, inv) => sum + parseFloat(inv.estimated_units), 0);
        const currentNav = navSummary.currentNav;
        const currentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.revised_amount || (parseFloat(inv.estimated_units) * currentNav)), 0);

        setInvestorStats({
          totalInvested,
          totalUnits,
          currentNav,
          currentValue,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    fetchStats();
  }, [dashboardRole]);

  const roleStats = {
    admin: [
      { name: 'Total Investors', value: '38' },
      { name: 'Pending KYC', value: '7' },
      { name: 'Pending Fundings', value: '5' },
      { name: 'Pending Redemptions', value: '2' },
    ],
    investor: [
      { name: 'My Active Funds', value: activeFundsCount.toString() },
      { name: 'Pending KYC', value: '1' },
      { name: 'Pending Funding', value: '1' },
      { name: 'Pending Redemption', value: '0' },
    ],
    accountant: [
      { name: 'Total Assigned Investors', value: '3' },
      { name: 'Investors With Missing Docs', value: '7' },
      { name: 'Unread Messages', value: '2' },
      { name: 'Upcoming meetings', value: '3' },
    ],
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

  if (dashboardRole === 'investor') {
    return (
      <DashboardLayout>
        <div className="space-y-8 font-helvetica text-[#1F1F1F]">
          <div className="flex flex-col gap-1">
            <h1 className="font-goudy text-2xl text-[#1F1F1F]">Dashboard</h1>
            <p className="text-sm text-[#8E8E93]">
              Here&apos;s your latest investment overview and updates from Ovalia Capital.
            </p>
          </div>

          {(investorKycStatus === 'unverified' || !investorKycStatus) && (
            <div className="rounded-xl bg-[#F6F6F6] px-5 py-4 md:px-6 md:py-5 border-l-4 border-[#F2C63D]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-goudy text-[28px] leading-none text-[#1F1F1F]">Verify Your Identity</p>
                  <p className="mt-2 font-helvetica text-sm text-[#8A8A8A]">
                    To start investing and access all features, please complete your identity verification.
                  </p>
                </div>
                <Link
                  href="/dashboard/kyc-verification"
                  className="rounded-full bg-[#F2C63D] px-8 py-3 font-goudy text-[18px] leading-none font-bold text-[#1F1F1F] hover:bg-[#EAC835] text-center"
                >
                  Verify Now
                </Link>
              </div>
            </div>
          )}

          {investorKycStatus === 'pending' && (
            <div className="rounded-xl bg-[#F6EFE3] px-5 py-4 md:px-6 md:py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-goudy text-[28px] leading-none text-[#E7A324]">KYC Verification in Progress</p>
                  <p className="mt-2 font-helvetica text-sm text-[#8A8A8A]">
                    Your verification is currently under review. This usually takes 1–2 business days. We&apos;ll notify
                    you once it&apos;s complete.
                  </p>
                </div>
                <div className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 font-helvetica text-lg font-medium text-[#E7A324]">
                  Pending
                </div>
              </div>
            </div>
          )}

          {investorKycStatus === 'rejected' && (
            <div className="rounded-xl bg-[#FFF1F1] px-5 py-4 md:px-6 md:py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-goudy text-[28px] leading-none text-[#FF4C4C]">KYC Verification Unsuccessful</p>
                  <p className="mt-2 font-helvetica text-sm text-[#8A8A8A]">
                    We couldn&apos;t verify your information at this time. Please review your details and retry
                    verification to continue investing.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <Link
                    href="/dashboard/kyc-verification"
                    className="rounded-full bg-[#FFF9EE] px-5 py-2 font-goudy text-[20px] leading-none text-[#BFA778]"
                  >
                    Upload Documents Manually
                  </Link>
                  <Link
                    href="/dashboard/kyc-verification"
                    onClick={() => {
                      setInvestorKycStatus('pending');
                      setInvestorKycState('pending');
                    }}
                    className="rounded-full bg-[#F2C63D] px-5 py-2 font-goudy text-[20px] leading-none text-[#6A4D00]"
                  >
                    Retry Verification
                  </Link>
                </div>
              </div>
            </div>
          )}

          {investorKycStatus === 'verified' && (
            <div className="rounded-xl bg-[#ECF9F2] px-5 py-4 md:px-6 md:py-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-goudy text-[28px] leading-none text-[#2FA66A]">KYC Verification Completed</p>
                  <p className="mt-2 font-helvetica text-sm text-[#6D8A77]">
                    Your identity has been verified successfully. You can continue investing without restrictions.
                  </p>
                </div>
                <div className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 font-helvetica text-lg font-medium text-[#2FA66A]">
                  Verified
                </div>
              </div>
            </div>
          )}

          {/* Top summary cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total Invested',
                value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(investorStats.totalInvested),
                helper: '↑ 12.5% this quarter',
              },
              {
                label: 'Current Value',
                value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(investorStats.currentValue),
                helper: `+${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(investorStats.currentValue - investorStats.totalInvested)}`,
              },
              {
                label: 'Total Units',
                value: investorStats.totalUnits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
                helper: '',
              },
              {
                label: 'Current NAV',
                value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(investorStats.currentNav),
                helper: 'Per unit',
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl bg-white px-6 py-5 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
                  {card.value}
                </p>
                {card.helper && (
                  <p className={`mt-2 text-xs font-medium ${(card.label === 'Current Value' && (investorStats.currentValue - investorStats.totalInvested) < 0) ? 'text-red-500' : 'text-[#2BB673]'}`}>
                    {card.helper}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Main content grid */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.1fr)]">
            {/* Performance Overview */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-goudy text-base">Performance Overview</h2>
                  <p className="mt-1 text-xs text-[#8E8E93]">$2,500.00</p>
                  <p className="text-[11px] text-[#C0C0C0]">Price</p>
                </div>
                <button className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-[#4B4B4B]">
                  Last year
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="flex items-end">
                  {/* Simple static performance line chart */}
                  <svg
                    viewBox="0 0 300 120"
                    className="h-32 w-full rounded-2xl bg-[#FFF9EE] p-3"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 100 L40 80 L80 90 L120 50 L160 70 L200 40 L240 75 L280 55 L300 60"
                      fill="none"
                      stroke="#F3C046"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="space-y-3 text-sm text-[#4B4B4B]">
                  <div>
                    <p className="text-xs text-[#A0A0A0]">24h% change</p>
                    <p className="mt-1 text-sm font-semibold text-[#2BB673]">1.64% ↑</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#A0A0A0]">Price</p>
                      <p className="mt-1 font-medium text-[#1F1F1F]">$2,500.00</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0]">Volume (24h)</p>
                      <p className="mt-1 font-medium text-[#1F1F1F]">$25</p>
                    </div>
                    <div>
                      <p className="text-[#A0A0A0]">Market cap</p>
                      <p className="mt-1 font-medium text-[#1F1F1F]">$219</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="font-goudy text-base">Quick Actions</h2>
                <p className="mt-2 text-xs text-[#8E8E93]">
                  Common actions to manage your investments and get support quickly.
                </p>
                <div className="mt-5 space-y-3">
                  <Link
                    href="/dashboard/funds"
                    className="block w-full rounded-full bg-[#FFF3D6] py-3 text-center text-sm font-semibold text-[#E29F3A] hover:bg-[#FFE7AF]"
                  >
                    Invest
                  </Link>
                  <Link
                    href="/notifications"
                    className="block w-full rounded-full bg-[#FFF3D6] py-3 text-center text-sm font-semibold text-[#E29F3A] hover:bg-[#FFE7AF]"
                  >
                    Messages
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-full bg-[#FFF3D6] py-3 text-center text-sm font-semibold text-[#E29F3A] hover:bg-[#FFE7AF]"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {/* Pending Actions */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between cursor-pointer"
                onClick={() =>
                  setInvestorExpanded((prev) => ({
                    ...prev,
                    pending: !prev.pending,
                  }))
                }
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3D6] text-sm font-semibold text-[#E29F3A]">
                    4
                  </span>
                  <p className="font-goudy text-sm">Pending Actions</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${investorExpanded.pending ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {investorExpanded.pending && (
                <div className="mt-4 space-y-4 text-xs text-[#4B4B4B]">
                  {investorPendingActions.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-[#1F1F1F]">{item.title}</p>
                        <p className="mt-1 text-[11px] text-[#8E8E93]">{item.description}</p>
                      </div>
                      <ChevronRight className="mt-1 h-3 w-3 text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unread Messages */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between cursor-pointer"
                onClick={() =>
                  setInvestorExpanded((prev) => ({
                    ...prev,
                    messages: !prev.messages,
                  }))
                }
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4F6F4] text-sm font-semibold text-[#2BB673]">
                    5
                  </span>
                  <p className="font-goudy text-sm">Unread Messages</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${investorExpanded.messages ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {investorExpanded.messages && (
                <div className="mt-4 space-y-4 text-xs text-[#4B4B4B]">
                  {investorUnreadMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-1 items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#D2B48C]" />
                        <div>
                          <p className="text-[13px] font-medium text-[#1F1F1F]">{msg.name}</p>
                          <p className="mt-1 text-[11px] text-[#8E8E93]">{msg.preview}</p>
                        </div>
                      </div>
                      <span className="mt-1 text-[11px] text-[#C0C0C0]">{msg.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Your accounts */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between cursor-pointer"
                onClick={() =>
                  setInvestorExpanded((prev) => ({
                    ...prev,
                    accounts: !prev.accounts,
                  }))
                }
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF3D6] text-sm font-semibold text-[#E29F3A]">
                    {investorAccountList.length}
                  </span>
                  <p className="font-goudy text-sm">Your accounts</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${investorExpanded.accounts ? 'rotate-180' : ''
                    }`}
                />
              </button>
              {investorExpanded.accounts && (
                <div className="mt-4 space-y-3 text-xs text-[#4B4B4B]">
                  {investorAccountList.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-xl bg-[#F7F8FA] px-4 py-3"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-[#1F1F1F]">{acc.name}</p>
                        <p className="mt-1 text-[11px] text-[#8E8E93]">{acc.subtitle}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 font-sans">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F]">Dashboard</h1>
          {dashboardRole === 'admin' && (
            <p className="font-helvetica text-sm sm:text-md mt-2">Welcome Back, {welcomeName}</p>
          )}
          {dashboardRole === 'accountant' && (
            <p className="font-helvetica text-sm sm:text-md mt-2">Here’s a summary of your assigned investors and pending actions.</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {roleStats[dashboardRole].map((item) => (
            <div
              key={item.name}
              className="bg-white overflow-hidden shadow-sm rounded-xl p-6 flex flex-col justify-between h-32"
            >
              <dt className="text-md sm:text-lg font-helvetica font-medium truncate">
                {item.name}
              </dt>
              <dd className="text-xl sm:text-3xl font-bold text-[#1F1F1F] font-helvetica">
                {item.value}
              </dd>
            </div>
          ))}
        </div>

        {dashboardRole === 'admin' && (
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
        )}

        {/* Accountant: Figma-style three panels */}
        {dashboardRole === 'accountant' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Assigned Investors */}
              <div className="rounded-2xl bg-white shadow-sm border border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setAssignedOpen((s) => !s)}
                  className="flex w-full items-center justify-between p-6"
                  aria-expanded={assignedOpen}
                  aria-controls="assigned-panel"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF9EE] text-lg font-goudy leading-none text-[#E7A324]">4</span>
                    <h3 className="text-[20px] font-goudy leading-none text-[#2E2E2E]">New Assigned Investor</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${assignedOpen ? 'rotate-180' : ''}`} />
                </button>

                <div id="assigned-panel" aria-hidden={!assignedOpen} className={`p-6 pt-3 overflow-hidden transition-[max-height] duration-300 ${assignedOpen ? 'border-t border-[#EEEEEE] max-h-96' : 'max-h-0'}`}>
                  <div className="pt-0">
                    {recentInvestors.slice(0, 4).map((inv, idx) => (
                      <div key={inv.id} className="flex items-center gap-4 py-3 border-b border-[#EEEEEE] last:border-0">
                        <img src={userIcons[idx % userIcons.length]} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="text-[16px] font-goudy leading-none text-[#2E2E2E]">{inv.fundName}</p>
                          <p className="text-sm font-helvetica text-[#8E8E93]">{inv.accountType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unread Messages */}
              <div className="rounded-2xl bg-white shadow-sm border border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setMessagesOpen((s) => !s)}
                  className="flex w-full items-center justify-between p-6"
                  aria-expanded={messagesOpen}
                  aria-controls="messages-panel"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E4F6F4] text-lg font-goudy leading-none text-[#2BB673]">5</span>
                    <h3 className="text-[20px] font-goudy leading-none text-[#2E2E2E]">Unread Messages</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${messagesOpen ? 'rotate-180' : ''}`} />
                </button>

                <div id="messages-panel" aria-hidden={!messagesOpen} className={`p-6 pt-3 overflow-hidden transition-[max-height] duration-300 ${messagesOpen ? 'border-t border-[#EEEEEE] max-h-96' : 'max-h-0'}`}>
                  <div className="pt-0">
                    {investorUnreadMessages.map((m, idx) => (
                      <div key={m.id} className="flex items-start justify-between gap-3 py-4 border-b border-[#EEEEEE] last:border-0">
                        <div className="flex items-center gap-4">
                          <img src={userIcons[(idx + 1) % userIcons.length]} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                          <div>
                            <p className="text-[16px] font-goudy leading-none text-[#2E2E2E]">{m.name}</p>
                            <p className="mt-1 text-sm font-helvetica text-[#8E8E93] max-w-[260px] truncate">{m.preview}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-[#C0C0C0]">{m.time}</span>
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ECFDF3] text-xs font-medium text-[#2BB673]">{m.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="rounded-2xl bg-white shadow-sm border border-[#F3F4F6]">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((s) => !s)}
                  className="flex w-full items-center justify-between p-6"
                  aria-expanded={notificationsOpen}
                  aria-controls="notifications-panel"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-lg font-goudy leading-none text-[#6366F1]">3</span>
                    <h3 className="text-[20px] font-goudy leading-none text-[#2E2E2E]">Notifications</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${notificationsOpen ? 'rotate-180' : ''}`} />
                </button>

                <div id="notifications-panel" aria-hidden={!notificationsOpen} className={`p-6 pt-3 overflow-hidden transition-[max-height] duration-300 ${notificationsOpen ? 'border-t border-[#EEEEEE] max-h-96' : 'max-h-0'}`}>
                  <div className="pt-0">
                    {notificationsAccountant.map((section) => (
                      <div key={section.day} className="mb-4">
                        <p className="text-xs font-semibold text-[#8E8E93] mb-2">{section.day}</p>
                        {section.items.map((n) => (
                          <div key={n.id} className="text-sm text-[#4B4B4B] border-b border-[#EEEEEE] py-3 last:border-0">
                            <p className="font-medium text-[#1F1F1F]">{n.title} <span className="text-xs text-[#C0C0C0]">• {n.time}</span></p>
                            <p className="mt-1 text-xs font-helvetica text-[#8E8E93]">{n.subtitle}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* {dashboardRole === 'accountant' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#1F1F1F] mb-2">Accounting Access</h3>
            <p className="text-sm text-gray-600">You can view reconciliation, NAV, funding, and redemption operations only.</p>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#1F1F1F] mb-2">Restricted Data</h3>
            <p className="text-sm text-gray-600">Investor management and admin-only operational sections are hidden for this role.</p>
          </div>
        </div>
      )} */}

        {/* Bottom Sections */}
        {dashboardRole === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Funding Requests */}
            <div className="bg-white shadow-sm rounded-xl overflow-hidden">
              <div
                className="p-6 flex items-center justify-between cursor-pointer"
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
                className="p-6 flex items-center justify-between cursor-pointer"
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
                className="p-6 flex items-center justify-between cursor-pointer"
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
        )}

      </div>
    </DashboardLayout>
  );
}

