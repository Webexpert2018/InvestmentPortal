'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calendar as CalendarIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function NAVEntryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [btcPerformance, setBtcPerformance] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [formData, setFormData] = useState({
    effectiveDate: '',
    totalFundValue: '',
    totalUnits: '',
    navPerUnit: '',
    note: '',
  });

  useEffect(() => {
    fetchHistory();
    fetchStatsData();
    fetchBtcPerformance();
  }, []);

  const fetchStatsData = async () => {
    try {
      setLoadingStats(true);
      const [summaryRes, adminStatsRes] = await Promise.all([
        apiClient.getNavSummary().catch(() => null),
        apiClient.getAdminStats().catch(() => null),
      ]);
      if (summaryRes) setSummary(summaryRes);
      if (adminStatsRes) setAdminStats(adminStatsRes);
    } catch (error) {
      console.error('Error fetching NAV stats data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchBtcPerformance = async () => {
    try {
      const days = 180;
      const btcRes = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`);
      const btcData = await btcRes.json();

      if (btcData.prices) {
        const mappedBtc = btcData.prices.map((p: any) => ({
          date: new Date(p[0]).toISOString(),
          value: p[1],
        }));
        setBtcPerformance(mappedBtc);
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

  const getBtcStats = () => {
    if (btcPerformance.length < 2) return { value: 0, change: 0 };
    const latest = btcPerformance[btcPerformance.length - 1].value;
    const thirtyDaysAgo = btcPerformance[Math.max(0, btcPerformance.length - 31)].value;
    const change = ((latest - thirtyDaysAgo) / thirtyDaysAgo) * 100;
    return { value: latest, change };
  };

  const btcStats = getBtcStats();

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

  const fetchHistory = async () => {
    try {
      const res = await apiClient.getNavHistory();
      setHistory(res.slice(0, 5)); // Keep recent 5
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const recentEntries = history.map(item => {
    const date = new Date(item.effective_date);
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return {
      quarter: `Q${quarter} ${date.getFullYear()}`,
      date: item.effective_date,
      value: `$${parseFloat(item.nav_per_unit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-calculate NAV per Unit when Total Fund Value and Total Units are entered
      if (field === 'totalFundValue' || field === 'totalUnits') {
        const rawValue = value.replace(/[^0-9.]/g, '');
        const fundValue = parseFloat(field === 'totalFundValue' ? rawValue : updated.totalFundValue.replace(/[^0-9.]/g, ''));
        const units = parseFloat(field === 'totalUnits' ? rawValue : updated.totalUnits.replace(/[^0-9.]/g, ''));

        if (!isNaN(fundValue) && !isNaN(units) && units > 0) {
          updated.navPerUnit = (fundValue / units).toFixed(2);
        } else {
          updated.navPerUnit = '';
        }
      }

      return updated;
    });
  };

  const handleCancel = () => {
    router.push('/dashboard/nav-management');
  };

  const handleSaveDraft = async () => {
    submitEntry('draft');
  };

  const handlePublishNAV = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!confirmationChecked) return;
    submitEntry('active');
  };

  const submitEntry = async (status: 'active' | 'draft') => {
    try {
      setSubmitting(true);
      const payload = {
        effective_date: formData.effectiveDate,
        total_fund_value: parseFloat(formData.totalFundValue.replace(/[^0-9.]/g, '')),
        total_units: parseFloat(formData.totalUnits),
        nav_per_unit: parseFloat(formData.navPerUnit),
        note: formData.note,
        status: status,
      };

      await apiClient.createNavEntry(payload);
      setShowPublishModal(false);
      router.push('/dashboard/nav-management');
    } catch (error: any) {
      console.error('Error saving NAV entry:', error);
      alert(error.message || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };
  const cancelPublish = () => {
    setShowPublishModal(false);
    setConfirmationChecked(false);
  };

  const getQuarterYear = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 mb-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="font-medium">Quarterly NAV Entry</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
          {loadingStats ? (
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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-0">Quarterly NAV Entry</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            Enter the official total fund value for the quarter. NAV per unit will be calculated automatically using the system's total units for the selected date.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm p-4 md:p-8">
              <div className="space-y-6">
                {/* Effective Date and Total Fund Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Effective Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal px-4 py-2 h-10 border-gray-300 rounded-lg",
                            !formData.effectiveDate && "text-muted-foreground"
                          )}
                        >
                          {formData.effectiveDate ? (
                            format(new Date(formData.effectiveDate), "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                          <CalendarIcon className="h-5 w-5 text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.effectiveDate ? new Date(formData.effectiveDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              handleInputChange('effectiveDate', format(date, 'yyyy-MM-dd'));
                            }
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cannot be a future date</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Total Fund Value
                    </label>
                    <input
                      type="text"
                      placeholder="$0.00"
                      value={formData.totalFundValue}
                      onChange={(e) => handleInputChange('totalFundValue', e.target.value)}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          handleInputChange('totalFundValue', num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }}
                      onFocus={(e) => {
                        e.target.value = e.target.value.replace(/,/g, '');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Total Units and NAV per Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Total Units (system)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter total units"
                      value={formData.totalUnits}
                      onChange={(e) => handleInputChange('totalUnits', e.target.value)}
                      onBlur={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          handleInputChange('totalUnits', num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
                        }
                      }}
                      onFocus={(e) => {
                        e.target.value = e.target.value.replace(/,/g, '');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      NAV per Unit (calculated)
                    </label>
                    <input
                      type="text"
                      placeholder="$0.00"
                      value={formData.navPerUnit ? parseFloat(formData.navPerUnit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Value / Total Units. Converted to 2 decimal places</p>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Note
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Private note visible only to you</p>
                  <textarea
                    placeholder="Enter note"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formData.note.length}/1000</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] dark:bg-[#1C1C1C] dark:hover:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-800 rounded-full font-medium"
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveDraft}
                      className="px-6 py-2 bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 rounded-full font-medium"
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={handlePublishNAV}
                      className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 dark:text-gray-100 rounded-full font-medium"
                    >
                      Publish NAV
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Recent NAV Entries */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b p-6">Recent NAV Entries</h3>
              <div className="space-y-3 p-6">
                {recentEntries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.quarter}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Publish NAV Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1C1C1C] rounded-lg p-8 w-full max-w-2xl mx-4 relative">
              {/* Close Button */}
              <button
                onClick={cancelPublish}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Confirm Publish NAV</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  You are about to publish the official NAV for {getQuarterYear(formData.effectiveDate)}. This action will recompute positions and performance snapshots, and notify investors (if enabled). Do you want to proceed?
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <div className="mb-8">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-[#1F3B6E] focus:ring-[#1F3B6E] border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    I confirm I have reviewed the calculation and have authorization to publish.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  onClick={cancelPublish}
                  className="px-8 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] dark:bg-[#1C1C1C] dark:hover:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-800 rounded-full font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPublish}
                  disabled={!confirmationChecked}
                  className={`px-8 py-2 rounded-full font-medium ${confirmationChecked
                    ? 'bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 dark:text-gray-100'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
