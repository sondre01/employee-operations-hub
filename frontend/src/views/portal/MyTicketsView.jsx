import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  FileText,
  Send,
  X,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function MyTicketsView() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: '',
    priority: 'Medium',
  });
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'raise'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketList, deptList] = await Promise.all([
        apiRequest(`/tickets?createdByEmployeeId=${currentUser.id}`),
        apiRequest('/departments'),
      ]);
      setTickets(ticketList);
      setDepartments(deptList);
      if (deptList.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptList[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await apiRequest('/tickets', {
        method: 'POST',
        body: {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
          queue: 1,
          createdByEmployeeId: currentUser.id,
        },
      });

      setFormSuccess(`Ticket "${formData.title}" submitted successfully!`);
      setFormData({
        title: '',
        description: '',
        departmentId: departments[0]?.id || '',
        priority: 'Medium',
      });
      setActiveTab('history');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-sans select-none pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
              <Ticket className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
              My Support Tickets
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 mb-0">
            Track operational requests, hardware inquiries, HR certificates, and internal IT service tickets.
          </p>
        </div>

        {/* Tab Switcher & Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#13264C] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Submitted Tickets ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raise')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'raise'
                  ? 'bg-[#13264C] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#D61766]" />
              <span>Raise Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {formSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: Submitted Tickets History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-medium">
              Loading support tickets...
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-rose-600 font-medium">
              Error loading tickets: {error}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 m-0">No Support Tickets Yet</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Need equipment assistance, HR certifications, or access upgrades? Open a ticket to notify your resolver desk.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('raise')}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Raise Your First Ticket</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Resolver</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Date Filed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#13264C]">
                        #{t.id}
                      </td>
                      <td className="py-3 px-4 text-zinc-700 font-semibold">
                        {t.departmentName || 'General Desk'}
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
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-950 max-w-xs truncate">{t.title}</div>
                        <div className="text-zinc-500 text-[11px] max-w-xs truncate">{t.description}</div>
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
                      <td className="py-3 px-4 text-zinc-600">
                        {t.assignedToEmployeeName ? (
                          <span className="font-semibold text-zinc-900">{t.assignedToEmployeeName}</span>
                        ) : (
                          <span className="text-zinc-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">
                        {t.resolutionNotes || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                        {new Date(t.createdAtUtc).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Raise New Support Ticket Form */}
      {activeTab === 'raise' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
              <PlusCircle className="w-4 h-4 text-[#D61766]" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
              Submit New Support Ticket
            </h3>
          </div>

          <form onSubmit={handleCreateTicket} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Target Department Queue
                </label>
                <select
                  name="departmentId"
                  required
                  value={formData.departmentId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Urgency / Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                >
                  <option value="Low">Low (Informational / Inquiry)</option>
                  <option value="Medium">Medium (Standard Request)</option>
                  <option value="High">High (Impacting Client Deliverables)</option>
                  <option value="Urgent">Urgent (Production / Workstation Blocker)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Summary / Subject
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. Request Certificate of Employment (COE) for Pag-IBIG loan"
                value={formData.title}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Details &amp; Explanation
              </label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="Include deadline, specific requirements, or error details..."
                value={formData.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-xs cursor-pointer disabled:opacity-60 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
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
      )}
    </div>
  );
}
