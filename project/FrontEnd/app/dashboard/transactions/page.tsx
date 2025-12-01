'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownRight, ArrowUpRight, Search, Filter, Download } from 'lucide-react';

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const transactions = [
    {
      id: 'TX001',
      type: 'deposit',
      amount: 0.25,
      usdValue: 21300,
      price: 85200,
      status: 'completed',
      date: '2024-11-18T10:30:00',
      txHash: '0x1a2b3c4d5e6f7g8h9i0j',
      fee: 15.50,
    },
    {
      id: 'TX002',
      type: 'deposit',
      amount: 0.50,
      usdValue: 33900,
      price: 67800,
      status: 'completed',
      date: '2024-10-15T14:22:00',
      txHash: '0x9i8h7g6f5e4d3c2b1a0',
      fee: 18.00,
    },
    {
      id: 'TX003',
      type: 'withdrawal',
      amount: 0.10,
      usdValue: 8500,
      price: 85000,
      status: 'pending',
      date: '2024-11-19T09:15:00',
      txHash: null,
      fee: 25.00,
    },
    {
      id: 'TX004',
      type: 'deposit',
      amount: 0.45,
      usdValue: 26505,
      price: 58900,
      status: 'completed',
      date: '2024-09-10T16:45:00',
      txHash: '0xa1b2c3d4e5f6g7h8i9j0',
      fee: 12.75,
    },
    {
      id: 'TX005',
      type: 'deposit',
      amount: 0.25823,
      usdValue: 9425.50,
      price: 36500,
      status: 'completed',
      date: '2024-08-05T11:20:00',
      txHash: '0xf9e8d7c6b5a4938271',
      fee: 10.00,
    },
    {
      id: 'TX006',
      type: 'withdrawal',
      amount: 0.05,
      usdValue: 3200,
      price: 64000,
      status: 'failed',
      date: '2024-07-22T13:30:00',
      txHash: null,
      fee: 0,
    },
  ];

  const stats = {
    totalDeposits: 1.45823,
    totalWithdrawals: 0.15,
    totalFees: 81.25,
    successRate: 91.67,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-gray-600 mt-2">View and manage your transaction history</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeposits} BTC</div>
              <p className="text-xs text-gray-500 mt-1">Lifetime deposits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWithdrawals} BTC</div>
              <p className="text-xs text-gray-500 mt-1">Lifetime withdrawals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalFees}</div>
              <p className="text-xs text-gray-500 mt-1">Network & service fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
              <p className="text-xs text-gray-500 mt-1">Transaction success</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Transaction History</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-6 w-6 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-lg capitalize">{tx.type}</div>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Amount</div>
                            <div className="font-medium">{tx.amount} BTC</div>
                          </div>
                          <div>
                            <div className="text-gray-500">USD Value</div>
                            <div className="font-medium">${tx.usdValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Price</div>
                            <div className="font-medium">${tx.price.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Fee</div>
                            <div className="font-medium">${tx.fee.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Transaction ID: </span>
                            <span className="font-mono">{tx.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Date: </span>
                            <span>{new Date(tx.date).toLocaleString()}</span>
                          </div>
                        </div>
                        {tx.txHash && (
                          <div className="mt-2 text-xs">
                            <span className="text-gray-500">Hash: </span>
                            <span className="font-mono text-blue-600">{tx.txHash}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm" className="bg-orange-500 text-white hover:bg-orange-600">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
