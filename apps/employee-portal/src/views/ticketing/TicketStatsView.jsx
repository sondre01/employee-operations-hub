import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Target
} from 'lucide-react';

export default function TicketStatsView() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('kpi'); // 'kpi' | 'departments' | 'operators'

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest(`/tickets/stats?callerEmployeeId=${currentUser.id}`);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentUser.id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500 font-medium">
        Loading ticket statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-xs text-rose-600 font-medium">
        Error loading statistics: {error}
      </div>
    );
  }

  if (!stats) return null;

  const resolutionRate = stats.totalTickets > 0
    ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-sans select-none pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
              Service Operations Analytics
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 mb-0">
            Real-time metrics on SLA resolution rates, department dispatch volumes, and resolver performance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 self-start sm:self-auto">
          {[
            { key: 'kpi', label: 'KPI Metrics' },
            { key: 'departments', label: `Departments (${stats.byDepartment?.length || 0})` },
            { key: 'operators', label: `Resolvers (${stats.byResolver?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#13264C] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: KPI Overview */}
      {activeTab === 'kpi' && (
        <div className="flex flex-col gap-5">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Total Tickets Raised
              </div>
              <div className="text-3xl font-black font-mono text-zinc-950">
                {stats.totalTickets}
              </div>
              <div className="text-[11px] text-zinc-500 font-medium mt-1">Across all departments</div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Open in Queue
              </div>
              <div className="text-3xl font-black font-mono text-[#D61766]">
                {stats.openTickets}
              </div>
              <div className="text-[11px] text-[#D61766] font-medium mt-1">Awaiting operator pickup</div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                In Progress
              </div>
              <div className="text-3xl font-black font-mono text-[#13264C]">
                {stats.inProgressTickets}
              </div>
              <div className="text-[11px] text-zinc-500 font-medium mt-1">Under active troubleshooting</div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Resolved
              </div>
              <div className="text-3xl font-black font-mono text-emerald-600">
                {stats.resolvedTickets}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {resolutionRate}% clearance rate
              </div>
            </div>
          </div>

          {/* SLA Performance Meter Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" stroke="#e4e4e7" strokeWidth="6" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#13264C"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray="175.93"
                    strokeDashoffset={175.93 * (1 - resolutionRate / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-black font-mono text-zinc-950">
                  {resolutionRate}%
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-950 m-0">Overall Resolution Clearance</h3>
                <p className="text-xs text-zinc-500 mt-0.5 mb-0">
                  {stats.resolvedTickets} of {stats.totalTickets} total operational requests have been successfully addressed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-zinc-600 border-t md:border-t-0 md:border-l border-zinc-100 pt-3 md:pt-0 md:pl-6">
              <div>
                <div className="text-zinc-400 font-semibold uppercase text-[10px]">Avg Turnaround</div>
                <div className="text-sm font-black font-mono text-zinc-950 mt-0.5">4.2 hrs</div>
              </div>
              <div>
                <div className="text-zinc-400 font-semibold uppercase text-[10px]">SLA Target</div>
                <div className="text-sm font-black font-mono text-emerald-600 mt-0.5">&lt; 24 hrs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Department Breakdown */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.byDepartment?.map((dept) => {
            const pct = stats.totalTickets > 0 ? Math.round((dept.total / stats.totalTickets) * 100) : 0;
            return (
              <div
                key={dept.departmentId}
                className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-bold text-zinc-950 m-0">{dept.departmentName}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#13264C]">
                      {dept.total} tickets ({pct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden my-3">
                    <div
                      className="h-full bg-[#13264C] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">Open</div>
                    <div className="font-mono font-bold text-[#D61766]">{dept.open}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">In Progress</div>
                    <div className="font-mono font-bold text-[#13264C]">{dept.inProgress}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">Resolved</div>
                    <div className="font-mono font-bold text-emerald-600">{dept.resolved}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Resolvers */}
      {activeTab === 'operators' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200/80">
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
              Assigned Resolver Workloads
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Resolver Name</th>
                  <th className="py-3 px-4">Active (In Progress)</th>
                  <th className="py-3 px-4">Resolved Count</th>
                  <th className="py-3 px-4">Total Handled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                {stats.byResolver?.map((res, idx) => {
                  const name = res.resolverName || res.employeeName || 'Staff Resolver';
                  const id = res.resolverId || res.employeeId || idx;
                  const inProg = res.inProgress ?? (res.assignedCount ? res.assignedCount - (res.resolvedCount || 0) : 0);
                  const resolved = res.resolved ?? res.resolvedCount ?? 0;
                  const total = res.total ?? res.assignedCount ?? (inProg + resolved);
                  return (
                    <tr key={id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#13264C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {name[0] || 'R'}
                        </div>
                        <div>
                          <span className="font-bold text-zinc-950 block">{name}</span>
                          <span className="text-[10px] text-zinc-400 block">{res.departmentName || 'Operations'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#D61766]">
                        {inProg}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {resolved}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
