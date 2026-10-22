import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ServiceDeskView() {
  const { currentPersona } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [queueFilter, setQueueFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New Ticket Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    queue: 'ItInfrastructure',
  });
  const [formSuccess, setFormSuccess] = useState(null);

  // Resolution Modal / Inline prompt
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (queueFilter) params.append('queue', queueFilter);
      if (statusFilter) params.append('status', statusFilter);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest(`/tickets${query}`);
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [queueFilter, statusFilter]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    try {
      await apiRequest('/tickets', {
        method: 'POST',
        body: {
          ...formData,
          createdByEmployeeId: currentPersona.id,
        },
      });
      setFormSuccess(`Ticket "${formData.title}" submitted successfully.`);
      setFormData({
        title: '',
        description: '',
        queue: 'ItInfrastructure',
      });
      fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (ticketId, nextStatus, notes = null) => {
    try {
      await apiRequest(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: {
          status: nextStatus,
          assignedToEmployeeId: currentPersona.id,
          resolutionNotes: notes,
        },
      });
      setResolvingTicketId(null);
      setResolutionNotes('');
      fetchTickets();
    } catch (err) {
      alert(`Error updating ticket status: ${err.message}`);
    }
  };

  const handleConfirmResolution = (ticketId) => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes before marking the ticket as Resolved.');
      return;
    }
    handleUpdateStatus(ticketId, 'Resolved', resolutionNotes.trim());
  };

  return (
    <section>
      <h2>Operational Service Desk & Helpdesk Queues</h2>
      <p>
        Routing internal IT infrastructure (hardware/VPN) and HR/Legal (COE, HMO, statutory contributions) tickets.
      </p>

      {/* Filter Bar */}
      <fieldset>
        <legend>Queue & Status Filters</legend>
        <label htmlFor="queueFilter">Queue: </label>
        <select
          id="queueFilter"
          value={queueFilter}
          onChange={(e) => setQueueFilter(e.target.value)}
        >
          <option value="">All Queues</option>
          <option value="ItInfrastructure">IT Infrastructure (Hardware, VPN, Workstations)</option>
          <option value="HrLegal">HR & Legal (COE, HMO, Statutory Benefits)</option>
        </select>
        {' | '}

        <label htmlFor="statusFilter">Status: </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="InProgress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        {' '}
        <button type="button" onClick={() => { setQueueFilter(''); setStatusFilter(''); }}>
          Reset Filters
        </button>
      </fieldset>

      <br />

      {loading && <p>Loading service desk tickets...</p>}
      {error && <p><strong>Error:</strong> {error}</p>}

      {/* Tickets Table */}
      {!loading && (
        <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Queue</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Assigned Resolver</th>
              <th>Resolution Notes</th>
              <th>Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="9" align="center">No tickets found in this queue.</td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>
                    <strong>
                      {t.queue === 'ItInfrastructure' ? 'IT / Infra' : 'HR / Legal'}
                    </strong>
                  </td>
                  <td><strong>{t.title}</strong></td>
                  <td>{t.description}</td>
                  <td>
                    <em>{t.status}</em>
                  </td>
                  <td>{t.createdByEmployeeName}</td>
                  <td>{t.assignedToEmployeeName || <em>Unassigned</em>}</td>
                  <td>{t.resolutionNotes || '-'}</td>
                  <td>
                    {t.status === 'Open' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t.id, 'InProgress')}
                      >
                        Start Progress
                      </button>
                    )}

                    {t.status === 'InProgress' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setResolvingTicketId(resolvingTicketId === t.id ? null : t.id)}
                        >
                          {resolvingTicketId === t.id ? 'Cancel' : 'Resolve Ticket'}
                        </button>
                      </>
                    )}

                    {t.status === 'Resolved' && (
                      <span>Resolved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Inline Resolution Box */}
      {resolvingTicketId && (
        <>
          <br />
          <fieldset>
            <legend>Resolve Ticket #{resolvingTicketId}</legend>
            <p>
              <label htmlFor="resolutionNotes">Resolution Documentation: </label>
              <br />
              <textarea
                id="resolutionNotes"
                rows="3"
                cols="50"
                placeholder="Explain what steps were taken to resolve this request..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </p>
            <button type="button" onClick={() => handleConfirmResolution(resolvingTicketId)}>
              Confirm & Mark Resolved
            </button>
            {' '}
            <button type="button" onClick={() => { setResolvingTicketId(null); setResolutionNotes(''); }}>
              Cancel
            </button>
          </fieldset>
        </>
      )}

      {/* Submit Ticket Form */}
      <br />
      <details open>
        <summary><strong>+ Submit New Support Ticket</strong></summary>
        <form onSubmit={handleCreateTicket}>
          <fieldset>
            <legend>Ticket Submission (Submitting as: {currentPersona.name})</legend>
            {formSuccess && <p><strong>Success:</strong> {formSuccess}</p>}

            <p>
              <label htmlFor="queue">Select Queue: </label>
              <br />
              <select
                id="queue"
                name="queue"
                value={formData.queue}
                onChange={handleFormChange}
              >
                <option value="ItInfrastructure">IT Infrastructure (Hardware, VPN, Software Licenses)</option>
                <option value="HrLegal">HR & Legal (COE, HMO, Leaves, Statutory Contributions)</option>
              </select>
            </p>

            <p>
              <label htmlFor="title">Summary / Subject: </label>
              <br />
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Request Certificate of Employment for bank verification"
                style={{ width: '350px' }}
                value={formData.title}
                onChange={handleFormChange}
              />
            </p>

            <p>
              <label htmlFor="description">Detailed Description: </label>
              <br />
              <textarea
                id="description"
                name="description"
                rows="4"
                cols="50"
                required
                placeholder="Provide details, deadline, or relevant links..."
                value={formData.description}
                onChange={handleFormChange}
              />
            </p>

            <button type="submit">Submit Ticket</button>
          </fieldset>
        </form>
      </details>
    </section>
  );
}
