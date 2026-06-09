'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Type, DollarSign, Calendar, Edit3, Trash2, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface VisualPdfEditorProps {
  file: File | string | null;
  initialValues?: {
    namePage?: number;
    nameX?: number;
    nameY?: number;
    datePage?: number;
    dateX?: number;
    dateY?: number;
    signaturePage?: number;
    signatureX?: number;
    signatureY?: number;
    amountPage?: number;
    amountX?: number;
    amountY?: number;
    placements?: any[];
  };
  onChange: (coordinates: {
    namePage: number | null;
    nameX: number | null;
    nameY: number | null;
    datePage: number | null;
    dateX: number | null;
    dateY: number | null;
    signaturePage: number | null;
    signatureX: number | null;
    signatureY: number | null;
    amountPage: number | null;
    amountX: number | null;
    amountY: number | null;
    placements: any[];
  }) => void;
}

type FieldType = 'name' | 'amount' | 'date' | 'signature';

interface PlacedField {
  id: string; // Unique placement ID
  type: FieldType;
  page: number;
  xPercent: number; // 0 - 100 relative to page width
  yPercent: number; // 0 - 100 relative to page height
}

export function VisualPdfEditor({ file, initialValues, onChange }: VisualPdfEditorProps) {
  const [pdfjsLoaded, setPdfjsLoaded] = useState<boolean>(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<FieldType | null>(null);
  const [placements, setPlacements] = useState<PlacedField[]>([]);
  const [pageDimensions, setPageDimensions] = useState<{ originalWidth: number; originalHeight: number } | null>(null);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInitializedRef = useRef<boolean>(false);

  // Dragging states
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPercent = useRef<{ xPercent: number; yPercent: number }>({ xPercent: 0, yPercent: 0 });

  // 1. Dynamic PDF.js Script Loader
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfjsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setPdfjsLoaded(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  // 2. Load PDF Document
  useEffect(() => {
    if (!pdfjsLoaded || !file) return;

    let active = true;
    setLoading(true);

    async function loadDocument() {
      try {
        let url = '';
        if (file instanceof File) {
          url = URL.createObjectURL(file);
        } else if (typeof file === 'string') {
          url = file;
        }

        const loadingTask = window.pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (active) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPageNumber(1);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading PDF document:", error);
        if (active) setLoading(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
    };
  }, [file, pdfjsLoaded]);

  // 3. Render page to Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let active = true;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);

        const desiredWidth = 850;
        const viewport = page.getViewport({ scale: 1 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        setPageDimensions({
          originalWidth: viewport.width,
          originalHeight: viewport.height,
        });

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;

        // Correct initial values percentage mappings if standard dimensions are loaded
        if (initialValues && active && placements.length === 0 && !hasInitializedRef.current) {
          if (initialValues.placements && Array.isArray(initialValues.placements) && initialValues.placements.length > 0) {
            const loaded = initialValues.placements.map((p, idx) => ({
              id: p.id || `${p.type}_${Date.now()}_${idx}`,
              type: p.type as FieldType,
              page: p.page,
              xPercent: p.xPercent,
              yPercent: p.yPercent
            }));
            setPlacements(loaded);
            hasInitializedRef.current = true;
          } else {
            // Fallback mapping of singular legacy coordinates
            const fallback: PlacedField[] = [];
            let hasAnyLegacy = false;
            if (initialValues.namePage && initialValues.nameX && initialValues.nameY) {
              fallback.push({
                id: `name_${Date.now()}`,
                type: 'name',
                page: initialValues.namePage,
                xPercent: (initialValues.nameX / viewport.width) * 100,
                yPercent: (initialValues.nameY / viewport.height) * 100,
              });
              hasAnyLegacy = true;
            }
            if (initialValues.amountPage && initialValues.amountX && initialValues.amountY) {
              fallback.push({
                id: `amount_${Date.now()}`,
                type: 'amount',
                page: initialValues.amountPage,
                xPercent: (initialValues.amountX / viewport.width) * 100,
                yPercent: (initialValues.amountY / viewport.height) * 100,
              });
              hasAnyLegacy = true;
            }
            if (initialValues.datePage && initialValues.dateX && initialValues.dateY) {
              fallback.push({
                id: `date_${Date.now()}`,
                type: 'date',
                page: initialValues.datePage,
                xPercent: (initialValues.dateX / viewport.width) * 100,
                yPercent: (initialValues.dateY / viewport.height) * 100,
              });
              hasAnyLegacy = true;
            }
            if (initialValues.signaturePage && initialValues.signatureX && initialValues.signatureY) {
              fallback.push({
                id: `signature_${Date.now()}`,
                type: 'signature',
                page: initialValues.signaturePage,
                xPercent: (initialValues.signatureX / viewport.width) * 100,
                yPercent: (initialValues.signatureY / viewport.height) * 100,
              });
              hasAnyLegacy = true;
            }
            if (hasAnyLegacy) {
              setPlacements(fallback);
              hasInitializedRef.current = true;
            }
          }
        }

      } catch (error) {
        console.error("Error rendering PDF page to canvas:", error);
      }
    }

    renderPage();

    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber]);

  // Load initial values from parameters if available
  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (initialValues) {
      if (initialValues.placements && Array.isArray(initialValues.placements) && initialValues.placements.length > 0) {
        const loaded = initialValues.placements.map((p, idx) => ({
          id: p.id || `${p.type}_${Date.now()}_${idx}`,
          type: p.type as FieldType,
          page: p.page,
          xPercent: p.xPercent,
          yPercent: p.yPercent
        }));
        setPlacements(loaded);
        hasInitializedRef.current = true;
      } else {
        const fallback: PlacedField[] = [];
        let hasAnyLegacy = false;
        if (initialValues.namePage && initialValues.nameX !== undefined && initialValues.nameY !== undefined) {
          fallback.push({
            id: `name_init`,
            type: 'name',
            page: initialValues.namePage,
            xPercent: (initialValues.nameX / 612) * 100,
            yPercent: (initialValues.nameY / 792) * 100,
          });
          hasAnyLegacy = true;
        }
        if (initialValues.amountPage && initialValues.amountX !== undefined && initialValues.amountY !== undefined) {
          fallback.push({
            id: `amount_init`,
            type: 'amount',
            page: initialValues.amountPage,
            xPercent: (initialValues.amountX / 612) * 100,
            yPercent: (initialValues.amountY / 792) * 100,
          });
          hasAnyLegacy = true;
        }
        if (initialValues.datePage && initialValues.dateX !== undefined && initialValues.dateY !== undefined) {
          fallback.push({
            id: `date_init`,
            type: 'date',
            page: initialValues.datePage,
            xPercent: (initialValues.dateX / 612) * 100,
            yPercent: (initialValues.dateY / 792) * 100,
          });
          hasAnyLegacy = true;
        }
        if (initialValues.signaturePage && initialValues.signatureX !== undefined && initialValues.signatureY !== undefined) {
          fallback.push({
            id: `signature_init`,
            type: 'signature',
            page: initialValues.signaturePage,
            xPercent: (initialValues.signatureX / 612) * 100,
            yPercent: (initialValues.signatureY / 792) * 100,
          });
          hasAnyLegacy = true;
        }
        if (hasAnyLegacy) {
          setPlacements(fallback);
          hasInitializedRef.current = true;
        }
      }
    }
  }, [initialValues]);

  // Propagate placements array and primary placeholders coordinates back to parent components
  useEffect(() => {
    const width = pageDimensions?.originalWidth || 612;
    const height = pageDimensions?.originalHeight || 792;

    const primaryName = placements.find(p => p.type === 'name');
    const primaryDate = placements.find(p => p.type === 'date');
    const primarySignature = placements.find(p => p.type === 'signature');
    const primaryAmount = placements.find(p => p.type === 'amount');

    onChange({
      namePage: primaryName ? primaryName.page : null,
      nameX: primaryName ? Math.round((primaryName.xPercent / 100) * width) : null,
      nameY: primaryName ? Math.round((primaryName.yPercent / 100) * height) : null,

      datePage: primaryDate ? primaryDate.page : null,
      dateX: primaryDate ? Math.round((primaryDate.xPercent / 100) * width) : null,
      dateY: primaryDate ? Math.round((primaryDate.yPercent / 100) * height) : null,

      signaturePage: primarySignature ? primarySignature.page : null,
      signatureX: primarySignature ? Math.round((primarySignature.xPercent / 100) * width) : null,
      signatureY: primarySignature ? Math.round((primarySignature.yPercent / 100) * height) : null,

      amountPage: primaryAmount ? primaryAmount.page : null,
      amountX: primaryAmount ? Math.round((primaryAmount.xPercent / 100) * width) : null,
      amountY: primaryAmount ? Math.round((primaryAmount.yPercent / 100) * height) : null,

      placements: placements.map(p => ({
        id: p.id,
        type: p.type,
        page: p.page,
        xPercent: p.xPercent,
        yPercent: p.yPercent
      }))
    });
  }, [placements, pageDimensions]);

  // 4. Drag & Drop Handlers
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    setDraggingFieldId(id);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const currentPlacement = placements.find(p => p.id === id);
    if (currentPlacement) {
      dragStartPercent.current = {
        xPercent: currentPlacement.xPercent,
        yPercent: currentPlacement.yPercent,
      };
    }
  };

  useEffect(() => {
    if (!draggingFieldId || !pageContainerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = pageContainerRef.current!.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;

      let newXPercent = dragStartPercent.current.xPercent + deltaXPercent;
      let newYPercent = dragStartPercent.current.yPercent + deltaYPercent;

      newXPercent = Math.max(0, Math.min(100, newXPercent));
      newYPercent = Math.max(0, Math.min(100, newYPercent));

      setPlacements(prev => prev.map(p => {
        if (p.id === draggingFieldId) {
          return { ...p, xPercent: newXPercent, yPercent: newYPercent };
        }
        return p;
      }));
    };

    const handleMouseUp = () => {
      setDraggingFieldId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingFieldId]);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !pageContainerRef.current) return;

    const rect = pageContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    const newField: PlacedField = {
      id: `${activeTool}_${Date.now()}`,
      type: activeTool,
      page: pageNumber,
      xPercent,
      yPercent
    };

    setPlacements(prev => [...prev, newField]);
    setActiveTool(null);
  };

  const removePlacement = (id: string) => {
    setPlacements(prev => prev.filter(p => p.id !== id));
  };

  const tools: { type: FieldType; label: string; icon: any; color: string; bg: string; border: string }[] = [
    { type: 'signature', label: 'Signature Block', icon: Edit3, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { type: 'name', label: 'Investor Name', icon: Type, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { type: 'date', label: 'Date Signed', icon: Calendar, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { type: 'amount', label: 'Investment Amount', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-white rounded-2xl border border-gray-100 p-3 md:p-6 shadow-sm">
      {/* Sidebar Tool selection */}
      <div className="w-full lg:w-72 flex flex-col gap-5 border-r border-gray-100 pr-6">
        <div>
          <h3 className="font-goudy text-lg font-bold text-[#1F3B6E] mb-2">Visual Field Designer</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Select a field below, then click on the PDF to position where the e-signature elements will overlay. You can place as many as you need!
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-col gap-2.5">
          {tools.map(tool => {
            const count = placements.filter(p => p.type === tool.type).length;
            const isActive = activeTool === tool.type;
            const ToolIcon = tool.icon;

            return (
              <button
                key={tool.type}
                type="button"
                onClick={() => setActiveTool(isActive ? null : tool.type)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all ${isActive
                  ? 'border-[#FCD34D] bg-[#FEF3E2] text-gray-900 shadow-sm ring-1 ring-[#FCD34D]'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${tool.bg} ${tool.color}`}>
                    <ToolIcon className="h-4 w-4" />
                  </div>
                  <span className="truncate">{tool.label}</span>
                </div>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tool.bg} ${tool.color} border ${tool.border}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Placed fields list with direct page navigation & deletion */}
        {placements.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Placed Elements ({placements.length})</h4>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {placements.map((placement, index) => {
                const tool = tools.find(t => t.type === placement.type);
                if (!tool) return null;
                const ToolIcon = tool.icon;
                return (
                  <div key={placement.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/50 transition-colors">
                    <button
                      type="button"
                      onClick={() => setPageNumber(placement.page)}
                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                    >
                      <div className={`p-1 rounded ${tool.bg} ${tool.color} shrink-0`}>
                        <ToolIcon className="h-3 w-3" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-gray-800 truncate">
                          {tool.label} #{index + 1}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">
                          Page {placement.page} ({Math.round(placement.xPercent)}%, {Math.round(placement.yPercent)}%)
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removePlacement(placement.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                      title="Delete Field"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Coordinate Status list */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-auto">
          <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> Instructions
          </h4>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Click a tool, then click on the page to place. You can drag placed badges directly on the PDF, or click any element in the list above to jump straight to its page.
          </p>
        </div>
      </div>

      {/* PDF Viewport Workspace */}
      <div className="flex-1 flex flex-col items-center gap-4 bg-gray-50 rounded-2xl p-6 border border-gray-100 overflow-auto min-h-[500px]">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between w-full border-b border-gray-200/60 pb-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(p => p - 1)}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-700 min-w-[80px] text-center">
              Page {pageNumber} of {numPages || '?'}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber(p => p + 1)}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {activeTool && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 font-semibold animate-pulse">
              Click anywhere on the page to place {tools.find(t => t.type === activeTool)?.label}
            </div>
          )}
        </div>

        {/* Visual Workspace Canvas container */}
        <div className="relative flex-1 flex items-center justify-center p-4 w-full">
          <div
            ref={pageContainerRef}
            onClick={handlePageClick}
            className={`relative shadow-lg border border-gray-200 bg-white select-none ${activeTool ? 'cursor-crosshair' : 'cursor-default'
              }`}
            style={{ maxWidth: '100%', minWidth: '400px' }}
          >
            {file ? (
              <div className="relative">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 px-8 absolute inset-0 bg-white/80 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E] mb-3"></div>
                    <span className="text-xs text-gray-500 font-medium">Loading document...</span>
                  </div>
                )}
                <canvas ref={canvasRef} className="max-w-full block" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-12 text-center text-gray-400">
                <FileText className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium">Please upload a subscription document above to enable the visual designer.</p>
              </div>
            )}

            {/* Overlaid placed coordinates badges */}
            {placements
              .filter(placement => placement.page === pageNumber)
              .map((placement, index) => {
                const tool = tools.find(t => t.type === placement.type);
                if (!tool) return null;

                const ToolIcon = tool.icon;
                const isDragging = draggingFieldId === placement.id;
                const absoluteIndex = placements.findIndex(p => p.id === placement.id) + 1;
                const shortLabel = placement.type === 'signature' ? 'Sig' :
                  placement.type === 'name' ? 'Name' :
                    placement.type === 'date' ? 'Date' :
                      placement.type === 'amount' ? 'Amt' : tool.label;

                return (
                  <div
                    key={placement.id}
                    className={`absolute flex items-center gap-1 px-1.5 py-0.5 rounded border shadow-sm font-medium text-[10px] -translate-x-1/2 -translate-y-1/2 select-none transition-shadow group ${isDragging ? 'shadow-lg cursor-grabbing' : 'cursor-grab hover:shadow-md'
                      } ${tool.bg} ${tool.color} ${tool.border}`}
                    style={{
                      left: `${placement.xPercent}%`,
                      top: `${placement.yPercent}%`,
                      touchAction: 'none',
                      zIndex: 30
                    }}
                    onMouseDown={(e) => handleMouseDown(e, placement.id)}
                    title="Drag to reposition this field"
                  >
                    <ToolIcon className="h-2.5 w-2.5" />
                    <span>{shortLabel} #{absoluteIndex}</span>

                    {/* Inline Delete Button */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => removePlacement(placement.id)}
                      className="ml-1 p-0.5 rounded hover:bg-black/10 text-gray-400 hover:text-red-600 transition-colors"
                      title={`Remove field`}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
