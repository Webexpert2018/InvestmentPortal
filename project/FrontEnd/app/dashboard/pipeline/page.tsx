'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { X, Plus, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const colorOptions = [
  '#E5E7EB',
  '#DBEAFE', 
  '#BBF7D0',
  '#C7D2FE',
  '#DDD6FE',
  '#FDBA74',
  '#FCA5A5',
  '#FDE68A',
];

const mockInvestors = [
  'Marcus Arcand',
  'Ruben Korsgaard',
  'Omar Aminoff',
  'Jaxson Rhiel Madsen',
  'Chance Septimus',
];

const initialStages = [
  {
    id: 1,
    name: 'To Contact',
    color: '#F3F4F6',
    count: 5,
    investors: [
      { id: 1, name: 'Marcus Arcand', avatar: 'MA' },
      { id: 2, name: 'Ruben Korsgaard', avatar: 'RK' },
      { id: 3, name: 'Omar Aminoff', avatar: 'OA' },
      { id: 4, name: 'Jaxson Rhiel Madsen', avatar: 'JM' },
      { id: 5, name: 'Chance Septimus', avatar: 'CS' },
    ],
  },
  {
    id: 2,
    name: 'Contacted',
    color: '#DBEAFE',
    count: 6,
    investors: [
      { id: 6, name: 'Cristofor Westervelt', avatar: 'CW' },
      { id: 7, name: 'Nolan Dias', avatar: 'ND' },
      { id: 8, name: 'Wilson Saris', avatar: 'WS' },
      { id: 9, name: 'Gustavo Bergson', avatar: 'GB' },
      { id: 10, name: 'Carter Lubin', avatar: 'CL' },
      { id: 11, name: 'Gustavo Vetrovs', avatar: 'GV' },
    ],
  },
  {
    id: 3,
    name: 'Interested',
    color: '#D1FAE5',
    count: 4,
    investors: [
      { id: 12, name: 'Omar Donin', avatar: 'OD' },
      { id: 13, name: 'Ryan Carder', avatar: 'RC' },
      { id: 14, name: 'Phillip Westervelt', avatar: 'PW' },
      { id: 15, name: 'Alfonso Levin', avatar: 'AL' },
    ],
  },
  {
    id: 4,
    name: 'Set Up in Portal',
    color: '#E9D5FF',
    count: 4,
    investors: [
      { id: 16, name: 'Craig Westervelt', avatar: 'CW' },
      { id: 17, name: 'Roger Franci', avatar: 'RF' },
      { id: 18, name: 'Phillip Geidt', avatar: 'PG' },
      { id: 19, name: 'Leo Herwitz', avatar: 'LH' },
    ],
  },
  {
    id: 5,
    name: 'IRA Set Up',
    color: '#DDD6FE',
    count: 2,
    investors: [
      { id: 20, name: 'Chance Donin', avatar: 'CD' },
      { id: 21, name: 'Nolan Curtis', avatar: 'NC' },
    ],
  },
  {
    id: 6,
    name: 'Ready to Fund',
    color: '#FED7AA',
    count: 4,
    investors: [
      { id: 22, name: 'Cooper Dorwart', avatar: 'CD' },
      { id: 23, name: 'Talan Schleifer', avatar: 'TS' },
      { id: 24, name: 'Talan Herwitz', avatar: 'TH' },
      { id: 25, name: 'Ahmad Torff', avatar: 'AT' },
    ],
  },
];

export default function PipelinePage() {
  const [stages, setStages] = useState(initialStages);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pipeline_data');
    if (saved) {
      try {
        setStages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved pipeline data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pipeline_data', JSON.stringify(stages));
    }
  }, [stages, isLoaded]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceStageId = parseInt(source.droppableId);
    const destStageId = parseInt(destination.droppableId);

    // If dropped in same place
    if (sourceStageId === destStageId && source.index === destination.index) return;

    const newStages = Array.from(stages);
    const sInd = newStages.findIndex(s => s.id === sourceStageId);
    const dInd = newStages.findIndex(s => s.id === destStageId);

    if (sInd === -1 || dInd === -1) return;

    const sourceStage = newStages[sInd];
    const destStage = newStages[dInd];

    const sourceInvestors = Array.from(sourceStage.investors);
    const [movedInvestor] = sourceInvestors.splice(source.index, 1);

    if (sInd === dInd) {
      // Internal reorder
      sourceInvestors.splice(destination.index, 0, movedInvestor);
      newStages[sInd] = { ...sourceStage, investors: sourceInvestors };
    } else {
      // Cross column move
      const destInvestors = Array.from(destStage.investors);
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
    }

    setStages(newStages);
  };

  const handleAddClient = () => {
    if (!selectedInvestor || !selectedStageId) return;

    setStages(
      stages.map((stage) => {
        if (stage.id === selectedStageId) {
          const newId = Date.now();
          return {
            ...stage,
            investors: [
              ...stage.investors,
              {
                id: newId,
                name: selectedInvestor,
                avatar: selectedInvestor
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase(),
              },
            ],
            count: stage.count + 1,
          };
        }
        return stage;
      })
    );

    setShowAddClient(false);
    setSelectedInvestor('');
    setSelectedStageId(null);
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) return;

    const newStage = {
      id: Date.now(),
      name: newStageName,
      color: selectedColor,
      count: 0,
      investors: [],
    };

    setStages([...stages, newStage]);
    setShowAddStage(false);
    setNewStageName('');
    setSelectedColor(colorOptions[0]);
  };

  const openAddClientModal = (stageId: number) => {
    setSelectedStageId(stageId);
    setShowAddClient(true);
  };

  const deleteStage = (id: number) => {
    setStages(stages.filter(s => s.id !== id));
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
              onClick={() => setShowAddClient(true)}
              className="px-5 py-2 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-full hover:bg-[#FBD24E] transition-colors whitespace-nowrap"
            >
              Add Client
            </button>
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
                        className={`rounded-2xl p-4 min-h-[500px] transition-all duration-200 border-2 ${
                          snapshot.isDraggingOver ? 'border-[#FCD34D] ring-4 ring-[#FCD34D]/10' : 'border-transparent'
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
                          {stage.investors.map((investor, index) => (
                            <DraggableComponent key={investor.id} draggableId={investor.id.toString()} index={index}>
                              {(provided: any, snapshot: any) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group border border-transparent ${
                                    snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-[#FCD34D] rotate-1' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F3B6E] text-xs font-bold text-white shadow-inner">
                                        {investor.avatar}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-800">{investor.name}</span>
                                    </div>
                                    <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                  </div>
                                </div>
                              )}
                            </DraggableComponent>
                          ))}
                          {provided.placeholder}

                          {/* Add Client to this stage */}
                          <button
                            onClick={() => openAddClientModal(stage.id)}
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 text-gray-400 hover:border-[#FCD34D] hover:text-[#FCD34D] hover:bg-white/30 transition-all flex items-center justify-center gap-2 mt-4"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-bold uppercase tracking-wide">Add Client</span>
                          </button>
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

      {/* Modals remain the same but use premium styling */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl scale-in-95 animate-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Add Client</h2>
              <button
                onClick={() => {
                  setShowAddClient(false);
                  setSelectedInvestor('');
                  setSelectedStageId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Select Investor</label>
                <select
                  value={selectedInvestor}
                  onChange={(e) => setSelectedInvestor(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#FCD34D] transition-all"
                >
                  <option value="">Choose an investor...</option>
                  {mockInvestors.map((investor) => (
                    <option key={investor} value={investor}>
                      {investor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClient}
                  disabled={!selectedInvestor}
                  className="flex-1 py-4 bg-[#FCD34D] text-gray-800 text-sm font-bold rounded-2xl hover:bg-[#FBD24E] shadow-xl shadow-yellow-100 transition-all disabled:opacity-50"
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      className={`w-10 h-10 rounded-full transition-all border-4 ${
                        selectedColor === color ? 'border-white ring-2 ring-gray-300 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
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
