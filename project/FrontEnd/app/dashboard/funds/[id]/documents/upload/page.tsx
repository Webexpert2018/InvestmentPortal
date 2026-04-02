"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChevronLeft, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
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

export default function UploadDocumentPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    document_type: "",
    tax_year: "",
    description: "",
    note: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    if (!formData.document_type) {
      toast({
        title: "Error",
        description: "Please select a document type",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.uploadFundDocument(params.id as string, {
        file,
        document_type: formData.document_type,
        tax_year: formData.tax_year ? parseInt(formData.tax_year) : undefined,
        description: formData.description,
        note: formData.note,
      });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
        variant: "success",
      });
      router.push(`/dashboard/funds/${params.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-semibold text-gray-900 mt-4 font-serif">Upload Document</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload investor documents securely. All files are scanned before being added to the vault.
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
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

            {/* Drag and Drop area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                file ? "border-[#FCD34D] bg-[#FFFBEB]" : "border-gray-200 hover:border-[#FCD34D] hover:bg-gray-50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {file ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#FCD34D] rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-4 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="h-4 w-4" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#FFFBEB] transition-colors">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">Drag & drop files here</p>
                  <p className="text-sm text-gray-500 mt-1">Support for PDF, DOC, JPG, PNG</p>
                </div>
              )}
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
              disabled={isLoading || !file}
              className="px-12 py-2.5 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
