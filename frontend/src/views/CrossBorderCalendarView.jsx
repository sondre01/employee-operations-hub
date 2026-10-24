import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Filter,
  Send,
  X
} from 'lucide-react';

export default function CrossBorderCalendarView() {
  const { currentPersona, currentUser } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [countryFilter, setCountryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('2026');

  // New Holiday Form State
  const [formData, setFormData] = useState({
    title: '',
    holidayDate: '2026-05-01',
    country: 'Philippines',
    isWorkingDay: false,
    notes: '',
  });
  const [formSuccess, setFormSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'add'

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.append('year', yearFilter);
      if (countryFilter) params.append('country', countryFilter);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest(`/holidays${query}`);
      setHolidays(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [countryFilter, yearFilter]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    try {
      await apiRequest('/holidays', {
        method: 'POST',
        body: formData,
      });
      setFormSuccess(`Added holiday "${formData.title}" to calendar.`);
      setFormData({
        title: '',
        holidayDate: '2026-05-01',
        country: 'Philippines',
        isWorkingDay: false,
        notes: '',
      });
      setActiveTab('calendar');
      fetchHolidays();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHoliday = async (id, title) => {
    if (!window.confirm(`Delete holiday "${title}"?`)) return;
    try {
      await apiRequest(`/holidays/${id}`, { method: 'DELETE' });
      fetchHolidays();
    } catch (err) {
      alert(`Error deleting holiday: ${err.message}`);
    }
  };

  const isAdmin = currentPersona?.role === 'AdminHr' || currentUser?.ticketingRole === 'SuperAdmin';

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex items-center bg-zinc-200/70 p-1 rounded-xl border border-zinc-200/90 w-fit max-w-full overflow-x-auto no-scrollbar shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'calendar'
              ? 'bg-[#13264C] text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Holidays ({holidays.length})</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'add'
                ? 'bg-[#13264C] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#D61766]" />
            <span>Register Holiday</span>
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

      {/* Dual Station Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇵🇭</span>
            <div>
              <div className="text-xs font-bold text-zinc-950">Philippines Hub (Manila)</div>
              <div className="text-[11px] text-zinc-500">Asia/Manila (PHT) &bull; Core Delivery Engineering</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#13264C]/10 text-[#13264C]">
            HQ Campus
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇩🇰</span>
            <div>
              <div className="text-xs font-bold text-zinc-950">Denmark Client (Copenhagen)</div>
              <div className="text-[11px] text-zinc-500">Europe/Copenhagen (CEST) &bull; Enterprise Stakeholders</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D61766]/10 text-[#D61766]">
            Dedicated Client
          </span>
        </div>
      </div>

      {/* TAB 1: Calendar Ledger & Filter Toolbar */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
                Official Holiday Register
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Country Filters */}
              <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
                {[
                  { value: '', label: 'All Regions' },
                  { value: 'Philippines', label: '🇵🇭 Philippines' },
                  { value: 'Denmark', label: '🇩🇰 Denmark' },
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCountryFilter(c.value)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      countryFilter === c.value
                        ? 'bg-[#13264C] text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Year Filter */}
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-100 border border-zinc-200 rounded-xl font-bold text-zinc-800 focus:outline-none focus:border-[#13264C]"
              >
                <option value="2026">2026 Calendar</option>
                <option value="2025">2025 Calendar</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-medium">
              Loading cross-border calendar...
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-rose-600 font-medium">
              Error loading calendar: {error}
            </div>
          ) : holidays.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              No holiday records found for the selected region.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[680px]">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 whitespace-nowrap">Country</th>
                    <th className="py-3 px-4">Holiday Name</th>
                    <th className="py-3 px-4 whitespace-nowrap">Operational Status</th>
                    <th className="py-3 px-4">Cross-Border Impact</th>
                    {isAdmin && <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                  {holidays.map((h) => {
                    const isPH = h.country === 'Philippines';
                    const defaultImpact = isPH
                      ? 'Manila Hub Closed (PH Non-Working Day) — Danish Clients Operating'
                      : 'Danish Client Closed — Manila Developers Operating Normally';

                    return (
                      <tr key={h.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#13264C] whitespace-nowrap">
                          {h.holidayDate}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                          {isPH ? '🇵🇭 Philippines' : '🇩🇰 Denmark'}
                        </td>
                        <td className="py-3 px-4 font-bold text-zinc-950">
                          {h.title}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              h.isWorkingDay
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
                            }`}
                          >
                            {h.isWorkingDay ? 'Working Day' : 'Office Closed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 text-xs">
                          {h.notes || defaultImpact}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteHoliday(h.id, h.title)}
                              className="text-zinc-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Register Holiday Form */}
      {activeTab === 'add' && isAdmin && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs w-full max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
              <PlusCircle className="w-4 h-4 text-[#D61766]" />
            </span>
            <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
              Register New Cross-Border Holiday
            </h3>
          </div>

          <form onSubmit={handleCreateHoliday} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Holiday Title
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. Labor Day / Store Bededag"
                value={formData.title}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Country / Region
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                >
                  <option value="Philippines">🇵🇭 Philippines</option>
                  <option value="Denmark">🇩🇰 Denmark</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Holiday Date
                </label>
                <input
                  name="holidayDate"
                  type="date"
                  required
                  value={formData.holidayDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                id="isWorkingDay"
                name="isWorkingDay"
                type="checkbox"
                checked={formData.isWorkingDay}
                onChange={handleFormChange}
                className="w-4 h-4 rounded text-[#13264C] focus:ring-[#13264C]"
              />
              <label htmlFor="isWorkingDay" className="text-xs font-medium text-zinc-700 cursor-pointer">
                Special working holiday (DevOps / Client sprint coverage required)
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Cross-Border Operational Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Specify staffing coverage or asynchronous delivery protocol..."
                value={formData.notes}
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
                <span>Save Holiday to Calendar</span>
              </motion.button>
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
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
