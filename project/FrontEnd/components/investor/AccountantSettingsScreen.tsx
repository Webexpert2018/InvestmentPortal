'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Plus, X } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

/* ═══════════════════════════════════════════════════════
   TYPES & DATA
   ═══════════════════════════════════════════════════════ */

type AcctTab = 'profile' | 'security' | 'notifications';

interface Session {
  id: string;
  device: string;
  status: string;
  isActive: boolean;
}

const TAB_LIST: { id: AcctTab; label: string }[] = [
  { id: 'profile', label: 'Profile Information' },
  { id: 'security', label: 'Security & Login' },
  { id: 'notifications', label: 'Notification' },
];

const SESSIONS: Session[] = [
  { id: 's1', device: 'Chrome on macOS (Current) - New York, USA', status: 'ACTIVE NOW', isActive: true },
  { id: 's2', device: 'Safari on Windows - London, UK', status: '2 hours ago', isActive: false },
];

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export function AccountantSettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<AcctTab>('profile');

  // ── Profile ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1 (USA)');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [profileImg, setProfileImg] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);

  // ── Security ──
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [authApp, setAuthApp] = useState(false);
  const [smsCodes, setSmsCodes] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);

  // ── Notifications ──
  const [notifDocUploaded, setNotifDocUploaded] = useState(true);
  const [notifMissingDoc, setNotifMissingDoc] = useState(true);
  const [notifInvestorMsg, setNotifInvestorMsg] = useState(false);
  const [notifReminder, setNotifReminder] = useState(true);

  // ── Form errors ──
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});

  // ── Logout modal ──
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ── Validation helpers ──
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isDigitsOnly = (val: string) => /^\d*$/.test(val);

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!isValidEmail(email)) errs.email = 'Invalid email format';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    else if (!isDigitsOnly(phone)) errs.phone = 'Phone number must contain only digits';
    if (!dob.trim()) errs.dob = 'Date of birth is required';
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSecurity = () => {
    const errs: Record<string, string> = {};
    if (!curPwd.trim()) errs.curPwd = 'Current password is required';
    if (!newPwd.trim()) errs.newPwd = 'New password is required';
    else if (newPwd.length < 8) errs.newPwd = 'Password must be at least 8 characters';
    if (!confirmPwd.trim()) errs.confirmPwd = 'Confirm password is required';
    else if (confirmPwd !== newPwd) errs.confirmPwd = 'Passwords do not match';
    setSecurityErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onImgChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileImg(e.target.files?.[0]?.name ?? '');
  };

  /* ─────────────── Toggle ─────────────── */
  const Toggle = ({ on, toggle }: { on: boolean; toggle: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${on ? 'bg-[#2196F3]' : 'bg-[#D1D5DB]'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
      />
    </button>
  );

  /* ═══════════════════════════════════════
     TAB 1 — Profile Information
     ═══════════════════════════════════════ */
  const ProfileTab = () => (
    <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white p-6 sm:p-8">
      {/* Avatar upload */}
      <div className="mb-6 flex items-center gap-4">
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={onImgChange} />
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          className="flex h-[60px] w-[60px] flex-col items-center justify-center gap-1 rounded-[8px] border-2 border-dashed border-[#D1D5DB] text-[#9CA3AF] hover:border-[#9CA3AF] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-[10px] leading-none font-helvetica">Upload</span>
        </button>
        <span className="text-[13px] text-[#9CA3AF] font-helvetica">
          {profileImg || 'Upload profile image here'}
        </span>
      </div>

      {/* Form fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">First Name</label>
          <input
            placeholder="Enter first name"
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); setProfileErrors((p) => ({ ...p, firstName: '' })); }}
            className={`h-[42px] w-full rounded-[8px] border ${profileErrors.firstName ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
          />
          {profileErrors.firstName && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.firstName}</p>}
        </div>
        {/* Last Name */}
        <div>
          <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Last Name</label>
          <input
            placeholder="Enter last name"
            value={lastName}
            onChange={(e) => { setLastName(e.target.value); setProfileErrors((p) => ({ ...p, lastName: '' })); }}
            className={`h-[42px] w-full rounded-[8px] border ${profileErrors.lastName ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
          />
          {profileErrors.lastName && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.lastName}</p>}
        </div>
        {/* Email */}
        <div>
          <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setProfileErrors((p) => ({ ...p, email: '' })); }}
            className={`h-[42px] w-full rounded-[8px] border ${profileErrors.email ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
          />
          {profileErrors.email && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.email}</p>}
        </div>
        {/* Phone Number */}
        <div>
          <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Phone Number</label>
          <div className="flex gap-2">
            <div className="relative w-[120px] shrink-0">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-[42px] w-full appearance-none rounded-[8px] border border-[#E5E7EB] bg-white pl-3 pr-7 text-[13px] text-[#374151] outline-none font-helvetica"
              >
                <option>+1 (USA)</option>
                <option>+44 (UK)</option>
                <option>+91 (India)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => {
                const val = e.target.value;
                if (isDigitsOnly(val)) { setPhone(val); setProfileErrors((p) => ({ ...p, phone: '' })); }
              }}
              className={`h-[42px] w-full rounded-[8px] border ${profileErrors.phone ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
            />
          </div>
          {profileErrors.phone && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.phone}</p>}
        </div>
        {/* Date of Birth */}
        <div>
          <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Date of Birth</label>
          <div className="relative">
            <input
              ref={dobRef}
              type="date"
              placeholder="Select date of birth"
              value={dob}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setDob(e.target.value); setProfileErrors((p) => ({ ...p, dob: '' })); }}
              className={`h-[42px] w-full rounded-[8px] border ${profileErrors.dob ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 pr-10 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              style={{ colorScheme: 'light' }}
            />
            <button type="button" onClick={() => dobRef.current?.showPicker()} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
              <CalendarDays className="h-[18px] w-[18px]" />
            </button>
            <style>{`input[type="date"]::-webkit-calendar-picker-indicator { display: none !important; } input[type="date"]::-webkit-inner-spin-button { display: none; }`}</style>
          </div>
          {profileErrors.dob && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.dob}</p>}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setFirstName(''); setLastName(''); setEmail('');
            setPhone(''); setDob(''); setProfileImg('');
          }}
          className="h-[40px] min-w-[100px] rounded-full border border-[#E5E7EB] bg-white px-6 text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors font-helvetica"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { if (validateProfile()) { /* save logic */ } }}
          className="h-[40px] min-w-[100px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica"
        >
          Save
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     TAB 2 — Security & Login
     ═══════════════════════════════════════ */
  const SecurityTab = () => (
    <div className="space-y-5">
      {/* Change Password */}
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Change Password</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2 sm:max-w-[calc(50%-10px)]">
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={curPwd}
                onChange={(e) => { setCurPwd(e.target.value); setSecurityErrors((p) => ({ ...p, curPwd: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${securityErrors.curPwd ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {securityErrors.curPwd && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{securityErrors.curPwd}</p>}
            </div>
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setSecurityErrors((p) => ({ ...p, newPwd: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${securityErrors.newPwd ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {securityErrors.newPwd && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{securityErrors.newPwd}</p>}
            </div>
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Confirm Password</label>
              <input
                type="password"
                placeholder="Enter confirm password"
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); setSecurityErrors((p) => ({ ...p, confirmPwd: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${securityErrors.confirmPwd ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {securityErrors.confirmPwd && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{securityErrors.confirmPwd}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => { if (validateSecurity()) { /* update password logic */ } }}
              className="h-[40px] min-w-[100px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Two-Factor Authentication</h3>
        </div>
        <div className="px-6 py-2">
          {/* Authenticator App */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1F1F1F] font-helvetica">Authenticator App</p>
              <p className="mt-[2px] text-[12px] text-[#9CA3AF] font-helvetica">Time-based one-time password (OTP)</p>
            </div>
            <Toggle on={authApp} toggle={() => setAuthApp(!authApp)} />
          </div>
          {/* SMS Backup Codes */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1F1F1F] font-helvetica">SMS Backup Codes</p>
              <p className="mt-[2px] text-[12px] text-[#9CA3AF] font-helvetica">Receive codes via text message as a backup.</p>
            </div>
            <Toggle on={smsCodes} toggle={() => setSmsCodes(!smsCodes)} />
          </div>
          {/* Download Recovery Codes */}
          <div className="py-4">
            <button
              type="button"
              className="h-[36px] rounded-full border border-[#F5D98A] bg-[#FFF8E7] px-5 text-[12px] font-medium text-[#92722A] hover:bg-[#FFF3D6] transition-colors font-helvetica"
            >
              Download Recovery Codes
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Active Sessions</h3>
        </div>
        <div className="px-6 py-3">
          <p className="text-[12px] text-[#9CA3AF] font-helvetica">
            Review and manage devices currently logged into your account.
          </p>
          <div className="mt-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-[#ECEDEF] py-4 last:border-b-0">
                <div>
                  <p className="text-[13px] text-[#1F1F1F] font-helvetica">{s.device}</p>
                  <p className={`mt-[2px] text-[11px] font-semibold font-helvetica ${s.isActive ? 'text-[#16A66A]' : 'text-[#9CA3AF]'}`}>
                    {s.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  className="h-[32px] rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-4 text-[12px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors font-helvetica"
                >
                  Log Out
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     TAB 3 — Notifications
     ═══════════════════════════════════════ */
  const NotificationsTab = () => (
    <div>
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Email Notifications</h3>
        </div>
        <div className="px-6 py-2">
          {/* New document uploaded */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">New document uploaded</span>
            <Toggle on={notifDocUploaded} toggle={() => setNotifDocUploaded(!notifDocUploaded)} />
          </div>
          {/* Missing document alerts */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">Missing document alerts</span>
            <Toggle on={notifMissingDoc} toggle={() => setNotifMissingDoc(!notifMissingDoc)} />
          </div>
          {/* New investor messages */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">New investor messages</span>
            <Toggle on={notifInvestorMsg} toggle={() => setNotifInvestorMsg(!notifInvestorMsg)} />
          </div>
          {/* Reminder */}
          <div className="flex items-center justify-between py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">Reminder</span>
            <Toggle on={notifReminder} toggle={() => setNotifReminder(!notifReminder)} />
          </div>
        </div>


        {/* Save button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="h-[40px] min-w-[100px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     LOGOUT CONFIRMATION MODAL
     ═══════════════════════════════════════ */
  const LogoutModal = () => {
    if (!logoutOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
        <div className="relative mx-4 w-full max-w-[536px] rounded-sm bg-white p-5 shadow-xl">
          {/* Close */}
          <button
            type="button"
            onClick={() => setLogoutOpen(false)}
            className="absolute right-4 top-4 text-[#6B7280] hover:text-[#374151] transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <h2 className="text-[18px] font-semibold text-[#1F1F1F] font-goudy">Log Out</h2>
          <p className="mt-1 text-[13px] text-[#6B7280] font-helvetica">
            Are you sure you want to log out this account?
          </p>

          <div className="mt-7 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setLogoutOpen(false)}
              className="h-[40px] min-w-[120px] rounded-full bg-[#FFF8E1] px-7 text-[14px] font-medium text-[#B8860B] hover:bg-[#FFECB3] transition-colors font-helvetica"
            >
              No
            </button>
            <button
              type="button"
              onClick={() => {
                setLogoutOpen(false);
                logout();
                router.push('/');
              }}
              className="h-[40px] min-w-[120px] rounded-full px-7 text-[14px] font-semibold text-[#7A5C00] hover:opacity-90 transition-colors font-helvetica"
              style={{ background: 'linear-gradient(135deg, #F5D77A 0%, #E2B93B 100%)' }}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════
     PAGE LAYOUT
     ═══════════════════════════════════════ */
  return (
    <div className="mx-auto w-full max-w-8xl font-helvetica">
      {/* Title */}
      <h1 className="text-[26px] font-bold leading-8 text-[#1F1F1F] font-goudy">Settings</h1>
      <p className="mt-1 text-[13px] text-[#9CA3AF] font-helvetica">
        Manage your account preferences and security.
      </p>

      {/* Tabs */}
      <div className="mt-5 flex gap-6 border-b border-[#ECEDEF]">
        {TAB_LIST.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative pb-3 text-[14px] font-helvetica transition-colors ${tab === t.id
              ? 'font-medium text-[#2A4474]'
              : 'text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[50%] rounded-full bg-[#FBCB4B]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 pb-8">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>

      <LogoutModal />
    </div>
  );
}
