import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  ArrowRight,
  Play,
  Check,
  X,
  FileText,
  RotateCcw
} from 'lucide-react';

export default function TicketQueueView() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const isSuperAdmin = currentUser?.ticketingRole === 'SuperAdmin';
  const defaultDeptFilter = isSuperAdmin ? '' : (currentUser?.departmentId ? currentUser.departmentId.toString() : '');
  const [deptFilter, setDeptFilter] = useState(defaultDeptFilter);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Resolution modal state
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (deptFilter) params.append('departmentId', deptFilter);
      if (statusFilter) params.append('status', statusFilter);

      const query = params.toString() ? `?${params.toString()}` : '';
      const [ticketList, deptList, empList] = await Promise.all([
        apiRequest(`/tickets${query}`),
        apiRequest('/departments'),
        apiRequest('/employees'),
      ]);

      let filtered = ticketList;
      if (priorityFilter) {
        filtered = filtered.filter((t) => t.priority === priorityFilter);
      }

      setTickets(filtered);
      setDepartments(deptList);
      setEmployees(empList.filter((e) => e.isInternal));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptFilter, statusFilter, priorityFilter]);

  const handleUpdateStatus = async (ticketId, nextStatus, notes = null) => {
    try {
      await apiRequest(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: {
          status: nextStatus,
          assignedToEmployeeId: currentUser.id,
          resolutionNotes: notes,
        },
      });
      setResolvingTicketId(null);
      setResolutionNotes('');
      fetchData();
    } catch (err) {
      alert(`Error updating ticket: ${err.message}`);
    }
  };

  const handleAssignTicket = async (ticketId, targetEmployeeId) => {
    try {
      await apiRequest(`/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        body: {
          assignedToEmployeeId: parseInt(targetEmployeeId, 10),
        },
      });
      fetchData();
    } catch (err) {
      alert(`Error assigning ticket: ${err.message}`);
    }
  };

  const handleConfirmResolution = (ticketId) => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution documentation notes before resolving this ticket.');
      return;
    }
    handleUpdateStatus(ticketId, 'Resolved', resolutionNotes.trim());
  };

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-sans select-none pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
              <Inbox className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
              Operational Ticket Queue
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 mb-0">
            Dispatch, assign, and resolve internal IT, HR, and facilities operations tickets across departments.
          </p>
        </div>

        {/* Status Pill Switcher */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 self-start sm:self-auto">
          {[
            { value: '', label: 'All Queue' },
            { value: 'Open', label: 'Open' },
            { value: 'InProgress', label: 'In Progress' },
            { value: 'Resolved', label: 'Resolved' },
          ].map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setStatusFilter(s.value); setResolvingTicketId(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === s.value && !resolvingTicketId
                  ? 'bg-[#13264C] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-700">Filter By:</span>
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#13264C]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#13264C]"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setDeptFilter('');
            setStatusFilter('');
            setPriorityFilter('');
            setResolvingTicketId(null);
          }}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Resolution Documentation Drawer / Box */}
      <AnimatePresence>
        {resolvingTicketId && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 m-0">
                  Resolution Documentation for Ticket #{resolvingTicketId}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => { setResolvingTicketId(null); setResolutionNotes(''); }}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-900 mb-1">
                Action Taken &amp; Resolution Notes
              </label>
              <textarea
                rows={3}
                placeholder="Detail what was completed to resolve this issue..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-900 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleConfirmResolution(resolvingTicketId)}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Mark Resolved</span>
              </motion.button>
              <button
                type="button"
                onClick={() => { setResolvingTicketId(null); setResolutionNotes(''); }}
                className="py-2 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/60 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-medium">
            Loading operational ticket queue...
          </div>
        ) : error ? (
          <div className="p-6 text-xs text-rose-600 font-medium">
            Error loading queue: {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            No tickets found in this queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Ticket</th>
                  <th className="py-3 px-4 whitespace-nowrap">Dept</th>
                  <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-3 px-4">Title &amp; Context</th>
                  <th className="py-3 px-4 whitespace-nowrap">Submitted By</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Assignee</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#13264C] whitespace-nowrap">
                      #{t.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                      {t.departmentName || 'General'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          t.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : t.priority === 'High'
                            ? 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.priority === 'Urgent'
                              ? 'bg-rose-500'
                              : t.priority === 'High'
                              ? 'bg-[#D61766]'
                              : 'bg-zinc-400'
                          }`}
                        />
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-zinc-950 truncate">{t.title}</div>
                      <div className="text-zinc-500 text-[11px] truncate">{t.description}</div>
                      {t.resolutionNotes && (
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 truncate">
                          Resolution: {t.resolutionNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">
                      {t.createdByEmployeeName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'InProgress'
                            ? 'bg-[#13264C]/10 text-[#13264C] border-[#13264C]/20'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={t.assignedToEmployeeId || ''}
                        onChange={(e) => handleAssignTicket(t.id, e.target.value)}
                        className="px-2 py-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:outline-none focus:border-[#13264C]"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.status === 'Open' && (
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleUpdateStatus(t.id, 'InProgress')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-2xs cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </motion.button>
                        )}
                        {t.status === 'InProgress' && (
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setResolvingTicketId(resolvingTicketId === t.id ? null : t.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Resolve</span>
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
