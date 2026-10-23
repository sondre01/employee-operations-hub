import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Operational Ticket Queue</h2>

        {/* Status Sub-tabs to eliminate scroll clutter */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: statusFilter === '' && !resolvingTicketId ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: statusFilter === '' && !resolvingTicketId ? '2px solid #0366d6' : '2px solid transparent',
              color: statusFilter === '' && !resolvingTicketId ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            📋 All Queue
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('Open'); setResolvingTicketId(null); }}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: statusFilter === 'Open' && !resolvingTicketId ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: statusFilter === 'Open' && !resolvingTicketId ? '2px solid #0366d6' : '2px solid transparent',
              color: statusFilter === 'Open' && !resolvingTicketId ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            🟡 Open Queue
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('InProgress'); setResolvingTicketId(null); }}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: statusFilter === 'InProgress' && !resolvingTicketId ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: statusFilter === 'InProgress' && !resolvingTicketId ? '2px solid #0366d6' : '2px solid transparent',
              color: statusFilter === 'InProgress' && !resolvingTicketId ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            🔵 In Progress
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('Resolved'); setResolvingTicketId(null); }}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: statusFilter === 'Resolved' && !resolvingTicketId ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: statusFilter === 'Resolved' && !resolvingTicketId ? '2px solid #0366d6' : '2px solid transparent',
              color: statusFilter === 'Resolved' && !resolvingTicketId ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            🟢 Resolved
          </button>

          {resolvingTicketId && (
            <button
              type="button"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                borderBottom: '2px solid #166534',
                color: '#166534',
                cursor: 'pointer'
              }}
            >
              ✍️ Resolve Ticket #{resolvingTicketId}
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Additional Filters Bar */}
        <fieldset style={{ marginBottom: '16px' }}>
          <legend>Queue Filters</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div>
              <label htmlFor="deptFilter">Department: </label>
              <select
                id="deptFilter"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id.toString()}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priorityFilter">Priority: </label>
              <select
                id="priorityFilter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
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
            >
              Reset Filters
            </button>
          </div>
        </fieldset>

        {/* Resolution documentation tab view */}
        {resolvingTicketId && (
          <fieldset style={{ background: '#f0fdf4', borderColor: '#86efac', marginBottom: '16px' }}>
            <legend>Documentation for Ticket #{resolvingTicketId}</legend>
            <p>
              <label htmlFor="resolutionNotes">Resolution Documentation (Action taken):</label>
              <br />
              <textarea
                id="resolutionNotes"
                rows="3"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="Detail what was completed to resolve this issue..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </p>
            <button type="button" onClick={() => handleConfirmResolution(resolvingTicketId)}>
              Confirm &amp; Mark Resolved
            </button>{' '}
            <button type="button" onClick={() => { setResolvingTicketId(null); setResolutionNotes(''); }}>
              Cancel
            </button>
          </fieldset>
        )}

        {loading && <p>Loading ticket queue...</p>}
        {error && <p><strong>Error:</strong> {error}</p>}

      {!loading && (
        <table border="1" cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Dept</th>
              <th>Priority</th>
              <th>Title</th>
              <th>Submitted By</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="8" align="center">No tickets found in this queue.</td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id}>
                  <td><strong>#{t.id}</strong></td>
                  <td>{t.departmentName || 'General'}</td>
                  <td>
                    <span style={{
                      fontWeight: '700',
                      color: t.priority === 'Urgent' ? '#b91c1c' : t.priority === 'High' ? '#c2410c' : '#334155'
                    }}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <strong>{t.title}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>{t.description}</small>
                    {t.resolutionNotes && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#166534' }}>
                        <em>Resolution: {t.resolutionNotes}</em>
                      </div>
                    )}
                  </td>
                  <td>{t.createdByEmployeeName}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: t.status === 'Resolved' ? '#dcfce7' : t.status === 'InProgress' ? '#e0f2fe' : '#fef3c7',
                      color: t.status === 'Resolved' ? '#166534' : t.status === 'InProgress' ? '#0369a1' : '#92400e'
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={t.assignedToEmployeeId || ''}
                      onChange={(e) => handleAssignTicket(t.id, e.target.value)}
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.jobTitle})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {t.status === 'Open' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(t.id, 'InProgress')}
                          style={{ fontSize: '11px' }}
                        >
                          Start
                        </button>
                      )}
                      {t.status === 'InProgress' && (
                        <button
                          type="button"
                          onClick={() => setResolvingTicketId(resolvingTicketId === t.id ? null : t.id)}
                          style={{ fontSize: '11px', background: '#166534', color: '#ffffff', borderColor: '#166534' }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
}
