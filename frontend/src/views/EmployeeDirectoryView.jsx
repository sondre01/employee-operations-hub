import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  Trash2,
  CheckCircle2,
  Laptop,
  Ticket,
  Building2,
  X,
  Send,
  ArrowLeft,
  Briefcase
} from 'lucide-react';

export default function EmployeeDirectoryView() {
  const { currentPersona, currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Selected Employee Details
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Employee Form State
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    workEmail: '',
    jobTitle: '',
    employmentType: 'ClientDedicated',
    role: 'Developer',
    clientName: '',
    primaryTechStack: '',
  });
  const [formSuccess, setFormSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'detail' | 'onboard'

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (clientSearch.trim()) params.append('clientName', clientSearch.trim());

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest(`/employees${query}`);
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [typeFilter, roleFilter, clientSearch]);

  const handleSelectEmployee = async (id) => {
    setLoadingDetail(true);
    try {
      const detail = await apiRequest(`/employees/${id}`);
      setSelectedEmployee(detail);
      setActiveTab('detail');
    } catch (err) {
      alert(`Error loading details: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await apiRequest(`/employees/${id}`, { method: 'DELETE' });
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null);
        setActiveTab('roster');
      }
      fetchEmployees();
    } catch (err) {
      alert(`Failed to delete employee: ${err.message}`);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    try {
      const computedFullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');
      await apiRequest('/employees', {
        method: 'POST',
        body: {
          ...formData,
          fullName: computedFullName
        },
      });
      setFormSuccess(`Successfully onboarded ${computedFullName}`);
      setFormData({
        lastName: '',
        firstName: '',
        middleName: '',
        workEmail: '',
        jobTitle: '',
        employmentType: 'ClientDedicated',
        role: 'Developer',
        clientName: '',
        primaryTechStack: '',
      });
      setActiveTab('roster');
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  const isAdmin = currentPersona?.role === 'AdminHr' || currentUser?.ticketingRole === 'SuperAdmin';

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-sans select-none pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
              Staff Directory &amp; Workforce Roster
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 mb-0">
            Workforce roster across Internal Core operations and Dedicated Client delivery teams.
          </p>
        </div>

        {/* Tab Controls */}
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
              Roster ({employees.length})
            </button>
            {selectedEmployee && (
              <button
                type="button"
                onClick={() => setActiveTab('detail')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'detail'
                    ? 'bg-[#13264C] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Profile: {selectedEmployee.fullName.split(' ')[0]}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('onboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'onboard'
                    ? 'bg-[#13264C] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-[#D61766]" />
                <span>Onboard Staff</span>
              </button>
            )}
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
            <button type="button" onClick={() => setFormSuccess(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: Directory Roster & Filter */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 sm:p-5 border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter client..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] text-zinc-900 font-medium"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 focus:outline-none focus:border-[#13264C]"
              >
                <option value="">All Types</option>
                <option value="InternalCore">Internal Core Staff</option>
                <option value="ClientDedicated">Client Dedicated</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-800 focus:outline-none focus:border-[#13264C]"
              >
                <option value="">All Roles</option>
                <option value="AdminHr">Admin / HR</option>
                <option value="DanishClientLead">Client Lead</option>
                <option value="Developer">Developer</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => { setTypeFilter(''); setRoleFilter(''); setClientSearch(''); }}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-medium">
              Loading employee directory...
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-rose-600 font-medium">
              Error: {error}
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              No staff members found matching filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Client Org / Dept</th>
                    <th className="py-3 px-4">Tech Stack</th>
                    <th className="py-3 px-4">Hardware</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#13264C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {emp.fullName[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950">{emp.fullName}</div>
                          <div className="font-mono text-[10px] text-zinc-500">{emp.workEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-700">{emp.jobTitle}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            emp.employmentType === 'InternalCore'
                              ? 'bg-[#13264C]/10 text-[#13264C] border-[#13264C]/20'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}
                        >
                          {emp.employmentType === 'InternalCore' ? 'Internal Core' : 'Client Dedicated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-800 font-semibold">
                        {emp.clientName || emp.departmentName || 'Core Operations'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                        {emp.primaryTechStack || '—'}
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        <span className="inline-flex items-center gap-1">
                          <Laptop className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{emp.assignedHardwareCount}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectEmployee(emp.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#13264C] bg-[#13264C]/10 hover:bg-[#13264C]/20 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                              className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* TAB 2: Employee Profile Inspector */}
      {activeTab === 'detail' && selectedEmployee && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#13264C] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {selectedEmployee.fullName[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950 m-0">
                  {selectedEmployee.fullName}
                </h3>
                <div className="font-mono text-xs text-zinc-500 mt-0.5">
                  ID: #{selectedEmployee.id} &bull; {selectedEmployee.workEmail}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Roster</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Position</div>
              <div className="font-semibold text-zinc-950 mt-0.5">{selectedEmployee.jobTitle}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Classification</div>
              <div className="font-semibold text-zinc-950 mt-0.5">
                {selectedEmployee.employmentType === 'InternalCore' ? 'Internal Core' : 'Client Dedicated'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Client / Dept</div>
              <div className="font-semibold text-zinc-950 mt-0.5">
                {selectedEmployee.clientName || 'Internal Company'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Tech Stack</div>
              <div className="font-mono font-semibold text-[#13264C] mt-0.5">
                {selectedEmployee.primaryTechStack || 'Standard Environment'}
              </div>
            </div>
          </div>

          {/* Hardware Custody */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
                <Laptop className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 m-0">
                Hardware Custody Ledger ({selectedEmployee.hardwareItems?.length || 0})
              </h4>
            </div>

            {selectedEmployee.hardwareItems?.length === 0 ? (
              <p className="text-xs text-zinc-500 m-0">No company hardware items currently logged in custody.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200/80">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Asset Tag</th>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3">Serial No</th>
                      <th className="py-2.5 px-3">Assigned Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                    {selectedEmployee.hardwareItems.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#13264C]">{item.assetTag}</td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-950">{item.modelName}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-500">{item.serialNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-500">{item.assignedDate}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Onboard Employee Form */}
      {activeTab === 'onboard' && isAdmin && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
              <UserPlus className="w-4 h-4 text-[#D61766]" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
              Onboard New Staff Member
            </h3>
          </div>

          <form onSubmit={handleCreateEmployee} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">First Name *</label>
                <input
                  name="firstName"
                  type="text"
                  required
                  placeholder="e.g. Danilo"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Last Name *</label>
                <input
                  name="lastName"
                  type="text"
                  required
                  placeholder="e.g. Navarro"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Middle Name (Optional)</label>
                <input
                  name="middleName"
                  type="text"
                  placeholder="e.g. Cruz"
                  value={formData.middleName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Work Email Address *</label>
                <input
                  name="workEmail"
                  type="email"
                  required
                  placeholder="e.g. d.navarro@company.io"
                  value={formData.workEmail}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Position / Job Title *</label>
                <input
                  name="jobTitle"
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={formData.jobTitle}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Classification *</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                >
                  <option value="ClientDedicated">Client Dedicated</option>
                  <option value="InternalCore">Internal Core</option>
                </select>
              </div>
            </div>

            {formData.employmentType === 'ClientDedicated' && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Danish Client Enterprise</label>
                <input
                  name="clientName"
                  type="text"
                  placeholder="e.g. Nordic Logistics ApS"
                  value={formData.clientName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Primary Tech Stack &amp; Skills</label>
              <input
                name="primaryTechStack"
                type="text"
                placeholder="e.g. .NET 8, React, PostgreSQL, Docker"
                value={formData.primaryTechStack}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] font-medium text-zinc-900"
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
                <span>Submit Staff Onboarding Record</span>
              </motion.button>
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
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
