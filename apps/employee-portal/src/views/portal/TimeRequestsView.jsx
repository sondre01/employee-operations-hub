import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTimeRequests, saveTimeRequests } from '../../utils/workforceStorage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  PlusCircle,
  Send,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Check,
  XCircle,
  Clock3
} from 'lucide-react';

export default function TimeRequestsView() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'guest';
  const [requests, setRequests] = useState(() => getTimeRequests(userId));
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'create'
  const [statusFilter, setStatusFilter] = useState('All');
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [form, setForm] = useState({
    type: 'Time Correction / Missed Log',
    incidentDate: new Date().toISOString().split('T')[0],
    hours: '1.0 hr',
    manager: 'Danilo Navarro (DevOps Director)',
    reason: ''
  });

  useEffect(() => {
    setRequests(getTimeRequests(userId));
  }, [userId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      alert('Please provide a reason or justification for this request.');
      return;
    }

    const newReq = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      type: form.type,
      incidentDate: form.incidentDate,
      hours: form.hours,
      manager: form.manager,
      reason: form.reason.trim(),
      submittedAt: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    const updated = [newReq, ...requests];
    setRequests(updated);
    saveTimeRequests(updated, userId);
    setSuccessMessage(`Request ${newReq.id} has been submitted to ${newReq.manager}.`);
    setActiveTab('history');
    setForm({
      type: 'Time Correction / Missed Log',
      incidentDate: new Date().toISOString().split('T')[0],
      hours: '1.0 hr',
      manager: 'Danilo Navarro (DevOps Director)',
      reason: ''
    });
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'All') return true;
    return r.status === statusFilter;
  });

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex items-center bg-zinc-200/70 p-1 rounded-xl border border-zinc-200/90 w-fit max-w-full overflow-x-auto no-scrollbar shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-[#13264C] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Filed Requests ({requests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'create'
              ? 'bg-[#13264C] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#D61766]" />
          <span>File New Request</span>
        </button>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: Filed Requests History & Table */}
      {activeTab === 'history' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Total Requests Filed
              </div>
              <div className="text-2xl font-black font-mono text-zinc-950">
                {requests.length}
              </div>
              <div className="text-[11px] text-zinc-500 font-medium mt-1">Current calendar year</div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Pending Review
              </div>
              <div className="text-2xl font-black font-mono text-[#D61766]">
                {pendingCount}
              </div>
              <div className="text-[11px] text-[#D61766] font-medium mt-1">Awaiting manager sign-off</div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Approved
              </div>
              <div className="text-2xl font-black font-mono text-[#13264C]">
                {approvedCount}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Credited to payroll
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Resolution SLA
              </div>
              <div className="text-2xl font-black font-mono text-zinc-950">
                24h
              </div>
              <div className="text-[11px] text-zinc-500 font-medium mt-1">Average response time</div>
            </div>
          </div>

          {/* History Ledger Table */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            {/* Table Toolbar */}
            <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
                  Filed Requests &amp; Status Ledger ({filteredRequests.length})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
                  {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        statusFilter === status
                          ? 'bg-[#13264C] text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-950'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Button to view File New Request */}
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13264C] hover:bg-[#0E1D3B] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#D61766]" />
                  <span>File New Request</span>
                </button>
              </div>
            </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[680px]">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Request ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap">Shift Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Duration</th>
                <th className="py-3 px-4 whitespace-nowrap">Approver</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#13264C] whitespace-nowrap">{r.id}</td>
                  <td className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">{r.type}</td>
                  <td className="py-3 px-4 font-mono text-zinc-600 whitespace-nowrap">{r.incidentDate}</td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-950 whitespace-nowrap">{r.hours}</td>
                  <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">{r.manager}</td>
                  <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">{r.reason}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : r.status === 'Pending'
                          ? 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {r.status === 'Pending' ? (
                        <>
                          <Clock3 className="w-3 h-3" />
                          Pending Review
                        </>
                      ) : r.status === 'Approved' ? (
                        <>
                          <Check className="w-3 h-3" />
                          Approved
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {/* TAB 2: File New Request Form & Guidelines */}
  {activeTab === 'create' && (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
            <FileText className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
            File New Request
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Request Category
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
            >
              <option value="Time Correction / Missed Log">⏰ Time Correction / Missed Clock-in</option>
              <option value="Overtime Pre-Approval">⚡ Overtime (OT) Pre-Approval</option>
              <option value="Official Business / Shift Adjustment">🌍 Official Business / Client Shift Adjustment</option>
              <option value="Leave of Absence Filing">🏖️ Leave of Absence (Sick / Vacation / Emergency)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Target Shift Date
              </label>
              <input
                type="date"
                required
                value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Duration / Hours
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2.0 hrs or Full Day"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Designated Approving Manager
            </label>
            <select
              value={form.manager}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
            >
              <option value="Danilo Navarro (DevOps Director)">Danilo Navarro — Director of Dev Operations &amp; Infrastructure</option>
              <option value="Maria Santos (HR Manager)">Maria Santos — HR &amp; Talent Operations Manager</option>
              <option value="Christian Reyes (DevOps Normal Admin)">Christian Reyes — Senior DevOps Lead</option>
              <option value="Grace Tan (Finance Specialist)">Grace Tan — Finance &amp; Payroll Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Reason &amp; Technical / Operational Justification
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain the reason for adjustment, missed punch, or planned overtime..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>Submit Request to Manager</span>
            </motion.button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Right Info Box */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 m-0">
            Escalation &amp; Routing Guidelines
          </h4>
          <div className="space-y-3 text-xs text-zinc-600">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#13264C] mt-1.5 shrink-0" />
              <div>
                <strong className="text-zinc-950">Time Corrections:</strong> Must be filed within 48 hours of the affected pay cycle.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D61766] mt-1.5 shrink-0" />
              <div>
                <strong className="text-zinc-950">Overtime Pre-Approvals:</strong> Require prior consent before sprint night shifts.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <div>
                <strong className="text-zinc-950">Approved Adjustments:</strong> Automatically reflected on the next upcoming payroll credit cut-off.
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#13264C]/5 rounded-2xl border border-[#13264C]/20 p-4">
          <div className="text-xs font-bold text-[#13264C] flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            Direct Manager Routing
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            Requests are dispatched electronically to <strong className="text-zinc-900">{form.manager.split('—')[0]}</strong> with automated audit trails.
          </div>
        </div>
      </div>
    </div>
  )}
</div>
);
}
