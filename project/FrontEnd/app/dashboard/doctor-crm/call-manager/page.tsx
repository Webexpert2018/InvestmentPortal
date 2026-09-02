'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import * as XLSX from 'xlsx';
import { 
  Target, 
  Search, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  ChevronRight,
  X,
  Users,
  Mail,
  AlertCircle,
  MapPin,
  UserPlus,
  GitFork,
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  Phone,
  Save,
  Filter,
  Activity,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface CrmDoctor {
  id: string;
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone: string;
  stage: string;
  callAction?: string;
  lastActivityDate: string;
}

interface ParsedDoctorLead {
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone: string;
  stage: string;
}

const INITIAL_CRM_DOCTORS: CrmDoctor[] = [];

export default function CallManagerPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState<CrmDoctor[]>(INITIAL_CRM_DOCTORS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [callFilter, setCallFilter] = useState<'queue' | 'all' | 'interested' | 'not_interested'>('queue');
  const [searchQuery, setSearchQuery] = useState('');

  // Call Manager Notes & Call Action States
  const [callNotesMap, setCallNotesMap] = useState<Record<string, string>>({});
  const [callActionsMap, setCallActionsMap] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Call Action Modal State
  const [selectedDoctorForAction, setSelectedDoctorForAction] = useState<CrmDoctor | null>(null);
  const [tempCallActionText, setTempCallActionText] = useState<string>('');

  const handleOpenCallActionModal = (doc: CrmDoctor) => {
    setSelectedDoctorForAction(doc);
    setTempCallActionText(callActionsMap[doc.id] !== undefined ? callActionsMap[doc.id] : (doc.callAction || ''));
  };

  const handleCopyPhone = (docId: string, phone: string) => {
    if (!phone || phone === 'N/A') {
      toast.error('No phone number available to copy.');
      return;
    }
    try {
      navigator.clipboard.writeText(phone);
      setCopiedPhoneId(docId);
      toast.success(`📋 Copied ${phone} to clipboard!`);
      setTimeout(() => {
        setCopiedPhoneId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy phone number.');
    }
  };

  // Add Doctor Lead Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newOrganization, setNewOrganization] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  
  // Bulk Upload Modal States
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [parsedLeads, setParsedLeads] = useState<ParsedDoctorLead[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Notes History Modal State
  const [selectedDoctorForNotes, setSelectedDoctorForNotes] = useState<CrmDoctor | null>(null);
  const [historyNotes, setHistoryNotes] = useState<any[]>([]);
  const [isLoadingHistoryNotes, setIsLoadingHistoryNotes] = useState<boolean>(false);

  const handleOpenNotesHistory = async (doc: CrmDoctor) => {
    setSelectedDoctorForNotes(doc);
    setIsLoadingHistoryNotes(true);
    try {
      const res = await apiClient.getDoctorNotes(doc.id);
      if (res && res.success && Array.isArray(res.notes)) {
        setHistoryNotes(res.notes);
      } else {
        setHistoryNotes([]);
      }
    } catch (err: any) {
      console.error('Error fetching notes history:', err);
      toast.error('Failed to load saved notes from database.');
    } finally {
      setIsLoadingHistoryNotes(false);
    }
  };

  const handleDeleteHistoryNote = async (noteId: number) => {
    try {
      const res = await apiClient.deleteDoctorNote(noteId);
      if (res && res.success) {
        toast.success('Deleted call note from database');
        setHistoryNotes(prev => prev.filter(n => n.id !== noteId));
      } else {
        toast.error('Failed to delete note');
      }
    } catch (err: any) {
      console.error('Error deleting note:', err);
      toast.error(err.message || 'Failed to delete note');
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin && user.role !== 'investor_relations') {
        toast.error('Access denied. You do not have permission to access Call Manager.');
        router.push('/dashboard');
      } else {
        loadSavedDoctorsFromDb();
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const loadSavedDoctorsFromDb = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSavedDoctorProspects(100);
      if (response && response.prospects && response.prospects.length > 0) {
        const mapped: CrmDoctor[] = response.prospects.map((r: any) => ({
          id: r.apollo_id || r.id,
          fullName: r.full_name || r.fullName || 'Physician',
          specialty: r.specialty || 'Medical Doctor',
          organization: r.organization || 'Medical Clinic',
          location: r.location || `${r.city || ''}, ${r.state || ''}`.trim() || 'United States',
          email: r.email || 'Email in DB',
          phone: r.phone || 'N/A',
          stage: r.stage || r.status || 'needs_call',
          callAction: r.call_action || r.callAction || '',
          lastActivityDate: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : 'Saved in DB',
        }));
        setDoctors(mapped);
      }
    } catch (error: any) {
      console.error('Error loading doctor prospects for Call Manager:', error);
      toast.error('Failed to load from database: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      toast.error('Full Name and Email Address are required.');
      return;
    }

    if (newPhone.trim()) {
      const cleanDigits = newPhone.replace(/[^0-9]/g, '');
      if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        toast.error('Please enter a valid phone number (between 7 and 15 digits, e.g. +1 (305) 555-0103).');
        return;
      }
    }

    setIsSavingDoctor(true);
    try {
      const res = await apiClient.addManualDoctorProspect({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        specialty: newSpecialty.trim(),
        organization: newOrganization.trim(),
        location: newLocation.trim(),
        phone: newPhone.trim()
      });

      if (res && res.success) {
        toast.success(`🎉 Added ${newFullName} to database!`);
        setIsAddModalOpen(false);
        setNewFullName('');
        setNewEmail('');
        setNewSpecialty('');
        setNewOrganization('');
        setNewLocation('');
        setNewPhone('');
        await loadSavedDoctorsFromDb();
      } else {
        toast.error('Failed to save doctor to database.');
      }
    } catch (err: any) {
      console.error('Error creating doctor prospect:', err);
      toast.error(err.message || 'Error creating doctor prospect');
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const handleSaveCallNote = async (docId: string, customNote?: string) => {
    const noteText = customNote || callNotesMap[docId];
    if (!noteText || !noteText.trim()) {
      toast.error('Please enter a note to save.');
      return;
    }

    setSavingNoteId(docId);
    try {
      const res = await apiClient.addDoctorNote(docId, noteText.trim(), (user as any)?.fullName || user?.email || 'Call Manager');
      if (res && res.success) {
        toast.success('📝 Saved call note to PostgreSQL database!');
        setCallNotesMap(prev => ({ ...prev, [docId]: '' }));
        
        // Instantly reflect new note in open modal history
        if (res.note) {
          setHistoryNotes(prev => [res.note, ...prev]);
        }
        // Always fetch fresh list from PostgreSQL database
        const freshNotesRes = await apiClient.getDoctorNotes(docId);
        if (freshNotesRes && freshNotesRes.success && Array.isArray(freshNotesRes.notes)) {
          setHistoryNotes(freshNotesRes.notes);
        }
      } else {
        toast.error('Failed to save call note.');
      }
    } catch (err: any) {
      console.error('Error saving call note:', err);
      toast.error(err.message || 'Failed to save call note');
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleUpdateCallAction = async (docId: string, customAction?: string) => {
    const actionText = customAction !== undefined ? customAction : callActionsMap[docId];
    if (!actionText || !actionText.trim()) {
      toast.error('Please enter a call action to save.');
      return;
    }

    setSavingActionId(docId);
    try {
      const res = await apiClient.updateProspectCallAction(docId, actionText.trim());
      if (res && res.success) {
        toast.success(`📞 Saved Call Action to DB!`);
        setDoctors(prev => prev.map(d => d.id === docId ? { ...d, callAction: actionText.trim() } : d));
        setCallActionsMap(prev => ({ ...prev, [docId]: actionText.trim() }));
        setSelectedDoctorForAction(null);
      } else {
        toast.error('Failed to save call action to DB.');
      }
    } catch (err: any) {
      console.error('Error saving call action:', err);
      toast.error(err.message || 'Failed to save call action');
    } finally {
      setSavingActionId(null);
    }
  };

  const handleUpdateStage = async (docId: string, newStage: string) => {
    try {
      const res = await apiClient.updateProspectStage(docId, newStage);
      if (res && res.success) {
        if (newStage === 'interested') {
          toast.success("Saved to DB as interested & Google Calendar invite sent! 📅");
        } else {
          toast.success(`Updated stage in DB to '${newStage}'`);
        }
        setDoctors(prev => prev.map(d => d.id === docId ? { ...d, stage: newStage } : d));
      } else {
        toast.error('Failed to update stage.');
      }
    } catch (err: any) {
      console.error('Error updating stage:', err);
      toast.error(err.message || 'Failed to update stage');
    }
  };

  const handleLogCallOutcome = async (doc: CrmDoctor, outcome: 'interested' | 'voicemail' | 'no_answer') => {
    let note = '';
    let actionName = '';
    let newStage = doc.stage;

    if (outcome === 'interested') {
      actionName = 'Spoke - Interested';
      note = '📞 Spoke with physician - High interest in wealth fund & webinar';
      newStage = 'interested';
    } else if (outcome === 'voicemail') {
      actionName = 'Left Voicemail';
      note = '📞 Left voicemail detailing Ovalia Capital session';
      newStage = 'didnt_pick_up';
    } else if (outcome === 'no_answer') {
      actionName = 'No Answer';
      note = '📞 Phone call attempted - No answer / line busy';
      newStage = 'didnt_pick_up';
    }

    if (actionName) {
      await handleUpdateCallAction(doc.id, actionName);
    }
    if (newStage !== doc.stage) {
      await handleUpdateStage(doc.id, newStage);
    }
    if (note) {
      await handleSaveCallNote(doc.id, note);
    }
  };

  const processExcelFile = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (!rawJson || rawJson.length === 0) {
          toast.error('The uploaded Excel file appears to be empty.');
          setParsedLeads([]);
          return;
        }

        const normalizedLeads: ParsedDoctorLead[] = rawJson.map((row: any) => {
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
                return String(row[k]).trim();
              }
            }
            return '';
          };

          const fullName = getVal('Full Name', 'Doctor Name', 'Doctor & Specialty', 'Name', 'full_name') || '-';
          const specialty = getVal('Medical Specialty', 'Specialty', 'specialty') || '-';
          const organization = getVal('Practice / Clinic Name', 'Clinic', 'Organization', 'organization') || '-';
          const location = getVal('Practice Location', 'Location', 'City', 'State', 'location') || '-';
          const email = getVal('Email Address', 'Contact Info', 'Email', 'email') || '-';
          let phone = getVal('Phone Number', 'Phone', 'phone') || 'N/A';
          let stage = getVal('Stage', 'Stage & Status', 'Status', 'stage').toLowerCase();

          if (stage === 'scheduled for call' || stage === 'call queue' || stage === 'call_queue') {
            stage = 'needs_call';
          } else if (!stage || stage === '-') {
            stage = 'pending_outreach';
          }

          if (phone !== 'N/A') {
            const cleanDigits = phone.replace(/[^0-9]/g, '');
            if (cleanDigits.length < 7 || cleanDigits.length > 15) {
              phone = 'N/A';
            }
          }

          return { fullName, specialty, organization, location, email, phone, stage };
        });

        setParsedLeads(normalizedLeads);
        toast.success(`Successfully parsed ${normalizedLeads.length} leads from Excel file!`);
      } catch (err: any) {
        console.error('Error parsing Excel file:', err);
        toast.error('Failed to parse Excel file: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkUploadSubmit = async () => {
    if (parsedLeads.length === 0) {
      toast.error('No valid leads parsed to upload.');
      return;
    }

    setIsUploadingBulk(true);
    try {
      const res = await apiClient.bulkAddDoctorProspects(parsedLeads);
      if (res && res.success) {
        toast.success(`🎉 Bulk uploaded ${res.count} doctor leads into database!`);
        setIsBulkUploadModalOpen(false);
        setParsedLeads([]);
        setUploadedFileName('');
        await loadSavedDoctorsFromDb();
      } else {
        toast.error('Failed to complete bulk upload.');
      }
    } catch (err: any) {
      console.error('Error bulk uploading doctor prospects:', err);
      toast.error(err.message || 'Error executing bulk upload');
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const downloadSampleExcelTemplate = () => {
    const templateData = [
      {
        'Full Name': 'Dr. Denver Vance, MD',
        'Email Address': 'denver.vance@example.com',
        'Medical Specialty': 'Orthopedic Surgery',
        'Phone Number': '+1 (512) 555-0192',
        'Practice / Clinic Name': 'Austin Joint & Spine',
        'Practice Location': 'Austin, TX',
        'Stage': 'needs_call'
      },
      {
        'Full Name': 'Dr. Mary Jenkins, MD',
        'Email Address': 'mary.jenkins@example.com',
        'Medical Specialty': 'Cardiovascular Disease',
        'Phone Number': '+1 (312) 555-0148',
        'Practice / Clinic Name': 'Midwest Heart Clinic',
        'Practice Location': 'Chicago, IL',
        'Stage': 'needs_call'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctor Leads');
    XLSX.writeFile(workbook, 'Doctor_Leads_Bulk_Upload_Template.xlsx');
    toast.success('Downloaded sample Excel template!');
  };

  // KPIs
  const scheduleForCallCount = doctors.filter(d => ['call_queue', 'needs_call', 'didnt_pick_up', 'call_back_later'].includes(d.stage)).length;
  const interestedCount = doctors.filter(d => d.stage === 'interested').length;
  const notInterestedCount = doctors.filter(d => d.stage === 'not_interested').length;

  const filteredDoctors = doctors.filter(doc => {
    let matchesFilter = true;
    if (callFilter === 'queue') {
      matchesFilter = ['call_queue', 'needs_call', 'not_interested', 'didnt_pick_up', 'call_back_later'].includes(doc.stage);
    } else if (callFilter === 'interested') {
      matchesFilter = doc.stage === 'interested';
    } else if (callFilter === 'not_interested') {
      matchesFilter = doc.stage === 'not_interested';
    }

    const matchesSearch = 
      doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.callAction && doc.callAction.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] relative space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <PhoneCall className="w-4 h-4" />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Step 3: Direct Phone Outreach &amp; Calling Intelligence
              </span>
            </div>
            <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
              Physician Call Manager Console
            </h1>
            <p className="text-[#8E8E93] text-[14px] mt-1 max-w-3xl">
              Dedicated phone outreach portal for non-responsive leads. Dial physicians directly, record live call outcomes, save notes, and advance lead stages in PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <Link
              href="/dashboard/doctor-crm"
              className="px-4 py-2 bg-white hover:bg-gray-100 text-[#1F1F1F] text-[13px] font-bold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#E8E8E8]"
            >
              <ArrowLeft className="w-4 h-4 text-[#8E8E93]" />
              <span>Back to Doctor CRM</span>
            </Link>
          </div>
        </div>

        {/* Top 3 Dynamic KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Call Queue */}
          <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">CALL QUEUE ACTIVE</div>
            <div className="flex items-baseline justify-between">
              <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">
                {isLoading ? '...' : `${scheduleForCallCount} Doctors`}
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Needs Phone Call
              </span>
            </div>
            <div className="text-[12px] text-[#8E8E93] mt-2">Unresponsive post-email; queued for call</div>
          </div>

          {/* Card 2: Not Interested */}
          <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">NOT INTERESTED</div>
            <div className="flex items-baseline justify-between">
              <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">
                {isLoading ? '...' : `${notInterestedCount} Doctors`}
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                Not Interested
              </span>
            </div>
            <div className="text-[12px] text-[#8E8E93] mt-2">Stays in Call Manager list</div>
          </div>

          {/* Card 3: Total Database Docs */}
          <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">TOTAL DATABASE DOCS</div>
            <div className="flex items-baseline justify-between">
              <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">
                {isLoading ? '...' : `${doctors.length} Doctors`}
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Database Active
              </span>
            </div>
            <div className="text-[12px] text-[#8E8E93] mt-2">Saved in PostgreSQL database</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-end">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4" />
            <input
              type="text"
              placeholder="Search by doctor, phone, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E8E8E8] rounded-full py-2 pl-10 pr-4 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
            />
          </div>
        </div>

        {/* Call Manager Table */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[#F2F2F2] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F2F2F2] bg-[#FCFCFC]">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Doctor &amp; Specialty</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Contact &amp; Phone</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Practice Location</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Stage &amp; Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Call Action (Saved in DB)</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider text-right">Call Notes &amp; History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F2]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#8E8E93] text-[14px]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#D9A11E]" />
                        <span>Loading doctor call queue from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#8E8E93] text-[14px]">
                      No physician prospects found matching this call queue filter.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                      {/* Column 1: Doctor & Specialty */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFF9EE] text-[#D9A11E] border border-[#FFE7A8] flex items-center justify-center font-bold text-[14px] shadow-xs">
                            {doc.fullName ? doc.fullName.replace(/^Dr\.?\s+/i, '')[0] : 'D'}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/doctor-leads/${doc.id}`}
                              className="font-bold text-[14px] text-[#1F1F1F] hover:text-[#D9A11E] hover:underline transition-colors block cursor-pointer"
                              title="Click to view full physician profile dossier & AI campaign"
                            >
                              {doc.fullName}
                            </Link>
                            <div className="text-[12px] text-[#8E8E93] font-medium">{doc.specialty}</div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Contact Info (Email & Direct Phone Dialing) */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <div className="text-[13px] font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#8E8E93]" />
                            <span>{doc.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-[12px] font-bold text-gray-800 flex items-center gap-1">
                              <PhoneCall className="w-3.5 h-3.5 text-[#D9A11E]" />
                              <span>{doc.phone}</span>
                            </div>
                            {doc.phone && doc.phone !== 'N/A' && (
                              <button
                                onClick={() => handleCopyPhone(doc.id, doc.phone)}
                                className="px-2.5 py-0.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-full flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                                title="Click to copy phone number to clipboard"
                              >
                                {copiedPhoneId === doc.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-white" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Phone className="w-3 h-3" />
                                    <span>Call Now</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Practice Location */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div>
                          <div className="text-[13px] font-semibold text-[#1F1F1F]">{doc.organization}</div>
                          <div className="text-[12px] text-[#8E8E93] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#8E8E93]" />
                            <span>{doc.location}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Stage & Status Dropdown Selector (2 Options: Interested & Not Interested) */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          <select
                            value={['interested', 'not_interested', 'didnt_pick_up', 'call_back_later'].includes(doc.stage) ? doc.stage : 'needs_call'}
                            onChange={(e) => handleUpdateStage(doc.id, e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-[12px] font-bold text-gray-800 focus:outline-none focus:border-[#FFC63F]"
                          >
                            {!['interested', 'not_interested', 'didnt_pick_up', 'call_back_later'].includes(doc.stage) && (
                              <option value="needs_call" disabled>📞 Needs Call (needs_call)</option>
                            )}
                            <option value="didnt_pick_up">📞 Didn't Pick Up (didnt_pick_up)</option>
                            <option value="call_back_later">🕒 Call Back Later (call_back_later)</option>
                            <option value="interested">🟢 Interested (interested)</option>
                            <option value="not_interested">🔴 Not Interested (not_interested)</option>
                          </select>
                          <span className="text-[11px] text-[#8E8E93] pl-1 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {doc.lastActivityDate}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Call Action (Separate Typable DB Column call_action) */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-start">
                          <button
                            onClick={() => handleOpenCallActionModal(doc)}
                            className="w-44 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[12px] font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Click to view or edit call action"
                          >
                            <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate text-left flex-1">
                              {callActionsMap[doc.id] !== undefined
                                ? callActionsMap[doc.id]
                                : (doc.callAction || 'Add Action')}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Column 6: Call Notes & History (Single Button opening Modal) */}
                      <td className="px-6 py-4.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenNotesHistory(doc)}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                          title="Click to view previous call notes & save a new note"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>📝 Notes &amp; History</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Doctor Lead Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FFF9EE] text-[#D9A11E] border border-[#FFE7A8] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-goudy text-[22px] font-bold text-[#1F1F1F]">Add New Doctor Lead</h3>
                  <p className="text-[12px] text-[#8E8E93]">Save physician prospect to database with stage set to Pending Outreach</p>
                </div>
              </div>

              <form onSubmit={handleCreateDoctor} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#1F1F1F] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Denver Vance, MD"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#1F1F1F] mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. dr.vance@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#1F1F1F] mb-1">Medical Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Orthopedic Surgery"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#1F1F1F] mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 (305) 555-0103"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#1F1F1F] mb-1">Practice / Clinic Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vance Spine & Joint"
                      value={newOrganization}
                      onChange={(e) => setNewOrganization(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#1F1F1F] mb-1">Practice Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Austin, TX"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-bold rounded-full transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDoctor}
                    className="px-5 py-2 bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] text-[13px] font-bold rounded-full transition-all shadow-sm flex items-center gap-2"
                  >
                    {isSavingDoctor ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#1F1F1F]" />
                        <span>Saving to DB...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Save Doctor Lead</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {isBulkUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[24px] max-w-3xl w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200 my-8">
              <button
                onClick={() => {
                  setIsBulkUploadModalOpen(false);
                  setParsedLeads([]);
                  setUploadedFileName('');
                }}
                className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1F1F1F] text-[#FFC63F] flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-goudy text-[22px] font-bold text-[#1F1F1F]">Bulk Upload Doctor Leads (Excel / CSV)</h3>
                  <p className="text-[12px] text-[#8E8E93]">Upload doctor leads spreadsheet directly into PostgreSQL doctor_prospects table</p>
                </div>
              </div>

              {/* Specification Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 mb-4 text-[12px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    Expected Excel Header Columns:
                  </span>
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Sample Excel Template</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-amber-900 pt-1">
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 font-semibold">• Full Name</div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 font-semibold">• Email Address</div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 font-semibold">• Medical Specialty</div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 font-semibold">• Phone Number</div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 font-semibold">• Practice / Clinic</div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 font-semibold">• Practice Location</div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 font-semibold">• Stage (needs_call)</div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-amber-200 text-amber-800 font-semibold">• Combined Columns</div>
                </div>
              </div>

              {/* File Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processExcelFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  dragActive ? 'border-[#FFC63F] bg-[#FFF9EE]' : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-8 h-8 text-[#8E8E93] mx-auto mb-2" />
                <p className="text-[13px] font-bold text-[#1F1F1F]">Drag and drop your Excel (.xlsx, .xls) or CSV file here</p>
                <p className="text-[12px] text-[#8E8E93] mt-1">or click below to choose file from your computer</p>
                
                <input
                  type="file"
                  id="excelFileInput"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processExcelFile(e.target.files[0]);
                    }
                  }}
                />
                
                <label
                  htmlFor="excelFileInput"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#1F1F1F] hover:bg-[#333] text-white text-[12px] font-bold rounded-full cursor-pointer transition-all shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#FFC63F]" />
                  <span>Choose Excel / CSV File</span>
                </label>

                {uploadedFileName && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold text-[12px] border border-green-200">
                    <Check className="w-3.5 h-3.5" />
                    <span>Loaded: {uploadedFileName} ({parsedLeads.length} leads)</span>
                  </div>
                )}
              </div>

              {/* Parsed Leads Preview Table */}
              {parsedLeads.length > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-[#1F1F1F] flex items-center gap-2">
                      <span>Preview Parsed Leads ({parsedLeads.length})</span>
                      <span className="text-[11px] font-normal text-[#8E8E93]">Ready to save into PostgreSQL</span>
                    </h4>
                  </div>
                  <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead className="sticky top-0 bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2">Doctor Name</th>
                          <th className="px-3 py-2">Specialty</th>
                          <th className="px-3 py-2">Clinic</th>
                          <th className="px-3 py-2">Location</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Phone</th>
                          <th className="px-3 py-2">Stage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {parsedLeads.slice(0, 15).map((lead, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 font-bold text-gray-900">{lead.fullName}</td>
                            <td className="px-3 py-1.5 text-gray-600">{lead.specialty}</td>
                            <td className="px-3 py-1.5 text-gray-600">{lead.organization}</td>
                            <td className="px-3 py-1.5 text-gray-600">{lead.location}</td>
                            <td className="px-3 py-1.5 text-gray-600">{lead.email}</td>
                            <td className="px-3 py-1.5 text-gray-600">{lead.phone}</td>
                            <td className="px-3 py-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                {lead.stage}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedLeads.length > 15 && (
                    <p className="text-[11px] text-[#8E8E93] italic text-right">Showing first 15 of {parsedLeads.length} parsed records...</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkUploadModalOpen(false);
                    setParsedLeads([]);
                    setUploadedFileName('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-bold rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUploadSubmit}
                  disabled={isUploadingBulk || parsedLeads.length === 0}
                  className="px-6 py-2 bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] text-[13px] font-bold rounded-full transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploadingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#1F1F1F]" />
                      <span>Saving {parsedLeads.length} Leads to DB...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Confirm &amp; Upload {parsedLeads.length} Leads</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Call Action Edit Modal */}
        {selectedDoctorForAction && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedDoctorForAction(null)}
                className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-goudy text-[22px] font-bold text-[#1F1F1F]">
                    Call Action
                  </h3>
                  <p className="text-[12px] text-[#8E8E93]">
                    {selectedDoctorForAction.fullName} • {selectedDoctorForAction.specialty}
                  </p>
                </div>
              </div>

              {/* Edit Call Action Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#1F1F1F] mb-1.5">
                    Call Action Text (Saved in DB)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Type call action..."
                    value={tempCallActionText}
                    onChange={(e) => setTempCallActionText(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  onClick={() => setSelectedDoctorForAction(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-bold rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateCallAction(selectedDoctorForAction.id, tempCallActionText)}
                  disabled={savingActionId === selectedDoctorForAction.id}
                  className="px-5 py-2 bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] text-[13px] font-bold rounded-full transition-all shadow-sm flex items-center gap-2"
                >
                  {savingActionId === selectedDoctorForAction.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#1F1F1F]" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#1F1F1F]" />
                      <span>Save Action</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Call Notes History Modal */}
        {selectedDoctorForNotes && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedDoctorForNotes(null)}
                className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-goudy text-[22px] font-bold text-[#1F1F1F]">
                    Call Notes History: {selectedDoctorForNotes.fullName}
                  </h3>
                  <p className="text-[12px] text-[#8E8E93]">
                    {selectedDoctorForNotes.specialty} • {selectedDoctorForNotes.organization} ({selectedDoctorForNotes.phone})
                  </p>
                </div>
              </div>

              {/* Quick Add Note Form in Modal */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 mb-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add new call note for this doctor..."
                  value={callNotesMap[selectedDoctorForNotes.id] || ''}
                  onChange={(e) => setCallNotesMap({ ...callNotesMap, [selectedDoctorForNotes.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCallNote(selectedDoctorForNotes.id);
                  }}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-[12px] text-[#1F1F1F] w-full focus:outline-none focus:border-[#FFC63F]"
                />
                <button
                  onClick={() => handleSaveCallNote(selectedDoctorForNotes.id)}
                  disabled={savingNoteId === selectedDoctorForNotes.id}
                  className="px-4 py-1.5 bg-[#1F1F1F] hover:bg-[#333] text-white text-[12px] font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1"
                >
                  {savingNoteId === selectedDoctorForNotes.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFC63F]" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-[#FFC63F]" />
                  )}
                  <span>Save</span>
                </button>
              </div>

              {/* Notes List from PostgreSQL */}
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {isLoadingHistoryNotes ? (
                  <div className="py-8 text-center text-[#8E8E93] text-[13px] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#D9A11E]" />
                    <span>Loading saved notes from PostgreSQL database...</span>
                  </div>
                ) : historyNotes.length === 0 ? (
                  <div className="py-8 text-center text-[#8E8E93] text-[13px]">
                    No call notes saved for this physician yet. Type above to add one.
                  </div>
                ) : (
                  historyNotes.map((n) => (
                    <div key={n.id} className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[13px] font-semibold text-[#1F1F1F] leading-snug">{n.note}</p>
                        <div className="text-[11px] text-[#8E8E93] flex items-center gap-2">
                          <span className="font-bold text-gray-700">{n.author_name || 'Call Manager'}</span>
                          <span>•</span>
                          <span>{n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteHistoryNote(n.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Delete this note"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-gray-100 mt-4">
                <button
                  onClick={() => setSelectedDoctorForNotes(null)}
                  className="px-5 py-1.5 bg-[#1F1F1F] text-white text-[12px] font-bold rounded-full transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
