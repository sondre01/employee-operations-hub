import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  FileCheck2,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Trash2,
  ChevronDown,
  Check,
  X,
  Send,
  Users
} from 'lucide-react';

export default function PolicyComplianceView() {
  const { currentPersona, currentUser } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Policy Form State
  const [formData, setFormData] = useState({
    title: '',
    version: '1.0',
    summaryMarkdown: '',
    isMandatory: true,
  });
  const [formSuccess, setFormSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' | 'publish'

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const empId = currentPersona?.id || currentUser?.id;
      const endpoint = empId ? `/policies?employeeId=${empId}` : '/policies';
      const data = await apiRequest(endpoint);
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [currentPersona?.id, currentUser?.id]);

  const handleAcknowledge = async (policyId) => {
    try {
      const empId = currentPersona?.id || currentUser?.id;
      if (!empId) {
        alert('Please log in or select an employee persona to acknowledge policies.');
        return;
      }
      await apiRequest(`/policies/${policyId}/acknowledge`, {
        method: 'POST',
        body: {
          employeeId: empId,
        },
      });
      fetchPolicies();
    } catch (err) {
      alert(`Error acknowledging policy: ${err.message}`);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    try {
      await apiRequest('/policies', {
        method: 'POST',
        body: formData,
      });
      setFormSuccess(`Published policy "${formData.title}" (v${formData.version})`);
      setFormData({
        title: '',
        version: '1.0',
        summaryMarkdown: '',
        isMandatory: true,
      });
      setActiveTab('policies');
      fetchPolicies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePolicy = async (id, title) => {
    if (!window.confirm(`Delete policy "${title}"?`)) return;
    try {
      await apiRequest(`/policies/${id}`, { method: 'DELETE' });
      fetchPolicies();
    } catch (err) {
      alert(`Error deleting policy: ${err.message}`);
    }
  };

  const isAdmin = currentPersona?.role === 'AdminHr' || currentUser?.ticketingRole === 'SuperAdmin';
  const acknowledgedCount = policies.filter(p => p.isAcknowledgedByCurrentEmployee).length;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex items-center bg-zinc-200/70 p-1 rounded-xl border border-zinc-200/90 w-fit max-w-full overflow-x-auto no-scrollbar shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'policies'
              ? 'bg-[#13264C] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Policies ({policies.length})</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'publish'
                ? 'bg-[#13264C] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#D61766]" />
            <span>Publish Policy</span>
          </button>
        )}
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

      {/* Overall Compliance Progress Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#13264C]/10 text-[#13264C] flex items-center justify-center font-bold shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-950">
              Personal Compliance Status ({currentUser?.fullName || currentPersona?.name})
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {acknowledgedCount} of {policies.length} mandatory guidelines signed and recorded on file
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              acknowledgedCount === policies.length && policies.length > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
            }`}
          >
            {acknowledgedCount === policies.length && policies.length > 0
              ? '✓ 100% Fully Compliant'
              : `Pending ${policies.length - acknowledgedCount} Signatures`}
          </span>
        </div>
      </div>

      {/* TAB 1: Policy Cards */}
      {activeTab === 'policies' && (
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-medium">
              Loading compliance policies...
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-rose-600 font-medium">
              Error loading policies: {error}
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              No policies published yet.
            </div>
          ) : (
            policies.map((p) => {
              const acknowledged = p.isAcknowledgedByCurrentEmployee;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs flex flex-col gap-3 transition-all hover:border-zinc-300"
                >
                  {/* Policy Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight m-0">
                        {p.title}
                      </h3>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                        v{p.version}
                      </span>
                      {p.isMandatory && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D61766]/10 text-[#D61766] border border-[#D61766]/20">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{p.totalAcknowledgements} Signatures</span>
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeletePolicy(p.id, p.title)}
                          className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete Policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Content */}
                  <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/70 text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                    {p.summaryMarkdown}
                  </div>

                  {/* Card Bottom: Acknowledgement Status & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-medium">Your Compliance Record:</span>
                      {acknowledged ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Acknowledged on {new Date(p.acknowledgedAtUtc || Date.now()).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[#D61766]">
                          <AlertTriangle className="w-4 h-4 text-[#D61766]" />
                          <span>Pending Read-Receipt</span>
                        </span>
                      )}
                    </div>

                    {!acknowledged && (
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleAcknowledge(p.id)}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-xs cursor-pointer transition-all self-start sm:self-auto"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign &amp; Acknowledge</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Publish Policy Form */}
      {activeTab === 'publish' && isAdmin && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs w-full max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
              <PlusCircle className="w-4 h-4 text-[#D61766]" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
              Publish New Policy Handbook
            </h3>
          </div>

          <form onSubmit={handleCreatePolicy} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Policy Document Title
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. Remote Work Security & Hardware Encryption Policy"
                value={formData.title}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Revision Version
                </label>
                <input
                  name="version"
                  type="text"
                  required
                  placeholder="e.g. 1.0 or 2.1"
                  value={formData.version}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  id="isMandatory"
                  name="isMandatory"
                  type="checkbox"
                  checked={formData.isMandatory}
                  onChange={handleFormChange}
                  className="w-4 h-4 rounded text-[#13264C] focus:ring-[#13264C]"
                />
                <label htmlFor="isMandatory" className="text-xs font-medium text-zinc-700 cursor-pointer">
                  Mandatory for all staff
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Executive Policy Summary &amp; Obligations
              </label>
              <textarea
                name="summaryMarkdown"
                rows={5}
                required
                placeholder="Detail core obligations, security mandates, and employee compliance protocols..."
                value={formData.summaryMarkdown}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-xs cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Publish Policy to Workforce</span>
              </motion.button>
              <button
                type="button"
                onClick={() => setActiveTab('policies')}
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
