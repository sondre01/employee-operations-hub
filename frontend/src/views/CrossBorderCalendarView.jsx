import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  X,
  Info,
  Globe2,
  Check,
  AlertCircle
} from 'lucide-react';

// Comprehensive cross-border seed holidays for 2026 & 2025
const SEED_HOLIDAYS = [
  // --- 2026 PHILIPPINES ---
  { id: 'ph-2026-01', title: "New Year's Day", holidayDate: '2026-01-01', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH). Manila Hub closed; synchronized with Copenhagen.' },
  { id: 'ph-2026-02', title: 'Chinese Lunar New Year', holidayDate: '2026-02-17', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH). Danish client operating normally.' },
  { id: 'ph-2026-03', title: 'EDSA People Power Anniversary', holidayDate: '2026-02-25', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH). Danish client operating normally.' },
  { id: 'ph-2026-04', title: 'Maundy Thursday', holidayDate: '2026-04-02', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (Holy Week). Dual closure with Copenhagen.' },
  { id: 'ph-2026-05', title: 'Good Friday', holidayDate: '2026-04-03', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (Holy Week). Dual closure with Copenhagen.' },
  { id: 'ph-2026-06', title: 'Black Saturday', holidayDate: '2026-04-04', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH).' },
  { id: 'ph-2026-07', title: 'Araw ng Kagitingan (Day of Valor)', holidayDate: '2026-04-09', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH). Danish client operating normally.' },
  { id: 'ph-2026-08', title: 'Labor Day', holidayDate: '2026-05-01', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH). Manila Hub closed.' },
  { id: 'ph-2026-09', title: 'Philippine Independence Day', holidayDate: '2026-06-12', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH). Danish client operating normally.' },
  { id: 'ph-2026-10', title: 'Ninoy Aquino Day', holidayDate: '2026-08-21', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH).' },
  { id: 'ph-2026-11', title: 'National Heroes Day', holidayDate: '2026-08-31', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH). Last Monday of August.' },
  { id: 'ph-2026-12', title: "All Saints' Day", holidayDate: '2026-11-01', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH).' },
  { id: 'ph-2026-13', title: "All Souls' Day", holidayDate: '2026-11-02', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH).' },
  { id: 'ph-2026-14', title: 'Bonifacio Day', holidayDate: '2026-11-30', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH).' },
  { id: 'ph-2026-15', title: 'Feast of the Immaculate Conception', holidayDate: '2026-12-08', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH).' },
  { id: 'ph-2026-16', title: 'Christmas Eve', holidayDate: '2026-12-24', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH). Joint closure.' },
  { id: 'ph-2026-17', title: 'Christmas Day', holidayDate: '2026-12-25', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH & DK). Both hubs closed.' },
  { id: 'ph-2026-18', title: 'Rizal Day', holidayDate: '2026-12-30', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH).' },
  { id: 'ph-2026-19', title: 'Last Day of the Year', holidayDate: '2026-12-31', country: 'Philippines', isWorkingDay: false, notes: 'Special Non-Working Day (PH). Joint closure.' },

  // --- 2026 DENMARK ---
  { id: 'dk-2026-01', title: 'Nytårsdag (New Year)', holidayDate: '2026-01-01', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK). Both hubs closed.' },
  { id: 'dk-2026-02', title: 'Skærtorsdag (Maundy Thursday)', holidayDate: '2026-04-02', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK). Dual closure with Manila.' },
  { id: 'dk-2026-03', title: 'Langfredag (Good Friday)', holidayDate: '2026-04-03', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK). Dual closure with Manila.' },
  { id: 'dk-2026-04', title: 'Påskedag (Easter Sunday)', holidayDate: '2026-04-05', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK).' },
  { id: 'dk-2026-05', title: '2. Påskedag (Easter Monday)', holidayDate: '2026-04-06', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK). Danish client closed; Manila developers operating normally.' },
  { id: 'dk-2026-06', title: 'Arbejdernes Kampdag (Labor Day)', holidayDate: '2026-05-01', country: 'Denmark', isWorkingDay: true, notes: 'Special Observance (DK). Manila Hub closed; DK operates afternoon half-day.' },
  { id: 'dk-2026-07', title: 'Kristi Himmelfartsdag (Ascension Day)', holidayDate: '2026-05-14', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK). Copenhagen closed; Manila engineering operating normally.' },
  { id: 'dk-2026-08', title: 'Pinsedag (Whit Sunday)', holidayDate: '2026-05-24', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK).' },
  { id: 'dk-2026-09', title: '2. Pinsedag (Whit Monday)', holidayDate: '2026-05-25', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK). Copenhagen closed; Manila developers operating.' },
  { id: 'dk-2026-10', title: 'Grundlovsdag (Constitution Day)', holidayDate: '2026-06-05', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK). Copenhagen closed; Manila operating.' },
  { id: 'dk-2026-11', title: 'Juleaften (Christmas Eve)', holidayDate: '2026-12-24', country: 'Denmark', isWorkingDay: false, notes: 'Traditional Holiday (DK). Both hubs closed.' },
  { id: 'dk-2026-12', title: '1. Juledag (Christmas Day)', holidayDate: '2026-12-25', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK & PH). Both hubs closed.' },
  { id: 'dk-2026-13', title: '2. Juledag (Boxing Day)', holidayDate: '2026-12-26', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK).' },
  { id: 'dk-2026-14', title: 'Nytårsaften (New Year Eve)', holidayDate: '2026-12-31', country: 'Denmark', isWorkingDay: false, notes: 'Traditional Holiday (DK). Both hubs closed.' },

  // --- 2025 SAMPLES ---
  { id: 'ph-2025-01', title: "New Year's Day", holidayDate: '2025-01-01', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH).' },
  { id: 'ph-2025-02', title: 'Maundy Thursday', holidayDate: '2025-04-17', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH).' },
  { id: 'ph-2025-03', title: 'Good Friday', holidayDate: '2025-04-18', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH).' },
  { id: 'ph-2025-04', title: 'Labor Day', holidayDate: '2025-05-01', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH).' },
  { id: 'ph-2025-05', title: 'Christmas Day', holidayDate: '2025-12-25', country: 'Philippines', isWorkingDay: false, notes: 'Regular Holiday (PH & DK).' },
  { id: 'dk-2025-01', title: 'Nytårsdag', holidayDate: '2025-01-01', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK).' },
  { id: 'dk-2025-02', title: 'Skærtorsdag', holidayDate: '2025-04-17', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK).' },
  { id: 'dk-2025-03', title: 'Langfredag', holidayDate: '2025-04-18', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK).' },
  { id: 'dk-2025-04', title: 'Kristi Himmelfartsdag', holidayDate: '2025-05-29', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK).' },
  { id: 'dk-2025-05', title: 'Juledag', holidayDate: '2025-12-25', country: 'Denmark', isWorkingDay: false, notes: 'National Holiday (DK & PH).' }
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CrossBorderCalendarView() {
  const { currentPersona, currentUser } = useAuth();
  const isAdmin = currentPersona?.role === 'AdminHr' || currentUser?.ticketingRole === 'SuperAdmin';

  // Persistence cache
  const [holidays, setHolidays] = useState(() => {
    try {
      const local = localStorage.getItem('ops_holidays_cache_v2');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return SEED_HOLIDAYS;
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'agenda' | 'add'
  const [countryFilter, setCountryFilter] = useState(''); // '' | 'Philippines' | 'Denmark'
  const [agendaSearch, setAgendaSearch] = useState('');
  const [ledgerYearFilter, setLedgerYearFilter] = useState('2026');

  // Calendar Viewport state: defaults to October 2026
  const [viewDate, setViewDate] = useState(() => new Date(2026, 9, 26));
  const [selectedDate, setSelectedDate] = useState('2026-10-26');

  // Today reference ISO
  const todayIso = useMemo(() => {
    const d = new Date();
    // Default to the operations hub baseline 2026-10-26 if current year is 2026, or use current system date
    if (d.getFullYear() === 2026) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '2026-10-26';
  }, []);

  // Form State for Registering New Holiday
  const [formData, setFormData] = useState({
    title: '',
    holidayDate: '2026-10-26',
    country: 'Philippines',
    isWorkingDay: false,
    notes: '',
  });
  const [formSuccess, setFormSuccess] = useState(null);

  // Fetch holidays from API with fallback to cache/seed
  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (countryFilter) params.append('country', countryFilter);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest(`/holidays${query}`);
      if (Array.isArray(data) && data.length > 0) {
        setHolidays(data);
        localStorage.setItem('ops_holidays_cache_v2', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Backend holiday API unreachable, serving cached cross-border registry:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [countryFilter]);

  // Navigate calendar month
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    setViewDate(new Date(2026, 9, 26));
    setSelectedDate('2026-10-26');
  };

  const handleMonthSelect = (monthIdx) => {
    setViewDate(new Date(currentYear, parseInt(monthIdx, 10), 1));
  };

  const handleYearSelect = (yearVal) => {
    setViewDate(new Date(parseInt(yearVal, 10), currentMonth, 1));
  };

  // Build calendar matrix (Monday-first)
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
    const leadingEmptyCount = (firstDayOfWeek + 6) % 7; // Monday = 0, Sun = 6

    const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Leading days from previous month
    for (let i = leadingEmptyCount - 1; i >= 0; i--) {
      const day = prevMonthDaysCount - i;
      const prevDate = new Date(currentYear, currentMonth - 1, day);
      const iso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        date: prevDate,
        dayNumber: day,
        iso,
        isCurrentMonth: false,
        isPrevMonth: true,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(currentYear, currentMonth, day);
      const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        date: thisDate,
        dayNumber: day,
        iso,
        isCurrentMonth: true,
      });
    }

    // Trailing days from next month to complete standard 5 or 6-row grid
    const totalSlots = cells.length > 35 ? 42 : 35;
    const trailingCount = totalSlots - cells.length;
    for (let day = 1; day <= trailingCount; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      const iso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        date: nextDate,
        dayNumber: day,
        iso,
        isCurrentMonth: false,
        isNextMonth: true,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Map holidays by ISO date for fast cell lookup
  const holidaysByDate = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      // Filter by country if selected
      if (countryFilter && h.country !== countryFilter) return;

      if (!map[h.holidayDate]) {
        map[h.holidayDate] = [];
      }
      map[h.holidayDate].push(h);
    });
    return map;
  }, [holidays, countryFilter]);

  // Current Month Holiday & Work Day Stats
  const currentMonthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthHolidays = holidays.filter((h) => h.holidayDate.startsWith(monthPrefix));
    const phCount = monthHolidays.filter((h) => h.country === 'Philippines').length;
    const dkCount = monthHolidays.filter((h) => h.country === 'Denmark').length;

    // Calculate working days in this month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(currentYear, currentMonth, d);
      const dayOfWeek = dayDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return {
      total: monthHolidays.length,
      phCount,
      dkCount,
      workingDays,
    };
  }, [holidays, currentYear, currentMonth]);

  // Selected date holidays & operational status calculation
  const selectedHolidays = holidays.filter((h) => h.holidayDate === selectedDate);
  const phHolidayForSelected = selectedHolidays.find((h) => h.country === 'Philippines');
  const dkHolidayForSelected = selectedHolidays.find((h) => h.country === 'Denmark');

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOpenAddForDate = (dateIso) => {
    setFormData((prev) => ({
      ...prev,
      holidayDate: dateIso,
      title: '',
      notes: '',
      isWorkingDay: false,
    }));
    setActiveTab('add');
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setFormSuccess(null);

    const newHoliday = {
      id: `hol-${Date.now()}`,
      title: formData.title,
      holidayDate: formData.holidayDate,
      country: formData.country,
      isWorkingDay: Boolean(formData.isWorkingDay),
      notes: formData.notes || (formData.country === 'Philippines'
        ? 'Manila Hub Non-Working Day — Danish Clients Operating Normally'
        : 'Danish Client Closed — Manila Developers Operating Normally')
    };

    try {
      await apiRequest('/holidays', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.warn('API save offline, saving holiday locally:', err.message);
    }

    // Update local state and cache
    const updated = [newHoliday, ...holidays];
    setHolidays(updated);
    try {
      localStorage.setItem('ops_holidays_cache_v2', JSON.stringify(updated));
    } catch (e) {}

    setFormSuccess(`Successfully registered "${formData.title}" on ${formData.holidayDate}.`);
    setSelectedDate(formData.holidayDate);

    // Jump calendar view to this holiday's month
    const [y, m, d] = formData.holidayDate.split('-').map(Number);
    setViewDate(new Date(y, m - 1, d));

    setFormData({
      title: '',
      holidayDate: '2026-10-26',
      country: 'Philippines',
      isWorkingDay: false,
      notes: '',
    });
    setActiveTab('grid');
  };

  const handleDeleteHoliday = async (id, title) => {
    if (!window.confirm(`Delete holiday "${title}"?`)) return;
    try {
      await apiRequest(`/holidays/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete offline, removing from local registry:', err.message);
    }

    const updated = holidays.filter((h) => h.id !== id);
    setHolidays(updated);
    try {
      localStorage.setItem('ops_holidays_cache_v2', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleCellClick = (cell) => {
    setSelectedDate(cell.iso);
    if (!cell.isCurrentMonth) {
      setViewDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
    }
  };

  // Filtered agenda list for Ledger view
  const filteredAgendaHolidays = useMemo(() => {
    return holidays
      .filter((h) => {
        if (countryFilter && h.country !== countryFilter) return false;
        if (ledgerYearFilter && !h.holidayDate.startsWith(ledgerYearFilter)) return false;
        if (agendaSearch.trim()) {
          const q = agendaSearch.toLowerCase();
          return (
            h.title.toLowerCase().includes(q) ||
            h.holidayDate.includes(q) ||
            (h.notes && h.notes.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate));
  }, [holidays, countryFilter, ledgerYearFilter, agendaSearch]);

  // Selected date human readable string
  const formatSelectedDateHuman = (isoStr) => {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-2 sm:gap-2.5 min-h-0 overflow-hidden">
      {/* ========================================================
          1. TOP NAVIGATION & VIEW CONTROLS
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-2.5 py-1.5 sm:py-2 rounded-xl border border-zinc-200/80 shadow-2xs shrink-0">
        {/* Left: Tab Switcher (Grid vs Agenda vs Add) */}
        <div className="flex items-center bg-zinc-100 p-0.5 sm:p-1 rounded-xl border border-zinc-200/80 gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'grid'
                ? 'bg-[#13264C] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Interactive Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'agenda'
                ? 'bg-[#13264C] text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Holiday Ledger ({holidays.length})</span>
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

        {/* Right: Regional Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 self-start sm:self-auto">
          {[
            { value: '', label: 'All Regions' },
            { value: 'Philippines', label: '🇵🇭 Manila' },
            { value: 'Denmark', label: '🇩🇰 Copenhagen' },
          ].map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCountryFilter(c.value)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                countryFilter === c.value
                  ? 'bg-white text-[#13264C] shadow-2xs border border-zinc-200/80'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {formSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs"
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

      {/* ========================================================
          TAB 1: ACTUAL INTERACTIVE CALENDAR GRID VIEW
          ======================================================== */}
      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 flex-1 min-h-0 h-full overflow-hidden">
          {/* Main Calendar Panel (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden h-full min-h-0">
            {/* Calendar Toolbar */}
            <div className="px-3 sm:px-3.5 py-1.5 sm:py-2 border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Prev / Next & Month Heading */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 border border-zinc-200/80">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h2 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight m-0 min-w-[130px]">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
              </div>

              {/* Fast Selectors & Today Jump Button */}
              <div className="flex items-center gap-1.5">
                <select
                  value={currentMonth}
                  onChange={(e) => handleMonthSelect(e.target.value)}
                  className="px-2 py-1 text-xs bg-zinc-100 border border-zinc-200/80 rounded-xl font-bold text-zinc-800 focus:outline-none focus:border-[#13264C]"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={(e) => handleYearSelect(e.target.value)}
                  className="px-2 py-1 text-xs bg-zinc-100 border border-zinc-200/80 rounded-xl font-bold text-zinc-800 focus:outline-none focus:border-[#13264C]"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>

                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 text-xs font-bold text-[#13264C] bg-white border border-zinc-200/80 hover:bg-zinc-50 rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Monthly Stats Strip */}
            <div className="px-3 py-1 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 border-b border-zinc-200/60 flex flex-wrap items-center justify-between text-[11px] text-zinc-600 gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                  {MONTH_NAMES[currentMonth]}:
                </span>
                <span className="font-bold text-zinc-900">
                  {currentMonthStats.total} {currentMonthStats.total === 1 ? 'Holiday' : 'Holidays'}
                </span>
                <span className="text-zinc-300">&bull;</span>
                <span className="text-zinc-600">
                  🇵🇭 {currentMonthStats.phCount} Manila &bull; 🇩🇰 {currentMonthStats.dkCount} Copenhagen
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10.5px] font-semibold text-zinc-500">
                <Clock className="w-3 h-3 text-[#13264C]" />
                <span>{currentMonthStats.workingDays} Sprint Days</span>
              </div>
            </div>

            {/* Weekdays Header (Monday-first) */}
            <div className="grid grid-cols-7 border-b border-zinc-200/80 bg-zinc-50/70 text-center shrink-0">
              {WEEKDAY_NAMES.map((day, idx) => {
                const isWeekend = idx >= 5;
                return (
                  <div
                    key={day}
                    className={`py-1 text-[10.5px] font-bold tracking-wider uppercase border-r border-zinc-200/60 last:border-r-0 ${
                      isWeekend ? 'text-zinc-400' : 'text-zinc-600'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* 7-column Calendar Day Matrix (Fills available height proportionally) */}
            <div
              className={`grid grid-cols-7 ${
                calendarCells.length > 35 ? 'grid-rows-6' : 'grid-rows-5'
              } auto-rows-fr bg-zinc-200/40 gap-px border-b border-zinc-200/80 flex-1 min-h-0 h-full overflow-hidden`}
            >
              {calendarCells.map((cell) => {
                const dayHolidays = holidaysByDate[cell.iso] || [];
                const isSelected = selectedDate === cell.iso;
                const isToday = cell.iso === todayIso || cell.iso === '2026-10-26';
                const hasPh = dayHolidays.some((h) => h.country === 'Philippines');
                const hasDk = dayHolidays.some((h) => h.country === 'Denmark');
                const dayOfWeek = cell.date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={cell.iso}
                    onClick={() => handleCellClick(cell)}
                    className={`h-full p-1 sm:p-1.5 flex flex-col justify-between transition-all cursor-pointer relative group overflow-hidden ${
                      !cell.isCurrentMonth
                        ? 'bg-zinc-50/90 text-zinc-400'
                        : isSelected
                        ? 'bg-[#13264C]/5 ring-2 ring-[#13264C] ring-inset z-10'
                        : isWeekend
                        ? 'bg-zinc-50/40 text-zinc-700 hover:bg-zinc-100/70'
                        : 'bg-white text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {/* Top Row: Date Number & Region Flags */}
                    <div className="flex items-center justify-between shrink-0">
                      <span
                        className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded-full transition-colors ${
                          isToday
                            ? 'bg-[#13264C] text-white shadow-2xs font-extrabold ring-2 ring-[#13264C]/20'
                            : isSelected
                            ? 'bg-zinc-900 text-white font-extrabold'
                            : cell.isCurrentMonth
                            ? 'text-zinc-800'
                            : 'text-zinc-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Region Flags */}
                      {dayHolidays.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[11px] sm:text-xs">
                          {hasPh && <span title="Philippines Holiday">🇵🇭</span>}
                          {hasDk && <span title="Denmark Holiday">🇩🇰</span>}
                        </div>
                      )}
                    </div>

                    {/* Middle: Holiday Event Chips */}
                    <div className="flex flex-col gap-0.5 my-0.5 overflow-hidden flex-1 justify-center">
                      {dayHolidays.slice(0, 2).map((h) => {
                        const isPH = h.country === 'Philippines';
                        return (
                          <div
                            key={h.id}
                            title={`${h.country}: ${h.title} (${h.notes || ''})`}
                            className={`px-1 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[9.5px] font-semibold truncate flex items-center gap-1 border transition-all ${
                              isPH
                                ? 'bg-[#13264C]/10 text-[#13264C] border-[#13264C]/25 hover:bg-[#13264C]/20'
                                : 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/25 hover:bg-[#D61766]/20'
                            }`}
                          >
                            <span className="shrink-0">{isPH ? '🇵🇭' : '🇩🇰'}</span>
                            <span className="truncate">{h.title}</span>
                          </div>
                        );
                      })}

                      {dayHolidays.length > 2 && (
                        <span className="text-[8.5px] sm:text-[9px] font-bold text-zinc-500 pl-1 leading-none">
                          +{dayHolidays.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Bottom Status Hint */}
                    <div className="shrink-0 flex items-center justify-between">
                      {dayHolidays.some((h) => h.isWorkingDay) ? (
                        <span className="text-[8px] sm:text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 leading-none">
                          Work Day
                        </span>
                      ) : dayHolidays.length > 0 ? (
                        <span className="text-[8px] sm:text-[8.5px] font-bold text-[#D61766] bg-[#D61766]/10 px-1 py-0.2 rounded leading-none">
                          Holiday
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Footer Legend */}
            <div className="px-3 py-1.5 sm:py-2 bg-zinc-50 border-t border-zinc-200/80 flex flex-wrap items-center justify-between text-[10.5px] text-zinc-600 gap-1.5 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#13264C]" />
                  <span className="font-semibold text-zinc-700">🇵🇭 Manila</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D61766]" />
                  <span className="font-semibold text-zinc-700">🇩🇰 Copenhagen</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-zinc-700">Working Holiday</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                <Info className="w-3 h-3 text-zinc-400" />
                <span>Click any day to inspect sync</span>
              </div>
            </div>
          </div>

          {/* Right Side: Day Inspector (4 cols on lg, perfectly fitting height) */}
          <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-zinc-200/80 p-3 sm:p-3.5 shadow-xs h-full min-h-0 overflow-hidden gap-2">
            {/* Header: Selected Date & Admin Action */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 shrink-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-zinc-950 m-0 tracking-tight">
                {formatSelectedDateHuman(selectedDate)}
              </h3>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenAddForDate(selectedDate)}
                  className="p-1 rounded-lg text-[#13264C] hover:bg-[#13264C]/10 border border-zinc-200 transition-colors cursor-pointer"
                  title="Add holiday on this date"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#D61766]" />
                </button>
              )}
            </div>

            {/* Station Operating Status Badges */}
            <div className="flex flex-col gap-1.5 shrink-0">
              {/* Manila Station */}
              <div className="p-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">🇵🇭</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 truncate">Manila HQ Campus</div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {phHolidayForSelected ? phHolidayForSelected.title : 'Standard Delivery Shift'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    phHolidayForSelected
                      ? phHolidayForSelected.isWorkingDay
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-[#13264C]/10 text-[#13264C] border-[#13264C]/25'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {phHolidayForSelected
                    ? phHolidayForSelected.isWorkingDay
                      ? 'Working Day'
                      : 'Office Closed'
                    : 'Operating'}
                </span>
              </div>

              {/* Copenhagen Station */}
              <div className="p-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">🇩🇰</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 truncate">Copenhagen Hub</div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {dkHolidayForSelected ? dkHolidayForSelected.title : 'Client Operations Active'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    dkHolidayForSelected
                      ? dkHolidayForSelected.isWorkingDay
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/25'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {dkHolidayForSelected
                    ? dkHolidayForSelected.isWorkingDay
                      ? 'Working Day'
                      : 'Office Closed'
                    : 'Operating'}
                </span>
              </div>
            </div>

            {/* Cross-Border Coordination Guidance */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-zinc-50 to-white border border-zinc-200/90 text-xs flex flex-col gap-1 shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-[11px]">
                <Globe2 className="w-3 h-3 text-[#13264C]" />
                <span>Coordination Protocol</span>
              </div>
              <p className="text-zinc-600 text-[10.5px] sm:text-[11px] leading-relaxed m-0">
                {phHolidayForSelected && !dkHolidayForSelected
                  ? 'Manila Campus closed for holiday. Copenhagen clients operating normally. Asynchronous escalation protocol active.'
                  : !phHolidayForSelected && dkHolidayForSelected
                  ? 'Copenhagen office closed. Manila developers operate normally with zero meeting interruptions; focus on sprint execution.'
                  : phHolidayForSelected && dkHolidayForSelected
                  ? 'Joint cross-border holiday: both facilities closed. 24/7 automated telemetry and incident bridge monitor systems.'
                  : 'Standard synchronized business day. Real-time collaboration window active from 02:00 PM to 06:00 PM PHT (08:00 AM – 12:00 PM CEST).'}
              </p>
            </div>

            {/* Detailed Holiday Entries on this day (Scrolls internally if multiple) */}
            <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto no-scrollbar pt-0.5">
              {selectedHolidays.length > 0 ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">
                    Official Holiday Records ({selectedHolidays.length})
                  </span>
                  {selectedHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="p-2 rounded-xl border border-zinc-200 bg-white shadow-2xs flex flex-col gap-0.5 text-xs shrink-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-950 flex items-center gap-1.5 text-[11px]">
                          <span>{h.country === 'Philippines' ? '🇵🇭' : '🇩🇰'}</span>
                          <span>{h.title}</span>
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(h.id, h.title)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete holiday record"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-[10.5px] text-zinc-500 leading-tight">
                        {h.notes || 'No custom operational notes provided.'}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-3 text-zinc-400 text-xs my-auto">
                  No public holidays recorded on this date.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: HOLIDAY LEDGER (AGENDA / TABLE VIEW)
          ======================================================== */}
      {activeTab === 'agenda' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden flex flex-col flex-1 min-h-0 h-full">
          {/* Filter & Search Bar */}
          <div className="px-3.5 py-2.5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                <CalendarRange className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
                  Official Cross-Border Ledger
                </h3>
                <span className="text-[11px] text-zinc-500">
                  Comprehensive register of legal &amp; client holidays
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year Filter */}
              <select
                value={ledgerYearFilter}
                onChange={(e) => setLedgerYearFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-100 border border-zinc-200/80 rounded-xl font-bold text-zinc-800 focus:outline-none focus:border-[#13264C]"
              >
                <option value="">All Years</option>
                <option value="2026">2026 Calendar</option>
                <option value="2025">2025 Calendar</option>
              </select>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search holiday or date..."
                  value={agendaSearch}
                  onChange={(e) => setAgendaSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Table (Scrolls internally without page scroll) */}
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-medium my-auto">
              Loading cross-border ledger...
            </div>
          ) : filteredAgendaHolidays.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500 my-auto">
              No holiday records found matching the current criteria.
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[720px]">
                <thead className="sticky top-0 bg-zinc-50/95 backdrop-blur-xs border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-4 whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Region</th>
                    <th className="py-2.5 px-4">Holiday Name</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">Hub Operations</th>
                    <th className="py-2.5 px-4">Cross-Border Protocol &amp; Impact</th>
                    {isAdmin && <th className="py-2.5 px-4 text-right whitespace-nowrap">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                  {filteredAgendaHolidays.map((h) => {
                    const isPH = h.country === 'Philippines';
                    const defaultImpact = isPH
                      ? 'Manila Hub Closed (PH Non-Working Day) — Danish Clients Operating'
                      : 'Danish Client Closed — Manila Developers Operating Normally';

                    return (
                      <tr
                        key={h.id}
                        className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedDate(h.holidayDate);
                          const [y, m, d] = h.holidayDate.split('-').map(Number);
                          setViewDate(new Date(y, m - 1, d));
                          setActiveTab('grid');
                        }}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-[#13264C] whitespace-nowrap">
                          {h.holidayDate}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                          {isPH ? '🇵🇭 Philippines' : '🇩🇰 Denmark'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-zinc-950">
                          {h.title}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              h.isWorkingDay
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-[#D61766]/10 text-[#D61766] border-[#D61766]/20'
                            }`}
                          >
                            {h.isWorkingDay ? 'Working Day' : 'Office Closed'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-500 text-xs">
                          {h.notes || defaultImpact}
                        </td>
                        {isAdmin && (
                          <td
                            className="py-2.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
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

      {/* ========================================================
          TAB 3: REGISTER NEW HOLIDAY (ADMIN ONLY)
          ======================================================== */}
      {activeTab === 'add' && isAdmin && (
        <div className="flex-1 min-h-0 flex items-center justify-center p-2 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs w-full max-w-xl max-h-full overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-zinc-100">
              <span className="p-1.5 rounded-lg bg-[#13264C]/10 text-[#13264C]">
                <PlusCircle className="w-4 h-4 text-[#D61766]" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 tracking-tight m-0">
                  Register New Cross-Border Holiday
                </h3>
                <span className="text-[11px] text-zinc-500">
                  Adds official holiday to both calendar grid and ledger
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateHoliday} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Holiday Title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Labor Day / Store Bededag / Constitution Day"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Country / Region
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleFormChange}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                  >
                    <option value="Philippines">🇵🇭 Philippines (Manila HQ)</option>
                    <option value="Denmark">🇩🇰 Denmark (Copenhagen Client)</option>
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
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <input
                  id="isWorkingDay"
                  name="isWorkingDay"
                  type="checkbox"
                  checked={formData.isWorkingDay}
                  onChange={handleFormChange}
                  className="w-4 h-4 rounded text-[#13264C] focus:ring-[#13264C] cursor-pointer"
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
                  rows={2}
                  placeholder="Specify staffing coverage, asynchronous delivery protocol, or ticket routing..."
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] shadow-xs cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Holiday to Calendar</span>
                </motion.button>
                <button
                  type="button"
                  onClick={() => setActiveTab('grid')}
                  className="py-2 px-3.5 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
