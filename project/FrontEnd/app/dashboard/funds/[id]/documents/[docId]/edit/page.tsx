"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChevronLeft, Loader2, Save, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, BASE_URL } from "@/lib/api/client";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  "K-1",
  "Statement",
  "Tax Form",
  "W-9",
  "Subscription Agreement",
  "Other",
];

const TAX_YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    document_type: "",
    tax_year: "",
    description: "",
    note: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);

  useEffect(() => {
    if (params.docId) {
      fetchDocument();
    }
  }, [params.docId]);

  const fetchDocument = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getDocumentById(params.docId as string);
      setFormData({
        document_type: data.document_type || "",
        tax_year: data.tax_year?.toString() || "",
        description: data.description || "",
        note: data.note || "",
      });
      setExistingFileUrl(data.file_url);
      setExistingFileName(data.file_name);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch document details");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.document_type) {
      toast.error("Please select a document type");
      return;
    }

    setIsSaving(true);
    try {
      if (file) {
        // If there's a new file, we need to use FormData
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        formDataObj.append('document_type', formData.document_type);
        if (formData.tax_year) formDataObj.append('tax_year', formData.tax_year);
        if (formData.description) formDataObj.append('description', formData.description);
        if (formData.note) formDataObj.append('note', formData.note);

        // We assume the backend handles PATCH /documents/:id with multipart/form-data
        // If not, we'll need to check the API logs or use a different approach.
        // For now, let's add a method to apiClient for this.
        await apiClient.updateDocumentWithFile(params.docId as string, formDataObj);
      } else {
        await apiClient.updateDocument(params.docId as string, {
          document_type: formData.document_type,
          tax_year: formData.tax_year ? parseInt(formData.tax_year) : undefined,
          description: formData.description,
          note: formData.note,
        });
      }
      toast.success("Document updated successfully");
      router.push(`/dashboard/funds/${params.id}?tab=documents`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update document");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FCD34D]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Breadcrumb/Back */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Fund
          </button>
          <h1 className="text-4xl font-bold text-[#1F2937] mb-2 font-serif">Edit Document Details</h1>
          <p className="text-gray-500 font-medium">
            Update metadata for this document. File changes are now supported below.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-md p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              {/* Document Type */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 tracking-wide uppercase">Document Type</label>
                <div className="relative">
                  <select
                    required
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent outline-none transition-all appearance-none font-medium text-gray-700"
                  >
                    <option value="">Select document type</option>
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronLeft className="h-4 w-4 rotate-[270deg]" />
                  </div>
                </div>
              </div>

              {/* Tax Year */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 tracking-wide uppercase">Tax Year</label>
                <div className="relative">
                  <select
                    value={formData.tax_year}
                    onChange={(e) => setFormData({ ...formData, tax_year: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent outline-none transition-all appearance-none font-medium text-gray-700"
                  >
                    <option value="">Select tax year</option>
                    {TAX_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronLeft className="h-4 w-4 rotate-[270deg]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 flex justify-between tracking-wide uppercase">
                  Description
                  <span className="text-xs text-gray-400 font-normal">{formData.description.length}/1000</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent outline-none transition-all h-40 resize-none font-medium text-gray-700"
                />
              </div>

              {/* Note */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 flex justify-between tracking-wide uppercase">
                  Note
                  <span className="text-xs text-gray-400 font-normal">{formData.note.length}/1000</span>
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add a private note visible only to you"
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent outline-none transition-all h-40 resize-none font-medium text-gray-700"
                />
              </div>
            </div>

            {/* Replace Document Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <label className="text-sm font-bold text-gray-700 tracking-wide uppercase">Replace Document (Optional)</label>
              <div className="flex flex-col gap-4">
                {file ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">{file.name}</p>
                        <p className="text-xs text-blue-600">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                     <div className="flex-1 flex items-center gap-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg italic text-gray-400">
                        {existingFileName ? existingFileName : 'No file currently uploaded'}
                     </div>
                     <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) setFile(selectedFile);
                      }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <Upload className="h-5 w-5 text-gray-400" />
                      Select New File
                    </label>
                  </div>
                )}
                <p className="text-xs text-gray-400">Accepted formats: PDF, DOCX, XLSX, Images (Max 10MB)</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-10 mt-10">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-500 font-bold hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={isSaving}
              className="px-12 py-3 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 font-bold rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center gap-2 h-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
