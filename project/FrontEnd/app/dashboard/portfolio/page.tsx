'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bitcoin, TrendingUp, TrendingDown, Wallet, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function PortfolioPage() {
  const [timeframe, setTimeframe] = useState('1M');

  const portfolioData = {
    totalValue: 127500.00,
    bitcoinBalance: 1.45823,
    avgBuyPrice: 62340.50,
    currentPrice: 87450.00,
    totalGain: 36589.50,
    gainPercentage: 40.26,
    invested: 90910.50,
  };

  const holdings = [
    {
      id: 1,
      asset: 'Bitcoin',
      symbol: 'BTC',
      balance: 1.45823,
      avgPrice: 62340.50,
      currentPrice: 87450.00,
      value: 127500.00,
      change24h: 2.45,
    },
  ];

  const recentActivity = [
    { id: 1, type: 'buy', amount: 0.25, price: 85200, date: '2024-11-18', total: 21300 },
    { id: 2, type: 'buy', amount: 0.50, price: 67800, date: '2024-10-15', total: 33900 },
    { id: 3, type: 'buy', amount: 0.45, price: 58900, date: '2024-09-10', total: 26505 },
    { id: 4, type: 'buy', amount: 0.25823, price: 36500, date: '2024-08-05', total: 9425.50 },
  ];

  const performanceData = [
    { month: 'Jun', value: 65000 },
    { month: 'Jul', value: 72000 },
    { month: 'Aug', value: 68500 },
    { month: 'Sep', value: 85000 },
    { month: 'Oct', value: 95000 },
    { month: 'Nov', value: 127500 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-gray-600 mt-2">Track your Bitcoin investments and performance</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Value
              </CardTitle>
              <Wallet className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolioData.totalValue.toLocaleString()}
              </div>
              <div className="flex items-center mt-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{portfolioData.gainPercentage}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bitcoin Balance
              </CardTitle>
              <Bitcoin className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolioData.bitcoinBalance} BTC
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ${portfolioData.currentPrice.toLocaleString()} per BTC
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Invested
              </CardTitle>
              <DollarSign className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolioData.invested.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Avg: ${portfolioData.avgBuyPrice.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Gain
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${portfolioData.totalGain.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                +{portfolioData.gainPercentage}% all time
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance</CardTitle>
                <div className="flex gap-2">
                  {['1W', '1M', '3M', '1Y', 'ALL'].map((period) => (
                    <Button
                      key={period}
                      variant={timeframe === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeframe(period)}
                      className={timeframe === period ? 'bg-orange-500' : ''}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {performanceData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-orange-500 rounded-t"
                      style={{
                        height: `${(item.value / 130000) * 100}%`,
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <div key={holding.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Bitcoin className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-semibold">{holding.asset}</div>
                          <div className="text-sm text-gray-500">{holding.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${holding.value.toLocaleString()}</div>
                        <div className={`text-sm flex items-center justify-end ${holding.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.change24h >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {Math.abs(holding.change24h)}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Balance</div>
                        <div className="font-medium">{holding.balance} BTC</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Avg Price</div>
                        <div className="font-medium">${holding.avgPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Current</div>
                        <div className="font-medium">${holding.currentPrice.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  Buy More Bitcoin
                </Button>
                <Button variant="outline" className="w-full">
                  Request Withdrawal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      activity.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {activity.type === 'buy' ? (
                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{activity.type} Bitcoin</div>
                      <div className="text-sm text-gray-500">{activity.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{activity.amount} BTC</div>
                    <div className="text-sm text-gray-500">
                      ${activity.total.toLocaleString()} @ ${activity.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
