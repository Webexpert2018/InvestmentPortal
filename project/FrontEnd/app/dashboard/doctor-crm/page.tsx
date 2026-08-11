'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import * as XLSX from 'xlsx';
import { 
  Target, 
  Search, 
  PhoneCall, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Bot, 
  Send, 
  Loader2, 
  ChevronRight,
  Headphones,
  Minimize2,
  Maximize2,
  X,
  RefreshCw,
  Users,
  Mail,
  AlertCircle,
  MapPin,
  UserPlus,
  Plus,
  GitFork,
  Upload,
  FileSpreadsheet,
  Download,
  Check,
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

const INITIAL_CRM_DOCTORS: CrmDoctor[] = [
  {
    id: 'crm-201',
    fullName: 'Dr. David Wiebe, MD',
    specialty: 'Orthopedic Surgery',
    organization: 'Austin Spine & Joint Center',
    location: 'Austin, TX',
    email: 'dwiebe@austinspine.example.com',
    phone: '+1 (512) 555-0192',
    stage: 'call_queue',
    lastActivityDate: '4 days ago'
  },
  {
    id: 'crm-202',
    fullName: 'Dr. Sarah Jenkins, MD',
    specialty: 'Cardiovascular Disease',
    organization: 'Midwest Heart & Vascular Institute',
    location: 'Chicago, IL',
    email: 'sjenkins@midwestheart.example.com',
    phone: '+1 (312) 555-0148',
    stage: 'luma_registered',
    lastActivityDate: 'Registered 2 hours ago'
  },
  {
    id: 'crm-203',
    fullName: 'Dr. Marcus Vance, MD',
    specialty: 'Dermatology & Aesthetics',
    organization: 'Vance Dermatology Group',
    location: 'Miami, FL',
    email: 'mvance@vancederm.example.com',
    phone: '+1 (305) 555-0183',
    stage: 'pending_outreach',
    lastActivityDate: 'Replied yesterday'
  }
];

export default function DoctorCrmPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState<CrmDoctor[]>(INITIAL_CRM_DOCTORS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'interested' | 'pending_outreach' | 'needs_call'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
  
  // AI Agent Chat States - CLOSED BY DEFAULT
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; timestamp: string }>>([
    {
      sender: 'agent',
      text: 'Hello! I am your OpenAI + Fireflies Intelligence Agent. Ask me anything about your physician pipeline!',
      timestamp: 'Just now'
    }
  ]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin && user.role !== 'investor_relations') {
        toast.error('Access denied. You do not have permission to access Doctor CRM.');
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
          stage: r.stage || r.status || 'pending_outreach',
          lastActivityDate: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : 'Saved in DB',
        }));
        setDoctors(mapped);
      }
    } catch (error: any) {
      console.error('Error loading doctor prospects for CRM:', error);
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
        toast.success(`🎉 Added ${newFullName} to database! Stage set to Pending Outreach.`);
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
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          toast.error('The selected Excel file is empty.');
          return;
        }

        const parsed: ParsedDoctorLead[] = [];

        for (let i = 0; i < json.length; i++) {
          const row = json[i];

          const getVal = (...possibleHeaders: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase();
              for (const header of possibleHeaders) {
                if (cleanKey === header.toLowerCase() || cleanKey.includes(header.toLowerCase())) {
                  return String(row[key] || '').trim();
                }
              }
            }
            return '';
          };

          // 1. Individual column matching form headers
          let fullName = getVal('Full Name', 'FULL NAME', 'Doctor Name', 'Doctor', 'Name');
          let email = getVal('Email Address', 'EMAIL ADDRESS', 'Email');
          let specialty = getVal('Medical Specialty', 'MEDICAL SPECIALTY', 'Specialty', 'Speciality', 'Field');
          let phone = getVal('Phone Number', 'PHONE NUMBER', 'Phone', 'Mobile');
          let organization = getVal('Practice / Clinic Name', 'PRACTICE / CLINIC NAME', 'Clinic Name', 'Practice Name', 'Organization', 'Practice', 'Hospital');
          let location = getVal('Practice Location', 'PRACTICE LOCATION', 'Location', 'City', 'State');
          let stageStatus = getVal('Stage & Status', 'STAGE & STATUS', 'Stage', 'Status', 'Pipeline Stage');

          // Combined column 1 fallback: "Doctor & Specialty"
          const docAndSpecialty = getVal('Doctor & Specialty', 'Doctor and Specialty', 'Doctor & Speciality');
          if (docAndSpecialty) {
            if (docAndSpecialty.includes(' - ')) {
              const parts = docAndSpecialty.split(' - ');
              if (!fullName) fullName = parts[0].trim();
              if (!specialty) specialty = parts.slice(1).join(' - ').trim();
            } else if (docAndSpecialty.includes(' | ')) {
              const parts = docAndSpecialty.split(' | ');
              if (!fullName) fullName = parts[0].trim();
              if (!specialty) specialty = parts.slice(1).join(' | ').trim();
            } else if (docAndSpecialty.includes('(') && docAndSpecialty.includes(')')) {
              const match = docAndSpecialty.match(/^(.*?)\((.*?)\)$/);
              if (match) {
                if (!fullName) fullName = match[1].trim();
                if (!specialty) specialty = match[2].trim();
              }
            } else {
              if (!fullName) fullName = docAndSpecialty.trim();
            }
          }

          // Combined column 2 fallback: "Contact Info"
          const contactInfo = getVal('Contact Info', 'Contact Information', 'Contact');
          if (contactInfo) {
            const emailMatch = contactInfo.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
            if (emailMatch && !email) email = emailMatch[0];

            const phoneMatch = contactInfo.match(/(\+?[0-9]{1,4}[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4})/);
            if (phoneMatch && !phone) phone = phoneMatch[0];
            else if (!phone && contactInfo.includes(',')) {
              const parts = contactInfo.split(',');
              for (const part of parts) {
                if (!part.includes('@') && part.replace(/[^0-9]/g, '').length >= 7) {
                  phone = part.trim();
                  break;
                }
              }
            }
          }

          // Combined column 3 fallback: "Practice Location"
          const combinedLoc = getVal('Practice Location', 'Practice & Location', 'Clinic Location');
          if (combinedLoc && !organization && !location) {
            if (combinedLoc.includes(',')) {
              const parts = combinedLoc.split(',');
              organization = parts[0].trim();
              location = parts.slice(1).join(',').trim();
            } else {
              organization = combinedLoc.trim();
              location = combinedLoc.trim();
            }
          }

          // Stage mapping normalization: ensure needs_call is used for phone call queues
          let stage = 'pending_outreach';
          if (stageStatus) {
            const lowerStage = stageStatus.toLowerCase().trim();
            if (lowerStage === 'needs_call' || lowerStage.includes('needs_call') || lowerStage.includes('needs call') || lowerStage.includes('call') || lowerStage.includes('queue')) {
              stage = 'needs_call';
            } else if (lowerStage.includes('interested') || lowerStage.includes('high intent')) {
              stage = 'interested';
            } else if (lowerStage.includes('replied') || lowerStage.includes('reply')) {
              stage = 'email_replied';
            } else if (lowerStage.includes('luma') || lowerStage.includes('rsvp')) {
              stage = 'luma_registered';
            } else if (lowerStage.includes('converted') || lowerStage.includes('investor')) {
              stage = 'converted_investor';
            } else if (lowerStage.includes('pending') || lowerStage.includes('outreach')) {
              stage = 'pending_outreach';
            } else {
              stage = stageStatus;
            }
          }

          if (fullName || email || specialty || organization || location) {
            parsed.push({
              fullName: fullName || '-',
              specialty: specialty || '-',
              organization: organization || '-',
              location: location || '-',
              email: email || '-',
              phone: phone || 'N/A',
              stage: stage || 'pending_outreach'
            });
          }
        }

        if (parsed.length === 0) {
          toast.error('No valid doctor leads found in Excel file. Please ensure column headers match Full Name, Email Address, Specialty, Location, or Stage.');
          return;
        }

        setParsedLeads(parsed);
        toast.success(`Successfully parsed ${parsed.length} doctor lead(s) from ${file.name}`);
      } catch (err: any) {
        console.error('Error reading Excel file:', err);
        toast.error('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkUploadSubmit = async () => {
    if (parsedLeads.length === 0) {
      toast.error('No parsed doctor leads to upload.');
      return;
    }

    setIsUploadingBulk(true);
    try {
      const res = await apiClient.bulkAddDoctorProspects(parsedLeads);
      if (res && res.success) {
        toast.success(`🎉 Successfully saved ${res.count} doctor lead(s) into database!`);
        setIsBulkUploadModalOpen(false);
        setParsedLeads([]);
        setUploadedFileName('');
        await loadSavedDoctorsFromDb();
      } else {
        toast.error('Failed to bulk upload doctor leads.');
      }
    } catch (err: any) {
      console.error('Error bulk uploading doctor prospects:', err);
      toast.error(err.message || 'Error bulk uploading doctor prospects');
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const downloadSampleExcelTemplate = () => {
    const data = [
      {
        "Full Name": "Dr. Sarah Jenkins, MD",
        "Email Address": "sjenkins@midwestheart.com",
        "Medical Specialty": "Cardiovascular Disease",
        "Phone Number": "+1 (312) 555-0148",
        "Practice / Clinic Name": "Midwest Heart & Vascular Institute",
        "Practice Location": "Chicago, IL",
        "Stage": "pending_outreach"
      },
      {
        "Full Name": "Dr. Marcus Vance, MD",
        "Email Address": "mvance@vancederm.com",
        "Medical Specialty": "Dermatology & Aesthetics",
        "Phone Number": "+1 (305) 555-0183",
        "Practice / Clinic Name": "Vance Dermatology Group",
        "Practice Location": "Miami, FL",
        "Stage": "interested"
      },
      {
        "Full Name": "Dr. David Wiebe, MD",
        "Email Address": "dwiebe@austinspine.com",
        "Medical Specialty": "Orthopedic Surgery",
        "Phone Number": "+1 (512) 555-0192",
        "Practice / Clinic Name": "Austin Spine & Joint Center",
        "Practice Location": "Austin, TX",
        "Stage": "needs_call"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 25 },
      { wch: 20 },
      { wch: 35 },
      { wch: 20 },
      { wch: 20 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doctor Leads");
    XLSX.writeFile(workbook, "Doctor_Leads_Bulk_Upload_Template.xlsx");
    toast.success('Downloaded Doctor_Leads_Bulk_Upload_Template.xlsx');
  };

  // Dynamic KPI Counts picked directly from database records based on exact stages
  const totalDocsCount = doctors.length;
  const interestedCount = doctors.filter(d => 
    ['interested', 'email_replied', 'luma_registered', 'converted_investor'].includes(d.stage)
  ).length;
  const pendingOutreachCount = doctors.filter(d => 
    d.stage === 'pending_outreach'
  ).length;
  const scheduleForCallCount = doctors.filter(d => 
    ['call_queue', 'needs_call'].includes(d.stage)
  ).length;

  const handleAgentSend = (queryText: string) => {
    if (!queryText.trim()) return;
    
    const newMsg = {
      sender: 'user' as const,
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAgentMessages(prev => [...prev, newMsg]);
    setAgentInput('');
    setIsAgentThinking(true);

    setTimeout(() => {
      let responseText = `Currently tracking ${totalDocsCount} doctors in your database. ${interestedCount} interested, ${pendingOutreachCount} pending outreach, and ${scheduleForCallCount} queued for calls.`;
      setAgentMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAgentThinking(false);
    }, 1200);
  };

  const filteredDoctors = doctors.filter(doc => {
    let matchesTab = true;
    if (activeTab === 'interested') {
      matchesTab = ['interested', 'email_replied', 'luma_registered', 'converted_investor'].includes(doc.stage);
    } else if (activeTab === 'pending_outreach') {
      matchesTab = doc.stage === 'pending_outreach';
    } else if (activeTab === 'needs_call') {
      matchesTab = ['call_queue', 'needs_call'].includes(doc.stage);
    }

    const matchesSearch = 
      doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] relative">
        {/* Main Full Width Content Section */}
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                  <Target className="w-4 h-4" />
                </span>
                <span className="text-[12px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Step 2: CRM &amp; Meeting Intelligence
                </span>
              </div>
              <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
                Doctor Outreach CRM &amp; AI Agent
              </h1>
              <p className="text-[#8E8E93] text-[14px] mt-1 max-w-3xl">
                Manage physician status across multi-channel outreach. Track direct email replies, webinar RSVPs, and phone call queues for non-responders.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <Link
                href="/dashboard/doctor-crm/email-sequence?from=crm"
                className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#333333] text-white text-[13px] font-bold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#1F1F1F]"
              >
                <GitFork className="w-4 h-4 text-[#FFC63F]" />
                <span>View Email Sequence</span>
              </Link>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] text-[13px] font-bold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Doctor Lead</span>
              </button>

              <button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#333333] text-white text-[13px] font-bold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#1F1F1F]"
              >
                <Upload className="w-4 h-4 text-[#FFC63F]" />
                <span>Bulk Upload</span>
              </button>
            </div>
          </div>

          {/* Top 4 Dynamic KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Total Docs */}
            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">TOTAL DOCS</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">
                  {isLoading ? '...' : `${totalDocsCount} Doctors`}
                </div>
                <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                  Database Active
                </span>
              </div>
              <div className="text-[12px] text-[#8E8E93] mt-2">Saved in PostgreSQL database</div>
            </div>

            {/* Card 2: Interested */}
            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">INTERESTED</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">
                  {isLoading ? '...' : `${interestedCount} Doctors`}
                </div>
                <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  High Intent
                </span>
              </div>
              <div className="text-[12px] text-[#8E8E93] mt-2">Email replies &amp; webinar RSVPs</div>
            </div>

            {/* Card 3: Pending Outreach */}
            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">PENDING OUTREACH</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">
                  {isLoading ? '...' : `${pendingOutreachCount} Doctors`}
                </div>
                <span className="text-[12px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  In Progress
                </span>
              </div>
              <div className="text-[12px] text-[#8E8E93] mt-2">5-Day AI drip sequence active</div>
            </div>

            {/* Card 4: Schedule for Call */}
            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">SCHEDULE FOR CALL</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">
                  {isLoading ? '...' : `${scheduleForCallCount} Doctors`}
                </div>
                <span className="text-[12px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  Needs Phone Call
                </span>
              </div>
              <div className="text-[12px] text-[#8E8E93] mt-2">Unresponsive post-email; queued for call</div>
            </div>
          </div>

          {/* Pipeline Navigation Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${
                  activeTab === 'all' 
                    ? 'bg-[#FFC63F] text-[#1F1F1F] shadow-sm' 
                    : 'bg-white hover:bg-gray-100 text-[#6C6C6C] border border-[#E8E8E8]'
                }`}
              >
                All Prospects ({doctors.length})
              </button>

              <button
                onClick={() => setActiveTab('interested')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'interested' 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'bg-white hover:bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Interested ({interestedCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('pending_outreach')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'pending_outreach' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Pending Outreach ({pendingOutreachCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('needs_call')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'needs_call' 
                    ? 'bg-[#FFC63F] text-[#1F1F1F] shadow-sm' 
                    : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Schedule for Call ({scheduleForCallCount})</span>
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4" />
              <input
                type="text"
                placeholder="Filter doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E8E8E8] rounded-full py-2 pl-10 pr-4 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
              />
            </div>
          </div>

          {/* CRM Pipeline Table */}
          <div className="bg-white rounded-[20px] shadow-sm border border-[#F2F2F2] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F2F2F2] bg-[#FCFCFC]">
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Doctor &amp; Specialty</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Practice Location</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Stage &amp; Status</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F2]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93] text-[14px]">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-[#D9A11E]" />
                          <span>Loading doctor records from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93] text-[14px]">
                        No physician prospects found matching this pipeline filter.
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

                        {/* Column 2: Contact Info (Email & Phone) */}
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-[13px] font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[#8E8E93]" />
                              <span>{doc.email}</span>
                            </div>
                            <div className="text-[12px] text-[#8E8E93] flex items-center gap-1.5">
                              <PhoneCall className="w-3.5 h-3.5 text-[#8E8E93]" />
                              <span>{doc.phone}</span>
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

                        {/* Column 4: Stage & Status */}
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {doc.stage === 'pending_outreach' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Mail className="w-3.5 h-3.5 text-purple-600" />
                                Pending Outreach
                              </span>
                            )}
                            {['interested', 'luma_registered', 'converted_investor'].includes(doc.stage) && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                Interested
                              </span>
                            )}
                            {doc.stage === 'email_replied' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                Replied via Email
                              </span>
                            )}
                            {['call_queue', 'needs_call'].includes(doc.stage) && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                                Schedule for Call
                              </span>
                            )}
                            {!['pending_outreach', 'interested', 'luma_registered', 'converted_investor', 'email_replied', 'call_queue', 'needs_call'].includes(doc.stage) && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                {doc.stage ? doc.stage.replace('_', ' ') : 'Outreach Active'}
                              </span>
                            )}
                            <span className="text-[11px] text-[#8E8E93] pl-1 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {doc.lastActivityDate}
                            </span>
                          </div>
                        </td>

                        {/* Column 5: Actions */}
                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/doctor-leads/${doc.id}`}
                              className="px-4 py-2 rounded-full text-[12px] font-extrabold bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] shadow-xs flex items-center gap-1.5 transition-all inline-flex cursor-pointer"
                            >
                              <span>View Profile</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Doctor Lead Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF9EE] text-[#D9A11E] border border-[#FFE7A8] flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-goudy text-[20px] font-bold text-[#1F1F1F]">Add New Physician Lead</h3>
                    <p className="text-[12px] text-gray-500">Save lead to PostgreSQL with stage set to Pending Outreach</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1F1F1F] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Marcus Vance, MD"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. marcus.vance@clinic.org"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Medical Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Dermatology"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (305) 555-0103"
                      value={newPhone}
                      onChange={(e) => {
                        // Allow digits, plus, hyphens, parentheses, and spaces only
                        const filtered = e.target.value.replace(/[^0-9+\-\(\)\s\.]/g, '');
                        setNewPhone(filtered);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Practice / Clinic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vance Dermatology Group"
                    value={newOrganization}
                    onChange={(e) => setNewOrganization(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Practice Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Miami, FL"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[12px] text-purple-900 flex items-start gap-2">
                  <Mail className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>The new physician lead will be initialized in stage <strong>Pending Outreach</strong> and can be included in 5-day AI email drip campaigns.</span>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDoctor}
                    className="px-6 py-2.5 rounded-full text-[13px] font-bold bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingDoctor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Save &amp; Add to Pipeline</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Collapsible & Expandable Floating OpenAI Executive Assistant Widget */}
        {!isAgentOpen ? (
          /* Collapsed Pill Button in Bottom Right */
          <button
            onClick={() => setIsAgentOpen(true)}
            className="fixed right-6 bottom-6 z-40 bg-[#1F1F1F] hover:bg-[#2D2D2D] text-white p-3.5 px-5 rounded-full shadow-2xl border border-gray-700 flex items-center gap-3 transition-all transform hover:scale-105 group cursor-pointer"
            title="Open Executive Assistant AI Agent"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] font-bold shadow-md shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="text-left pr-1">
              <div className="text-[13px] font-bold text-white flex items-center gap-1.5 leading-tight">
                Executive Assistant
                <span className="w-2 h-2 rounded-full bg-[#FFC63F] animate-pulse" />
              </div>
              <div className="text-[11px] text-gray-400">Ask AI Agent</div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-gray-300 ml-1">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </button>
        ) : (
          /* Expanded Floating Chat Drawer Window */
          <div className="fixed right-6 bottom-6 z-40 w-[360px] sm:w-[400px] h-[580px] max-h-[85vh] bg-[#1F1F1F] rounded-[24px] text-white shadow-2xl border border-gray-800 flex flex-col justify-between overflow-hidden transition-all duration-300">
            {/* Header with Collapse Controls */}
            <div className="p-4 bg-[#181818] border-b border-gray-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] font-bold shadow-md shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-goudy text-[16px] font-bold text-white flex items-center gap-2 flex-wrap leading-snug">
                    Executive Assistant
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FFC63F]/20 text-[#FFC63F] px-2 py-0.5 rounded-full border border-[#FFC63F]/40">
                      RAG Engine
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400 truncate">
                    Learns from email, Luma &amp; Fireflies transcripts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setAgentMessages([{
                    sender: 'agent',
                    text: 'Hello! I am your OpenAI + Fireflies Intelligence Agent. Ask me anything about your physician pipeline!',
                    timestamp: 'Just now'
                  }])}
                  className="text-[11px] text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10 cursor-pointer"
                  title="Clear Chat"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsAgentOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
                  title="Minimize Assistant"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsAgentOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
                  title="Close Assistant"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Chat Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {agentMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[90%] px-4 py-3 rounded-[16px] text-[13px] leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-[#FFC63F] text-[#1F1F1F] font-semibold rounded-br-none shadow-sm' 
                        : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/10'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              {isAgentThinking && (
                <div className="flex items-center gap-2 text-gray-400 text-[13px] py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFC63F]" />
                  <span>AI Agent querying database &amp; transcripts...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts & Footer Input */}
            <div className="p-4 pt-2 border-t border-gray-800/80 bg-[#181818] shrink-0">
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] font-bold text-gray-400 py-0.5">Quick prompts:</span>
                {[
                  'Summarize Dr. David Wiebe',
                  'Interested doctors',
                  'Schedule for Call doctors'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAgentSend(chip)}
                    className="text-[10px] font-medium bg-white/5 hover:bg-white/15 text-gray-300 px-2.5 py-1 rounded-full border border-white/10 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleAgentSend(agentInput); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Ask AI Agent anything..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded-full px-4 py-2.5 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC63F] transition-all"
                />
                <button
                  type="submit"
                  disabled={!agentInput.trim() || isAgentThinking}
                  className="w-10 h-10 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload Doctor Leads Modal */}
        {isBulkUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-3xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF9EE] text-[#D9A11E] border border-[#FFE7A8] flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-goudy text-[22px] font-bold text-[#1F1F1F]">Bulk Upload Doctor Leads</h3>
                    <p className="text-[12px] text-gray-500">Upload Excel spreadsheet (.xlsx, .xls, .csv) to save doctor prospects into PostgreSQL</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsBulkUploadModalOpen(false);
                    setParsedLeads([]);
                    setUploadedFileName('');
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1F1F1F] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-1">
                {/* Model Column Specification Box */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-[13px]">
                      <Target className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Expected Excel File Structure (First Row / Column Headers)</span>
                    </div>
                    <button
                      onClick={downloadSampleExcelTemplate}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample Template</span>
                    </button>
                  </div>
                  <p className="text-[12px] text-blue-700">
                    Your Excel file can use separate individual field headers (matching the lead form) or combined table columns:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 text-[12px]">
                      <span className="font-bold text-gray-900 block">Full Name &amp; Email</span>
                      <span className="text-gray-500 text-[11px]">Full Name | Email Address</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 text-[12px]">
                      <span className="font-bold text-gray-900 block">Specialty &amp; Phone</span>
                      <span className="text-gray-500 text-[11px]">Medical Specialty | Phone Number</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 text-[12px]">
                      <span className="font-bold text-gray-900 block">Practice &amp; Location</span>
                      <span className="text-gray-500 text-[11px]">Practice / Clinic Name | Location</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 text-[12px]">
                      <span className="font-bold text-gray-900 block">Stage</span>
                      <span className="text-gray-500 text-[11px]">pending_outreach | interested | <strong className="text-amber-800">needs_call</strong></span>
                    </div>
                  </div>
                </div>

                {/* Drag & Drop File Selector */}
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
                    dragActive ? 'border-[#FFC63F] bg-[#FFF9EE]' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                  }`}
                >
                  <input
                    id="bulk-excel-input"
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processExcelFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="bulk-excel-input" className="cursor-pointer space-y-2 block">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-[#D9A11E] mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-[#1F1F1F] text-[14px]">
                        {uploadedFileName ? uploadedFileName : 'Click to upload'}
                      </span>
                      {!uploadedFileName && (
                        <span className="text-gray-500 text-[14px]"> or drag and drop your Excel file here</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">Supports .xlsx, .xls, and .csv files</p>
                  </label>
                </div>

                {/* Parsed Data Preview Section */}
                {parsedLeads.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1F1F1F] text-[14px]">Preview Parsed Doctor Leads ({parsedLeads.length})</span>
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">Ready to save</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setParsedLeads([]); setUploadedFileName(''); }}
                        className="text-[12px] text-red-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        Clear selection
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white custom-scrollbar">
                      <table className="w-full text-left text-[12px]">
                        <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 font-bold text-gray-600">
                          <tr>
                            <th className="px-3 py-2">Doctor &amp; Specialty</th>
                            <th className="px-3 py-2">Contact Info</th>
                            <th className="px-3 py-2">Practice Location</th>
                            <th className="px-3 py-2">Stage &amp; Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {parsedLeads.map((lead, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900">
                                {lead.fullName} <span className="text-gray-500 font-normal">({lead.specialty})</span>
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                <div>{lead.email}</div>
                                <div className="text-gray-400 text-[11px]">{lead.phone}</div>
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                <div>{lead.organization}</div>
                                <div className="text-gray-400 text-[11px]">{lead.location}</div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  {lead.stage}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkUploadModalOpen(false);
                    setParsedLeads([]);
                    setUploadedFileName('');
                  }}
                  className="px-5 py-2.5 rounded-full text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleBulkUploadSubmit}
                  disabled={parsedLeads.length === 0 || isUploadingBulk}
                  className="px-6 py-2.5 rounded-full text-[13px] font-bold text-[#1F1F1F] bg-[#FFC63F] hover:bg-[#F1B92E] shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isUploadingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#1F1F1F]" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save {parsedLeads.length} Leads to Database</span>
                    </>
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


