import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Kanban,
  List,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  Eye,
  Clock,
  User,
  Building2,
  Check
} from 'lucide-react';

const COLUMNS = [
  { id: 'Open', label: 'Open', dotBg: 'bg-[#13264C]', badgeBg: 'bg-[#13264C]/10 text-[#13264C]' },
  { id: 'Waiting on Us', label: 'Waiting on Us', dotBg: 'bg-sky-600', badgeBg: 'bg-sky-50 text-sky-700' },
  { id: 'Waiting on Contact', label: 'Waiting on Contact', dotBg: 'bg-amber-500', badgeBg: 'bg-amber-50 text-amber-700' },
  { id: 'On Hold', label: 'On Hold', dotBg: 'bg-purple-600', badgeBg: 'bg-purple-50 text-purple-700' },
  { id: 'Closed', label: 'Closed', dotBg: 'bg-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700' },
];

const LOCAL_STORAGE_KEY = 'ops_ticket_board_columns_v1';

export default function TicketQueueView() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Department filter state: defaults to current user's department (Dev Operation for Super Admin)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(() => {
    return currentUser?.departmentId ? currentUser.departmentId.toString() : '1';
  });

  // Inbound Email Simulator state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simForm, setSimForm] = useState({
    fromName: 'Khin Andrei Gamboa',
    fromEmail: 'gamboa.khinandrei@gmail.com',
    toEmail: 'it-support@company.io',
    subject: 'Workstation power supply failure after storm',
    body: 'Hi IT team, my secondary monitor and desktop power unit will not turn on today. Can an IT specialist check this or issue a temporary replacement unit? Thanks!'
  });
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState(null);

  // Ticket Detail & Message Inspection Modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketCol, setSelectedTicketCol] = useState('Open');
  const [selectedTicketAssigneeId, setSelectedTicketAssigneeId] = useState('');
  const [modalResolutionNotes, setModalResolutionNotes] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // View state: 'board' | 'list'
  const [viewMode, setViewMode] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');

  // Column mapping state: { [ticketId]: columnName }
  const [ticketColumns, setTicketColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Drag and drop state
  const [draggedTicketId, setDraggedTicketId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch tickets, access employees, and departments
      const callerParam = currentUser?.id ? `?callerEmployeeId=${currentUser.id}` : '';
      const [ticketList, accessEmpList, deptList] = await Promise.all([
        apiRequest(`/tickets${callerParam}`),
        apiRequest('/access/employees').catch(() => apiRequest('/employees')),
        apiRequest('/departments').catch(() => []),
      ]);

      setTickets(ticketList || []);
      setEmployees((accessEmpList || []).filter((e) => e.isInternal));
      setDepartments(deptList || []);
      if (deptList?.length > 0 && !simForm.toEmail) {
        setSimForm((prev) => ({
          ...prev,
          toEmail: deptList[0].supportEmail || 'it-support@company.io'
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateInboundEmail = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    setSimError(null);
    setSimResult(null);
    try {
      const res = await apiRequest('/tickets/inbound-email', {
        method: 'POST',
        body: simForm
      });
      setSimResult(res);
      fetchData(); // Immediately refresh Kanban tickets
    } catch (err) {
      setSimError(err.message || 'Failed to process inbound email.');
    } finally {
      setSimLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setSimResult(null);
    setSimError(null);
    if (preset === 'it') {
      setSimForm({
        fromName: 'Khin Andrei Gamboa',
        fromEmail: 'gamboa.khinandrei@gmail.com',
        toEmail: 'it-support@company.io',
        subject: 'VPN Connection drops intermittently on remote shift',
        body: 'Hello IT team, my OpenVPN client disconnects every 15 minutes during the afternoon sprint. Could you review my routing logs?'
      });
    } else if (preset === 'hr') {
      setSimForm({
        fromName: 'Jessica Alcantara',
        fromEmail: 'jessica.alcantara@gmail.com',
        toEmail: 'hr-support@company.io',
        subject: 'Request for Certificate of Employment (COE) with Compensation',
        body: 'Hi HR team, I need a signed Certificate of Employment stating my compensation breakdown for my home loan bank application. Thank you!'
      });
    } else if (preset === 'devops') {
      setSimForm({
        fromName: 'Bianca Mendoza',
        fromEmail: 'dev.bianca@company.io',
        toEmail: 'gamboa.khinandrei+devops@gmail.com',
        subject: 'Kubernetes staging namespace rollout failure',
        body: 'Hi Khin Andrei & DevOps team, our latest build helm deployment to staging-alpha failed with CrashLoopBackOff on pod container restart. Please inspect.'
      });
    } else if (preset === 'finance') {
      setSimForm({
        fromName: 'Arnel Bautista',
        fromEmail: 'arnel.bautista@gmail.com',
        toEmail: 'finance-support@company.io',
        subject: 'Travel allowance reimbursement claim inquiry',
        body: 'Hi Finance, attached are receipts for client on-site visit expenses last Thursday. Kindly confirm if processing will be included in the upcoming cut-off.'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.departmentId) {
      setSelectedDeptFilter(currentUser.departmentId.toString());
    }
  }, [currentUser?.departmentId]);

  // Determine which column a ticket belongs to
  const getTicketColumn = (ticket) => {
    if (ticketColumns[ticket.id]) {
      return ticketColumns[ticket.id];
    }
    if (ticket.status === 'Open') return 'Open';
    if (ticket.status === 'Resolved') return 'Closed';
    if (ticket.status === 'InProgress') return 'Waiting on Us';
    return 'Open';
  };

  // Map 5 board columns to 3 backend TicketStatus values
  const mapColumnToBackendStatus = (colName) => {
    if (colName === 'Closed') return 'Resolved';
    if (colName === 'Open') return 'Open';
    return 'InProgress'; // 'Waiting on Us', 'Waiting on Contact', 'On Hold'
  };

  // Move ticket to a new column
  const handleMoveTicket = async (ticketId, targetCol) => {
    if (!targetCol) return;

    // 1. Update local column mapping & persist to localStorage
    const updatedMap = { ...ticketColumns, [ticketId]: targetCol };
    setTicketColumns(updatedMap);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedMap));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }

    const backendStatus = mapColumnToBackendStatus(targetCol);

    // 2. Optimistically update local tickets state
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: backendStatus } : t))
    );

    // 3. Persist status change to backend
    try {
      const targetTicket = tickets.find((t) => t.id === ticketId);
      await apiRequest(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: {
          status: backendStatus,
          assignedToEmployeeId: targetTicket?.assignedToEmployeeId || currentUser?.id,
          resolutionNotes: targetCol === 'Closed' ? (targetTicket?.resolutionNotes || 'Closed via operations board.') : null,
        },
      });
    } catch (err) {
      console.error('Failed to sync ticket status to backend:', err);
    }
  };

  // Manager permission check: Only department managers can assign tickets of their co-members
  const isManager = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.ticketingRole === 'SuperAdmin') return true;
    if (currentUser.ticketingRole === 'DevOpsAdmin') return true;
    if (currentUser.ticketingRole === 'DepartmentManager') return true;
    if (currentUser.jobTitle && /manager|director|lead/i.test(currentUser.jobTitle)) return true;
    return false;
  }, [currentUser]);

  // Can the current logged-in user assign this specific ticket?
  const canUserAssignTicket = (ticket) => {
    if (!currentUser || !isManager) return false;

    // SuperAdmin has global administrative authority
    if (currentUser.ticketingRole === 'SuperAdmin') return true;

    // Department managers can ONLY assign tickets belonging to their own department
    const userDeptId = currentUser.departmentId;
    const userDeptName = (currentUser.departmentName || '').toLowerCase().trim();
    const ticketDeptId = ticket.departmentId;
    const ticketDeptName = (ticket.departmentName || '').toLowerCase().trim();

    if (userDeptId && ticketDeptId && userDeptId === ticketDeptId) {
      return true;
    }
    if (userDeptName && ticketDeptName && userDeptName === ticketDeptName) {
      return true;
    }

    return false;
  };

  // Filter assignable employees strictly to co-members of that specific department
  const getAssignableCoMembers = (ticket) => {
    const ticketDeptId = ticket.departmentId;
    const ticketDeptName = (ticket.departmentName || '').toLowerCase().trim();

    const coMembers = employees.filter((emp) => {
      if (!emp.isInternal) return false;

      if (ticketDeptId && emp.departmentId) {
        return emp.departmentId === ticketDeptId;
      }
      if (ticketDeptName && emp.departmentName) {
        return emp.departmentName.toLowerCase().trim() === ticketDeptName;
      }
      return false;
    });

    if (coMembers.length > 0) {
      // Ensure currently assigned person is included even if cross-assigned historically
      if (ticket.assignedToEmployeeId && !coMembers.some((m) => m.id === ticket.assignedToEmployeeId)) {
        const currentAssignee = employees.find((e) => e.id === ticket.assignedToEmployeeId);
        if (currentAssignee) {
          return [currentAssignee, ...coMembers];
        }
      }
      return coMembers;
    }

    // Fallback if ticket has no department assigned
    return employees.filter((e) => e.isInternal);
  };

  // Assign ticket to an employee by department manager
  const handleAssignTicket = async (ticketId, employeeIdStr) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    if (!canUserAssignTicket(targetTicket)) {
      alert(`Only managers of ${targetTicket.departmentName || 'this department'} can assign this ticket.`);
      return;
    }

    const empId = employeeIdStr ? parseInt(employeeIdStr, 10) : null;
    const emp = employees.find((e) => e.id === empId);

    // Optimistic UI update
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              assignedToEmployeeId: empId,
              assignedToEmployeeName: emp ? emp.fullName : null,
            }
          : t
      )
    );

    if (empId) {
      try {
        await apiRequest(`/tickets/${ticketId}/assign`, {
          method: 'PATCH',
          body: { assignedToEmployeeId: empId },
        });
      } catch (err) {
        console.error('Failed to assign ticket:', err);
        alert(`Error assigning ticket: ${err.message}`);
        fetchData();
      }
    }
  };

  const handleOpenTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedTicketCol(getTicketColumn(ticket));
    setSelectedTicketAssigneeId(ticket.assignedToEmployeeId ? ticket.assignedToEmployeeId.toString() : '');
    setModalResolutionNotes(ticket.resolutionNotes || '');
  };

  const handleSaveModalTicket = async () => {
    if (!selectedTicket) return;
    setModalSaving(true);
    try {
      const backendStatus = mapColumnToBackendStatus(selectedTicketCol);
      const newAssigneeId = selectedTicketAssigneeId ? parseInt(selectedTicketAssigneeId, 10) : null;

      await apiRequest(`/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        body: {
          status: backendStatus,
          assignedToEmployeeId: newAssigneeId,
          resolutionNotes: modalResolutionNotes || null,
        },
      });

      // Update local columns map
      const updatedMap = { ...ticketColumns, [selectedTicket.id]: selectedTicketCol };
      setTicketColumns(updatedMap);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedMap));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }

      await fetchData();
      setSelectedTicket(null);
    } catch (err) {
      alert(`Failed to update ticket: ${err.message}`);
    } finally {
      setModalSaving(false);
    }
  };

  // Drag event handlers
  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('text/plain', ticketId.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTicketId(ticketId);
  };

  const handleDragEnd = () => {
    setDraggedTicketId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    const ticketId = idStr ? parseInt(idStr, 10) : draggedTicketId;
    if (ticketId) {
      handleMoveTicket(ticketId, colId);
    }
    setDraggedTicketId(null);
    setDragOverCol(null);
  };

  // Filter tickets by department queue isolation and real-time search query
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Department Queue Isolation (Super Admin focuses on Dev Operation)
      if (selectedDeptFilter !== 'all') {
        const targetDeptId = parseInt(selectedDeptFilter, 10);
        if (t.departmentId !== targetDeptId) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const idStr = t.id.toString();
      const title = (t.title || '').toLowerCase();
      const requester = (t.createdByEmployeeName || '').toLowerCase();
      const department = (t.departmentName || '').toLowerCase();
      const priority = (t.priority || '').toLowerCase();
      const assignee = (t.assignedToEmployeeName || '').toLowerCase();

      return (
        idStr.includes(q) ||
        `#${idStr}`.includes(q) ||
        title.includes(q) ||
        requester.includes(q) ||
        department.includes(q) ||
        priority.includes(q) ||
        assignee.includes(q)
      );
    });
  }, [tickets, searchQuery, selectedDeptFilter]);

  return (
    <div className="h-full w-full flex-1 min-h-0 flex flex-col gap-3 font-sans select-none overflow-hidden">
      {/* Top Controls Toolbar: Search, Role Pill & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, issue, requester, department, or assignee..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-zinc-200/90 rounded-xl placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-[#13264C] shadow-2xs font-medium transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher, Role Badge & Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Subtle manager / role indicator pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium ${
              isManager
                ? 'bg-blue-50/60 text-[#13264C] border-blue-200/70'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200/80'
            }`}
            title={
              isManager
                ? `Manager of ${currentUser?.departmentName || 'DevOps'}: Authorized to assign department tickets.`
                : 'Regular Member: Ticket assignment managed by department managers.'
            }
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#13264C]" />
            <span className="truncate max-w-[200px]">
              {currentUser?.departmentName || 'Team'} {isManager ? 'Manager' : 'Member'}
            </span>
          </div>

          {/* Board vs List tabs */}
          <div className="flex items-center bg-zinc-200/70 p-1 rounded-xl border border-zinc-200/80">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-[#13264C] text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#13264C] text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Inbound Email Simulator Button */}
          <button
            type="button"
            onClick={() => setSimulatorOpen(true)}
            title="Simulate employee email to department inbox"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-700 hover:text-[#13264C] shadow-2xs cursor-pointer transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-[#D61766]" />
            <span className="hidden sm:inline">Inbound Email Simulator</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh tickets"
            className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-300 shadow-2xs cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#13264C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Department Focus & Queue Isolation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 shrink-0 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedDeptFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedDeptFilter === 'all'
              ? 'bg-[#13264C] text-white shadow-2xs'
              : 'bg-white hover:bg-zinc-100/80 text-zinc-600 border border-zinc-200/80'
          }`}
        >
          <span>All Departments</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            selectedDeptFilter === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {tickets.length}
          </span>
        </button>

        {departments.map((dept) => {
          const isSelected = selectedDeptFilter === dept.id.toString();
          const isUserDept = currentUser?.departmentId === dept.id || dept.name.toLowerCase().includes('dev operation');
          const count = tickets.filter((t) => t.departmentId === dept.id).length;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDeptFilter(dept.id.toString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#13264C] text-white shadow-2xs'
                  : isUserDept
                  ? 'bg-blue-50/70 hover:bg-blue-100/60 text-[#13264C] border border-blue-200'
                  : 'bg-white hover:bg-zinc-100/80 text-zinc-600 border border-zinc-200/80'
              }`}
            >
              <span>{dept.name}</span>
              {isUserDept && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-[#D61766] text-white">
                  Super Admin
                </span>
              )}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Board or List */}
      {loading && tickets.length === 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center bg-white rounded-2xl border border-zinc-200/80">
          <div className="text-xs text-zinc-500 font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#13264C]" />
            <span>Loading operational ticket queue...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 min-h-0 flex items-center justify-center bg-white rounded-2xl border border-rose-200/80 p-6">
          <div className="text-center max-w-sm">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-zinc-900 mb-1">Failed to load tickets</h4>
            <p className="text-xs text-zinc-500 mb-3">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1.5 rounded-lg bg-[#13264C] text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      ) : viewMode === 'board' ? (
        /* Board View (Kanban) */
        <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto overflow-y-hidden pb-1">
          {COLUMNS.map((col) => {
            const colTickets = filteredTickets.filter(
              (t) => getTicketColumn(t) === col.id
            );
            const isDropTarget = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className={`flex-1 min-w-[230px] max-w-none h-full flex flex-col rounded-2xl border transition-all duration-150 overflow-hidden ${
                  isDropTarget
                    ? 'bg-blue-50/60 border-2 border-dashed border-[#13264C]/50 shadow-inner'
                    : 'bg-zinc-100/70 border-zinc-200/80'
                }`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="px-3.5 py-2.5 bg-white/90 border-b border-zinc-200/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotBg}`} />
                    <span className="text-xs font-bold text-zinc-900 tracking-tight">
                      {col.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                    {colTickets.length}
                  </span>
                </div>

                {/* Column Cards Container - Scrollable with slim scrollbar */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {colTickets.map((ticket) => {
                    const isDragging = draggedTicketId === ticket.id;
                    const canAssign = canUserAssignTicket(ticket);
                    const coMembers = getAssignableCoMembers(ticket);

                    return (
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleOpenTicketModal(ticket)}
                        className={`bg-white rounded-xl border border-zinc-200/90 p-3 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all cursor-grab active:cursor-grabbing select-none flex flex-col gap-2.5 overflow-hidden shrink-0 ${
                          isDragging ? 'opacity-35 scale-[0.98] border-dashed border-[#13264C]' : ''
                        }`}
                      >
                        {/* 1. Ticket ID & 5. Critical Level */}
                        <div className="flex items-center justify-between gap-2 shrink-0">
                          <span className="font-mono font-bold text-xs text-[#13264C] bg-zinc-100 px-2 py-0.5 rounded-md">
                            #{ticket.id}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              ticket.priority === 'Urgent'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                : ticket.priority === 'High'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                : ticket.priority === 'Medium'
                                ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200/80'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ticket.priority === 'Urgent'
                                  ? 'bg-rose-500'
                                  : ticket.priority === 'High'
                                  ? 'bg-amber-500'
                                  : ticket.priority === 'Medium'
                                  ? 'bg-sky-500'
                                  : 'bg-zinc-400'
                              }`}
                            />
                            {ticket.priority || 'Normal'}
                          </span>
                        </div>

                        {/* Directed Department Email Desk */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/70 border border-blue-200/70 rounded-lg text-[10px] text-[#13264C] font-semibold">
                          <Mail className="w-3 h-3 text-[#13264C] shrink-0" />
                          <span className="truncate font-mono" title={ticket.departmentSupportEmail || 'Auto-routed support inbox'}>
                            To: {ticket.departmentSupportEmail || `${(ticket.departmentName || 'support').toLowerCase().replace(/\s+/g, '-')}@company.io`}
                          </span>
                        </div>

                        {/* 2. Ticket Issue */}
                        <div className="text-xs font-semibold text-zinc-900 leading-snug line-clamp-2">
                          {ticket.title}
                        </div>

                        {/* Incoming Message Snippet */}
                        {ticket.description ? (
                          <div className="text-[11px] text-zinc-600 line-clamp-2 bg-zinc-50 rounded-lg p-2 border border-zinc-200/60 leading-snug font-sans">
                            &ldquo;{ticket.description}&rdquo;
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-400 italic">
                            No message body provided.
                          </div>
                        )}

                        {/* 3. Person who raised it & 4. Department */}
                        <div className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                              Raised By
                            </span>
                            <span className="text-zinc-700 font-semibold truncate max-w-[140px]" title={ticket.createdByEmployeeEmail || ''}>
                              {ticket.createdByEmployeeName || 'Unknown'}
                            </span>
                          </div>
                          {ticket.createdByEmployeeEmail && (
                            <div className="text-[10px] text-zinc-400 font-mono text-right truncate">
                              {ticket.createdByEmployeeEmail}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                              Department
                            </span>
                            <span className="text-zinc-700 font-semibold truncate max-w-[140px]">
                              {ticket.departmentName || 'General'}
                            </span>
                          </div>
                        </div>

                        {/* 6. Person assigned in that tickets by the manager */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1.5 min-h-[26px]">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
                            Assigned
                          </span>

                          {canAssign ? (
                            <select
                              value={ticket.assignedToEmployeeId || ''}
                              onChange={(e) => handleAssignTicket(ticket.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md px-1.5 py-0.5 text-zinc-800 focus:outline-none focus:border-[#13264C] max-w-[145px] truncate cursor-pointer transition-colors"
                              title={`Assign to co-member of ${ticket.departmentName || 'department'}`}
                            >
                              <option value="">Unassigned</option>
                              {coMembers.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.fullName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`text-[11px] truncate max-w-[145px] ${
                                ticket.assignedToEmployeeName
                                  ? 'font-semibold text-zinc-800'
                                  : 'font-normal italic text-zinc-400'
                              }`}
                              title={
                                !isManager
                                  ? 'Regular employees cannot assign tickets. Only department managers can assign.'
                                  : `Only managers of ${ticket.departmentName || 'this department'} can assign this ticket.`
                              }
                            >
                              {ticket.assignedToEmployeeName || 'Unassigned'}
                            </span>
                          )}
                        </div>

                        {/* Inspect Message Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicketModal(ticket);
                          }}
                          className="w-full mt-0.5 py-1.5 px-2 rounded-lg bg-zinc-50 hover:bg-[#13264C] hover:text-white border border-zinc-200 text-zinc-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Email &amp; Message</span>
                        </button>
                      </div>
                    );
                  })}

                  {colTickets.length === 0 && (
                    <div className="flex-1 min-h-[100px] flex items-center justify-center p-4 border border-dashed border-zinc-200/80 rounded-xl text-center text-zinc-400 text-xs font-medium">
                      No tickets in {col.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300/80 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500 font-medium">
                {searchQuery
                  ? `No tickets match "${searchQuery}".`
                  : 'No tickets found in the queue.'}
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse min-w-[880px]">
                <thead className="bg-zinc-50/90 sticky top-0 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Ticket ID</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Directed Email Desk</th>
                    <th className="py-2.5 px-3.5">Ticket Issue &amp; Incoming Message</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Raised By</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Department</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Critical Level</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Assigned Staff</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                  {filteredTickets.map((t) => {
                    const currentCol = getTicketColumn(t);
                    const canAssign = canUserAssignTicket(t);
                    const coMembers = getAssignableCoMembers(t);

                    return (
                      <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                        {/* 1. Ticket ID */}
                        <td className="py-3 px-3.5 font-mono font-bold text-[#13264C] whitespace-nowrap">
                          #{t.id}
                        </td>

                        {/* Directed Department Email Desk */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50/80 border border-blue-200/80 w-fit">
                            <Mail className="w-3 h-3 text-[#13264C]" />
                            <span className="font-mono text-[10px] font-bold text-[#13264C]">
                              {t.departmentSupportEmail || `${(t.departmentName || 'support').toLowerCase().replace(/\s+/g, '-')}@company.io`}
                            </span>
                          </div>
                        </td>

                        {/* 2. Ticket Issue & Message */}
                        <td className="py-3 px-3.5 max-w-sm">
                          <div className="font-bold text-zinc-900 leading-snug">{t.title}</div>
                          {t.description && (
                            <div className="text-[11px] text-zinc-500 line-clamp-1 italic mt-0.5">
                              &ldquo;{t.description}&rdquo;
                            </div>
                          )}
                        </td>

                        {/* 3. Person who raised it */}
                        <td className="py-3 px-3.5 text-zinc-700 whitespace-nowrap">
                          <div className="font-semibold text-zinc-900">{t.createdByEmployeeName || 'Unknown'}</div>
                          {t.createdByEmployeeEmail && (
                            <div className="font-mono text-[10px] text-zinc-400">{t.createdByEmployeeEmail}</div>
                          )}
                        </td>

                        {/* 4. Department */}
                        <td className="py-3 px-3.5 text-zinc-700 whitespace-nowrap">
                          {t.departmentName || 'General'}
                        </td>

                        {/* 5. Critical Level */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.priority === 'Urgent'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                : t.priority === 'High'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                : t.priority === 'Medium'
                                ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200/80'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.priority === 'Urgent'
                                  ? 'bg-rose-500'
                                  : t.priority === 'High'
                                  ? 'bg-amber-500'
                                  : t.priority === 'Medium'
                                  ? 'bg-sky-500'
                                  : 'bg-zinc-400'
                              }`}
                            />
                            {t.priority || 'Normal'}
                          </span>
                        </td>

                        {/* Status (5 columns) */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <select
                            value={currentCol}
                            onChange={(e) => handleMoveTicket(t.id, e.target.value)}
                            className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 font-semibold text-zinc-800 focus:outline-none focus:border-[#13264C] cursor-pointer"
                          >
                            {COLUMNS.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 6. Person assigned by manager */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {canAssign ? (
                            <select
                              value={t.assignedToEmployeeId || ''}
                              onChange={(e) => handleAssignTicket(t.id, e.target.value)}
                              className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 font-medium text-zinc-800 focus:outline-none focus:border-[#13264C] cursor-pointer"
                              title={`Assign to co-member of ${t.departmentName || 'department'}`}
                            >
                              <option value="">Unassigned</option>
                              {coMembers.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.fullName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`text-xs ${
                                t.assignedToEmployeeName
                                  ? 'font-semibold text-zinc-800'
                                  : 'font-normal italic text-zinc-400'
                              }`}
                              title={
                                !isManager
                                  ? 'Regular employees cannot assign tickets. Only department managers can assign.'
                                  : `Only managers of ${t.departmentName || 'this department'} can assign this ticket.`
                              }
                            >
                              {t.assignedToEmployeeName || 'Unassigned'}
                            </span>
                          )}
                        </td>

                        {/* Action: Inspect Message Details */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenTicketModal(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#13264C] hover:text-white text-zinc-700 text-[11px] font-bold transition-colors cursor-pointer border border-zinc-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Inbound Email Simulator Modal */}
      <AnimatePresence>
        {simulatorOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-xl w-full p-5 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#13264C]/10 text-[#13264C]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 m-0">Inbound Email-to-Ticket Simulator</h3>
                    <div className="text-[11px] text-zinc-500">
                      Simulate employee concerns emailed to designated department inboxes
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSimulatorOpen(false); setSimResult(null); setSimError(null); }}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 py-3 flex flex-col gap-3">
                {/* 1-Click Quick Presets */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D61766]" />
                    <span>Quick Test Scenarios (1-Click Fill):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => applyPreset('it')}
                      className="p-2 rounded-xl text-left border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-[#13264C] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-zinc-900">💻 IT Hardware / VPN</div>
                      <div className="text-[10px] text-zinc-500 truncate">to it-support@company.io</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('hr')}
                      className="p-2 rounded-xl text-left border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-[#13264C] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-zinc-900">📋 HR / COE Request</div>
                      <div className="text-[10px] text-zinc-500 truncate">to hr-support@company.io</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('devops')}
                      className="p-2 rounded-xl text-left border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-[#13264C] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-zinc-900">🛠️ DevOps / Deploy</div>
                      <div className="text-[10px] text-zinc-500 truncate">to gamboa.khinandrei+devops@gmail.com</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('finance')}
                      className="p-2 rounded-xl text-left border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-[#13264C] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-zinc-900">💼 Finance / Expense</div>
                      <div className="text-[10px] text-zinc-500 truncate">to finance-support@company.io</div>
                    </button>
                  </div>
                </div>

                {/* Success Banner */}
                {simResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ticket #{simResult.ticketId} Auto-Created &amp; Routed!</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      <strong>Queue:</strong> {simResult.assignedQueue} &bull; <strong>Department:</strong> {simResult.departmentName}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {simResult.confirmationDispatched ? 'Confirmation email dispatched to sender inbox via SMTP.' : 'Simulated confirmation dispatched.'}
                    </div>
                  </motion.div>
                )}

                {/* Error Banner */}
                {simError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{simError}</span>
                  </div>
                )}

                {/* Simulation Form */}
                <form onSubmit={handleSimulateInboundEmail} className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        Employee Sender Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={simForm.fromName}
                        onChange={(e) => setSimForm(prev => ({ ...prev, fromName: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#13264C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        Employee Sender Gmail *
                      </label>
                      <input
                        type="email"
                        required
                        value={simForm.fromEmail}
                        onChange={(e) => setSimForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#13264C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      To Department Support Inbox *
                    </label>
                    <select
                      value={simForm.toEmail}
                      onChange={(e) => setSimForm(prev => ({ ...prev, toEmail: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#13264C] font-mono font-medium"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.supportEmail || `${d.name.toLowerCase().replace(/ /g, '-')}@company.io`}>
                          {d.name} ({d.supportEmail || 'auto-route'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Email Subject / Issue Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={simForm.subject}
                      onChange={(e) => setSimForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#13264C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Email Message / Detailed Concern *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={simForm.body}
                      onChange={(e) => setSimForm(prev => ({ ...prev, body: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#13264C]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setSimulatorOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={simLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{simLoading ? 'Ingesting Email...' : 'Send Inbound Email'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Detail & Inbound Message Inspection Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-2xl w-full p-5 max-h-[90vh] flex flex-col overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-white bg-[#13264C] px-2.5 py-1 rounded-lg">
                    #{selectedTicket.id}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 m-0">Inbound Message &amp; Ticket Routing</h3>
                    <div className="text-[11px] text-zinc-500">
                      Direct email delivery envelope &amp; ticket details
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1 rounded-lg hover:bg-zinc-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 py-4 flex flex-col gap-3.5">
                {/* Routing Envelope Header */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#13264C] font-bold">
                      <Mail className="w-4 h-4 text-[#13264C]" />
                      <span>Directed Support Inbox (To):</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#13264C] bg-white px-2.5 py-0.5 rounded-md border border-blue-200">
                      {selectedTicket.departmentSupportEmail || `${(selectedTicket.departmentName || 'support').toLowerCase().replace(/\s+/g, '-')}@company.io`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        From (Sender)
                      </span>
                      <div className="font-semibold text-zinc-900 mt-0.5">
                        {selectedTicket.createdByEmployeeName || 'Unknown Requester'}
                      </div>
                      {selectedTicket.createdByEmployeeEmail && (
                        <div className="font-mono text-[11px] text-zinc-500">
                          &lt;{selectedTicket.createdByEmployeeEmail}&gt;
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Assigned Department Desk
                      </span>
                      <div className="font-semibold text-zinc-900 mt-0.5">
                        {selectedTicket.departmentName || 'General Desk'}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {selectedTicket.departmentName?.toLowerCase().includes('dev operation')
                          ? 'Super Admin / DevOps Primary Queue'
                          : 'Operational Resolver Queue'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-blue-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Date &amp; Time Received
                      </span>
                      <span className="font-medium text-zinc-700">
                        {new Date(selectedTicket.createdAtUtc).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Priority Level
                      </span>
                      <span className="font-bold text-zinc-900">
                        {selectedTicket.priority || 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Subject / Ticket Issue */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                    Subject / Concern Title
                  </label>
                  <div className="text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                    {selectedTicket.title}
                  </div>
                </div>

                {/* Inbound Email Body / Full Message */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                    Inbound Message Body
                  </label>
                  <div className="text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
                    {selectedTicket.description || (
                      <span className="text-zinc-400 italic">No message body was attached to this ticket.</span>
                    )}
                  </div>
                </div>

                {/* Status & Resolution Section */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col gap-3">
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#13264C]" />
                    <span>Resolver Controls &amp; Status</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">
                        Queue Column / Status
                      </label>
                      <select
                        value={selectedTicketCol}
                        onChange={(e) => setSelectedTicketCol(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-[#13264C]"
                      >
                        {COLUMNS.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">
                        Assigned Resolver
                      </label>
                      {canUserAssignTicket(selectedTicket) ? (
                        <select
                          value={selectedTicketAssigneeId}
                          onChange={(e) => setSelectedTicketAssigneeId(e.target.value)}
                          className="w-full text-xs font-medium bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-[#13264C]"
                        >
                          <option value="">Unassigned</option>
                          {getAssignableCoMembers(selectedTicket).map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 truncate">
                          {selectedTicket.assignedToEmployeeName || 'Unassigned'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">
                      Resolution Notes / Resolver Response
                    </label>
                    <textarea
                      rows={2}
                      value={modalResolutionNotes}
                      onChange={(e) => setModalResolutionNotes(e.target.value)}
                      placeholder="Add resolution or troubleshooting notes..."
                      className="w-full text-xs bg-white border border-zinc-200 rounded-lg p-2 text-zinc-800 focus:outline-none focus:border-[#13264C]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalTicket}
                  disabled={modalSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{modalSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
