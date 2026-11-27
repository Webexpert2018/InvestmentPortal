'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [formData, setFormData] = useState({
    effectiveDate: '',
    totalFundValue: '',
    totalUnits: '',
    navPerUnit: '',
    note: '',
  });

  // Active lookup date: either the form's effectiveDate or today's date by default
  const activeLookupDate = useMemo(() => {
    if (formData.effectiveDate) {
      const parts = formData.effectiveDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      const parsed = new Date(formData.effectiveDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [formData.effectiveDate]);

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
      setAllHistory(res || []);
      setHistory((res || []).slice(0, 10)); // Keep recent 10
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const effectiveNav = useMemo(() => {
    if (!activeLookupDate || allHistory.length === 0) return null;
    const lookupDateStr = format(activeLookupDate, 'yyyy-MM-dd');
    const nonDrafts = allHistory.filter(
      item => String(item.status || '').toLowerCase() !== 'draft'
    );
    const eligible = nonDrafts.filter(item => {
      const itemDateStr = String(item.effective_date).slice(0, 10);
      return itemDateStr <= lookupDateStr;
    });
    eligible.sort((a, b) => {
      const dateDiff = new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return eligible[0] || null;
  }, [activeLookupDate, allHistory]);

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

  const recentEntries = history.map(item => {
    const date = new Date(item.effective_date);
    const month = date.getUTCMonth();
    const quarter = Math.floor(month / 3) + 1;
    const year = date.getUTCFullYear();
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });

    const fundVal = parseFloat(item.total_fund_value || 0);
    const unitsNum = parseFloat(item.total_units || 0);
    const navNum = parseFloat(item.nav_per_unit || 0);

    const rawStatusLower = String(item.status || '').toLowerCase();
    const statusLabel = (rawStatusLower === 'active' || rawStatusLower === 'published') ? 'Published' :
      rawStatusLower === 'draft' ? 'Draft' : 'Inactive';

    return {
      id: item.id,
      quarter: `Q${quarter} ${year}`,
      date: item.effective_date,
      formattedDate,
      fundValue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fundVal),
      units: unitsNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      navPerUnit: `$${navNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: statusLabel,
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
          {/* Left Side (col-span-2) - Quarterly NAV Entry Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm p-6 md:p-8 border border-gray-100 dark:border-gray-800">
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

          {/* Right Side (col-span-1) - Historical NAV Lookup synced with Effective Date / Today */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Historical NAV Lookup</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formData.effectiveDate ? 'Active NAV & values for selected date' : "Showing active NAV for today's date"}
                  </p>
                </div>

                {effectiveNav ? (
                  <div className="bg-[#FAF9F5] dark:bg-gray-800/40 rounded-xl p-4 border border-gray-200/60 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          {formData.effectiveDate ? 'Effective Date' : "Default (Today)"}
                        </span>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{format(activeLookupDate, "PPP")}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(effectiveNav.status === 'active' || effectiveNav.status === 'published' ? 'Published' : 'Inactive')}`}>
                        {effectiveNav.status === 'active' || effectiveNav.status === 'published' ? 'Published' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-[#1C1C1C] rounded-lg p-2.5 border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">NAV / Unit</p>
                        <p className="text-sm font-bold text-[#1F3B6E] dark:text-[#FFC63F]">
                          ${parseFloat(effectiveNav.nav_per_unit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-[#1C1C1C] rounded-lg p-2.5 border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Units</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {parseFloat(effectiveNav.total_units || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-[#1C1C1C] rounded-lg p-2.5 border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Fund Value</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(effectiveNav.total_fund_value || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span>Effective Since:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {format(new Date(effectiveNav.effective_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 text-center border border-gray-200/60 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No published or inactive NAV record was effective on or before {format(activeLookupDate, "PPP")}.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-[11px] text-gray-600 dark:text-gray-400">
                <p className="font-semibold text-amber-900 dark:text-amber-300 mb-0.5">Auto-Synced Lookup</p>
                <p>
                  Selecting an <strong>Effective Date</strong> in the form automatically updates these active NAV values. When none is selected, today's active rate is shown by default.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent NAV Entries Table */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent NAV Entries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF9F5] dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Quarter</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Effective Date</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Fund Value</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Units</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">NAV per Unit</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{entry.quarter}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{entry.formattedDate}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{entry.fundValue}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{entry.units}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">{entry.navPerUnit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">
                      No recent NAV entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
