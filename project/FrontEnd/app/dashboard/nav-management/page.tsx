'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, AlertTriangle, Loader2, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
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
  const [adminStats, setAdminStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [btcPerformance, setBtcPerformance] = useState<any[]>([]);
   const [btcTableData, setBtcTableData] = useState<any[]>([]);
  const [navRange, setNavRange] = useState('12'); // '12' = Last year by default
  const [btcRange, setBtcRange] = useState('6');
  const [tableSort, setTableSort] = useState<'status_asc' | 'status_desc' | 'date_desc' | 'date_asc'>('status_asc');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft' | 'Inactive'>('All');
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
      const [summaryRes, historyRes, adminStatsRes] = await Promise.all([
        apiClient.getNavSummary(),
        apiClient.getNavHistory(),
        apiClient.getAdminStats().catch(() => null),
      ]);
      setSummary(summaryRes);
      setHistory(historyRes);
      if (adminStatsRes) {
        setAdminStats(adminStatsRes);
      }
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

  // Calculate dynamic change stats for Fund Value Growth chart
  const getFundGrowthStats = () => {
    if (!performance || performance.length === 0) return {
      value: summary?.totalInvestments || adminStats?.totalInvestmentValue || 0,
      change: 0,
      range: navRange === '12' ? '1 Year' : `Last ${navRange} Months`
    };

    if (performance.length < 2) return {
      value: performance[0]?.value || summary?.totalInvestments || adminStats?.totalInvestmentValue || 0,
      change: 0,
      range: navRange === '12' ? '1 Year' : `Last ${navRange} Months`
    };

    const latest = performance[performance.length - 1].value;
    const previous = performance[0].value;
    const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

    return {
      value: latest,
      change: change,
      range: navRange === '12' ? '1 Year' : `Last ${navRange} Months`
    };
  };

  const fundStats = getFundGrowthStats();

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
  const totalUnitsVal = adminStats?.totalUnits ?? summary?.totalUnits ?? 0;
  const totalInvestmentsVal = adminStats?.totalInvestmentValue ?? summary?.totalInvestments ?? 0;

  const stats = [
    { label: 'Current NAV', value: summary ? `$${summary.currentNav.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00' },
    { label: 'Total Units', value: Number(totalUnitsVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) },
    { label: 'Total Investments', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(totalInvestmentsVal)) },
    { label: 'Total Fund Value', value: summary ? formatCurrency(summary.totalFundValue) : '$0.00' },
    { label: '30-Day BTC Trend', value: btcStats.change ? `${btcStats.change >= 0 ? '+' : ''}${btcStats.change.toFixed(1)}%` : '+0.0%', isPositive: btcStats.change >= 0 },
    { label: 'Investor Count', value: summary ? summary.investorCount.toLocaleString() : '0' },
  ];

  // NAV History data with Date, Total Units, and Status Sorting (Published first, then Draft)
  const navHistoryData = useMemo(() => {
    const mapped = (history || []).map((item) => {
      const date = new Date(item.effective_date);
      const month = date.getUTCMonth();
      const quarter = Math.floor(month / 3) + 1;

      // Map status labels
      const rawStatusLower = String(item.status || '').toLowerCase();
      const statusLabelMapped = (rawStatusLower === 'active' || rawStatusLower === 'published') ? 'Published' :
        rawStatusLower === 'draft' ? 'Draft' : 'Inactive';

      // Status priority: Published (1) -> Draft (2) -> Inactive (3)
      const statusPriority = statusLabelMapped === 'Published' ? 1 : statusLabelMapped === 'Draft' ? 2 : 3;

      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      });

      const totalUnitsNum = parseFloat(item.total_units || 0);
      const formattedUnits = isNaN(totalUnitsNum)
        ? '0.00'
        : totalUnitsNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

      return {
        id: item.id,
        quarter: `Q${quarter}`,
        formattedDate,
        rawDate: date.getTime(),
        year: date.getUTCFullYear().toString(),
        totalValue: formatCurrency(parseFloat(item.total_fund_value || 0)),
        totalUnits: formattedUnits,
        pricePerUnit: `$${parseFloat(item.nav_per_unit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: statusLabelMapped,
        statusPriority,
        rawStatus: item.status
      };
    });

    const filtered = statusFilter === 'All'
      ? mapped
      : mapped.filter((item) => item.status === statusFilter);

    return filtered.sort((a, b) => {
      if (tableSort === 'status_asc') {
        if (a.statusPriority !== b.statusPriority) {
          return a.statusPriority - b.statusPriority; // Published (1) -> Draft (2) -> Inactive (3)
        }
        return b.rawDate - a.rawDate; // Newest first within same status
      }
      if (tableSort === 'status_desc') {
        if (a.statusPriority !== b.statusPriority) {
          return b.statusPriority - a.statusPriority; // Inactive (3) -> Draft (2) -> Published (1)
        }
        return b.rawDate - a.rawDate; // Newest first within same status
      }
      if (tableSort === 'date_desc') {
        return b.rawDate - a.rawDate; // Date: Newest first
      }
      if (tableSort === 'date_asc') {
        return a.rawDate - b.rawDate; // Date: Oldest first
      }
      return 0;
    });
  }, [history, tableSort, statusFilter]);


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800/30';
      case 'Draft':
        return 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/40 border border-sky-100 dark:border-sky-800/30';
      case 'Inactive':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">NAV Management</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Performance Overview</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/nav-management/entry')}
            className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 dark:text-gray-100 px-6 py-2.5 rounded-full font-bold shadow-sm transition-all active:scale-95"
          >
            NAV Entry
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#1F3B6E] animate-spin" />
            </div>
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-[#1C1C1C] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 sm:p-6 transition-all hover:shadow-md">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 truncate">{stat.label}</p>
                <p className={`text-xl sm:text-2xl lg:text-[26px] font-bold truncate ${stat.isPositive ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}`} title={stat.value}>
                  {stat.value}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Performance Overview Section */}
        <div className="mb-8 bg-white dark:bg-[#1C1C1C]">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 p-5 border-b">Performance Overview</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fund Value Growth */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Fund Value Growth</h3>
                <Select value={navRange} onValueChange={setNavRange}>
                  <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 dark:border-gray-800 rounded-full">
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
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fundStats.value)}
                </p>
                <p className={`text-sm ${fundStats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fundStats.range} {fundStats.change >= 0 ? '+' : ''}{fundStats.change.toFixed(1)}%
                </p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performance}>
                    <defs>
                      <linearGradient id="fundValueGradient" x1="0" y1="0" x2="0" y2="1">
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
                            <div className="bg-white dark:bg-[#1C1C1C] p-3 border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">
                                {new Date(payload[0].payload.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                Fund Value: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(payload[0].value))}
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
                      fill="url(#fundValueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BTC Reference Trend */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">BTC Reference Trend (Unit)</h3>
                <Select value={btcRange} onValueChange={setBtcRange}>
                  <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 dark:border-gray-800 rounded-full">
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
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                            <div className="bg-white dark:bg-[#1C1C1C] p-3 border border-gray-100 dark:border-gray-800 shadow-xl rounded-xl">
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">
                                {new Date(payload[0].payload.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
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

        {/* NAV History */}
        <div>
          <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">NAV History</h3>
                
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl">
                  {(['All', 'Published', 'Draft', 'Inactive'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        statusFilter === st
                          ? 'bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-100 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sort:</span>
                <Select value={tableSort} onValueChange={(val: any) => setTableSort(val)}>
                  <SelectTrigger className="w-[195px] h-8 text-xs border-gray-200 dark:border-gray-800 rounded-lg">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_asc">Status: Published First</SelectItem>
                    <SelectItem value="status_desc">Status: Inactive First</SelectItem>
                    <SelectItem value="date_desc">Date: Newest First</SelectItem>
                    <SelectItem value="date_asc">Date: Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Quarter</th>
                    <th 
                      onClick={() => setTableSort(prev => prev === 'date_desc' ? 'date_asc' : 'date_desc')}
                      className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        {tableSort === 'date_desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1F3B6E] dark:text-[#FFC63F]" />
                        ) : tableSort === 'date_asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1F3B6E] dark:text-[#FFC63F]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Year</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Fund Value</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Total Units</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">$/sh per unit</th>
                    <th 
                      onClick={() => setTableSort(prev => prev === 'status_asc' ? 'status_desc' : 'status_asc')}
                      className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 select-none group"
                    >
                      <div 
                        className="flex items-center gap-1.5"
                        title={tableSort === 'status_asc' ? 'Published First' : tableSort === 'status_desc' ? 'Inactive First' : 'Click to sort by status'}
                      >
                        <span>Status</span>
                        {tableSort === 'status_asc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1F3B6E] dark:text-[#FFC63F]" />
                        ) : tableSort === 'status_desc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1F3B6E] dark:text-[#FFC63F]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {navHistoryData.length > 0 ? (
                    navHistoryData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{item.quarter}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{item.formattedDate}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">{item.year}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{item.totalValue}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{item.totalUnits}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{item.pricePerUnit}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => handleEdit(item.id)}
                              className="p-1.5 text-gray-500 hover:text-[#1F3B6E] hover:bg-blue-50 dark:text-gray-400 dark:hover:text-[#FFC63F] dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => handleDeleteClick(item.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-400 italic">
                        {loading ? 'Loading NAV history...' : 'No NAV history entries found'}
                      </td>
                    </tr>
                  )}
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
