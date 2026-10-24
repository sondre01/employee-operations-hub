import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceState, saveAttendanceState, getTimeRequests } from '../../utils/workforceStorage';
import {
  User,
  Clock,
  Bell,
  FileCheck2,
  CreditCard,
  ListChecks,
  Laptop,
  LogIn,
  LogOut,
  Coffee,
  Utensils,
  Globe2,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Timer,
  Check,
  Building2,
  UserCheck,
  Mail,
  MapPin,
  Palmtree,
  HeartPulse,
  Download,
  FileText,
  Ticket,
  QrCode,
  Smartphone
} from 'lucide-react';

export default function ProfileView({ onNavigateTab }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'guest';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attendance Punch State
  const [attendance, setAttendance] = useState(() => getAttendanceState(userId));

  // Time Requests State
  const [timeRequests, setTimeRequests] = useState(() => getTimeRequests(userId));

  // Corporate Profile Photo State (Governed by Marketing & Graphic Design Team)
  const [avatarUrl] = useState(() => {
    try {
      return currentUser?.avatarUrl || localStorage.getItem(`profile_avatar_${userId}`) || null;
    } catch {
      return currentUser?.avatarUrl || null;
    }
  });

  // Live Digital Clocks
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/employees/${currentUser.id}`);
        setProfile(data);
      } catch (err) {
        console.warn('Fallback to local user profile context:', err);
        setProfile({
          ...currentUser,
          hardwareItems: currentUser.hardwareItems || [
            { id: 1, modelName: 'MacBook Pro 16" M3 Max', assetTag: 'MLY-MBP-2026-089' }
          ],
          recentTickets: currentUser.recentTickets || []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    setAttendance(getAttendanceState(userId));
    setTimeRequests(getTimeRequests(userId));
  }, [currentUser, userId]);

  const updateClockStatus = (newStatus, logKey, logValue) => {
    const updated = {
      ...attendance,
      currentStatus: newStatus,
      todayLogs: {
        ...attendance.todayLogs,
        [logKey]: logValue,
        ...(newStatus === 'Clocked In' && logKey === 'clockIn' ? { clockOut: null } : {})
      }
    };
    setAttendance(updated);
    saveAttendanceState(updated, userId);
  };

  const nowString = () => {
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleClockIn = () => updateClockStatus('Clocked In', 'clockIn', nowString());
  const handleClockOut = () => updateClockStatus('Clocked Out', 'clockOut', nowString());

  // Break In: Starts break -> changes to Break Out
  const handleBreakIn = () => updateClockStatus('On Break', 'breakStart', nowString());
  // Break Out: Ends break -> returns to Clocked In
  const handleBreakOut = () => updateClockStatus('Clocked In', 'breakEnd', nowString());

  // Lunch In: Starts lunch -> changes to Lunch Out
  const handleLunchIn = () => updateClockStatus('On Lunch', 'lunchOut', nowString());
  // Lunch Out: Ends lunch -> returns to Clocked In
  const handleLunchOut = () => updateClockStatus('Clocked In', 'lunchIn', nowString());

  // Parse Name Breakdown
  const parseNames = () => {
    if (currentUser?.lastName && currentUser?.firstName) {
      return {
        first: currentUser.firstName,
        middle: currentUser.middleName || '—',
        last: currentUser.lastName
      };
    }
    const full = currentUser?.fullName || profile?.fullName || 'Mark Villanueva';
    const parts = full.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], middle: '—', last: '—' };
    if (parts.length === 2) return { first: parts[0], middle: '—', last: parts[1] };
    return {
      first: parts[0],
      middle: parts.slice(1, -1).join(' '),
      last: parts[parts.length - 1]
    };
  };

  const names = parseNames();
  const initials = `${(names.first[0] || 'M')}${(names.last[0] || 'V')}`.toUpperCase();
  const isDedicated = (currentUser?.employmentType === 'ClientDedicated') || (currentUser?.role === 'Developer' && !currentUser?.isInternal);

  const employeeId = currentUser?.employeeCode || `EMP-2026-${(currentUser?.id || 7).toString().padStart(3, '0')}`;
  const formattedName = `${names.last}, ${names.first}${names.middle && names.middle !== '—' ? ` ${names.middle}` : ''}`;
  const positionTitle = currentUser?.jobTitle && currentUser?.jobTitle !== 'Operations Specialist' ? currentUser.jobTitle : 'IT Hardware & Systems Specialist';
  const departmentTitle = currentUser?.departmentName && currentUser?.departmentName !== 'Dev Operation' ? currentUser.departmentName : 'IT Team';
  const reportingLead = currentUser?.reportingTo || 'Søren Lindqvist (Lead)';
  const officialEmail = currentUser?.workEmail || 'it.specialist@company.io';
  const engagementName = isDedicated ? 'Client: Nordic Logistics ApS' : 'Malayo Core Platform Delivery';

  // Leave Balance Credits (Annual CY 2026 Entitlements)
  const vacationBalance = currentUser?.vacationBalance ?? 12.0;
  const vacationTotal = 15.0;
  const sickLeaveBalance = currentUser?.sickLeaveBalance ?? 8.5;
  const sickLeaveTotal = 10.0;

  // Formatted Date & Time for Time Clock
  const dateTodayString = currentTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const manilaTimeString = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Pending Requests Calculation
  const pendingCount = timeRequests.filter(r => r.status === 'Pending Manager Review').length || 3;
  const timeCorrCount = timeRequests.filter(r => r.category === 'Time Correction').length || 2;
  const overtimeCount = timeRequests.filter(r => r.category === 'Overtime Pre-Approval').length || 1;
  const adjustmentCount = timeRequests.filter(r => r.category === 'Shift Adjustment').length || 0;

  // Onboarding Fulfillment Calculation
  const fulfillmentPercent = 75;
  const strokeDashoffset = 175.93 * (1 - fulfillmentPercent / 100);

  // Status Badge Styling (Midnight Navy #13264C & Berry Crimson #D61766)
  const getStatusStyle = (status) => {
    if (status === 'Clocked In') {
      return {
        badge: 'bg-[#13264C] text-white border-[#0E1D3B] ring-[#13264C]/20 shadow-xs',
        dot: 'bg-[#D61766]'
      };
    }
    if (status === 'On Break') {
      return {
        badge: 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/30 ring-[#D61766]/10 font-bold',
        dot: 'bg-[#D61766]'
      };
    }
    if (status === 'On Lunch') {
      return {
        badge: 'bg-[#BE145B]/10 text-[#BE145B] border-[#BE145B]/30 ring-[#BE145B]/10 font-bold',
        dot: 'bg-[#BE145B]'
      };
    }
    return {
      badge: 'bg-zinc-50 text-zinc-600 border-zinc-200 ring-zinc-200/20',
      dot: 'bg-zinc-400'
    };
  };
  const statusStyle = getStatusStyle(attendance.currentStatus);

  if (loading && !profile) {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm font-medium">
        Loading employee summary profile...
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ========================================================
          TOP ROW (TIER 1): 3 Primary Box Containers
          [Left: Employment Info & Leave Balances] [Middle (Wider): Time Clock] [Right: Announcements]
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.36fr_1.1fr] gap-4 items-stretch shrink-0 lg:min-h-[380px]">
        
        {/* BOX 1 (LEFT): 2 Containers - Container 1: Profile & Info, Container 2: Vacation & Sick Leave Balances */}
        <div className="flex flex-col gap-4 h-full">
          {/* CONTAINER 1: Profile on Left (Avatar + Name Below), Credentials Info on Right */}
          <motion.section
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-center overflow-hidden min-h-[175px]"
          >
            {/* Profile (Left: Picture + Name below) & Info (Right: Right-Aligned Details) */}
            <div className="flex items-center gap-3.5 sm:gap-4 my-auto min-h-0">
              {/* Left Side: Avatar & Name underneath */}
              <div className="flex flex-col items-center shrink-0 w-22 sm:w-26">
                <div
                  className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-zinc-100 border border-zinc-200/90 shadow-xs ring-2 ring-zinc-50 flex items-center justify-center overflow-hidden shrink-0 select-none"
                  title="Corporate profile avatar"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={names.first}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-xl sm:text-2xl font-black text-[#13264C]">
                      {initials}
                    </div>
                  )}
                  {/* Status dot */}
                  <span
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Active on Duty"
                  />
                </div>
                <div
                  className="mt-2 text-xs sm:text-sm font-black text-zinc-950 text-center tracking-tight leading-tight w-full truncate"
                  title={`${names.first} ${names.last}`}
                >
                  {names.first} {names.last}
                </div>
              </div>

              {/* Right Side: Information Details (Labels Left-Aligned, Infos Right-Aligned) */}
              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1.5 sm:space-y-2 text-xs">
                {/* Employee ID */}
                <div className="flex items-center justify-between gap-2 w-full truncate">
                  <span className="text-zinc-500 font-semibold text-left shrink-0 text-[11px] sm:text-xs">
                    Employee ID:
                  </span>
                  <span className="font-mono font-bold text-[#13264C] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60 text-right truncate text-[11px] sm:text-xs shadow-2xs">
                    {employeeId}
                  </span>
                </div>

                {/* Department */}
                <div className="flex items-center justify-between gap-2 w-full truncate">
                  <span className="text-zinc-500 font-semibold text-left shrink-0 text-[11px] sm:text-xs">
                    Department:
                  </span>
                  <span className="font-bold text-zinc-900 text-right truncate text-[11px] sm:text-xs" title={departmentTitle}>
                    {departmentTitle}
                  </span>
                </div>

                {/* Position */}
                <div className="flex items-center justify-between gap-2 w-full truncate">
                  <span className="text-zinc-500 font-semibold text-left shrink-0 text-[11px] sm:text-xs">
                    Position:
                  </span>
                  <span className="font-bold text-zinc-900 text-right truncate text-[11px] sm:text-xs" title={positionTitle}>
                    {positionTitle}
                  </span>
                </div>

                {/* Reporting Manager */}
                <div className="flex items-center justify-between gap-2 w-full truncate">
                  <span className="text-zinc-500 font-semibold text-left shrink-0 text-[11px] sm:text-xs">
                    Reporting Manager:
                  </span>
                  <span className="font-bold text-zinc-900 text-right truncate text-[11px] sm:text-xs" title={reportingLead}>
                    {reportingLead}
                  </span>
                </div>

                {/* Working Email */}
                <div className="flex items-center justify-between gap-2 w-full truncate">
                  <span className="text-zinc-500 font-semibold text-left shrink-0 text-[11px] sm:text-xs">
                    Working Email:
                  </span>
                  <a
                    href={`mailto:${officialEmail}`}
                    className="text-zinc-900 hover:text-[#D61766] transition-colors text-right font-semibold truncate text-[11px] sm:text-xs"
                    title={officialEmail}
                  >
                    {officialEmail}
                  </a>
                </div>
              </div>
            </div>
          </motion.section>

          {/* CONTAINER 2: Vacation & Sick Leave Balances */}
          <motion.section
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex-1 bg-white rounded-xl border border-zinc-200/90 p-3.5 sm:p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-center overflow-hidden min-h-[175px]"
          >
            {/* 2-Column Split: Column 1 = Vacation Leave, Column 2 = Sick Leave */}
            <div className="grid grid-cols-2 divide-x divide-zinc-100 gap-3 items-center my-auto">
              {/* Column 1: Vacation Leave */}
              <div className="flex flex-col items-center text-center justify-center pr-1 gap-1">
                {/* 1. Logo a bit large to be seen */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Palmtree className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                {/* 2. VL Balance */}
                <span className="text-xs sm:text-sm font-bold text-zinc-800 tracking-tight mt-0.5">
                  VL Balance
                </span>

                {/* 3. Days */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#13264C]">
                    {vacationBalance.toFixed(1)}
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-500 font-semibold">
                    / {vacationTotal} Days
                  </span>
                </div>

                {/* 4. Button */}
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('requests') : null}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-zinc-50 hover:bg-[#13264C] text-zinc-700 hover:text-white border border-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 group shadow-2xs"
                  title="Apply for Vacation Leave"
                >
                  <span>Apply VL</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Column 2: Sick Leave */}
              <div className="flex flex-col items-center text-center justify-center pl-3 gap-1">
                {/* 1. Logo a bit large to be seen */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <HeartPulse className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                {/* 2. SL Balance */}
                <span className="text-xs sm:text-sm font-bold text-zinc-800 tracking-tight mt-0.5">
                  SL Balance
                </span>

                {/* 3. Days */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#13264C]">
                    {sickLeaveBalance.toFixed(1)}
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-500 font-semibold">
                    / {sickLeaveTotal} Days
                  </span>
                </div>

                {/* 4. Button */}
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('requests') : null}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-zinc-50 hover:bg-[#13264C] text-zinc-700 hover:text-white border border-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 group shadow-2xs"
                  title="Apply for Sick Leave"
                >
                  <span>Apply SL</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </motion.section>
        </div>

        {/* BOX 2 (MIDDLE - WIDER WIDTH): Workday Time Clock & Shift Station */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[380px]"
        >

          {/* Centered Enlarged Date Today & Live PH Time */}
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-4">
            <div className="text-xs sm:text-sm md:text-base font-bold text-zinc-500 uppercase tracking-wider">
              {dateTodayString}
            </div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tabular-nums text-zinc-950 tracking-tight mt-1 sm:mt-2">
              {manilaTimeString}
            </div>
          </div>

          {/* Punch Action 3-Button Stack (Vertical Order: Line by Line) */}
          <div className="flex flex-col justify-center gap-2.5 my-2 shrink-0">
            {/* LINE 1: Clock In -> Clock Out */}
            {attendance.currentStatus === 'Clocked Out' ? (
              <motion.button
                key="btn-clock-in"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleClockIn}
                className="w-full flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-700/80 rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In</span>
              </motion.button>
            ) : (
              <motion.button
                key="btn-clock-out"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleClockOut}
                className="w-full flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 border border-red-700/80 rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out</span>
              </motion.button>
            )}

            {/* LINE 2: Break In -> Break Out */}
            <motion.button
              whileHover={attendance.currentStatus === 'Clocked Out' ? {} : { y: -1 }}
              whileTap={attendance.currentStatus === 'Clocked Out' ? {} : { scale: 0.98 }}
              type="button"
              disabled={attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Lunch'}
              onClick={attendance.currentStatus === 'On Break' ? handleBreakOut : handleBreakIn}
              className={`w-full flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all border ${
                attendance.currentStatus === 'On Break'
                  ? 'bg-[#D61766] hover:bg-[#BE145B] text-white border-[#BE145B] font-bold shadow-xs cursor-pointer'
                  : attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Lunch'
                  ? 'bg-zinc-100/60 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300 cursor-pointer'
              }`}
            >
              {attendance.currentStatus === 'On Break' ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Coffee className="w-4 h-4 text-zinc-700" />
              )}
              <span>{attendance.currentStatus === 'On Break' ? 'Break Out' : 'Break In'}</span>
            </motion.button>

            {/* LINE 3: Lunch In -> Lunch Out */}
            <motion.button
              whileHover={attendance.currentStatus === 'Clocked Out' ? {} : { y: -1 }}
              whileTap={attendance.currentStatus === 'Clocked Out' ? {} : { scale: 0.98 }}
              type="button"
              disabled={attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Break'}
              onClick={attendance.currentStatus === 'On Lunch' ? handleLunchOut : handleLunchIn}
              className={`w-full flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all border ${
                attendance.currentStatus === 'On Lunch'
                  ? 'bg-[#BE145B] hover:bg-[#A61250] text-white border-[#A61250] font-bold shadow-xs cursor-pointer'
                  : attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Break'
                  ? 'bg-zinc-100/60 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300 cursor-pointer'
              }`}
            >
              <Utensils className={`w-4 h-4 ${attendance.currentStatus === 'On Lunch' ? 'text-white' : 'text-zinc-700'}`} />
              <span>{attendance.currentStatus === 'On Lunch' ? 'Lunch Out' : 'Lunch In'}</span>
            </motion.button>
          </div>
        </motion.section>

        {/* BOX 3 (RIGHT): Company Announcements & HR Bulletins */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[380px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#D61766]/10 text-[#D61766]">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-bold text-zinc-950 tracking-tight">
                  Announcements
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#D61766] bg-[#D61766]/10 border border-[#D61766]/20 px-2.5 py-0.5 rounded-full">
              3 Bulletins
            </span>
          </div>

          {/* 3 Bulletin Items - Individual announcement containers with uncontained highlighted category labels */}
          <div className="flex flex-col gap-2.5 my-2 flex-1 min-h-0">
            {/* Bulletin 1 */}
            <div
              title="Thursday 4:00 PM PHT. Copenhagen client updates and year-end delivery milestones."
              className="flex-1 min-h-0 bg-zinc-50/80 hover:bg-zinc-100/90 border border-zinc-200/80 hover:border-zinc-300 p-2.5 sm:p-3 rounded-xl transition-all group overflow-hidden flex flex-col justify-between"
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#13264C]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#13264C]">
                    Townhall
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-zinc-500 font-mono font-medium">Oct 22</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-zinc-950 truncate group-hover:text-black transition-colors my-auto">
                Q4 Roadmaps &amp; Danish Team Growth
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 truncate shrink-0">
                Thursday 4:00 PM PHT &bull; Company townhall livestream
              </div>
            </div>

            {/* Bulletin 2 */}
            <div
              title="Maxicare enrollment open until Nov 5. Upload birth/marriage documents directly."
              className="flex-1 min-h-0 bg-zinc-50/80 hover:bg-zinc-100/90 border border-zinc-200/80 hover:border-zinc-300 p-2.5 sm:p-3 rounded-xl transition-all group overflow-hidden flex flex-col justify-between"
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D61766]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#D61766]">
                    Benefits
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-zinc-500 font-mono font-medium">Oct 18</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-zinc-950 truncate group-hover:text-black transition-colors my-auto">
                HMO Dependent &amp; Dental Window
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 truncate shrink-0">
                Maxicare enrollment open until Nov 5
              </div>
            </div>

            {/* Bulletin 3 */}
            <div
              title="Philippine national non-working days. Coordinate cross-border Danish sprint coverage."
              className="flex-1 min-h-0 bg-zinc-50/80 hover:bg-zinc-100/90 border border-zinc-200/80 hover:border-zinc-300 p-2.5 sm:p-3 rounded-xl transition-all group overflow-hidden flex flex-col justify-between"
            >
              <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8E0F44]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#8E0F44]">
                    Holiday
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-zinc-500 font-mono font-medium">Oct 14</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-zinc-950 truncate group-hover:text-black transition-colors my-auto">
                All Saints’ Day (Nov 1–2) Holidays
              </div>
              <div className="text-xs sm:text-sm text-zinc-600 truncate shrink-0">
                National non-working days &bull; Danish sprint coverage
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ========================================================
          MIDDLE ROW (TIER 2): 3 Containers (Requirements, Pending Requests, Payroll)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.36fr_1.1fr] gap-4 items-stretch shrink-0 lg:min-h-[225px]">
        
        {/* BOTTOM BOX 1: Onboarding Documents & Requirements Checklist (Fulfillment Chart) */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[225px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <span className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight">
                Requirements Fulfillment
              </span>
            </div>
            <span className="text-xs font-bold text-[#13264C] bg-[#13264C]/10 border border-[#13264C]/20 px-2.5 py-0.5 rounded-full">
              Compliant
            </span>
          </div>

          {/* Fulfillment Chart & Stat Overview - Centered inside container */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 my-auto w-full py-2">
            {/* Significantly Enlarged Circular Progress Gauge */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" stroke="#f4f4f5" strokeWidth="5.5" fill="none" />
                <motion.circle
                  initial={{ strokeDashoffset: 175.93 }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#D61766"
                  strokeWidth="5.5"
                  fill="none"
                  strokeDasharray="175.93"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono text-[#13264C] tracking-tight leading-none">
                  {fulfillmentPercent}%
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider mt-1">
                  Cleared
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center text-center sm:text-left">
              <div className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight leading-snug">
                6 of 8 Requirements Cleared
              </div>
              <div className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                Statutory, Tax &amp; Master Contract Verified
              </div>
            </div>
          </div>

        </motion.section>

        {/* TIER 2 - BOX 5 (MIDDLE): Time Logs (Punches Timestamp Summary) */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[225px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold text-zinc-950 tracking-tight">
                Time Logs
              </span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusStyle.badge}`}>
              {attendance.currentStatus}
            </span>
          </div>

          {/* Body: Separated Timestamps with Unconnected Lines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 sm:gap-y-4 my-auto py-2.5">
            {/* Clock in */}
            <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-zinc-200/90">
              <span className="text-xs sm:text-sm font-medium text-zinc-500">Clock in -</span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-700">{attendance.todayLogs?.clockIn || '09:00 AM'}</span>
            </div>
            {/* Clock Out */}
            <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-zinc-200/90">
              <span className="text-xs sm:text-sm font-medium text-zinc-500">Clock Out -</span>
              <span className="text-sm sm:text-base font-mono font-bold text-zinc-800">{attendance.todayLogs?.clockOut || (attendance.currentStatus === 'Clocked Out' ? '06:00 PM' : 'Active')}</span>
            </div>

            {/* Break in */}
            <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-zinc-200/90">
              <span className="text-xs sm:text-sm font-medium text-zinc-500">Break in -</span>
              <span className="text-sm sm:text-base font-mono font-bold text-zinc-800">{attendance.todayLogs?.breakStart || '10:30 AM'}</span>
            </div>
            {/* Break Out */}
            <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-zinc-200/90">
              <span className="text-xs sm:text-sm font-medium text-zinc-500">Break Out -</span>
              <span className="text-sm sm:text-base font-mono font-bold text-zinc-800">{attendance.todayLogs?.breakEnd || (attendance.currentStatus === 'On Break' ? 'In Progress' : '10:45 AM')}</span>
            </div>

            {/* Lunch in */}
            <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-zinc-200/90">
              <span className="text-xs sm:text-sm font-medium text-zinc-500">Lunch in -</span>
              <span className="text-sm sm:text-base font-mono font-bold text-zinc-800">{attendance.todayLogs?.lunchStart || '01:00 PM'}</span>
            </div>
            {/* Lunch Out */}
            <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-zinc-200/90">
              <span className="text-xs sm:text-sm font-medium text-zinc-500">Lunch Out -</span>
              <span className="text-sm sm:text-base font-mono font-bold text-zinc-800">{attendance.todayLogs?.lunchEnd || (attendance.currentStatus === 'On Lunch' ? 'In Progress' : '02:00 PM')}</span>
            </div>
          </div>

        </motion.section>

        {/* TIER 2 - BOX 6 (RIGHT): App Access (QR Code for iOS & Android) */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[225px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                <QrCode className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold text-zinc-950 tracking-tight">
                App Access
              </span>
            </div>
            <span className="text-xs bg-[#13264C]/10 text-[#13264C] border border-[#13264C]/20 px-2.5 py-0.5 rounded-full font-bold">
              Standby
            </span>
          </div>

          {/* Body: Centered QR Code & Centered Text */}
          <div className="flex flex-col items-center justify-center text-center my-auto py-1">
            {/* Centered Crisp QR Code Graphic */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 bg-zinc-50 p-2 rounded-2xl border border-zinc-200/90 shadow-2xs flex items-center justify-center shrink-0 mb-2">
              <svg className="w-full h-full text-zinc-900" viewBox="0 0 100 100" fill="currentColor">
                <path d="M10 10 h24 v24 h-24 z M14 14 v16 h16 v-16 z M18 18 h8 v8 h-8 z" />
                <path d="M66 10 h24 v24 h-24 z M70 14 v16 h16 v-16 z M74 18 h8 v8 h-8 z" />
                <path d="M10 66 h24 v24 h-24 z M14 70 v16 h16 v-16 z M18 74 h8 v8 h-8 z" />
                <rect x="42" y="10" width="7" height="7" />
                <rect x="52" y="14" width="7" height="7" />
                <rect x="42" y="24" width="7" height="7" />
                <rect x="10" y="42" width="7" height="7" />
                <rect x="22" y="46" width="7" height="7" />
                <rect x="30" y="42" width="7" height="7" />
                <rect x="42" y="42" width="7" height="7" />
                <rect x="52" y="42" width="7" height="7" />
                <rect x="64" y="46" width="7" height="7" />
                <rect x="74" y="42" width="7" height="7" />
                <rect x="84" y="46" width="7" height="7" />
                <rect x="42" y="56" width="7" height="7" />
                <rect x="52" y="62" width="7" height="7" />
                <rect x="64" y="56" width="7" height="7" />
                <rect x="74" y="66" width="7" height="7" />
                <rect x="84" y="74" width="7" height="7" />
                <rect x="42" y="74" width="7" height="7" />
                <rect x="52" y="84" width="7" height="7" />
                <rect x="66" y="84" width="7" height="7" />
                <rect x="80" y="84" width="7" height="7" />
              </svg>
            </div>

            {/* Mobile App Description & Platform Badges */}
            <div className="flex flex-col items-center text-center">
              <div className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight leading-snug">
                Mobile Workforce App
              </div>
              <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Scan to access via mobile browser
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-xs border border-zinc-200/80 shadow-2xs">
                  iOS
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-xs border border-zinc-200/80 shadow-2xs">
                  Android
                </span>
              </div>
            </div>
          </div>

        </motion.section>
      </div>

      {/* ========================================================
          BOTTOM ROW (TIER 3): 3 Additional Containers Below
          [Left: Tickets Summary]
          [Middle: Pending Requests]
          [Right: Payroll Cut-Offs]
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.36fr_1.1fr] gap-4 items-stretch shrink-0 lg:min-h-[225px]">
        
        {/* TIER 3 - BOX 7 (LEFT): Tickets Summary */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[225px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                <Ticket className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold text-zinc-950 tracking-tight">
                Tickets Summary
              </span>
            </div>
            <span className="text-xs font-bold text-[#13264C] bg-[#13264C]/10 border border-[#13264C]/20 px-2.5 py-0.5 rounded-full">
              2 Active
            </span>
          </div>

          {/* Body: Raised Tickets List */}
          <div className="my-auto space-y-2 py-1">
            <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-zinc-900 truncate">#104 MacBook Docking Hub</div>
                <div className="text-[10px] text-zinc-500 truncate">IT Systems &bull; Oct 22</div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md shrink-0">
                In Progress
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-zinc-900 truncate">#101 VPN Pod Access</div>
                <div className="text-[10px] text-zinc-500 truncate">Network Security &bull; Oct 19</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md shrink-0">
                Resolved
              </span>
            </div>
          </div>

          {/* Footer with simple Raise Ticket button */}
          <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 shrink-0">
            <span className="text-zinc-600 font-medium">SLA: 4h Response</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('mytickets')}
                className="py-1 px-2.5 rounded-lg bg-[#13264C] hover:bg-[#1a3366] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Raise New Support Ticket"
              >
                <span>+ Raise Ticket</span>
              </button>
            )}
          </div>
        </motion.section>

        {/* TIER 3 - BOX 8 (MIDDLE - WIDER WIDTH): Pending Requests */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[225px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#D61766]/10 text-[#D61766]">
                <ListChecks className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold text-zinc-950 tracking-tight">
                Pending Requests ({pendingCount})
              </span>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('requests')}
                className="flex items-center gap-1 text-[#D61766] hover:text-[#BE145B] font-bold text-xs cursor-pointer underline underline-offset-2"
              >
                <span>+ File Request</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Body: Split into KPI Stat & Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_2fr] gap-2.5 items-center my-auto py-1">
            {/* KPI Stat & Approver Info */}
            <div className="bg-zinc-100/90 border border-zinc-200 p-2.5 sm:p-3 rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#D61766] leading-none font-mono">
                  {pendingCount}
                </span>
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Total
                </span>
              </div>
              <div className="text-xs text-zinc-500 mt-1.5 truncate">
                Approver: <strong className="text-[#13264C]">Søren L.</strong>
              </div>
            </div>

            {/* 3 Category Metric Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-50 border border-zinc-200/80 p-2 sm:p-2.5 rounded-xl text-center hover:border-zinc-300 transition-colors">
                <div className="text-base sm:text-lg font-black text-[#13264C] font-mono">{timeCorrCount}</div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5">Time Corr.</div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200/80 p-2 sm:p-2.5 rounded-xl text-center hover:border-zinc-300 transition-colors">
                <div className="text-base sm:text-lg font-black text-[#D61766] font-mono">{overtimeCount}</div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5">Overtime</div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200/80 p-2 sm:p-2.5 rounded-xl text-center hover:border-zinc-300 transition-colors">
                <div className="text-base sm:text-lg font-black text-zinc-600 font-mono">{adjustmentCount}</div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5">Shift Adj.</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 shrink-0">
            <div className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-zinc-400" />
              <span>SLA: <strong className="text-[#13264C]">24h Window</strong></span>
            </div>
            <span className="text-zinc-700 font-medium">Standard Escalation Active</span>
          </div>
        </motion.section>

        {/* TIER 3 - BOX 9 (RIGHT): Payroll Cut-Offs */}
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
          className="h-full bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden lg:min-h-[225px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold text-zinc-950 tracking-tight">
                Payroll Cut-Offs
              </span>
            </div>
            <span className="text-xs bg-[#D61766]/10 text-[#D61766] border border-[#D61766]/20 px-2.5 py-0.5 rounded-full font-bold">
              3 Days Left
            </span>
          </div>

          {/* 4 Date Metric Cells in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2 my-auto py-1">
            <div className="bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-xl">
              <div className="text-[10px] sm:text-[11px] uppercase font-bold text-zinc-500 tracking-wider">Pay Period</div>
              <div className="text-xs sm:text-sm font-black text-zinc-950 mt-1">Oct 16 – 31</div>
              <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Semi-Monthly</div>
            </div>

            <div className="bg-zinc-100 border border-zinc-300/80 p-2.5 rounded-xl">
              <div className="text-[10px] sm:text-[11px] uppercase font-bold text-[#D61766] tracking-wider">Filing Cut-Off</div>
              <div className="text-xs sm:text-sm font-black text-zinc-950 mt-1">Oct 26, 11:59p</div>
              <div className="text-[10px] text-zinc-600 font-medium mt-0.5">Adjustments</div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200/80 p-2.5 rounded-xl">
              <div className="text-[10px] sm:text-[11px] uppercase font-bold text-zinc-500 tracking-wider">Approval Cut-Off</div>
              <div className="text-xs sm:text-sm font-black text-zinc-800 mt-1">Oct 28, 5:00p</div>
              <div className="text-[10px] text-zinc-500 font-medium mt-0.5">Sign-Off</div>
            </div>

            <div className="bg-[#112144] text-white border border-[#0E1D3B] p-2.5 rounded-xl shadow-xs">
              <div className="text-[10px] sm:text-[11px] uppercase font-bold text-zinc-300 tracking-wider flex items-center justify-between">
                <span>Crediting Date</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D61766]"></span>
              </div>
              <div className="text-xs sm:text-sm font-black text-white mt-1">Oct 31, 2026</div>
              <div className="text-[10px] text-zinc-300 font-medium mt-0.5">Direct Deposit</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 shrink-0">
            <span>Next: <strong className="text-[#13264C]">Nov 01 – 15</strong></span>
            <span className="text-zinc-800 font-semibold">Direct Deposit BDO</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
