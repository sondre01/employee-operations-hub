import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceState } from '../../utils/workforceStorage';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  ArrowUpRight,
  Globe2,
  ShieldCheck,
  Activity
} from 'lucide-react';

export default function AttendanceView({ onNavigateTab }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'guest';
  const [attendance, setAttendance] = useState(() => getAttendanceState(userId));
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'performance'
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    setAttendance(getAttendanceState(userId));
  }, [userId]);

  const filteredHistory = attendance.history.filter((item) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Overtime') return item.status.includes('OT');
    return item.status === statusFilter;
  });

  const totalPeriodHours = attendance.history.reduce((acc, curr) => acc + curr.totalHours, 0).toFixed(1);
  const targetCycleHours = 88.0;
  const cycleCompletionPct = Math.min(100, Math.round((parseFloat(totalPeriodHours) / targetCycleHours) * 100));

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Two Tabs Navigation */}
      <div className="flex items-center bg-zinc-200/70 p-1 rounded-xl border border-zinc-200/90 w-fit max-w-full overflow-x-auto no-scrollbar shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'audit'
              ? 'bg-[#13264C] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Shift &amp; Biometric Audit Trail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'performance'
              ? 'bg-[#13264C] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Cycle Performance &amp; Shift Sync</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: Shift & Biometric Audit Trail (Full Focus)
          ======================================================== */}
      {activeTab === 'audit' && (
        <motion.div
          key="tab-audit"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-white rounded-xl border border-zinc-200/90 shadow-xs hover:border-zinc-300 transition-all overflow-hidden flex flex-col flex-1 min-h-[460px]"
        >
          {/* Table Top Toolbar */}
          <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 self-start sm:self-auto shrink-0 max-w-full overflow-x-auto no-scrollbar">
              {['All', 'Completed', 'Overtime', 'Grace Period'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === f
                      ? 'bg-[#13264C] text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <span className="text-xs text-zinc-500 font-medium">
              Showing <strong className="text-zinc-900 font-mono">{filteredHistory.length}</strong> of{' '}
              <strong className="text-zinc-900 font-mono">{attendance.history.length}</strong> shift records
            </span>
          </div>

          {/* Clean Responsive Full-Width Table */}
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead className="bg-zinc-50/90 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Date</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Day</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Scheduled Shift</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Clock In</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Lunch (Out &ndash; In)</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Clock Out</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Duration</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                {filteredHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/90 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-950 whitespace-nowrap">{row.date}</td>
                    <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">{row.day}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500 text-[11px] whitespace-nowrap">08:00 &ndash; 17:00</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#13264C] whitespace-nowrap">{row.clockIn}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600 whitespace-nowrap">
                      {row.lunchOut} &ndash; {row.lunchIn}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#13264C] whitespace-nowrap">{row.clockOut}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-zinc-950 whitespace-nowrap">
                      {row.totalHours.toFixed(2)} hrs
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.status.includes('OT')
                            ? 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
                            : row.status === 'Grace Period'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.status.includes('OT')
                              ? 'bg-[#D61766]'
                              : row.status === 'Grace Period'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary Totals */}
          <div className="p-3.5 sm:p-4 bg-zinc-50/90 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-zinc-500 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Biometric Timesheet Ledger Certified for CY 2026 Payroll Distribution</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-700">
              <div>
                <span className="text-zinc-500 mr-1">Shifts Logged:</span>
                <strong className="text-zinc-950 font-mono">{filteredHistory.length} Days</strong>
              </div>
              <div>
                <span className="text-zinc-500 mr-1">Total Compensable:</span>
                <strong className="text-[#13264C] font-mono font-black text-sm">{totalPeriodHours} hrs</strong>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          TAB 2: Cycle Performance & Shift Schedule / Sync
          ======================================================== */}
      {activeTab === 'performance' && (
        <motion.div
          key="tab-performance"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch flex-1"
        >
          {/* CARD 1: Cycle Performance & Hours */}
          <section className="h-full bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-[#D61766]/10 text-[#D61766]">
                  <Activity className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight m-0">
                    Cycle Performance
                  </h3>
                  <p className="text-[11px] text-zinc-500 m-0">
                    Pay cycle hour accumulation and punctuality breakdown
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Punctuality 98.2%
              </span>
            </div>

            {/* 4 Metric Cards in Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 flex-1">
              {/* Metric 1 */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/80 flex flex-col justify-between hover:bg-zinc-100/80 transition-all">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Period Hours Logged
                </span>
                <div className="my-1.5">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-[#13264C]">
                    {totalPeriodHours}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 ml-1">hrs</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>10 regular shifts cleared</span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/80 flex flex-col justify-between hover:bg-zinc-100/80 transition-all">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Approved Overtime
                </span>
                <div className="my-1.5">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-[#D61766]">
                    1.5
                  </span>
                  <span className="text-xs font-bold text-zinc-500 ml-1">hrs</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-semibold truncate">
                  Oct 20 Evening deployment
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/80 flex flex-col justify-between hover:bg-zinc-100/80 transition-all">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  On-Time Reliability
                </span>
                <div className="my-1.5">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-zinc-950">
                    98.2%
                  </span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 truncate">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Exemplary punctuality</span>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/80 flex flex-col justify-between hover:bg-zinc-100/80 transition-all">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Pending Adjustments
                </span>
                <div className="my-1.5">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-[#8E0F44]">
                    1
                  </span>
                  <span className="text-xs font-bold text-zinc-500 ml-1">Request</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-semibold truncate">
                  Under manager review
                </div>
              </div>
            </div>

            {/* Pay Cycle Target Progress Bar */}
            <div className="pt-4 border-t border-zinc-100 shrink-0">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-600">Pay Cycle Target Progress</span>
                <span className="font-mono font-bold text-[#13264C]">
                  {totalPeriodHours} / {targetCycleHours} hrs ({cycleCompletionPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#13264C] via-[#9B1348] to-[#D61766] transition-all duration-500"
                  style={{ width: `${cycleCompletionPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5 font-medium">
                <span>Standard 88h Cycle Target</span>
                <span>7 days remaining in cut-off</span>
              </div>
            </div>
          </section>

          {/* CARD 2: Shift Schedule & Sync */}
          <section className="h-full bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                  <Globe2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight m-0">
                    Shift Schedule &amp; Sync
                  </h3>
                  <p className="text-[11px] text-zinc-500 m-0">
                    Assigned operational window and Danish delivery sync
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#13264C] bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-md">
                Manila Core
              </span>
            </div>

            {/* Operational Protocols List */}
            <div className="flex flex-col gap-3 my-4 flex-1 justify-center">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div>
                  <div className="text-xs font-semibold text-zinc-700">Assigned Core Shift</div>
                  <div className="text-[10px] text-zinc-400">Regular Manila operations</div>
                </div>
                <span className="font-mono text-xs font-bold text-zinc-950">08:00 AM &ndash; 05:00 PM PHT</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div>
                  <div className="text-xs font-semibold text-zinc-700">Danish Team Sync</div>
                  <div className="text-[10px] text-zinc-400">Nordic Logistics ApS handover</div>
                </div>
                <span className="font-mono text-xs font-bold text-[#13264C]">01:00 AM &ndash; 10:00 AM CEST</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div>
                  <div className="text-xs font-semibold text-zinc-700">Grace Period Allowance</div>
                  <div className="text-[10px] text-zinc-400">Standard punctuality policy</div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  15 Minutes (08:15 AM)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                <div>
                  <div className="text-xs font-semibold text-zinc-700">Breaks Entitlement</div>
                  <div className="text-[10px] text-zinc-400">Mandated Philippine labor intervals</div>
                </div>
                <span className="font-mono text-xs font-bold text-zinc-950">1h Lunch + 2x 15m Coffee</span>
              </div>
            </div>

            {/* Bottom Action Prompt */}
            <div className="pt-4 border-t border-zinc-100 flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Biometric timestamps verified via secure audit ledger</span>
              </div>
              <button
                type="button"
                onClick={() => (onNavigateTab ? onNavigateTab('requests') : null)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-[#13264C] text-zinc-800 hover:text-white border border-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 group shadow-2xs"
              >
                <span>Apply for Overtime / Missed Punch Adjustment</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}
