import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  UserCheck,
  Edit3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Building2,
  Lock,
  Save,
  X
} from 'lucide-react';

export default function AccessControlView() {
  const { currentUser, isSuperAdmin, canAssignEmployees } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingEmp, setEditingEmp] = useState(null);
  const [formIsInternal, setFormIsInternal] = useState(false);
  const [formDeptId, setFormDeptId] = useState('');
  const [formRole, setFormRole] = useState('None');
  const [formHasAccess, setFormHasAccess] = useState(false);
  const [formCanAssign, setFormCanAssign] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'edit'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch('http://localhost:5000/api/access/employees'),
        fetch('http://localhost:5000/api/departments')
      ]);

      if (!empRes.ok) throw new Error('Failed to load employee access roster');
      if (!deptRes.ok) throw new Error('Failed to load departments');

      const empData = await empRes.json();
      const deptData = await deptRes.json();
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (emp) => {
    setEditingEmp(emp);
    setFormIsInternal(emp.isInternal || false);
    setFormDeptId(emp.departmentId || '');
    setFormRole(emp.ticketingRole || 'None');
    setFormHasAccess(emp.hasTicketingAccess || false);
    setFormCanAssign(emp.canAssignEmployees || false);
    setSuccess('');
    setError('');
    setActiveTab('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        isInternal: formIsInternal,
        departmentId: formDeptId ? parseInt(formDeptId) : null,
        ticketingRole: formRole,
        hasTicketingAccess: formHasAccess,
        canAssignEmployees: formCanAssign
      };

      const res = await fetch(`http://localhost:5000/api/access/${editingEmp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update employee access');
      }

      setSuccess(`Permissions updated for ${editingEmp.fullName}`);
      setEditingEmp(null);
      setActiveTab('roster');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.fullName?.toLowerCase().includes(q) ||
      emp.workEmail?.toLowerCase().includes(q) ||
      emp.departmentName?.toLowerCase().includes(q) ||
      emp.jobTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-sans select-none pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
              Access Control &amp; RBAC Management
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 mb-0">
            Grant operational ticketing desk privileges, assign department resolver queues, and delegate staff onboarding rights.
          </p>
        </div>

        {/* Tab & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-[#13264C] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Access Roster ({employees.length})
            </button>
            {editingEmp && (
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-[#13264C] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Edit: {editingEmp.fullName.split(' ')[0]}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 shadow-2xs cursor-pointer"
            title="Refresh Roster"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button type="button" onClick={() => setSuccess('')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold shadow-xs"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError('')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: Access Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          {/* Search Toolbar */}
          <div className="p-4 sm:p-5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff, role, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] text-zinc-900 font-medium"
              />
            </div>

            <div className="text-xs text-zinc-500 font-medium">
              Showing <strong>{filteredEmployees.length}</strong> registered identities
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-medium">
              Loading employee RBAC roster...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Operational Role</th>
                    <th className="py-3 px-4">Desk Access</th>
                    <th className="py-3 px-4">Delegation</th>
                    {(isSuperAdmin || canAssignEmployees) && (
                      <th className="py-3 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#13264C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {emp.fullName[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950">{emp.fullName}</div>
                          <div className="font-mono text-[10px] text-zinc-500">{emp.workEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            emp.isInternal
                              ? 'bg-[#13264C]/10 text-[#13264C] border-[#13264C]/20'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          {emp.isInternal ? 'Internal Core' : 'External Client'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-700">{emp.jobTitle}</td>
                      <td className="py-3 px-4">
                        {emp.departmentName ? (
                          <span className="font-semibold text-zinc-900">{emp.departmentName}</span>
                        ) : (
                          <span className="text-zinc-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            emp.ticketingRole === 'SuperAdmin'
                              ? 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
                              : emp.ticketingRole === 'DevOpsAdmin'
                              ? 'bg-[#13264C]/10 text-[#13264C] border-[#13264C]/20'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {emp.ticketingRole}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {emp.hasTicketingAccess ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Permitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-400">
                            <XCircle className="w-3.5 h-3.5" />
                            Locked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {emp.canAssignEmployees ? (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#13264C]/10 text-[#13264C]">
                            Can Assign
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </td>
                      {(isSuperAdmin || canAssignEmployees) && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditClick(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#13264C] bg-[#13264C]/10 hover:bg-[#13264C]/20 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Access</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Edit Access Form */}
      {activeTab === 'edit' && editingEmp && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
                  Modify Privileges: {editingEmp.fullName}
                </h3>
                <div className="font-mono text-xs text-zinc-500 mt-0.5">{editingEmp.workEmail}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setEditingEmp(null); setActiveTab('roster'); }}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Employment Classification
                </label>
                <select
                  value={formIsInternal ? 'internal' : 'external'}
                  onChange={(e) => {
                    const isInt = e.target.value === 'internal';
                    setFormIsInternal(isInt);
                    if (!isInt) {
                      setFormDeptId('');
                      setFormHasAccess(false);
                      setFormRole('None');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                >
                  <option value="external">External (Client-Dedicated)</option>
                  <option value="internal">Internal Core Staff (Company Operations)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Assigned Department
                </label>
                <select
                  value={formDeptId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormDeptId(val);
                    if (val) setFormIsInternal(true);
                  }}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                >
                  <option value="">-- No Department Assigned --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Ticketing System Role
              </label>
              <select
                value={formRole}
                onChange={(e) => {
                  const r = e.target.value;
                  setFormRole(r);
                  if (r !== 'None') setFormHasAccess(true);
                }}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
              >
                <option value="None">None (Standard Employee Only)</option>
                <option value="DepartmentMember">Department Member (Queue Resolver)</option>
                <option value="DepartmentManager">Department Manager (Team Lead)</option>
                <option value="DevOpsAdmin">DevOps Member (Queue Admin)</option>
                {isSuperAdmin && <option value="SuperAdmin">Super Admin (DevOps Manager - Full System)</option>}
              </select>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formHasAccess}
                  onChange={(e) => setFormHasAccess(e.target.checked)}
                  className="w-4 h-4 rounded text-[#13264C] focus:ring-[#13264C]"
                />
                <span className="text-xs font-bold text-zinc-900">Grant Operational Desk Access</span>
              </label>

              {isSuperAdmin && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formCanAssign}
                    onChange={(e) => setFormCanAssign(e.target.checked)}
                    className="w-4 h-4 rounded text-[#13264C] focus:ring-[#13264C]"
                  />
                  <span className="text-xs font-bold text-[#13264C]">Allow Staff RBAC Delegation Permissions</span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-xs cursor-pointer transition-all disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Privileges'}</span>
              </motion.button>
              <button
                type="button"
                onClick={() => { setEditingEmp(null); setActiveTab('roster'); }}
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
