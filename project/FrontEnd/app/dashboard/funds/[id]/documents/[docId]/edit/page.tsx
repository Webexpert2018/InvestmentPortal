"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChevronLeft, Loader2, Save, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, BASE_URL } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
      toast({
        title: "Error",
        description: error.message || "Failed to fetch document details",
        variant: "destructive",
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.document_type) {
      toast({
        title: "Error",
        description: "Please select a document type",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Document updated successfully",
        variant: "success",
      });
      router.push(`/dashboard/funds/${params.id}?tab=documents`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      });
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
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-1 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Fund
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 mt-4 font-serif">Edit Document Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update metadata for this document. File changes are now supported below.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Document Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Document Type</label>
                <select
                  required
                  value={formData.document_type}
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] outline-none transition-all"
                >
                  <option value="">Select document type</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tax Year */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tax Year</label>
                <select
                  value={formData.tax_year}
                  onChange={(e) => setFormData({ ...formData, tax_year: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] outline-none transition-all"
                >
                  <option value="">Select tax year</option>
                  {TAX_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex justify-between">
                  Description
                  <span className="text-xs text-gray-400 font-normal">{formData.description.length}/1000</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  maxLength={1000}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] outline-none transition-all h-32 resize-none"
                />
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex justify-between">
                  Note
                  <span className="text-xs text-gray-400 font-normal">{formData.note.length}/1000</span>
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add a private note visible only to you"
                  maxLength={1000}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FCD34D] focus:border-[#FCD34D] outline-none transition-all h-32 resize-none"
                />
              </div>
            </div>

            {/* Replace Document Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Replace Document (Optional)</label>
              <div
                onClick={() => document.getElementById("file-replace")?.click()}
                className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  file ? "border-[#FCD34D] bg-[#FFFBEB]" : "border-gray-200 hover:border-[#FCD34D] hover:bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  id="file-replace"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {file ? (
                  <div className="flex flex-col items-center text-center font-helvetica">
                    <div className="w-16 h-16 bg-[#FCD34D] rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to replace</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-4 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                    >
                      <X className="h-4 w-4" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center font-helvetica">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#FFFBEB] transition-colors">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium">
                      {existingFileName ? (
                        <>
                          Current: <span className="font-normal text-gray-500">{existingFileName}</span>
                          <br />
                          Drag & drop to replace
                        </>
                      ) : "Drag & drop files here"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Support for PDF, DOC, JPG, PNG</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="px-8 py-2.5 border-none bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="px-12 py-2.5 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
