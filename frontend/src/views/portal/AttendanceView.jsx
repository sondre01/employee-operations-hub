import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceState, saveAttendanceState } from '../../utils/workforceStorage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Utensils,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Filter,
  Check
} from 'lucide-react';

export default function AttendanceView() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'guest';
  const [attendance, setAttendance] = useState(() => getAttendanceState(userId));
  const [statusFilter, setStatusFilter] = useState('All');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setAttendance(getAttendanceState(userId));
  }, [userId]);

  const updateStatus = (newStatus, logKey, logValue) => {
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
    setMessage(`Action recorded: ${newStatus} at ${logValue}`);
    setTimeout(() => setMessage(null), 4000);
  };

  const nowString = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleClockIn = () => updateStatus('Clocked In', 'clockIn', nowString());
  const handleBreak = () => {
    if (attendance.currentStatus === 'On Break') {
      updateStatus('Clocked In', 'breakEnd', nowString());
    } else {
      updateStatus('On Break', 'breakStart', nowString());
    }
  };
  const handleLunchOut = () => updateStatus('On Lunch', 'lunchOut', nowString());
  const handleLunchIn = () => updateStatus('Clocked In', 'lunchIn', nowString());
  const handleClockOut = () => updateStatus('Clocked Out', 'clockOut', nowString());

  const filteredHistory = attendance.history.filter((item) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Overtime') return item.status.includes('OT');
    return item.status === statusFilter;
  });

  const totalPeriodHours = attendance.history.reduce((acc, curr) => acc + curr.totalHours, 0).toFixed(1);

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-sans select-none pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
              Attendance &amp; Workday History
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 mb-0">
            Real-time biometric timestamps, shift punch station, and timesheet ledger for{' '}
            <strong className="text-zinc-800">{currentUser?.fullName}</strong>.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-zinc-200 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#13264C]" />
          <span>Pay Cycle: Oct 16 – Oct 31, 2026</span>
        </span>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Period Hours Logged
          </div>
          <div className="text-2xl font-black font-mono text-[#13264C]">
            {totalPeriodHours} hrs
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            10 regular shifts cleared
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Approved Overtime
          </div>
          <div className="text-2xl font-black font-mono text-[#D61766]">
            1.5 hrs
          </div>
          <div className="text-[11px] text-zinc-500 font-medium mt-1">
            Oct 20 Evening deployment
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            On-Time Reliability
          </div>
          <div className="text-2xl font-black font-mono text-zinc-950">
            98.2%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Exemplary punctuality
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Pending Adjustments
          </div>
          <div className="text-2xl font-black font-mono text-[#8E0F44]">
            1 Request
          </div>
          <div className="text-[11px] text-zinc-500 font-medium mt-1">
            Under manager review
          </div>
        </div>
      </div>

      {/* Live Punch Controls Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#13264C]/10 text-[#13264C] flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium">Current Biometric Status</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  attendance.currentStatus === 'Clocked In'
                    ? 'bg-emerald-500'
                    : attendance.currentStatus === 'On Break'
                    ? 'bg-[#D61766]'
                    : attendance.currentStatus === 'On Lunch'
                    ? 'bg-[#BE145B]'
                    : 'bg-zinc-400'
                }`}
              />
              <span className="text-base sm:text-lg font-black text-zinc-950 tracking-tight">
                {attendance.currentStatus}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                (Today: {attendance.todayLogs.elapsedHours || '5h 42m'})
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              In: <strong className="text-[#13264C]">{attendance.todayLogs.clockIn || '—'}</strong> &bull; Lunch Out:{' '}
              <strong>{attendance.todayLogs.lunchOut || '—'}</strong> &bull; Lunch In:{' '}
              <strong>{attendance.todayLogs.lunchIn || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Action Punch Station */}
        <div className="flex flex-wrap items-center gap-2">
          {attendance.currentStatus === 'Clocked Out' ? (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleClockIn}
              className="flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-700/80 rounded-xl shadow-xs cursor-pointer transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Clock In</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleClockOut}
              className="flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-700/80 rounded-xl shadow-xs cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Clock Out</span>
            </motion.button>
          )}

          <motion.button
            whileHover={attendance.currentStatus === 'Clocked Out' ? {} : { y: -1 }}
            whileTap={attendance.currentStatus === 'Clocked Out' ? {} : { scale: 0.98 }}
            type="button"
            disabled={attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Lunch'}
            onClick={handleBreak}
            className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all ${
              attendance.currentStatus === 'On Break'
                ? 'bg-[#D61766] hover:bg-[#BE145B] text-white border-[#BE145B] font-bold cursor-pointer'
                : attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Lunch'
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200 cursor-pointer'
            }`}
          >
            {attendance.currentStatus === 'On Break' ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Coffee className="w-4 h-4 text-zinc-600" />
            )}
            <span>{attendance.currentStatus === 'On Break' ? 'Break Out' : 'Break In'}</span>
          </motion.button>

          <motion.button
            whileHover={attendance.currentStatus === 'Clocked Out' ? {} : { y: -1 }}
            whileTap={attendance.currentStatus === 'Clocked Out' ? {} : { scale: 0.98 }}
            type="button"
            disabled={attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Break'}
            onClick={attendance.currentStatus === 'On Lunch' ? handleLunchIn : handleLunchOut}
            className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all ${
              attendance.currentStatus === 'On Lunch'
                ? 'bg-[#BE145B] hover:bg-[#A61250] text-white border-[#A61250] font-bold cursor-pointer'
                : attendance.currentStatus === 'Clocked Out' || attendance.currentStatus === 'On Break'
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200 cursor-pointer'
            }`}
          >
            <Utensils className={`w-4 h-4 ${attendance.currentStatus === 'On Lunch' ? 'text-white' : 'text-zinc-600'}`} />
            <span>{attendance.currentStatus === 'On Lunch' ? 'Lunch In' : 'Lunch Out'}</span>
          </motion.button>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
              Shift Records &amp; Biometric Audit Trail
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 self-start sm:self-auto">
            {['All', 'Completed', 'Overtime', 'Grace Period'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === f
                    ? 'bg-[#13264C] text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Lunch (Out / In)</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-zinc-950">{row.date}</td>
                  <td className="py-3 px-4 text-zinc-500">{row.day}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#13264C]">{row.clockIn}</td>
                  <td className="py-3 px-4 font-mono text-zinc-600">
                    {row.lunchOut} &ndash; {row.lunchIn}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#13264C]">{row.clockOut}</td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-950">
                    {row.totalHours.toFixed(2)} hrs
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        row.status.includes('OT')
                          ? 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
                          : row.status === 'Grace Period'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
