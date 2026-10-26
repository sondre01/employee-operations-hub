import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Kanban,
  List,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck
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
      // Fetch access employees and departments
      const [ticketList, accessEmpList, deptList] = await Promise.all([
        apiRequest('/tickets'),
        apiRequest('/access/employees').catch(() => apiRequest('/employees')),
        apiRequest('/departments').catch(() => []),
      ]);

      setTickets(ticketList || []);
      setEmployees((accessEmpList || []).filter((e) => e.isInternal));
      setDepartments(deptList || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
                      /* Ticket Card - Strictly non-scrollable, contains ONLY the 6 requested fields */
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white rounded-xl border border-zinc-200/90 p-3 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all cursor-grab active:cursor-grabbing select-none flex flex-col gap-2 overflow-hidden shrink-0 ${
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

                        {/* 2. Ticket Issue */}
                        <div className="text-xs font-semibold text-zinc-900 leading-snug line-clamp-2">
                          {ticket.title}
                        </div>

                        {/* 3. Person who raised it & 4. Department */}
                        <div className="flex flex-col gap-1 text-[11px] font-medium text-zinc-500">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                              Raised By
                            </span>
                            <span className="text-zinc-700 font-semibold truncate max-w-[140px]">
                              {ticket.createdByEmployeeName || 'Unknown'}
                            </span>
                          </div>
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
                            /* Only department managers can assign to co-members of this specific department */
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
                            /* Regular employee or non-department manager: Clean read-only display */
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
              <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                <thead className="bg-zinc-50/90 sticky top-0 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Ticket ID</th>
                    <th className="py-2.5 px-3.5">Ticket Issue</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Raised By</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Department</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Critical Level</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Assigned Staff</th>
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

                        {/* 2. Ticket Issue */}
                        <td className="py-3 px-3.5 max-w-sm">
                          <span className="font-semibold text-zinc-900">{t.title}</span>
                        </td>

                        {/* 3. Person who raised it */}
                        <td className="py-3 px-3.5 text-zinc-700 whitespace-nowrap">
                          {t.createdByEmployeeName || 'Unknown'}
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
                            /* Only department managers can assign to co-members of this specific department */
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
                            /* Regular employee or non-department manager: Clean read-only display */
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
