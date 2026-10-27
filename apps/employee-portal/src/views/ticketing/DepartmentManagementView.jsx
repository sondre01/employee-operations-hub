import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  X,
  Layers,
  Mail,
  Copy,
  Check,
  Edit2
} from 'lucide-react';

export default function DepartmentManagementView() {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Department Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Support Email State
  const [editingDept, setEditingDept] = useState(null);
  const [editEmailVal, setEditEmailVal] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Copied indicator state: deptId -> boolean
  const [copiedId, setCopiedId] = useState(null);

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/departments');
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCopyEmail = (deptId, email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(deptId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await apiRequest('/departments', {
        method: 'POST',
        body: { name, description, supportEmail: supportEmail.trim() || null },
      });
      setFormSuccess(`Department "${name}" created successfully!`);
      setName('');
      setDescription('');
      setSupportEmail('');
      setActiveTab('list');
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setEditEmailVal(dept.supportEmail || '');
  };

  const handleSaveSupportEmail = async (e) => {
    e.preventDefault();
    if (!editingDept) return;
    setEditLoading(true);
    setError(null);
    try {
      await apiRequest(`/departments/${editingDept.id}`, {
        method: 'PATCH',
        body: { supportEmail: editEmailVal.trim() }
      });
      setFormSuccess(`Updated inbound support email for "${editingDept.name}".`);
      setEditingDept(null);
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Failed to update department email.');
    } finally {
      setEditLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.ticketingRole === 'SuperAdmin';

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-sans select-none pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
              Department Operations Management
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 mb-0">
            Define organizational business units, dispatch routing queues, and departmental resolver groups.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 self-start sm:self-auto max-w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'list'
                ? 'bg-[#13264C] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Departments ({departments.length})
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'create'
                  ? 'bg-[#13264C] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#D61766]" />
              <span>New Department</span>
            </button>
          )}
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

      {/* TAB 1: Department Cards Grid */}
      {activeTab === 'list' && (
        <div>
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-medium">
              Loading departments...
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-rose-600 font-medium">
              Error: {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                          <Layers className="w-4 h-4" />
                        </span>
                        <h3 className="text-sm font-bold text-zinc-950 m-0">{d.name}</h3>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                        ID #{d.id}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                      {d.description || 'General organizational functional queue.'}
                    </p>

                    {/* Designated Inbound Email Badge */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-[#13264C] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                            Inbound Support Desk
                          </div>
                          <div className="font-mono text-xs font-bold text-[#13264C] truncate">
                            {d.supportEmail || 'No inbound email set'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {d.supportEmail && (
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(d.id, d.supportEmail)}
                            title="Copy Support Email"
                            className="p-1.5 rounded-lg hover:bg-zinc-200/80 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                          >
                            {copiedId === d.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(d)}
                            title="Edit Inbound Email"
                            className="p-1.5 rounded-lg hover:bg-zinc-200/80 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Queue
                    </span>
                    <span className="text-zinc-700 font-medium">Auto-Ingestion Ready</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Inbound Support Email Modal */}
      <AnimatePresence>
        {editingDept && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 m-0">Edit Inbound Support Email</h3>
                    <div className="text-[11px] text-zinc-500">{editingDept.name}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSupportEmail} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Designated Support Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmailVal}
                    onChange={(e) => setEditEmailVal(e.target.value)}
                    placeholder="e.g. it-support@company.io"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-mono font-bold text-zinc-900"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Incoming emails sent to this address will automatically route as tickets assigned to {editingDept.name}.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingDept(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] cursor-pointer disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save Email'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TAB 2: Register Department Form */}
      {activeTab === 'create' && isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
              <PlusCircle className="w-4 h-4 text-[#D61766]" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
              Register New Department
            </h3>
          </div>

          <form onSubmit={handleCreateDepartment} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Legal &amp; Corporate Affairs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Designated Inbound Support Email (Optional)
              </label>
              <input
                type="email"
                placeholder="e.g. legal-support@company.io (Defaults to department slug)"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-mono font-medium text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Description &amp; Operational Scope *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe ticketing responsibilities and team resolver mandate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-xs cursor-pointer transition-all disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Creating...' : 'Register Department'}</span>
              </motion.button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
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
