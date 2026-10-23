import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function MyTicketsView() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departmentId: '',
    priority: 'Medium',
  });
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'raise'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketList, deptList] = await Promise.all([
        apiRequest(`/tickets?createdByEmployeeId=${currentUser.id}`),
        apiRequest('/departments'),
      ]);
      setTickets(ticketList);
      setDepartments(deptList);
      if (deptList.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptList[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await apiRequest('/tickets', {
        method: 'POST',
        body: {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
          queue: 1,
          createdByEmployeeId: currentUser.id,
        },
      });

      setFormSuccess(`Ticket "${formData.title}" submitted successfully!`);
      setFormData({
        title: '',
        description: '',
        departmentId: departments[0]?.id || '',
        priority: 'Medium',
      });
      setActiveTab('history');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>My Support Tickets</h2>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'history' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'history' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            📋 Submitted Tickets ({tickets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raise')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'raise' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'raise' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'raise' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            ➕ Raise Support Ticket
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {formSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{formSuccess}</span>
            <button type="button" onClick={() => setFormSuccess(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#166534', fontWeight: 600 }}>✕</button>
          </div>
        )}

        {/* Tab 1: Ticket History Table */}
        {activeTab === 'history' && (
          <div>
            {loading && <p>Loading your tickets...</p>}
            {error && <p><strong>Error:</strong> {error}</p>}

            {!loading && (
              <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Assigned Operator</th>
                    <th>Resolution Notes</th>
                    <th>Date Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="9" align="center" style={{ padding: '24px' }}>
                        You have not submitted any tickets yet.{' '}
                        <button type="button" onClick={() => setActiveTab('raise')} style={{ marginLeft: '8px' }}>
                          + Raise Your First Ticket
                        </button>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.id}>
                        <td><strong>#{t.id}</strong></td>
                        <td>{t.departmentName || 'General'}</td>
                        <td>
                          <span style={{
                            fontWeight: '600',
                            color: t.priority === 'Urgent' ? '#b91c1c' : t.priority === 'High' ? '#c2410c' : '#334155'
                          }}>
                            {t.priority}
                          </span>
                        </td>
                        <td><strong>{t.title}</strong></td>
                        <td>{t.description}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: t.status === 'Resolved' ? '#dcfce7' : t.status === 'InProgress' ? '#e0f2fe' : '#fef3c7',
                            color: t.status === 'Resolved' ? '#166534' : t.status === 'InProgress' ? '#0369a1' : '#92400e'
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td>{t.assignedToEmployeeName || <em>Unassigned</em>}</td>
                        <td>{t.resolutionNotes || '-'}</td>
                        <td>{new Date(t.createdAtUtc).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Raise New Ticket Form */}
        {activeTab === 'raise' && (
          <fieldset style={{ margin: 0 }}>
            <legend>New Support Ticket Submission</legend>
            <form onSubmit={handleCreateTicket} style={{ marginTop: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', width: '100%' }}>
                <p>
                  <label htmlFor="departmentId">Target Department Queue:</label>
                  <br />
                  <select
                    id="departmentId"
                    name="departmentId"
                    required
                    style={{ width: '100%' }}
                    value={formData.departmentId}
                    onChange={handleFormChange}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.description}
                      </option>
                    ))}
                  </select>
                </p>

                <p>
                  <label htmlFor="priority">Urgency / Priority:</label>
                  <br />
                  <select
                    id="priority"
                    name="priority"
                    style={{ width: '100%' }}
                    value={formData.priority}
                    onChange={handleFormChange}
                  >
                    <option value="Low">Low (Informational / Inquiry)</option>
                    <option value="Medium">Medium (Standard Request)</option>
                    <option value="High">High (Impacting Client Deliverables)</option>
                    <option value="Urgent">Urgent (Production / Workstation Blocker)</option>
                  </select>
                </p>
              </div>

              <p style={{ width: '100%' }}>
                <label htmlFor="title">Summary / Subject:</label>
                <br />
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  style={{ width: '100%' }}
                  placeholder="e.g. Request Certificate of Employment (COE) for Pag-IBIG loan"
                  value={formData.title}
                  onChange={handleFormChange}
                />
              </p>

              <p style={{ width: '100%' }}>
                <label htmlFor="description">Details & Explanation:</label>
                <br />
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  required
                  style={{ width: '100%' }}
                  placeholder="Include deadline, specific requirements, or error details..."
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
                <button type="button" onClick={() => setActiveTab('history')}>
                  Cancel
                </button>
              </div>
            </form>
          </fieldset>
        )}
      </div>
    </div>
  );
}
