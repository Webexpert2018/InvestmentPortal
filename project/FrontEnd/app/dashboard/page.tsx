'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin, Wallet, TrendingUp } from 'lucide-react';
import { formatUSD, formatBTC } from '@/lib/utils/bitcoin';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Investment Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your portfolio overview.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bitcoin Balance
              </CardTitle>
              <Bitcoin className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBTC(portfolio?.bitcoinBalance || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total BTC holdings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Portfolio Value
              </CardTitle>
              <Wallet className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatUSD(portfolio?.nav || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Net asset value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Performance
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {portfolio?.performancePercentage?.toFixed(2) || '0.00'}%
              </div>
              <p className="text-xs text-gray-500 mt-1">All-time return</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions yet</p>
                <Button className="mt-4">Make Your First Deposit</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatBTC(tx.amount)}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Make a Deposit
              </Button>
              <Button variant="outline" className="w-full">
                Request Withdrawal
              </Button>
              <Link href="/dashboard/documents">
                <Button variant="outline" className="w-full">
                  View Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Invested:</span>
                <span className="font-semibold">{formatUSD(portfolio?.totalInvested || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Withdrawn:</span>
                <span className="font-semibold">{formatUSD(portfolio?.totalWithdrawn || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Status:</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Active
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
