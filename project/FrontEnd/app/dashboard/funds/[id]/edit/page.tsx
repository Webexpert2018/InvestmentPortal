'use client';

import { useState } from 'react';
import { ChevronLeft, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const VisualPdfEditor = dynamic(() => import('@/components/VisualPdfEditor').then(mod => mod.VisualPdfEditor), { ssr: false });


export default function EditFundPage() {
  const router = useRouter();
  const params = useParams();
  const [fundName, setFundName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Active');
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
    }
  }, []);

  const [subDocFile, setSubDocFile] = useState<File | null>(null);
  const [subDocPath, setSubDocPath] = useState<string | null>(null);
  const [oaDocFile, setOaDocFile] = useState<File | null>(null);
  const [oaDocPath, setOaDocPath] = useState<string | null>(null);
  const [namePage, setNamePage] = useState<number | null>(null);
  const [nameX, setNameX] = useState<number | null>(null);
  const [nameY, setNameY] = useState<number | null>(null);
  const [datePage, setDatePage] = useState<number | null>(null);
  const [dateX, setDateX] = useState<number | null>(null);
  const [dateY, setDateY] = useState<number | null>(null);
  const [signaturePage, setSignaturePage] = useState<number | null>(null);
  const [signatureX, setSignatureX] = useState<number | null>(null);
  const [signatureY, setSignatureY] = useState<number | null>(null);
  const [amountPage, setAmountPage] = useState<number | null>(null);
  const [amountX, setAmountX] = useState<number | null>(null);
  const [amountY, setAmountY] = useState<number | null>(null);
  const [placements, setPlacements] = useState<any[]>([]);
  const [oaPlacements, setOaPlacements] = useState<any[]>([]);
  const [oaNamePage, setOaNamePage] = useState<number | null>(null);
  const [oaNameX, setOaNameX] = useState<number | null>(null);
  const [oaNameY, setOaNameY] = useState<number | null>(null);
  const [oaDatePage, setOaDatePage] = useState<number | null>(null);
  const [oaDateX, setOaDateX] = useState<number | null>(null);
  const [oaDateY, setOaDateY] = useState<number | null>(null);
  const [oaSignaturePage, setOaSignaturePage] = useState<number | null>(null);
  const [oaSignatureX, setOaSignatureX] = useState<number | null>(null);
  const [oaSignatureY, setOaSignatureY] = useState<number | null>(null);
  const [oaAmountPage, setOaAmountPage] = useState<number | null>(null);
  const [oaAmountX, setOaAmountX] = useState<number | null>(null);
  const [oaAmountY, setOaAmountY] = useState<number | null>(null);
  const [errors, setErrors] = useState({
    fundName: '',
    startDate: '',
    description: '',
    note: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    beneficiaryName: '',
    bankAddress: '',
  });



  const countWords = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  useEffect(() => {
    if (params.id) {
      fetchFundDetails();
    }
  }, [params.id]);

  const fetchFundDetails = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getFundById(params.id as string);
      setFundName(data.name || '');
      // Format date to YYYY-MM-DD for date input
      const formattedDate = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '';
      setStartDate(formattedDate);
      setDescription(data.description || '');
      setNote(data.note || '');
      setStatus(data.status || 'Active');
      setImage(data.image || null);
      setBankName(data.bankName || '');
      setAccountNumber(data.accountNumber || '');
      setRoutingNumber(data.routingNumber || '');
      setBeneficiaryName(data.beneficiaryName || '');
      setBankAddress(data.bankAddress || '');
      setSubDocPath(data.subscriptionDocPath || null);
      setOaDocPath(data.oaDocPath || null);
      setNamePage(data.namePage || null);
      setNameX(data.nameX !== undefined ? data.nameX : null);
      setNameY(data.nameY !== undefined ? data.nameY : null);
      setDatePage(data.datePage || null);
      setDateX(data.dateX !== undefined ? data.dateX : null);
      setDateY(data.dateY !== undefined ? data.dateY : null);
      setSignaturePage(data.signaturePage || null);
      setSignatureX(data.signatureX !== undefined ? data.signatureX : null);
      setSignatureY(data.signatureY !== undefined ? data.signatureY : null);
      setAmountPage(data.amountPage || null);
      setAmountX(data.amountX !== undefined ? data.amountX : null);
      setAmountY(data.amountY !== undefined ? data.amountY : null);
      setPlacements(data.placements || []);
      setOaPlacements(data.oaPlacements || []);
      setOaNamePage(data.oaNamePage || null);
      setOaNameX(data.oaNameX !== undefined ? data.oaNameX : null);
      setOaNameY(data.oaNameY !== undefined ? data.oaNameY : null);
      setOaDatePage(data.oaDatePage || null);
      setOaDateX(data.oaDateX !== undefined ? data.oaDateX : null);
      setOaDateY(data.oaDateY !== undefined ? data.oaDateY : null);
      setOaSignaturePage(data.oaSignaturePage || null);
      setOaSignatureX(data.oaSignatureX !== undefined ? data.oaSignatureX : null);
      setOaSignatureY(data.oaSignatureY !== undefined ? data.oaSignatureY : null);
      setOaAmountPage(data.oaAmountPage || null);
      setOaAmountX(data.oaAmountX !== undefined ? data.oaAmountX : null);
      setOaAmountY(data.oaAmountY !== undefined ? data.oaAmountY : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch fund details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {
      fundName: '',
      startDate: '',
      description: '',
      note: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      beneficiaryName: '',
      bankAddress: '',
    };

    let isValid = true;

    if (!fundName.trim()) {
      newErrors.fundName = 'Fund name is required';
      isValid = false;
    }

    if (!startDate.trim()) {
      newErrors.startDate = 'Start date is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
      isValid = false;
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
      isValid = false;
    } else if (!/^\d+$/.test(accountNumber)) {
      newErrors.accountNumber = 'Account number must contain only digits';
      isValid = false;
    }

    if (!routingNumber.trim()) {
      newErrors.routingNumber = 'Routing number is required';
      isValid = false;
    } else if (!/^\d{9}$/.test(routingNumber)) {
      newErrors.routingNumber = 'Routing number must be exactly 9 digits';
      isValid = false;
    }

    if (!beneficiaryName.trim()) {
      newErrors.beneficiaryName = 'For Benefit Of name is required';
      isValid = false;
    }

    if (!bankAddress.trim()) {
      newErrors.bankAddress = 'Bank address is required';
      isValid = false;
    }

    if (!subDocFile && !subDocPath) {
      toast.error('Subscription Agreement document is required');
      isValid = false;
    }

    if (!oaDocFile && !oaDocPath) {
      toast.error('Operating Agreement document is required');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    try {
      // 1. Update fund details
      await apiClient.updateFund(params.id as string, {
        name: fundName,
        start_date: startDate,
        description,
        note,
        status,
        bankName,
        accountNumber,
        routingNumber,
        beneficiaryName,
        bankAddress,
        subscriptionDocPath: subDocFile ? undefined : subDocPath, // if cleared, clear path
        oaDocPath: oaDocFile ? undefined : oaDocPath,
        namePage: (subDocFile || subDocPath) ? namePage : null,
        nameX: (subDocFile || subDocPath) ? nameX : null,
        nameY: (subDocFile || subDocPath) ? nameY : null,
        datePage: (subDocFile || subDocPath) ? datePage : null,
        dateX: (subDocFile || subDocPath) ? dateX : null,
        dateY: (subDocFile || subDocPath) ? dateY : null,
        signaturePage: (subDocFile || subDocPath) ? signaturePage : null,
        signatureX: (subDocFile || subDocPath) ? signatureX : null,
        signatureY: (subDocFile || subDocPath) ? signatureY : null,
        amountPage: (subDocFile || subDocPath) ? amountPage : null,
        amountX: (subDocFile || subDocPath) ? amountX : null,
        amountY: (subDocFile || subDocPath) ? amountY : null,
        placements: (subDocFile || subDocPath) ? placements : null,

        oaNamePage: (oaDocFile || oaDocPath) ? oaNamePage : null,
        oaNameX: (oaDocFile || oaDocPath) ? oaNameX : null,
        oaNameY: (oaDocFile || oaDocPath) ? oaNameY : null,
        oaDatePage: (oaDocFile || oaDocPath) ? oaDatePage : null,
        oaDateX: (oaDocFile || oaDocPath) ? oaDateX : null,
        oaDateY: (oaDocFile || oaDocPath) ? oaDateY : null,
        oaSignaturePage: (oaDocFile || oaDocPath) ? oaSignaturePage : null,
        oaSignatureX: (oaDocFile || oaDocPath) ? oaSignatureX : null,
        oaSignatureY: (oaDocFile || oaDocPath) ? oaSignatureY : null,
        oaAmountPage: (oaDocFile || oaDocPath) ? oaAmountPage : null,
        oaAmountX: (oaDocFile || oaDocPath) ? oaAmountX : null,
        oaAmountY: (oaDocFile || oaDocPath) ? oaAmountY : null,
        oaPlacements: (oaDocFile || oaDocPath) ? oaPlacements : null,
      });

      // 2. Upload image if selected
      if (selectedFile) {
        await apiClient.uploadFundImage(params.id as string, selectedFile);
      }

      // 3. Upload subscription document if selected
      if (subDocFile) {
        await apiClient.uploadSubscriptionDocument(params.id as string, subDocFile);
      }

      // 4. Upload OA document if selected
      if (oaDocFile) {
        await apiClient.uploadOADocument(params.id as string, oaDocFile);
      }

      toast.success('Fund updated successfully');
      router.push(`/dashboard/funds/${params.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update fund');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getFullImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/images/') || imagePath.startsWith('/documents/')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            Edit Fund Details
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-5 md:p-8">
          {/* Upload Image */}
          <div className="sm:flex items-center gap-6 mb-8 space-y-4 md:space-y-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : image ? (
                  <img
                    src={getFullImageUrl(image) || ''}
                    alt="Fund"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-4">No image uploaded</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                <span className="text-white text-xs font-medium">Change Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Fund image</p>
              <p className="text-xs text-gray-500">Click image to upload a new one</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Fund Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fund Name
                </label>
                <input
                  type="text"
                  value={fundName}
                  onChange={(e) => {
                    setFundName(e.target.value);
                    if (errors.fundName) {
                      setErrors({ ...errors, fundName: '' });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${errors.fundName ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                {errors.fundName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fundName}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors({ ...errors, description: '' });
                    }
                  }}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none ${errors.description ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                <div className="flex justify-between mt-1">
                  <div>
                    {errors.description && (
                      <p className="text-red-500 text-xs">{errors.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {countWords(description)} words | {description.length} chars
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (errors.startDate) {
                        setErrors({ ...errors, startDate: '' });
                      }
                    }}
                    className={`date-input w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent pr-10 ${errors.startDate ? 'border-red-500' : 'border-gray-200'
                      }`}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    if (errors.note) {
                      setErrors({ ...errors, note: '' });
                    }
                  }}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none ${errors.note ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                <div className="flex justify-between mt-1">
                  <div>
                    {errors.note && (
                      <p className="text-red-500 text-xs">{errors.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {note.length} chars
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 border-b border-gray-100 pb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Operating Agreement Section */}
          <div className="border-t border-gray-100 pt-8 mb-8 pb-8 border-b">
            <h3 className="font-goudy text-lg text-[#1F1F1F] mb-2">Operating Agreement (OA) <span className="text-red-500">*</span></h3>
            <p className="text-sm text-gray-500 mb-6">
              Upload the required PDF Operating Agreement for this fund.
            </p>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Document</label>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-sm font-medium text-gray-700 shrink-0 whitespace-nowrap w-fit">
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setOaDocFile(e.target.files[0]);
                          setOaDocPath(null);
                        }
                      }}
                    />
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm text-gray-500 break-all" title={oaDocFile ? oaDocFile.name : oaDocPath ? `${oaDocPath}` : 'No file chosen (Using system defaults)'}>
                      {oaDocFile ? oaDocFile.name : oaDocPath ? `${oaDocPath}` : 'No file chosen (Using system defaults)'}
                    </span>
                    {(oaDocFile || oaDocPath) && (
                      <button
                        type="button"
                        onClick={() => {
                          setOaDocFile(null);
                          setOaDocPath(null);
                        }}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors border border-red-100 w-fit"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Custom Document
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(oaDocFile || oaDocPath) && (
                <div className="mt-4">
                  <VisualPdfEditor
                    file={oaDocFile || (oaDocPath ? (oaDocPath.startsWith('http') ? `${BASE_URL}/api/documents/subscription/preview/custom?url=${encodeURIComponent(oaDocPath)}&token=${token || ''}` : `${BASE_URL}/api/documents/subscription/preview/${oaDocPath}?token=${token || ''}`) : null)}
                    initialValues={{
                      namePage: oaNamePage || undefined,
                      nameX: oaNameX !== null ? oaNameX : undefined,
                      nameY: oaNameY !== null ? oaNameY : undefined,
                      datePage: oaDatePage || undefined,
                      dateX: oaDateX !== null ? oaDateX : undefined,
                      dateY: oaDateY !== null ? oaDateY : undefined,
                      signaturePage: oaSignaturePage || undefined,
                      signatureX: oaSignatureX !== null ? oaSignatureX : undefined,
                      signatureY: oaSignatureY !== null ? oaSignatureY : undefined,
                      amountPage: oaAmountPage || undefined,
                      amountX: oaAmountX !== null ? oaAmountX : undefined,
                      amountY: oaAmountY !== null ? oaAmountY : undefined,
                      placements: oaPlacements
                    }}
                    onChange={(coords) => {
                      setOaNamePage(coords.namePage);
                      setOaNameX(coords.nameX);
                      setOaNameY(coords.nameY);
                      setOaDatePage(coords.datePage);
                      setOaDateX(coords.dateX);
                      setOaDateY(coords.dateY);
                      setOaSignaturePage(coords.signaturePage);
                      setOaSignatureX(coords.signatureX);
                      setOaSignatureY(coords.signatureY);
                      setOaAmountPage(coords.amountPage);
                      setOaAmountX(coords.amountX);
                      setOaAmountY(coords.amountY);
                      setOaPlacements(coords.placements);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subscription Document Section */}
          <div className="border-t border-gray-100 pt-8 mb-8 pb-8 border-b">
            <h3 className="font-goudy text-lg text-[#1F1F1F] mb-2">Subscription Document <span className="text-red-500">*</span></h3>
            <p className="text-sm text-gray-500 mb-6">
              Upload the required PDF subscription document for this fund.
            </p>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Document</label>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-sm font-medium text-gray-700 shrink-0 whitespace-nowrap w-fit">
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSubDocFile(e.target.files[0]);
                          setSubDocPath(null); // Clear previous path to show new preview name
                        }
                      }}
                    />
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm text-gray-500 break-all" title={subDocFile ? subDocFile.name : subDocPath ? `${subDocPath}` : 'No file chosen (Using system defaults)'}>
                      {subDocFile ? subDocFile.name : subDocPath ? `${subDocPath}` : 'No file chosen (Using system defaults)'}
                    </span>
                    {(subDocFile || subDocPath) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSubDocFile(null);
                          setSubDocPath(null);
                        }}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors border border-red-100 w-fit"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Custom Document
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(subDocFile || subDocPath) && (
                <div className="mt-4">
                  <VisualPdfEditor
                    file={subDocFile || (subDocPath ? (subDocPath.startsWith('http') ? `${BASE_URL}/api/documents/subscription/preview/custom?url=${encodeURIComponent(subDocPath)}&token=${token || ''}` : `${BASE_URL}/api/documents/subscription/preview/${subDocPath}?token=${token || ''}`) : null)}
                    initialValues={{
                      namePage: namePage || undefined,
                      nameX: nameX !== null ? nameX : undefined,
                      nameY: nameY !== null ? nameY : undefined,
                      datePage: datePage || undefined,
                      dateX: dateX !== null ? dateX : undefined,
                      dateY: dateY !== null ? dateY : undefined,
                      signaturePage: signaturePage || undefined,
                      signatureX: signatureX !== null ? signatureX : undefined,
                      signatureY: signatureY !== null ? signatureY : undefined,
                      amountPage: amountPage || undefined,
                      amountX: amountX !== null ? amountX : undefined,
                      amountY: amountY !== null ? amountY : undefined,
                      placements: placements
                    }}
                    onChange={(coords) => {
                      setNamePage(coords.namePage);
                      setNameX(coords.nameX);
                      setNameY(coords.nameY);
                      setDatePage(coords.datePage);
                      setDateX(coords.dateX);
                      setDateY(coords.dateY);
                      setSignaturePage(coords.signaturePage);
                      setSignatureX(coords.signatureX);
                      setSignatureY(coords.signatureY);
                      setAmountPage(coords.amountPage);
                      setAmountX(coords.amountX);
                      setAmountY(coords.amountY);
                      setPlacements(coords.placements);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="mb-8">
            <h3 className="font-goudy text-lg text-[#1F1F1F] mb-6">Bank Details (Wire Instructions)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metropolitan Commercial Bank"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    if (errors.bankName) setErrors({ ...errors, bankName: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${errors.bankName ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                {errors.bankName && (
                  <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${errors.accountNumber ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                {errors.accountNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number (ABA)</label>
                <input
                  type="text"
                  placeholder="Enter routing number"
                  value={routingNumber}
                  onChange={(e) => {
                    setRoutingNumber(e.target.value);
                    if (errors.routingNumber) setErrors({ ...errors, routingNumber: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${errors.routingNumber ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                {errors.routingNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.routingNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">For Benefit Of</label>
                <input
                  type="text"
                  placeholder="Enter for benefit of name"
                  value={beneficiaryName}
                  onChange={(e) => {
                    setBeneficiaryName(e.target.value);
                    if (errors.beneficiaryName) setErrors({ ...errors, beneficiaryName: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${errors.beneficiaryName ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                {errors.beneficiaryName && (
                  <p className="text-red-500 text-xs mt-1">{errors.beneficiaryName}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Address</label>
                <textarea
                  placeholder="Enter full bank address"
                  value={bankAddress}
                  onChange={(e) => {
                    setBankAddress(e.target.value);
                    if (errors.bankAddress) setErrors({ ...errors, bankAddress: '' });
                  }}
                  rows={2}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none ${errors.bankAddress ? 'border-red-500' : 'border-gray-200'
                    }`}
                />
                {errors.bankAddress && (
                  <p className="text-red-500 text-xs mt-1">{errors.bankAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => router.back()}
              className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
