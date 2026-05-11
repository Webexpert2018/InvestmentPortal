'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, AlertTriangle, MoreVertical, Loader2, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function NAVManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [btcPerformance, setBtcPerformance] = useState<any[]>([]);
  const [btcTableData, setBtcTableData] = useState<any[]>([]);
  const [navRange, setNavRange] = useState('6');
  const [btcRange, setBtcRange] = useState('6');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchNavPerformance();
  }, [navRange]);

  useEffect(() => {
    fetchBtcPerformance();
  }, [btcRange]);

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        apiClient.getNavSummary(),
        apiClient.getNavHistory(),
      ]);
      setSummary(summaryRes);
      setHistory(historyRes);
    } catch (error) {
      console.error('Error fetching base NAV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNavPerformance = async () => {
    try {
      const performanceRes = await apiClient.getPerformance(parseInt(navRange));
      setPerformance(performanceRes);
    } catch (error) {
      console.error('Error fetching NAV performance:', error);
    }
  };

  const fetchBtcPerformance = async () => {
    try {
      const days = parseInt(btcRange) * 30;
      const btcRes = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`);
      const btcData = await btcRes.json();

      if (btcData.prices) {
        const mappedBtc = btcData.prices.map((p: any) => ({
          date: new Date(p[0]).toISOString(),
          value: p[1]
        }));
        setBtcPerformance(mappedBtc);

        // Prepare table data from last 5 entries
        const tableData = btcData.prices.slice(-5).reverse().map((p: any, idx: number) => ({
          id: idx + 1,
          date: new Date(p[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          price: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p[1]),
          source: 'CoinGecko',
          status: 'success'
        }));
        setBtcTableData(tableData);
      }
    } catch (btcErr) {
      console.error('Error fetching live BTC data:', btcErr);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate dynamic change stats for the chart
  const getNavChangeStats = () => {
    if (performance.length < 2) return {
      value: summary?.currentNav || 0,
      change: 0,
      range: navRange === '12' ? '1 Year' : `Last ${navRange} Months`
    };

    const latest = performance[performance.length - 1].value;
    const previous = performance[0].value;
    const change = ((latest - previous) / previous) * 100;

    return {
      value: latest,
      change: change,
      range: navRange === '12' ? '1 Year' : `Last ${navRange} Months`
    };
  };

  const navStats = getNavChangeStats();

  // Calculate dynamic BTC stats
  const getBtcStats = () => {
    if (btcPerformance.length < 2) return {
      value: 0,
      change: 0,
      range: btcRange === '12' ? '1 Year' : `Last ${btcRange} Months`
    };
    const latest = btcPerformance[btcPerformance.length - 1].value;
    const thirtyDaysAgo = btcPerformance[Math.max(0, btcPerformance.length - 31)].value;
    const change = ((latest - thirtyDaysAgo) / thirtyDaysAgo) * 100;
    return {
      value: latest,
      change,
      range: btcRange === '12' ? '1 Year' : `Last ${btcRange} Months`
    };
  };

  const btcStats = getBtcStats();

  // Stats data
  const stats = [
    { label: 'Current NAV', value: summary ? `$${summary.currentNav.toFixed(2)}` : '$0.00' },
    { label: 'Total Fund Value', value: summary ? formatCurrency(summary.totalFundValue) : '$0.00' },
    { label: '30-Day BTC Trend', value: btcStats.change ? `${btcStats.change >= 0 ? '+' : ''}${btcStats.change.toFixed(1)}%` : '+0.0%', isPositive: btcStats.change >= 0 },
    { label: 'Investor Count', value: summary ? summary.investorCount.toLocaleString() : '0' },
  ];

  // Daily BTC Reference data - Now dynamic via btcTableData
  const navHistoryData = history.map(item => {
    const date = new Date(item.effective_date);
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;

    // Map status labels
    const statusLabelMapped = item.status === 'active' ? 'Published' :
      item.status === 'draft' ? 'Draft' : 'Inactive';

    return {
      id: item.id,
      quarter: `Q${quarter}`,
      year: date.getFullYear().toString(),
      pricePerUnit: `$${parseFloat(item.nav_per_unit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalValue: formatCurrency(parseFloat(item.total_fund_value)),
      status: statusLabelMapped,
      rawStatus: item.status
    };
  });


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return 'text-emerald-600 bg-emerald-50';
      case 'Draft':
        return 'text-sky-700 bg-sky-50';
      case 'Inactive':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/nav-management/edit/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await apiClient.deleteNavEntry(deleteId);
      toast.success('NAV entry deleted successfully');
      setDeleteId(null);
      fetchBaseData(); // Refresh list
      fetchNavPerformance(); // Refresh chart
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">NAV Management</h1>
            <p className="text-gray-500 font-medium">Performance Overview</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/nav-management/entry')}
            className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-6 py-2.5 rounded-full font-bold shadow-sm transition-all active:scale-95"
          >
            NAV Entry
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <div className="col-span-4 flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#1F3B6E] animate-spin" />
            </div>
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${stat.isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Performance Overview Section */}
        <div className="mb-8 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900 p-5 border-b">Performance Overview</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Official NAV Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Official NAV Trend</h3>
                <Select value={navRange} onValueChange={setNavRange}>
                  <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 rounded-full">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last month</SelectItem>
                    <SelectItem value="3">Last 3 months</SelectItem>
                    <SelectItem value="6">Last 6 months</SelectItem>
                    <SelectItem value="12">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">${navStats.value.toFixed(2)}</p>
                <p className={`text-sm ${navStats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {navStats.range} {navStats.change >= 0 ? '+' : ''}{navStats.change.toFixed(1)}%
                </p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performance}>
                    <defs>
                      <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FCD34D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      hide={false}
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      tickFormatter={(str) => {
                        try {
                          const date = new Date(str);
                          return date.toLocaleDateString('en-US', { month: 'short' });
                        } catch (e) {
                          return str;
                        }
                      }}
                      stroke="#9CA3AF"
                      dy={10}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                {new Date(payload[0].payload.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                NAV: ${Number(payload[0].value).toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#FCD34D"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#navGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BTC Reference Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">BTC Reference Trend (Unit)</h3>
                <Select value={btcRange} onValueChange={setBtcRange}>
                  <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 rounded-full">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last month</SelectItem>
                    <SelectItem value="3">Last 3 months</SelectItem>
                    <SelectItem value="6">Last 6 months</SelectItem>
                    <SelectItem value="12">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">
                  {btcStats.value > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(btcStats.value) : '$0.00'}
                </p>
                <p className={`text-sm ${btcStats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {btcStats.range} {btcStats.change >= 0 ? '+' : ''}{btcStats.change.toFixed(1)}%
                </p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={btcPerformance}>
                    <defs>
                      <linearGradient id="btcGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6B7FBA" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6B7FBA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      hide={false}
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      tickFormatter={(str) => {
                        try {
                          const date = new Date(str);
                          return date.toLocaleDateString('en-US', { month: 'short' });
                        } catch (e) {
                          return str;
                        }
                      }}
                      stroke="#9CA3AF"
                      dy={10}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                {new Date(payload[0].payload.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                BTC: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(payload[0].value))}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6B7FBA"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#btcGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Daily BTC Reference */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Daily BTC Reference</h3>
            <p className="text-sm text-gray-600 mb-6">Reflects varying market price and official fund NAV</p>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Price (USD)</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Source</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {btcTableData.length > 0 ? btcTableData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{item.date}</td>
                      <td className="px-6 py-4 text-gray-900 font-bold whitespace-nowrap">{item.price}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">{item.source}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.status === 'success' ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <Check className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm text-yellow-600">Fallback</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500 italic">
                        {loading ? 'Fetching live market data...' : 'No BTC data available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* NAV History */}
        <div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900">NAV History</h3>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Quarter</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Year</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">$/sh per unit</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Total Value</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {navHistoryData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-bold whitespace-nowrap">{item.quarter}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{item.year}</td>
                      <td className="px-6 py-4 text-gray-900 font-bold whitespace-nowrap">{item.pricePerUnit}</td>
                      <td className="px-6 py-4 text-gray-900 font-bold whitespace-nowrap">{item.totalValue}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors outline-none">
                              <MoreVertical className="h-5 w-5 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 bg-white">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleEdit(item.id)}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                              onClick={() => handleDeleteClick(item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete NAV Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this NAV history entry? This action cannot be undone and may affect dashboard statistics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}
