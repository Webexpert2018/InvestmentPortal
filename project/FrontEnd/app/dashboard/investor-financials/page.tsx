"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  Landmark, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  Building, 
  CreditCard, 
  User, 
  Mail, 
  FileText, 
  Check, 
  AlertCircle,
  RefreshCw,
  Link as LinkIcon,
  X,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface InvestorFinancial {
  id: string;
  name: string | null;
  email: string | null;
  investor_id: string | null;
  income: number;
  expenses: number;
  liability: number;
  assets: number;
  notes: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  investorName?: string | null;
  investorEmail?: string | null;
  investorKycStatus?: string | null;
}

export default function InvestorFinancialsPage() {
  const [records, setRecords] = useState<InvestorFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Editable local state for the currently expanded record
  const [editState, setEditState] = useState<{
    [id: string]: {
      name: string;
      email: string;
      income: string;
      expenses: string;
      liability: string;
      assets: string;
      notes: string;
      saving: boolean;
      savedSuccess: boolean;
      error: string | null;
    };
  }>({});

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newForm, setNewForm] = useState<{
    name: string;
    email: string;
    investor_id: string;
    income: string;
    expenses: string;
    liability: string;
    assets: string;
    notes: string;
    imageFile: File | null;
    imagePreview: string | null;
  }>({
    name: '',
    email: '',
    investor_id: '',
    income: '',
    expenses: '',
    liability: '',
    assets: '',
    notes: '',
    imageFile: null,
    imagePreview: null,
  });
  const [modalDragOver, setModalDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Search existing investors for linking
  const [registeredInvestors, setRegisteredInvestors] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [linkingQuery, setLinkingQuery] = useState('');
  const [isSearchingInvestors, setIsSearchingInvestors] = useState(false);

  // Image Upload & Preview State
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [id: string]: string }>({});
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Fixed Image Size Limit Validation: 5 MB
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

  const handleImageFileChange = async (id: string, file: File | null) => {
    if (!file) return;

    // 1. Validation for Image Format
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageErrors((prev) => ({
        ...prev,
        [id]: 'Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.',
      }));
      return;
    }

    // 2. Frontend Validation for Fixed Image Size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setImageErrors((prev) => ({
        ...prev,
        [id]: `Image size (${actualSizeMB} MB) exceeds the fixed maximum limit of ${MAX_IMAGE_SIZE_MB} MB. Please select a smaller image.`,
      }));
      return;
    }

    // Clear previous errors and upload to Cloudinary
    setImageErrors((prev) => ({ ...prev, [id]: '' }));
    setUploadingImageId(id);

    try {
      const res = await apiClient.uploadInvestorFinancialImage(id, file);
      if (res && res.imageUrl) {
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, imageUrl: res.imageUrl } : r))
        );
      }
    } catch (err: any) {
      setImageErrors((prev) => ({
        ...prev,
        [id]: err.message || 'Failed to upload image to Cloudinary.',
      }));
    } finally {
      setUploadingImageId(null);
    }
  };

  // Fetch all records
  const fetchRecords = async (query = search) => {
    try {
      setLoading(true);
      const data = await apiClient.getInvestorFinancials(query);
      setRecords(data || []);
      
      // Auto-expand first record if none is expanded
      if (!expandedId && data && data.length > 0) {
        setExpandedId(data[0].id);
        initEditState(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load investor financials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords('');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords(search);
  };

  const initEditState = (rec: InvestorFinancial) => {
    setEditState((prev) => ({
      ...prev,
      [rec.id]: {
        name: rec.name || '',
        email: rec.email || '',
        income: rec.income !== undefined && rec.income !== null ? String(rec.income) : '0',
        expenses: rec.expenses !== undefined && rec.expenses !== null ? String(rec.expenses) : '0',
        liability: rec.liability !== undefined && rec.liability !== null ? String(rec.liability) : '0',
        assets: rec.assets !== undefined && rec.assets !== null ? String(rec.assets) : '0',
        notes: rec.notes || '',
        saving: false,
        savedSuccess: false,
        error: null,
      },
    }));
  };

  const toggleExpand = (rec: InvestorFinancial) => {
    if (expandedId === rec.id) {
      setExpandedId(null);
    } else {
      setExpandedId(rec.id);
      if (!editState[rec.id]) {
        initEditState(rec);
      }
    }
  };

  const handleFieldChange = (id: string, field: string, value: string) => {
    // 1. Update edit state with fallback to in-memory record to preserve all other fields
    setEditState((prev) => {
      const rec = records.find((r) => r.id === id);
      const existing = prev[id] || {
        name: rec?.name || '',
        email: rec?.email || '',
        income: rec?.income !== undefined ? String(rec.income) : '0',
        expenses: rec?.expenses !== undefined ? String(rec.expenses) : '0',
        liability: rec?.liability !== undefined ? String(rec.liability) : '0',
        assets: rec?.assets !== undefined ? String(rec.assets) : '0',
        notes: rec?.notes || '',
        saving: false,
        savedSuccess: false,
        error: null,
      };

      return {
        ...prev,
        [id]: {
          ...existing,
          [field]: value,
          savedSuccess: false,
          error: null,
        },
      };
    });

    // 2. Also update records in real-time so Net Worth and card headers update instantly
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'income') return { ...r, income: parseFloat(value) || 0 };
        if (field === 'expenses') return { ...r, expenses: parseFloat(value) || 0 };
        if (field === 'assets') return { ...r, assets: parseFloat(value) || 0 };
        if (field === 'liability') return { ...r, liability: parseFloat(value) || 0 };
        if (field === 'name') return { ...r, name: value };
        if (field === 'email') return { ...r, email: value };
        if (field === 'notes') return { ...r, notes: value };
        return r;
      })
    );
  };

  const handleSaveRow = async (id: string) => {
    const rec = records.find((r) => r.id === id);
    const cur = editState[id] || {
      name: rec?.name || '',
      email: rec?.email || '',
      income: String(rec?.income ?? 0),
      expenses: String(rec?.expenses ?? 0),
      liability: String(rec?.liability ?? 0),
      assets: String(rec?.assets ?? 0),
      notes: rec?.notes || '',
    };

    const resolvedName = (cur.name !== undefined ? cur.name : (rec?.name || '')).trim();
    if (!resolvedName) {
      setEditState((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || cur),
          saving: false,
          error: 'Name is required and cannot be empty.',
        },
      }));
      return;
    }

    setEditState((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || cur), saving: true, error: null, savedSuccess: false },
    }));

    try {
      const payload = {
        name: resolvedName,
        email: (cur.email !== undefined ? cur.email : (rec?.email || '')).trim() || null,
        income: parseFloat(String(cur.income !== undefined ? cur.income : (rec?.income ?? 0))) || 0,
        expenses: parseFloat(String(cur.expenses !== undefined ? cur.expenses : (rec?.expenses ?? 0))) || 0,
        liability: parseFloat(String(cur.liability !== undefined ? cur.liability : (rec?.liability ?? 0))) || 0,
        assets: parseFloat(String(cur.assets !== undefined ? cur.assets : (rec?.assets ?? 0))) || 0,
        notes: cur.notes !== undefined ? cur.notes : (rec?.notes || null),
      };

      const updated = await apiClient.updateInvestorFinancial(id, payload);

      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );

      setEditState((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || cur), saving: false, savedSuccess: true, error: null },
      }));

      setTimeout(() => {
        setEditState((prev) => ({
          ...prev,
          [id]: { ...(prev[id] || cur), savedSuccess: false },
        }));
      }, 3000);
    } catch (err: any) {
      setEditState((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || cur),
          saving: false,
          error: err.message || 'Failed to save changes',
        },
      }));
    }
  };

  const handleDeleteRow = async (id: string, name: string | null) => {
    const displayName = name || 'this potential investor';
    if (!window.confirm(`Are you sure you want to remove ${displayName}?`)) {
      return;
    }

    try {
      await apiClient.deleteInvestorFinancial(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      alert(`Error deleting record: ${err.message || 'Unknown error'}`);
    }
  };

  // Searching registered investors for modal linking
  const searchInvestors = async (q: string) => {
    setIsSearchingInvestors(true);
    try {
      const res = await apiClient.searchRegisteredInvestors(q);
      setRegisteredInvestors(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingInvestors(false);
    }
  };

  const handleModalImageSelect = (file: File | null) => {
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAddError('Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setAddError(`Image size (${actualSizeMB} MB) exceeds the fixed maximum limit of ${MAX_IMAGE_SIZE_MB} MB.`);
      return;
    }

    setAddError(null);
    setNewForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleOpenAddModal = () => {
    setNewForm({
      name: '',
      email: '',
      investor_id: '',
      income: '',
      expenses: '',
      liability: '',
      assets: '',
      notes: '',
      imageFile: null,
      imagePreview: null,
    });
    setModalDragOver(false);
    setAddError(null);
    setLinkingQuery('');
    setRegisteredInvestors([]);
    setIsAddModalOpen(true);
    searchInvestors('');
  };

  const handleSelectRegisteredInvestor = (inv: { id: string; name: string; email: string }) => {
    setNewForm((prev) => ({
      ...prev,
      investor_id: inv.id,
      name: prev.name || inv.name,
      email: prev.email || inv.email,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newForm.name || !newForm.name.trim()) {
      setAddError('Please enter a name for the potential investor.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        name: newForm.name.trim(),
        email: newForm.email?.trim() || undefined,
        investor_id: newForm.investor_id || undefined,
        income: newForm.income ? parseFloat(newForm.income) : 0,
        expenses: newForm.expenses ? parseFloat(newForm.expenses) : 0,
        liability: newForm.liability ? parseFloat(newForm.liability) : 0,
        assets: newForm.assets ? parseFloat(newForm.assets) : 0,
        notes: newForm.notes || undefined,
      };

      let created = await apiClient.createInvestorFinancial(payload);

      // If an image was selected in the modal, upload to Cloudinary right away
      if (newForm.imageFile) {
        try {
          const imgRes = await apiClient.uploadInvestorFinancialImage(created.id, newForm.imageFile);
          if (imgRes && imgRes.imageUrl) {
            created = { ...created, imageUrl: imgRes.imageUrl };
          }
        } catch (uploadErr) {
          console.warn('Image upload error after create:', uploadErr);
        }
      }

      setRecords((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setExpandedId(created.id);
      initEditState(created);
    } catch (err: any) {
      setAddError(err.message || 'Failed to create investor record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <DashboardLayout>
      <div className="p-6 w-full space-y-6">
        {/* Top Banner / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-700 border border-amber-200/60">
                <Landmark className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
                Investor Financials
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Store and track financial discovery information (income, expenses, assets, liabilities) for prospective and field investors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRecords()}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#F3C046] hover:bg-[#e2b13c] text-slate-900 font-medium rounded-lg shadow-sm transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Potential Investor
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by person name, email, or linked investor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchRecords('');
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {/* List & Expandable Dropdown Cards */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          <p className="text-sm">Loading investor financials...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <Landmark className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No investor financials found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Start by adding your first prospective or meeting investor.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#F3C046] hover:bg-[#e2b13c] text-slate-900 font-medium rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Person
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const edit = editState[rec.id] || {
              name: rec.name || '',
              email: rec.email || '',
              income: String(rec.income ?? 0),
              expenses: String(rec.expenses ?? 0),
              liability: String(rec.liability ?? 0),
              assets: String(rec.assets ?? 0),
              notes: rec.notes || '',
              saving: false,
              savedSuccess: false,
              error: null,
            };

            const displayName = (edit.name !== undefined && edit.name !== '' ? edit.name : rec.name) || rec.investorName || 'Unnamed Prospect';
            const displayEmail = (edit.email !== undefined && edit.email !== '' ? edit.email : rec.email) || rec.investorEmail || 'No email specified';
            const netWorth = (Number(edit.assets !== undefined && edit.assets !== '' ? edit.assets : rec.assets) || 0) -
                             (Number(edit.liability !== undefined && edit.liability !== '' ? edit.liability : rec.liability) || 0);

            return (
              <div
                key={rec.id}
                className="bg-white border border-slate-200/90 rounded-xl shadow-sm transition-all hover:border-slate-300 overflow-hidden"
              >
                {/* Header Row / Toggle */}
                <div
                  onClick={() => toggleExpand(rec)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm tracking-wider uppercase font-serif">
                      {displayName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-base">
                          {displayName}
                        </span>
                        {rec.investor_id && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            <LinkIcon className="w-3 h-3" />
                            Registered Investor
                          </span>
                        )}
                        {rec.imageUrl && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImageUrl(rec.imageUrl!);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Click to view attached document/image"
                          >
                            <ImageIcon className="w-3 h-3" />
                            Image
                          </span>
                        )}
                        {!rec.name && !rec.email && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                            Draft Entry
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{displayEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary preview & actions */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Net Worth</div>
                      <div className={`text-sm font-bold font-serif ${netWorth >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatCurrency(netWorth)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(rec.id, displayName);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180 text-slate-700' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Dropdown Details: Smooth Transition */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100 border-t border-slate-200/80' : 'grid-rows-[0fr] opacity-0 border-t-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-5 sm:p-6 bg-slate-50/40 space-y-5">
                      {/* Person Contact Details Inline */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Full Name <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            value={edit.name}
                            onChange={(e) => handleFieldChange(rec.id, 'name', e.target.value)}
                            onBlur={() => handleSaveRow(rec.id)}
                            placeholder="e.g. John Doe"
                            className={`w-full px-3 py-1.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                              !edit.name?.trim() && edit.error
                                ? 'border-rose-400 focus:ring-rose-400/40 focus:border-rose-400'
                                : 'border-slate-200 focus:ring-amber-400/40 focus:border-amber-400'
                            }`}
                          />
                          {!edit.name?.trim() && edit.error && (
                            <span className="text-[11px] text-rose-500 mt-1 block">
                              Name cannot be empty
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={edit.email}
                            onChange={(e) => handleFieldChange(rec.id, 'email', e.target.value)}
                            onBlur={() => handleSaveRow(rec.id)}
                            placeholder="e.g. john@example.com"
                            className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* 4 Colored Neutral Financial Cards in 2x2 Grid */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Financial Breakdown (Editable)
                          </span>
                          <span className="text-xs text-slate-400">
                            Values update net worth in real-time
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 1. Income Card (Soft Sage Tint) */}
                          <div className="bg-[#F0F7F2] border-2 border-[#C2E2CC] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#1E5C32] uppercase tracking-wide">
                                Income
                              </span>
                              <div className="p-1.5 bg-[#D5EEDC] text-[#1E5C32] rounded-lg border border-[#BDE3C8]">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="text-[11px] text-[#2E6B42] font-medium mb-2">
                              Annual / Ongoing revenue
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2E6B42] text-sm font-semibold">
                                $
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={edit.income}
                                onChange={(e) => handleFieldChange(rec.id, 'income', e.target.value)}
                                onBlur={() => handleSaveRow(rec.id)}
                                className="w-full pl-7 pr-3 py-2 bg-white border border-[#BDE3C8] rounded-lg text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 shadow-sm"
                              />
                            </div>
                          </div>

                          {/* 2. Expenses Card (Soft Amber Tint) */}
                          <div className="bg-[#FEF7ED] border-2 border-[#F9DFC0] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#8C4F13] uppercase tracking-wide">
                                Expenses
                              </span>
                              <div className="p-1.5 bg-[#FCECDA] text-[#8C4F13] rounded-lg border border-[#F5D7B1]">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="text-[11px] text-[#8F5B25] font-medium mb-2">
                              Annual commitments & costs
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F5B25] text-sm font-semibold">
                                $
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={edit.expenses}
                                onChange={(e) => handleFieldChange(rec.id, 'expenses', e.target.value)}
                                onBlur={() => handleSaveRow(rec.id)}
                                className="w-full pl-7 pr-3 py-2 bg-white border border-[#F5D7B1] rounded-lg text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-500 shadow-sm"
                              />
                            </div>
                          </div>

                          {/* 3. Assets Card (Soft Sky Blue Tint) */}
                          <div className="bg-[#F0F6FF] border-2 border-[#BFDBFE] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wide">
                                Assets
                              </span>
                              <div className="p-1.5 bg-[#DBEAFE] text-[#1D4ED8] rounded-lg border border-[#BFDBFE]">
                                <Building className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="text-[11px] text-[#2563EB] font-medium mb-2">
                              Real estate, liquid, equity
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB] text-sm font-semibold">
                                $
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={edit.assets}
                                onChange={(e) => handleFieldChange(rec.id, 'assets', e.target.value)}
                                onBlur={() => handleSaveRow(rec.id)}
                                className="w-full pl-7 pr-3 py-2 bg-white border border-[#BFDBFE] rounded-lg text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-500 shadow-sm"
                              />
                            </div>
                          </div>

                          {/* 4. Liabilities Card (Soft Rose Tint) */}
                          <div className="bg-[#FFF1F2] border-2 border-[#FECDD3] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#BE123C] uppercase tracking-wide">
                                Liabilities
                              </span>
                              <div className="p-1.5 bg-[#FFE4E6] text-[#BE123C] rounded-lg border border-[#FECDD3]">
                                <CreditCard className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="text-[11px] text-[#9F1239] font-medium mb-2">
                              Mortgages, loans & debts
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BE123C] text-sm font-semibold">
                                $
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={edit.liability}
                                onChange={(e) => handleFieldChange(rec.id, 'liability', e.target.value)}
                                onBlur={() => handleSaveRow(rec.id)}
                                className="w-full pl-7 pr-3 py-2 bg-white border border-[#FECDD3] rounded-lg text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-500 shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Meeting Notes and Cloudinary Image Upload (2 Columns) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Column 1: Notes */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                            Meeting Notes & Observations
                          </label>
                          <textarea
                            rows={4}
                            value={edit.notes}
                            onChange={(e) => handleFieldChange(rec.id, 'notes', e.target.value)}
                            onBlur={() => handleSaveRow(rec.id)}
                            placeholder="Add notes from discovery meetings, investment appetite, target horizon..."
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                          />
                        </div>

                        {/* Column 2: Image Upload (Cloudinary with fixed 5MB validation) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Discovery Document / Card Image
                            </label>
                            <span className="text-[11px] text-slate-400">Fixed max: 5 MB</span>
                          </div>

                          {imageErrors[rec.id] && (
                            <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{imageErrors[rec.id]}</span>
                            </div>
                          )}

                          {rec.imageUrl ? (
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (dragOverId !== rec.id) setDragOverId(rec.id);
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(rec.id);
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(null);
                                const file = e.dataTransfer.files?.[0] || null;
                                if (file) handleImageFileChange(rec.id, file);
                              }}
                              className={`p-3 bg-white border-2 rounded-xl flex items-center justify-between gap-3 shadow-sm transition-all ${
                                dragOverId === rec.id
                                  ? 'border-amber-500 bg-amber-50/50 ring-4 ring-amber-400/20 scale-[1.01]'
                                  : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div
                                  onClick={() => setPreviewImageUrl(rec.imageUrl!)}
                                  className="w-14 h-14 relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer flex-shrink-0 group"
                                  title="Click to view full image"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={rec.imageUrl}
                                    alt="Discovery Document"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Eye className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="text-xs">
                                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                    Image Attached
                                  </div>
                                  <div className="text-slate-400 text-[11px] truncate max-w-[200px]">
                                    {dragOverId === rec.id ? (
                                      <span className="text-amber-700 font-semibold animate-pulse">
                                        Drop to replace image!
                                      </span>
                                    ) : (
                                      'Uploaded to Cloudinary (or drag new file to replace)'
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImageUrl(rec.imageUrl!)}
                                    className="text-[11px] text-amber-600 hover:text-amber-700 font-medium underline mt-0.5 inline-block"
                                  >
                                    View Full Size
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                                  {uploadingImageId === rec.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                                      Replace
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="hidden"
                                    disabled={uploadingImageId === rec.id}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      handleImageFileChange(rec.id, file);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (dragOverId !== rec.id) setDragOverId(rec.id);
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(rec.id);
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverId(null);
                                const file = e.dataTransfer.files?.[0] || null;
                                if (file) handleImageFileChange(rec.id, file);
                              }}
                              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center ${
                                dragOverId === rec.id
                                  ? 'border-amber-500 bg-amber-50/70 ring-4 ring-amber-400/20 scale-[1.01]'
                                  : 'border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/20'
                              }`}
                            >
                              {uploadingImageId === rec.id ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                  <span className="text-xs font-medium text-slate-600">Uploading to Cloudinary...</span>
                                </>
                              ) : dragOverId === rec.id ? (
                                <>
                                  <div className="p-2 bg-amber-100 rounded-full text-amber-700 animate-bounce">
                                    <UploadCloud className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-amber-800">
                                      Drop Image to Upload
                                    </span>
                                    <span className="text-[11px] text-amber-600 block mt-0.5">
                                      Validating fixed 5 MB size limit
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="p-1.5 bg-amber-50 rounded-full text-amber-600">
                                    <UploadCloud className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold text-slate-800">
                                      Drag & Drop Document / Card Image here
                                    </span>
                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                      Or click to browse • Supports JPG, PNG, WebP (Max 5 MB)
                                    </span>
                                  </div>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                disabled={uploadingImageId === rec.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleImageFileChange(rec.id, file);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Action Toolbar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          {edit.savedSuccess && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                              Changes saved successfully
                            </span>
                          )}
                          {edit.error && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-medium bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {edit.error}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(rec.id)}
                            disabled={edit.saving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {edit.saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Person / Potential Investor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">Add Potential Investor</h3>
                  <p className="text-xs text-slate-500">Record a new lead or meeting financial profile</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Optional Link to Registered Investor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Link Registered Investor (Optional)
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={linkingQuery}
                    onChange={(e) => {
                      setLinkingQuery(e.target.value);
                      searchInvestors(e.target.value);
                    }}
                    placeholder="Search existing investor by name or email..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                  {registeredInvestors.length > 0 && linkingQuery && (
                    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 shadow-sm">
                      {registeredInvestors.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => handleSelectRegisteredInvestor(inv)}
                          className="px-3 py-2 text-xs hover:bg-amber-50/60 cursor-pointer flex justify-between items-center"
                        >
                          <span className="font-medium text-slate-800">{inv.name}</span>
                          <span className="text-slate-400">{inv.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {newForm.investor_id && (
                    <div className="text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded inline-flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      Linked to registered investor ID: {newForm.investor_id.slice(0, 8)}...
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.name}
                    onChange={(e) => {
                      setNewForm({ ...newForm, name: e.target.value });
                      if (addError) setAddError(null);
                    }}
                    placeholder="e.g. Michael Smith"
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      addError && !newForm.name.trim()
                        ? 'border-rose-400 focus:ring-rose-400/40 focus:border-rose-400'
                        : 'border-slate-200 focus:ring-amber-400/40'
                    }`}
                  />
                  {addError && !newForm.name.trim() && (
                    <span className="text-[11px] text-rose-500 mt-1 block">
                      Name is required
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    placeholder="e.g. michael@example.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>
              </div>

              {/* 4 Financial Grid Fields */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Financial Values (Initial)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F0F7F2] p-3 rounded-xl border-2 border-[#C2E2CC]">
                    <span className="text-xs font-bold text-[#1E5C32] block mb-1">Income</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2E6B42] text-xs font-semibold">$</span>
                      <input
                        type="number"
                        step="any"
                        value={newForm.income}
                        onChange={(e) => setNewForm({ ...newForm, income: e.target.value })}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-1.5 text-sm bg-white border border-[#BDE3C8] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                      />
                    </div>
                  </div>

                  <div className="bg-[#FEF7ED] p-3 rounded-xl border-2 border-[#F9DFC0]">
                    <span className="text-xs font-bold text-[#8C4F13] block mb-1">Expenses</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8F5B25] text-xs font-semibold">$</span>
                      <input
                        type="number"
                        step="any"
                        value={newForm.expenses}
                        onChange={(e) => setNewForm({ ...newForm, expenses: e.target.value })}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-1.5 text-sm bg-white border border-[#F5D7B1] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                      />
                    </div>
                  </div>

                  <div className="bg-[#F0F6FF] p-3 rounded-xl border-2 border-[#BFDBFE]">
                    <span className="text-xs font-bold text-[#1D4ED8] block mb-1">Assets</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2563EB] text-xs font-semibold">$</span>
                      <input
                        type="number"
                        step="any"
                        value={newForm.assets}
                        onChange={(e) => setNewForm({ ...newForm, assets: e.target.value })}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-1.5 text-sm bg-white border border-[#BFDBFE] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      />
                    </div>
                  </div>

                  <div className="bg-[#FFF1F2] p-3 rounded-xl border-2 border-[#FECDD3]">
                    <span className="text-xs font-bold text-[#BE123C] block mb-1">Liabilities</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#BE123C] text-xs font-semibold">$</span>
                      <input
                        type="number"
                        step="any"
                        value={newForm.liability}
                        onChange={(e) => setNewForm({ ...newForm, liability: e.target.value })}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-1.5 text-sm bg-white border border-[#FECDD3] rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Notes
                </label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Notes from initial meeting, net worth goals..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
              </div>

              {/* Optional Document / Image Upload with Drag & Drop */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Discovery Document / Card Image <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Fixed max: 5 MB</span>
                </div>

                {newForm.imagePreview ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={newForm.imagePreview}
                          alt="Selected Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs truncate">
                        <div className="font-semibold text-slate-800 truncate">
                          {newForm.imageFile?.name || 'Selected Image'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {((newForm.imageFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Ready to upload to Cloudinary
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewForm({ ...newForm, imageFile: null, imagePreview: null })}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalDragOver(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalDragOver(false);
                      const file = e.dataTransfer.files?.[0] || null;
                      if (file) handleModalImageSelect(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center ${
                      modalDragOver
                        ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-400/20 scale-[1.01]'
                        : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
                    }`}
                  >
                    <div className="p-1.5 bg-amber-100 rounded-full text-amber-700">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800">
                        {modalDragOver ? 'Drop image here to attach' : 'Drag & drop image here, or click to browse'}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Supports JPG, PNG, WebP, GIF (Max 5 MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleModalImageSelect(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex justify-end items-center gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#F3C046] hover:bg-[#e2b13c] text-slate-900 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Investor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Full Image Preview Modal */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
          >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Discovery Document Preview
              </span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-900/5 overflow-auto max-h-[calc(90vh-60px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt="Enlarged Document Preview"
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
