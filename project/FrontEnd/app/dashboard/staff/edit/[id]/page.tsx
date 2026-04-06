'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, Loader2, Camera, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [funds, setFunds] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    role: '',
    associated_fund_id: '',
    full_name: '',
    email: '',
    phone: '',
    status: 'active',
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [staffData, fundsData] = await Promise.all([
        apiClient.getStaffById(id),
        apiClient.getFunds()
      ]);
      
      setFormData({
        role: staffData.role,
        associated_fund_id: staffData.associated_fund_id || '',
        full_name: staffData.full_name,
        email: staffData.email,
        phone: staffData.phone || '',
        status: staffData.status || 'active',
      });
      setImagePreview(staffData.profile_image_url || null);
      setFunds(fundsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load staff details');
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append('role', formData.role);
      submitData.append('full_name', formData.full_name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('status', formData.status);
      
      if (formData.role === 'partnership' && formData.associated_fund_id) {
        submitData.append('associated_fund_id', formData.associated_fund_id);
      }
      
      if (selectedFile) {
        submitData.append('file', selectedFile);
      }

      await apiClient.updateStaff(id, submitData);
      toast.success('Staff member updated successfully');
      router.push('/dashboard/staff');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#FFD66B]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1000px] font-helvetica text-[#1F1F1F]">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard/staff" className="flex items-center gap-2 text-[#333333] hover:opacity-70 transition-opacity">
            <ChevronLeft className="h-6 w-6" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
        </div>

        <h1 className="font-goudy text-[34px] leading-tight text-[#1F1F1F]">Edit Staff</h1>
        <p className="text-[#8E8E93] text-[14px] mt-1 mb-10">Update staff member details and permissions</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-[12px] p-8 shadow-sm ring-1 ring-black/5">
          <div className="mb-10 flex flex-col items-center">
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-[#f8f9fa] border-2 border-dashed border-[#DAE0E6] flex items-center justify-center overflow-hidden transition-all group-hover:border-[#FFD66B]">
                   {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                      <Camera className="h-8 w-8 text-[#8E8E93]" />
                   )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md border border-[#F2F2F2]">
                   <Plus className="h-4 w-4 text-[#FFD66B]" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
             </div>
             <p className="mt-4 text-[13px] font-medium text-[#1F1F1F]">Staff Image</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#1F1F1F]">Staff Role</label>
              <select
                disabled
                value={formData.role}
                className="h-[52px] px-4 rounded-[8px] bg-[#f0f0f0] border-none text-[15px] outline-none cursor-not-allowed opacity-70"
              >
                <option value="relations_associate">Relations Associate</option>
                <option value="accountant">Accountant</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>

            {formData.role === 'partnership' && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[14px] font-medium text-[#1F1F1F]">Associated Fund</label>
                <select
                  value={formData.associated_fund_id}
                  onChange={(e) => setFormData({ ...formData, associated_fund_id: e.target.value })}
                  className="h-[52px] px-4 rounded-[8px] bg-[#f8f9fa] border-none text-[15px] focus:ring-2 focus:ring-[#FFD66B] outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select associated fund</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>{fund.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#1F1F1F]">Full Name</label>
              <input
                required
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-[52px] px-4 rounded-[8px] bg-[#f8f9fa] border-none text-[15px] focus:ring-2 focus:ring-[#FFD66B] outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#1F1F1F]">Email</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-[52px] px-4 rounded-[8px] bg-[#f8f9fa] border-none text-[15px] focus:ring-2 focus:ring-[#FFD66B] outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#1F1F1F]">Phone Number</label>
              <div className="flex gap-3">
                <select className="h-[52px] px-4 rounded-[8px] bg-[#f8f9fa] border-none text-[15px] outline-none cursor-pointer w-[120px]">
                  <option>+1 USA</option>
                  <option>+91 IND</option>
                </select>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1 h-[52px] px-4 rounded-[8px] bg-[#DAE5F9] border-none text-[15px] focus:ring-2 focus:ring-[#FFD66B] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#1F1F1F]">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="h-[52px] px-4 rounded-[8px] bg-[#f8f9fa] border-none text-[15px] focus:ring-2 focus:ring-[#FFD66B] outline-none appearance-none cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between">
            <Link href="/dashboard/staff" className="px-8 py-3 rounded-full bg-[#FCF5E8] text-[#1F1F1F] font-semibold hover:bg-[#F5ECD7] transition-colors">Cancel</Link>
            <button
              disabled={loading}
              type="submit"
              className="px-10 py-3 rounded-full bg-[#FFD66B] text-[#1F1F1F] font-semibold hover:bg-[#FFC840] transition-all transform active:scale-95 disabled:opacity-50 min-w-[140px] flex items-center justify-center font-bold"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
