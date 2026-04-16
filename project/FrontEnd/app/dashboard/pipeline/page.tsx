'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { X, GripVertical } from 'lucide-react';
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

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, authLoading, router]);

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
    const { source, destination, draggableId } = result;

    if (!destination) return;

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
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowAddStage(true)}
              className="px-5 py-2 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-full hover:bg-[#FBD24E] transition-colors whitespace-nowrap"
            >
              Add Stage
            </button>
          </div>
        </div>

        {/* Pipeline Board */}
        <DragDropContextComponent onDragEnd={onDragEnd}>
          <div
            className="overflow-x-auto overflow-y-auto pb-2 pipeline-scroll"
            style={{ maxHeight: 'calc(100vh - 160px)', maxWidth: 'calc(-300px + 100vw)' }}
          >
            <div className="flex flex-nowrap gap-4 lg:gap-6 py-4 pr-4" style={{ minWidth: 'max-content' }}>
              {stages.map((stage) => (
                <div key={stage.id} className="flex-none w-[320px]">
                  <DroppableComponent droppableId={stage.id.toString()}>
                    {(provided: any, snapshot: any) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`rounded-2xl p-4 min-h-[500px] transition-all duration-200 border-2 ${snapshot.isDraggingOver ? 'border-[#FCD34D] ring-4 ring-[#FCD34D]/10' : 'border-transparent'
                          }`}
                        style={{ backgroundColor: stage.color }}
                      >
                        {/* Stage Header */}
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2 group">
                            <h3 className="text-sm font-bold text-gray-900 truncate max-w-[150px] uppercase tracking-wider">{stage.name}</h3>
                            <button
                              onClick={() => deleteStage(stage.id)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
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
                                  className={`bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group border border-transparent ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-[#FCD34D] rotate-1' : ''
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F3B6E] text-xs font-bold text-white shadow-inner">
                                        {investor.avatar || (investor.name || investor.fullName || '?').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-800">{investor.name || investor.fullName || 'Unnamed Investor'}</span>
                                          {user?.role === 'investor_relations' && investor.assignedIrId === user?.id && (
                                            <span className="px-1.5 py-0.5 bg-green-100 text-[10px] font-bold text-green-700 rounded-md uppercase tracking-tight">
                                              Assigned to Me
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
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
              ))}
            </div>
          </div>
        </DragDropContextComponent>
      </div>

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
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-[#FCD34D] transition-all"
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
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStage}
                  disabled={!newStageName.trim()}
                  className="flex-1 py-4 bg-[#FCD34D] text-gray-800 text-sm font-bold rounded-2xl hover:bg-[#FBD24E] shadow-xl shadow-yellow-100 transition-all disabled:opacity-50"
                >
                  Create Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
