'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Calendar as CalendarIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function EditNAVEntryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [formData, setFormData] = useState({
    effectiveDate: '',
    totalFundValue: '',
    totalUnits: '',
    navPerUnit: '',
    note: '',
    status: '',
  });

  useEffect(() => {
    fetchEntryData();
    fetchHistory();
  }, [id]);

  const fetchEntryData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNavEntryById(id);
      setFormData({
        effectiveDate: data.effective_date,
        totalFundValue: data.total_fund_value.toString(),
        totalUnits: data.total_units.toString(),
        navPerUnit: data.nav_per_unit.toString(),
        note: data.note || '',
        status: data.status,
      });
    } catch (error: any) {
      console.error('Error fetching entry:', error);
      toast.error('Failed to load NAV entry details');
      router.push('/dashboard/nav-management');
    } finally {
      setLoading(false);
    }
  };

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
      value: `$${parseFloat(item.nav_per_unit).toFixed(2)}`
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
        const fundValue = parseFloat(field === 'totalFundValue' ? value : updated.totalFundValue);
        const units = parseFloat(field === 'totalUnits' ? value : updated.totalUnits);
        
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
    submitUpdate('draft');
  };

  const handlePublishNAV = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!confirmationChecked) return;
    submitUpdate('active');
  };

  const submitUpdate = async (status: 'active' | 'draft') => {
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

      await apiClient.updateNavEntry(id, payload);
      toast.success(`Entry ${status === 'active' ? 'published' : 'saved as draft'} successfully`);
      setShowPublishModal(false);
      router.push('/dashboard/nav-management');
    } catch (error: any) {
      console.error('Error updating NAV entry:', error);
      toast.error(error.message || 'Failed to update entry');
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 text-[#1F3B6E] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="font-medium">Edit NAV Entry</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-0">Edit NAV Entry</h1>
          <p className="text-sm text-gray-600 mt-3">
            Update the official fund value for this entry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="space-y-6">
                {/* Effective Date and Total Fund Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
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
                    <p className="text-xs text-gray-500 mt-1">Cannot be a future date</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Total Fund Value
                    </label>
                    <input
                      type="text"
                      placeholder="$0.00"
                      value={formData.totalFundValue}
                      onChange={(e) => handleInputChange('totalFundValue', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Total Units and NAV per Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Total Units (system)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter total units"
                      value={formData.totalUnits}
                      onChange={(e) => handleInputChange('totalUnits', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      NAV per Unit (calculated)
                    </label>
                    <input
                      type="text"
                      placeholder="$0.00"
                      value={formData.navPerUnit}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total Value / Total Units. Converted to 2 decimal places</p>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Note
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Private note visible only to you</p>
                  <textarea
                    placeholder="Enter note"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">{formData.note.length}/1000</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                  <Button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-700 rounded-full font-medium"
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveDraft}
                      className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full font-medium"
                    >
                      Update as Draft
                    </Button>
                    <Button
                      onClick={handlePublishNAV}
                      className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-full font-medium"
                    >
                      Update & Publish
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Recent NAV Entries */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 border-b p-6">Recent NAV Entries</h3>
              <div className="space-y-3 p-6">
                {recentEntries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.quarter}</p>
                      <p className="text-xs text-gray-500">{entry.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{entry.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Publish NAV Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-4 relative">
              {/* Close Button */}
              <button
                onClick={cancelPublish}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Confirm Update & Publish</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  You are about to update and publish the official NAV for {getQuarterYear(formData.effectiveDate)}. If this is changed to 'Published', any previous active NAV will be retired. Do you want to proceed?
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
                  <span className="ml-3 text-sm text-gray-700">
                    I confirm I have reviewed the calculation and have authorization to publish.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  onClick={cancelPublish}
                  className="px-8 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 rounded-full font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPublish}
                  disabled={!confirmationChecked}
                  className={`px-8 py-2 rounded-full font-medium ${
                    confirmationChecked
                      ? 'bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirm & Update
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
