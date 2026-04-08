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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes] = await Promise.all([
        apiClient.getNavSummary(),
        apiClient.getNavHistory()
      ]);
      setSummary(summaryRes);
      setHistory(historyRes);
    } catch (error) {
      console.error('Error fetching NAV data:', error);
    } finally {
      setLoading(false);
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

  // Stats data
  const stats = [
    { label: 'Current NAV', value: summary ? `$${summary.currentNav.toFixed(2)}` : '$0.00' },
    { label: 'Total Fund Value', value: summary ? formatCurrency(summary.totalFundValue) : '$0.00' },
    { label: '30-Day BTC Trend', value: summary?.btcTrend || '+6.2%', isPositive: true },
    { label: 'Investor Count', value: summary ? summary.investorCount.toLocaleString() : '0' },
  ];

  // Daily BTC Reference data
  const btcReferenceData = [
    {
      id: 1,
      date: 'Feb 10, 2025',
      price: '$48,399.08',
      source: 'CoinGecko',
      status: 'success',
    },
    {
      id: 2,
      date: 'Jan 14, 2025',
      price: '$49,500.00',
      source: 'CoinGecko',
      status: 'success',
    },
    {
      id: 3,
      date: 'Jan 14, 2025',
      price: '$0.00',
      source: 'Binance',
      status: 'fallback',
    },
  ];

  // NAV History data - Map from history state
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
      pricePerUnit: `$${parseFloat(item.nav_per_unit).toFixed(2)}`,
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
      fetchData(); // Refresh list
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">NAV Management</h1>
            <p className="text-gray-600">Performance Overview</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/nav-management/entry')}
            className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-6 py-2 rounded-full font-medium"
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
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.isPositive ? 'text-green-600' : 'text-gray-900'}`}>
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Last 6 month</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">$124.50</p>
                <p className="text-sm text-green-600">Last Quarter +2.1%</p>
              </div>

              {/* Chart placeholder - Yellow/Orange gradient area */}
              <div className="relative h-48 bg-gradient-to-b from-yellow-100 to-transparent rounded-lg flex items-end justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 100 Q 50 80, 100 90 T 200 70 T 300 85 T 400 75 L 400 150 L 0 150 Z"
                    fill="url(#navGradient)"
                  />
                  <path
                    d="M 0 100 Q 50 80, 100 90 T 200 70 T 300 85 T 400 75"
                    fill="none"
                    stroke="#FCD34D"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>

            {/* BTC Reference Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">BTC Reference Trend (Unit)</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Last 6 month</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">$45,676.50</p>
                <p className="text-sm text-green-600">Last 30 days +3.5%</p>
              </div>

              {/* Chart placeholder - Blue gradient area */}
              <div className="relative h-48 bg-gradient-to-b from-blue-100 to-transparent rounded-lg flex items-end justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="btcGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6B7FBA" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6B7FBA" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 80 Q 50 60, 100 75 T 200 55 T 300 70 T 400 50 L 400 150 L 0 150 Z"
                    fill="url(#btcGradient)"
                  />
                  <path
                    d="M 0 80 Q 50 60, 100 75 T 200 55 T 300 70 T 400 50"
                    fill="none"
                    stroke="#6B7FBA"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily BTC Reference */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Daily BTC Reference</h3>
            <p className="text-sm text-gray-600 mb-6">Reflects varying market price and official fund NAV</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price (USD)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Source</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {btcReferenceData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{item.date}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.price}</td>
                      <td className="px-6 py-4 text-gray-600">{item.source}</td>
                      <td className="px-6 py-4">
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
                  ))}
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
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quarter</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Year</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">$/sh per unit</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {navHistoryData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{item.quarter}</td>
                      <td className="px-6 py-4 text-gray-900">{item.year}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.pricePerUnit}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.totalValue}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
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
