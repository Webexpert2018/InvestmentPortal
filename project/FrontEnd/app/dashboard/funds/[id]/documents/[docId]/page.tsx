"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChevronLeft, Loader2, Download, ExternalLink, FileText, Minus, Plus, Search, RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, BASE_URL } from "@/lib/api/client";
import { toast } from "sonner";

// Custom PDF Viewer Component using pdf.js from CDN
const CustomPdfViewer = ({ url, title }: { url: string; title: string }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [pdfProxy, setPdfProxy] = useState<any>(null);

  useEffect(() => {
    // Load PDF.js from CDN
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any)["pdfjs-dist/build/pdf"];
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      
      // Fetch as ArrayBuffer to avoid IDM interception
      fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          loadingTask.promise.then((pdf: any) => {
            setPdfProxy(pdf);
            setNumPages(pdf.numPages);
            renderPage(pdf, 1, 1.0);
            setIsLoading(false);
          }).catch((error: any) => {
            console.error("Error parsing PDF data:", error);
            toast.error("Error displaying PDF data");
            setIsLoading(false);
          });
        })
        .catch((error: any) => {
          console.error("Error fetching PDF file:", error);
          toast.error("Error fetching PDF file for preview");
          setIsLoading(false);
        });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [url]);

  const renderPage = (pdf: any, pgNum: number, currentScale: number) => {
    pdf.getPage(pgNum).then((page: any) => {
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      page.render(renderContext);
    });
  };

  useEffect(() => {
    if (pdfProxy) {
      renderPage(pdfProxy, pageNumber, scale);
    }
  }, [pageNumber, scale, pdfProxy]);

  const changePage = (offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages || 1));
  };

  const changeZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 3.0));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#525659]">
      {/* Toolbar - Matches the design exactly */}
      <div className="bg-[#323639] h-12 flex items-center justify-between px-6 text-white border-b border-black/20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded">
            <input 
              type="text" 
              value={pageNumber} 
              readOnly
              className="w-8 bg-transparent text-center focus:outline-none text-sm"
            />
            <span className="text-gray-400 text-sm">/ {numPages || '-'}</span>
          </div>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <button onClick={() => changeZoom(-0.1)} className="hover:bg-white/10 p-1 rounded transition-colors">
            <Minus className="h-4 w-4" />
          </button>
          <div className="bg-black/20 px-3 py-1 rounded text-xs min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </div>
          <button onClick={() => changeZoom(0.1)} className="hover:bg-white/10 p-1 rounded transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <button className="hover:bg-white/10 p-1.5 rounded transition-colors text-white/70" title="Fit to page">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button className="hover:bg-white/10 p-1.5 rounded transition-colors text-white/70" title="Rotate clockwise">
            <RotateCw className="h-4 w-4" />
          </button>
          <button className="hover:bg-white/10 p-1.5 rounded transition-colors text-white/70" title="Download">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 flex justify-center items-start scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-white/50 mb-2" />
            <span className="text-white/50 text-xs">Loading PDF...</span>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-2xl bg-white max-w-full" />
        )}
      </div>
      
      {/* Page Navigation Buttons Bottom (Optional) */}
      {!isLoading && numPages && numPages > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
           <button 
             onClick={() => changePage(-1)}
             className="p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all pointer-events-auto backdrop-blur-sm disabled:opacity-30"
             disabled={pageNumber === 1}
           >
             <ChevronLeft className="h-5 w-5" />
           </button>
           <button 
             onClick={() => changePage(1)}
             className="p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all pointer-events-auto backdrop-blur-sm disabled:opacity-30"
             disabled={pageNumber === numPages}
           >
             <ChevronLeft className="h-5 w-5 rotate-180" />
           </button>
        </div>
      )}
    </div>
  );
};

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);

  useEffect(() => {
    if (params.docId) {
      fetchDocument();
    }
  }, [params.docId]);

  const fetchDocument = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getDocumentById(params.docId as string);
      setDoc(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch document");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  if (!doc) return null;

  const fileUrl = `${BASE_URL}${doc.file_url}`;
  const isImage = doc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = doc.file_url.match(/\.(pdf)$/i);
  const isOffice = doc.file_url.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto bg-gray-50/10 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
            <h1 className="text-2xl font-semibold text-gray-800 ml-1">Document Details</h1>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Preview (approx 40% of card) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] bg-[#525659] relative flex flex-col shadow-inner">
                {isPDF ? (
                  <CustomPdfViewer url={fileUrl} title={doc.file_name} />
                ) : isImage ? (
                  <div className="w-full h-full flex justify-center items-center p-4 bg-white">
                    <img
                      src={fileUrl}
                      alt={doc.file_name}
                      className="max-w-full max-h-full object-contain shadow-md"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-white">
                    <FileText className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-900 font-bold mb-1">No Preview available</p>
                    <p className="text-gray-500 text-sm">Preview for this file type is not supported.</p>
                    <a href={apiClient.getDocumentDownloadUrl(doc.id)} download={doc.file_name} className="mt-4">
                      <Button className="bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] rounded-full">
                        Download to View
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info */}
            <div className="lg:col-span-7 flex flex-col pt-2">
              <h2 className="text-2xl font-bold text-gray-700 mb-8 border-b border-gray-100 pb-4">File Information</h2>
              
              <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                <div>
                  <label className="text-gray-400 font-medium text-sm mb-2 block tracking-wide">Upload Date</label>
                  <span className="text-xl font-bold text-gray-800">{formatDate(doc.uploaded_at)}</span>
                </div>
                <div>
                  <label className="text-gray-400 font-medium text-sm mb-2 block tracking-wide">Document Type</label>
                  <span className="text-xl font-bold text-gray-800">{doc.document_type || 'N/A'}</span>
                </div>
                <div>
                  <label className="text-gray-400 font-medium text-sm mb-2 block tracking-wide">Tax Year</label>
                  <span className="text-xl font-bold text-gray-800">{doc.tax_year || 'N/A'}</span>
                </div>
                <div>
                  <label className="text-gray-400 font-medium text-sm mb-2 block tracking-wide">File Size</label>
                  <span className="text-xl font-bold text-gray-800">{formatFileSize(doc.file_size)}</span>
                </div>
              </div>
              
              <div className="mt-10 space-y-8">
                <div>
                  <label className="text-gray-400 font-medium text-sm mb-2 block tracking-wide">Description</label>
                  <p className="text-gray-800 font-bold text-lg leading-relaxed max-w-2xl whitespace-pre-wrap">
                    {doc.description || "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."}
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 font-medium text-sm mb-2 block tracking-wide">Note</label>
                  <p className="text-gray-800 font-bold text-lg leading-relaxed max-w-2xl whitespace-pre-wrap">
                    {doc.note || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-12 pt-6 border-t border-gray-100">
                <Button
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="px-10 py-2.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] h-auto rounded-full font-bold transition-all shadow-sm"
                >
                  View Document
                </Button>
                <a href={apiClient.getDocumentDownloadUrl(doc.id)} download={doc.file_name}>
                  <Button
                    className="px-10 py-2.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] h-auto rounded-full font-bold transition-all shadow-sm border border-[#FEF3C7]"
                  >
                    Download Doc
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
