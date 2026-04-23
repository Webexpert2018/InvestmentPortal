'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { X, GripVertical, UserPlus, Mail, Phone, Loader2, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const colorOptions = [
  '#F3F4F6', // Gray
  '#DBEAFE', // Blue
  '#D1FAE5', // Green
  '#E9D5FF', // Purple
  '#DDD6FE', // Indigo
  '#FED7AA', // Orange
  '#FCA5A5', // Red
  '#FDE68A', // Yellow
];

const formatCompactAmount = (amount: number) => {
  if (amount === 0) return '$0';
  if (amount < 1000) return `$${amount}`;
  if (amount < 1000000) {
    const k = amount / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  const m = amount / 1000000;
  return `$${Number.isInteger(m) ? m : m.toFixed(1)}M`;
};

export default function PipelinePage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const { toast } = useToast();
  const [stages, setStages] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [expectedInvestment, setExpectedInvestment] = useState('');
  const [isUpdatingInvestment, setIsUpdatingInvestment] = useState(false);
  const [irStaffList, setIrStaffList] = useState<any[]>([]);
  const [selectedIrStaff, setSelectedIrStaff] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isIrLoading, setIsIrLoading] = useState(false);
  const [pipelineNote, setPipelineNote] = useState('');
  const [currentNewNote, setCurrentNewNote] = useState('');
  const [notesList, setNotesList] = useState<any[]>([]);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const boardScrollRef = useRef<HTMLDivElement>(null);

  const handleSyncBoardScroll = () => {
    if (topScrollRef.current && boardScrollRef.current) {
      boardScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleSyncTopScroll = () => {
    if (topScrollRef.current && boardScrollRef.current) {
      topScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, authLoading, router]);

  const canManageStages = user?.role === 'admin' || user?.role === 'executive_admin';

  const fetchData = useCallback(async () => {
    try {
      const boardData = await apiClient.getPipelineData();
      setStages(boardData);
      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch pipeline data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load pipeline data',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;

    // Handle Stage (Column) Reordering
    if (type === 'column') {
      if (!canManageStages) {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to reorder stages',
          variant: 'destructive',
        });
        return;
      }
      if (source.index === destination.index) return;

      const newStages = Array.from(stages);
      const [reorderedStage] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, reorderedStage);
      setStages(newStages);

      try {
        const stageIds = newStages.map(s => s.id);
        await apiClient.reorderPipelineStages(stageIds);
        toast({
          title: 'Success',
          description: 'Stage order updated',
          variant: 'success',
        });
      } catch (err) {
        console.error('Failed to reorder stages:', err);
        toast({
          title: 'Error',
          description: 'Failed to persist stage order',
          variant: 'destructive',
        });
        fetchData(); // Rollback
      }
      return;
    }

    const sourceStageId = parseInt(source.droppableId);
    const destStageId = parseInt(destination.droppableId);

    // If dropped in same place
    if (sourceStageId === destStageId && source.index === destination.index) return;

    // Optimistic Update
    const newStages = Array.from(stages);
    const sInd = newStages.findIndex(s => s.id === sourceStageId);
    const dInd = newStages.findIndex(s => s.id === destStageId);

    if (sInd === -1 || dInd === -1) return;

    const sourceStage = newStages[sInd];
    const destStage = newStages[dInd];

    if (!sourceStage || !destStage) return;

    const sourceInvestors = Array.from(sourceStage.investors || []);
    if (source.index < 0 || source.index >= sourceInvestors.length) return;

    const [movedInvestor] = sourceInvestors.splice(source.index, 1);
    if (!movedInvestor) return;

    if (sInd === dInd) {
      // Internal reorder (backend reorder not implemented yet, just UI)
      sourceInvestors.splice(destination.index, 0, movedInvestor);
      newStages[sInd] = { ...sourceStage, investors: sourceInvestors };
      setStages(newStages);
    } else {
      // Cross column move
      const destInvestors = Array.from(destStage.investors || []);
      destInvestors.splice(destination.index, 0, movedInvestor);

      newStages[sInd] = {
        ...sourceStage,
        investors: sourceInvestors,
        count: sourceInvestors.length
      };
      newStages[dInd] = {
        ...destStage,
        investors: destInvestors,
        count: destInvestors.length
      };

      setStages(newStages);

      // Persist to Backend
      try {
        await apiClient.updateInvestorPipelineStage(draggableId, destStageId);
        toast({
          title: 'Success',
          description: `Moved ${(movedInvestor as any)?.name || (movedInvestor as any)?.fullName || 'Investor'} to ${(destStage as any)?.name || 'Target Stage'}`,
          variant: 'success',
        });
      } catch (err) {
        console.error('Failed to update stage:', err);
        toast({
          title: 'Error',
          description: 'Failed to persist move',
          variant: 'destructive',
        });
        fetchData(); // Rollback
      }
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.createPipelineStage({
        name: newStageName,
        color: selectedColor
      });
      toast({
        title: 'Success',
        description: 'Stage created',
        variant: 'success',
      });
      fetchData();
      setShowAddStage(false);
      setNewStageName('');
      setSelectedColor(colorOptions[0]);
    } catch (err) {
      console.error('Failed to create stage:', err);
      toast({
        title: 'Error',
        description: 'Failed to create stage',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteStage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stage? Investors will be moved to the first stage.')) return;

    try {
      await apiClient.deletePipelineStage(id);
      toast({
        title: 'Success',
        description: 'Stage deleted',
        variant: 'success',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to delete stage:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete stage',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAmount = async () => {
    if (!selectedInvestor) return;
    setIsUpdatingInvestment(true);
    try {
      await apiClient.updateInvestorPipelineDetails(selectedInvestor.id, {
        expectedFutureInvestment: parseFloat(expectedInvestment) || 0
      });
      toast({
        title: 'Success',
        description: 'Amount updated successfully',
        variant: 'success',
      });
      const updatedStages = stages.map(stage => ({
        ...stage,
        investors: stage.investors?.map((inv: any) =>
          inv.id === selectedInvestor.id
            ? { ...inv, expectedFutureInvestment: parseFloat(expectedInvestment) || 0 }
            : inv
        )
      }));
      setStages(updatedStages);
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to update amount:', err);
      toast({
        title: 'Error',
        description: 'Failed to update amount',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingInvestment(false);
    }
  };

  const handleAssignIR = async () => {
    if (!selectedInvestor) return;
    setIsAssigning(true);
    try {
      await apiClient.assignInvestorRelations(selectedInvestor.id, selectedIrStaff || null);
      toast({
        title: 'Success',
        description: 'IR Officer assigned successfully',
        variant: 'success',
      });
      fetchData();
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to assign IR:', err);
      toast({
        title: 'Error',
        description: 'Failed to assign officer',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddNoteToList = () => {
    if (!currentNewNote.trim()) return;

    const newNote = {
      id: Date.now(),
      author: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.role || 'Staff'),
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      text: currentNewNote.trim()
    };

    setNotesList(prev => [newNote, ...prev]);
    setCurrentNewNote('');
    toast({
      title: 'Note added',
      description: 'The note has been added to the list. Click "Save Changes" at the bottom to persist.',
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedInvestor) return;
    setIsUpdatingInvestment(true);
    try {
      const amountChanged = parseFloat(expectedInvestment) !== selectedInvestor.expectedFutureInvestment;
      const irChanged = selectedIrStaff !== (selectedInvestor.assignedIrId || '');

      const serializedNotes = JSON.stringify(notesList);
      const noteChanged = serializedNotes !== (selectedInvestor.pipelineNote || '[]');

      const promises = [];
      if (amountChanged || noteChanged) {
        const details: any = {};
        if (amountChanged) details.expectedFutureInvestment = parseFloat(expectedInvestment) || 0;
        if (noteChanged) details.pipelineNote = serializedNotes;

        promises.push(apiClient.updateInvestorPipelineDetails(selectedInvestor.id, details));
      }
      if (irChanged) {
        promises.push(apiClient.assignInvestorRelations(selectedInvestor.id, selectedIrStaff || null));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        toast({
          title: 'Success',
          description: 'Investor details updated successfully',
          variant: 'success',
        });
        fetchData();
      }
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to update investor:', err);
      toast({
        title: 'Error',
        description: 'Failed to update details',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingInvestment(false);
    }
  };

  const fetchIRStaff = useCallback(async () => {
    setIsIrLoading(true);
    try {
      const res = await apiClient.getStaff('investor_relations', 1, 100);
      setIrStaffList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch IR staff:', err);
    } finally {
      setIsIrLoading(false);
    }
  }, []);

  if (!isLoaded) return null;

  const DroppableComponent = Droppable as any;
  const DraggableComponent = Draggable as any;
  const DragDropContextComponent = DragDropContext as any;

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F]">Pipeline</h1>
          </div>
          {canManageStages && (
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowAddStage(true)}
                className="px-5 py-2 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-full hover:bg-[#FBD24E] transition-colors whitespace-nowrap"
              >
                Add Stage
              </button>
            </div>
          )}
        </div>

        {/* Top Sync Scrollbar */}
        <div
          ref={topScrollRef}
          onScroll={handleSyncBoardScroll}
          className="overflow-x-auto pipeline-scroll"
          style={{ maxWidth: 'calc(-300px + 100vw)', marginBottom: '-10px' }}
        >
          <div style={{ width: 'max-content', height: '1px' }}>
            <div className="flex flex-nowrap gap-4 lg:gap-6 opacity-0 pointer-events-none" style={{ minWidth: 'max-content' }}>
              {stages.map((stage) => (
                <div key={stage.id} style={{ width: '350px' }} className="flex-none" />
              ))}
              <div className="pr-4" />
            </div>
          </div>
        </div>

        {/* Pipeline Board */}
        <DragDropContextComponent onDragEnd={onDragEnd}>
          <div
            ref={boardScrollRef}
            onScroll={handleSyncTopScroll}
            className="overflow-x-auto overflow-y-auto pt-2 pipeline-scroll"
            style={{
              maxHeight: 'calc(100vh - 160px)',
              maxWidth: 'calc(-300px + 100vw)',
            }}
          >
            <DroppableComponent droppableId="board" type="column" direction="horizontal">
              {(providedBoard: any) => (
                <div
                  {...providedBoard.droppableProps}
                  ref={providedBoard.innerRef}
                  className="flex flex-nowrap gap-4 lg:gap-6 py-4 pr-4"
                  style={{ minWidth: 'max-content' }}
                >
                  {stages.map((stage, index) => (
                    <DraggableComponent
                      key={stage.id}
                      draggableId={`stage-${stage.id}`}
                      index={index}
                      isDragDisabled={!canManageStages}
                    >
                      {(providedStage: any) => (
                        <div
                          ref={providedStage.innerRef}
                          {...providedStage.draggableProps}
                          className="flex-none w-[350px]"
                        >
                          <DroppableComponent droppableId={stage.id.toString()} type="investor">
                            {(provided: any, snapshot: any) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={`rounded-2xl p-4 min-h-[500px] transition-all duration-200 border-2 ${snapshot.isDraggingOver ? 'border-[#FCD34D] ring-4 ring-[#FCD34D]/10' : 'border-transparent'
                                  }`}
                                style={{ backgroundColor: stage.color }}
                              >
                                {/* Stage Header */}
                                <div
                                  {...(canManageStages ? providedStage.dragHandleProps : {})}
                                  className={cn(
                                    "flex items-center justify-between mb-5 select-none",
                                    canManageStages ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                                  )}
                                >
                                  <div className="flex items-center gap-2 group">
                                    <h3 className="text-sm font-bold text-gray-900 truncate max-w-[150px] uppercase tracking-wider">{stage.name}</h3>
                                    {canManageStages && (
                                      <button
                                        onClick={() => deleteStage(stage.id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-500 bg-white/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    {stage.count} {stage.count === 1 ? 'investor' : 'investors'}
                                  </span>
                                </div>

                                {/* Investors List */}
                                <div className="space-y-3">
                                  {stage.investors?.map((investor: any, index: number) => (
                                    <DraggableComponent key={investor.id} draggableId={investor.id.toString()} index={index}>
                                      {(provided: any, snapshot: any) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          onClick={() => {
                                            setSelectedInvestor(investor);
                                            setExpectedInvestment(investor.expectedFutureInvestment.toString());
                                            setSelectedIrStaff(investor.assignedIrId || '');

                                            // Handle notes parsing
                                            let parsedNotes = [];
                                            try {
                                              const rawNote = investor.pipelineNote;
                                              if (rawNote && (rawNote.startsWith('[') || rawNote.startsWith('{'))) {
                                                parsedNotes = JSON.parse(rawNote);
                                              } else if (rawNote) {
                                                // Legacy support: convert single string note to first list item
                                                parsedNotes = [{
                                                  id: Date.now(),
                                                  author: 'System',
                                                  date: 'Legacy Note',
                                                  text: rawNote
                                                }];
                                              }
                                            } catch (e) {
                                              console.error('Failed to parse notes:', e);
                                            }
                                            setNotesList(parsedNotes);
                                            setCurrentNewNote('');

                                            if (user?.role === 'admin' || user?.role === 'executive_admin') {
                                              fetchIRStaff();
                                            }
                                            setShowDetailModal(true);
                                          }}
                                          className={`bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group border border-transparent cursor-pointer ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-[#FCD34D] rotate-1' : ''
                                            }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex flex-col flex-1 min-w-0">

                                              <div className="flex items-center gap-3">

                                                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#1F3B6E] text-xs font-bold text-white shadow-inner">

                                                  {investor.avatar || (investor.name || investor.fullName || '?').charAt(0).toUpperCase()}

                                                </div>

                                                <div className="flex-1 flex items-center justify-between min-w-0 gap-2">

                                                  <div className="flex items-center gap-2 min-w-0">

                                                    <span className="text-[17px] font-bold text-gray-800 truncate">

                                                      {investor.name || investor.fullName || 'Unnamed Investor'}

                                                    </span>

                                                    {user?.role !== 'investor_relations' && investor.assignedIrId === user?.id && (

                                                      <span className="flex-none px-1.5 py-0.5 bg-green-100 text-[10px] font-bold text-green-700 rounded-md uppercase tracking-tight">

                                                        Self

                                                      </span>

                                                    )}

                                                  </div>

                                                  <div className="flex flex-col items-end flex-none">

                                                    <span className="text-[10px] font-bold text-gray-400 capital tracking-tighter leading-none">Amount</span>

                                                    <span className="text-[17px] font-extrabold text-green-600">

                                                      {formatCompactAmount(investor.expectedFutureInvestment || 0)}

                                                    </span>

                                                  </div>

                                                </div>

                                              </div>

                                              <div className="flex items-start mt-0.5">

                                                <div className="w-10 flex-none" />

                                                <div className="ml-3 flex-1 min-w-0">

                                                  {user?.role !== 'investor_relations' ? (

                                                    <div className="flex items-start gap-1.5 py-1 rounded-md">

                                                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex-none">With</span>

                                                      <span className={cn(

                                                        "text-[10px] font-extrabold uppercase leading-tight",

                                                        investor.assignedIrName ? "text-amber-600" : "text-gray-400 italic"

                                                      )}>

                                                        {investor.assignedIrName || 'Unassigned'}

                                                      </span>

                                                    </div>

                                                  ) : <div />}

                                                </div>

                                              </div>

                                            </div><GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                          </div>
                                        </div>
                                      )}
                                    </DraggableComponent>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              </div>
                            )}
                          </DroppableComponent>
                        </div>
                      )}
                    </DraggableComponent>
                  ))}
                  {providedBoard.placeholder}
                </div>
              )}
            </DroppableComponent>
          </div>
        </DragDropContextComponent>

        {showAddStage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl scale-in-95 animate-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">New Stage</h2>
                <button
                  onClick={() => {
                    setShowAddStage(false);
                    setNewStageName('');
                    setSelectedColor(colorOptions[0]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Stage Name</label>
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="e.g., Follow up"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-full text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-[#FCD34D] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Theme Color</label>
                  <div className="flex gap-3 flex-wrap p-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full transition-all border-4 ${selectedColor === color ? 'border-white ring-2 ring-gray-300 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowAddStage(false)}
                    className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStage}
                    disabled={!newStageName.trim()}
                    className="flex-1 py-4 bg-[#FCD34D] text-gray-800 text-sm font-bold rounded-full hover:bg-[#FBD24E] shadow-lg shadow-yellow-100 transition-all disabled:opacity-50"
                  >
                    Create Stage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investor Detail Modal */}
        {showDetailModal && selectedInvestor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-4xl shadow-2xl scale-in-95 animate-in overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-[#1F3B6E] text-xl font-bold text-white shadow-lg">
                    {selectedInvestor.avatar}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedInvestor.name || selectedInvestor.fullName}</h2>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-7 w-7 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left Column: Basic Info & Investment */}
                <div className="space-y-8">
                  <div className="bg-gray-50/50 rounded-3xl p-6 space-y-6 border border-gray-100">
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center flex-none">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-sm font-bold text-gray-700 truncate">{selectedInvestor.email || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-green-100/50 text-green-600 rounded-2xl flex items-center justify-center flex-none">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                        <p className="text-sm font-bold text-gray-700 truncate">{selectedInvestor.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Amount ($)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        value={expectedInvestment}
                        onChange={(e) => setExpectedInvestment(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-5 py-4 bg-gray-50 border rounded-full text-lg font-black text-[#1F3B6E] placeholder:text-gray-300 focus:ring-2 focus:ring-[#FCD34D] transition-all"
                      />
                    </div>
                  </div>

                  {(user?.role === 'admin' || user?.role === 'executive_admin') && (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Investor Relations Officer</label>
                      <div className="relative group">
                        <select
                          value={selectedIrStaff}
                          onChange={(e) => setSelectedIrStaff(e.target.value)}
                          disabled={isIrLoading}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-full text-sm font-bold text-gray-700 appearance-none focus:ring-2 focus:ring-[#FCD34D] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <option value="">{isIrLoading ? 'Loading staff...' : 'Unassigned / Select IR Officer'}</option>
                          {irStaffList.map((staff: any) => (
                            <option key={staff.id} value={staff.id}>{staff.full_name} ({staff.email})</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Internal Notes */}
                <div className="flex flex-col h-[500px]">
                  <div className="flex flex-col h-full space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Internal Notes / Comments</label>

                    {/* New Note Input Area */}
                    <div className="space-y-2">
                      <div className="relative border rounded-2xl bg-gray-50 overflow-hidden transition-all">
                        <textarea
                          value={currentNewNote}
                          onChange={(e) => setCurrentNewNote(e.target.value)}
                          placeholder="Add internal notes about this investor here..."
                          className="w-full p-4 bg-transparent text-sm font-medium text-gray-700 placeholder:text-gray-300 resize-none min-h-[100px] border-none focus:ring-0"
                        />
                      </div>
                      <button
                        onClick={handleAddNoteToList}
                        disabled={!currentNewNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Save Note
                      </button>
                    </div>

                    {/* Notes List / Feed */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {notesList.length === 0 ? (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl">
                          <p className="text-sm text-gray-300 font-medium">No notes yet</p>
                        </div>
                      ) : (
                        notesList.map((note) => (
                          <div key={note.id} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                  {note.author.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-gray-900">{note.author}</span>
                                <span className="text-[10px] font-medium text-gray-400">{note.date}</span>
                              </div>
                              <button
                                onClick={() => setNotesList(prev => prev.filter(n => n.id !== note.id))}
                                className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl rounded-tl-none border border-gray-100">
                              <p className="text-sm text-gray-700 leading-relaxed font-normal">{note.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10 mt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isUpdatingInvestment}
                  className="w-full py-4 bg-[#FCD34D] text-gray-800 text-sm font-bold rounded-full hover:bg-[#FBD24E] shadow-lg shadow-yellow-100 transition-all disabled:opacity-50"
                >
                  {isUpdatingInvestment ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
