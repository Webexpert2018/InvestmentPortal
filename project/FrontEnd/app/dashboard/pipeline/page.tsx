'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { X, Plus } from 'lucide-react';

const stageColors = [
  '#E5E7EB', // gray
  '#DBEAFE', // blue
  '#D1FAE5', // green
  '#E9D5FF', // purple
  '#C7D2FE', // indigo
  '#FED7AA', // orange
  '#FECACA', // red
  '#FEF3C7', // yellow
];

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
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const handleAddClient = () => {
    if (!selectedInvestor || !selectedStageId) return;

    setStages(
      stages.map((stage) => {
        if (stage.id === selectedStageId) {
          const newId = Math.max(...stages.flatMap((s) => s.investors.map((i) => i.id))) + 1;
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
      id: Math.max(...stages.map((s) => s.id)) + 1,
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

        {/* Pipeline Board: fixed-height container with horizontal + vertical scroll */}
        <div
          className="overflow-x-auto overflow-y-auto pb-2 pipeline-scroll"
          style={{ maxHeight: 'calc(100vh - 160px)', maxWidth: 'calc(-300px + 100vw)' }}
        >
          <div className="flex flex-nowrap gap-4 lg:gap-6 py-4 pr-4" style={{ minWidth: 'max-content' }}>
          {stages.map((stage) => (
            <div key={stage.id} className="flex-none w-[320px]">
              <div
                className="rounded-xl p-3 sm:p-4 min-h-[400px]"
                style={{ backgroundColor: stage.color }}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{stage.name}</h3>
                    <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{stage.count} investors</span>
                </div>

                {/* Investors */}
                <div className="space-y-2 sm:space-y-3">
                  {stage.investors.map((investor) => (
                    <div
                      key={investor.id}
                      className="bg-white rounded-lg p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1F3B6E] text-xs sm:text-sm font-semibold text-white flex-shrink-0">
                          {investor.avatar}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{investor.name}</span>
                      </div>
                    </div>
                  ))}

                  {/* Add Client to this stage */}
                  <button
                    onClick={() => openAddClientModal(stage.id)}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-2.5 sm:p-3 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs sm:text-sm font-medium">Add Client</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

    
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Add Client</h2>
              <button
                onClick={() => {
                  setShowAddClient(false);
                  setSelectedInvestor('');
                  setSelectedStageId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <select
                value={selectedInvestor}
                onChange={(e) => setSelectedInvestor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent"
              >
                <option value="">Select investor</option>
                {mockInvestors.map((investor) => (
                  <option key={investor} value={investor}>
                    {investor}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end flex-wrap">
              <button
                onClick={() => {
                  setShowAddClient(false);
                  setSelectedInvestor('');
                  setSelectedStageId(null);
                }}
                className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={!selectedInvestor}
                className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-full hover:bg-[#FBD24E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Stage Modal */}
      {showAddStage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Add New Stage</h2>
              <button
                onClick={() => {
                  setShowAddStage(false);
                  setNewStageName('');
                  setSelectedColor(colorOptions[0]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Enter stage name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Stage Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all flex-shrink-0 ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end flex-wrap">
              <button
                onClick={() => {
                  setShowAddStage(false);
                  setNewStageName('');
                  setSelectedColor(colorOptions[0]);
                }}
                className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStage}
                disabled={!newStageName.trim()}
                className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-full hover:bg-[#FBD24E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
