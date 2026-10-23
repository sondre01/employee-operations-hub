import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EmployeeDirectoryView() {
  const { currentPersona } = useAuth();
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
    fullName: '',
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
      await apiRequest('/employees', {
        method: 'POST',
        body: formData,
      });
      setFormSuccess(`Successfully onboarded ${formData.fullName}`);
      setFormData({
        fullName: '',
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

  const isDanishLead = currentPersona.role === 'DanishClientLead';
  const isAdmin = currentPersona.role === 'AdminHr';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Employee Directory &amp; Outstaffing Roster</h2>

        {/* Sub-tabs to eliminate vertical scrolling */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'roster' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'roster' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'roster' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            👥 Outstaffing Roster ({employees.length})
          </button>

          {selectedEmployee && (
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === 'detail' ? 600 : 400,
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'detail' ? '2px solid #0366d6' : '2px solid transparent',
                color: activeTab === 'detail' ? '#0366d6' : '#586069',
                cursor: 'pointer'
              }}
            >
              🔍 Profile: {selectedEmployee.fullName}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('onboard')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === 'onboard' ? 600 : 400,
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'onboard' ? '2px solid #0366d6' : '2px solid transparent',
                color: activeTab === 'onboard' ? '#0366d6' : '#586069',
                cursor: 'pointer'
              }}
            >
              ➕ Onboard New Employee
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {formSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{formSuccess}</span>
            <button type="button" onClick={() => setFormSuccess(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#166534', fontWeight: 600 }}>✕</button>
          </div>
        )}

        {/* Tab 1: Directory Roster & Filter */}
        {activeTab === 'roster' && (
          <div>
            <fieldset style={{ marginBottom: '16px' }}>
              <legend>Filters &amp; Search</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label htmlFor="typeFilter">Type: </label>
                  <select
                    id="typeFilter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="InternalCore">Internal Core (Ops / IT / HR)</option>
                    <option value="ClientDedicated">Client Dedicated (External)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="roleFilter">Role: </label>
                  <select
                    id="roleFilter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="AdminHr">Admin / HR</option>
                    <option value="DanishClientLead">Client Lead</option>
                    <option value="Developer">Developer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="clientSearch">Client: </label>
                  <input
                    id="clientSearch"
                    type="text"
                    placeholder="e.g. Acme Solutions"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>

                <button type="button" onClick={() => { setTypeFilter(''); setRoleFilter(''); setClientSearch(''); }}>
                  Reset Filters
                </button>
              </div>
            </fieldset>

            {loading && <p>Loading employee directory...</p>}
            {error && <p><strong>Error:</strong> {error}</p>}

            {!loading && (
              <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Work Email</th>
                    <th>Job Title</th>
                    <th>Classification</th>
                    <th>Assigned Client Org</th>
                    <th>Primary Stack</th>
                    <th>Hardware</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="9" align="center" style={{ padding: '24px' }}>No employees found matching filter criteria.</td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>#{emp.id}</td>
                        <td><strong>{emp.fullName}</strong></td>
                        <td><code>{emp.workEmail}</code></td>
                        <td>{emp.jobTitle}</td>
                        <td>
                          <span className={`badge ${emp.employmentType === 'InternalCore' ? 'badge-internal' : 'badge-external'}`}>
                            {emp.employmentType === 'InternalCore' ? 'Internal Core' : 'Client Dedicated'}
                          </span>
                        </td>
                        <td>{emp.clientName || 'Internal Company Operations'}</td>
                        <td><small>{emp.primaryTechStack || 'N/A'}</small></td>
                        <td>{emp.assignedHardwareCount} item(s)</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleSelectEmployee(emp.id)}
                            style={{ fontSize: '11px', padding: '3px 8px' }}
                          >
                            View Details
                          </button>
                          {isAdmin && (
                            <>
                              {' '}
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                                style={{ fontSize: '11px', padding: '3px 8px', color: '#cb2431' }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Selected Employee Details */}
        {activeTab === 'detail' && selectedEmployee && (
          <fieldset style={{ margin: 0 }}>
            <legend>Profile Details: {selectedEmployee.fullName} (ID: #{selectedEmployee.id})</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div><strong>Job Title:</strong> {selectedEmployee.jobTitle}</div>
              <div><strong>Email:</strong> <code>{selectedEmployee.workEmail}</code></div>
              <div><strong>Classification:</strong> {selectedEmployee.employmentType === 'InternalCore' ? 'Internal Core' : 'Client Dedicated'}</div>
              <div><strong>Client Assignment:</strong> {selectedEmployee.clientName || 'Internal Company Operations'}</div>
              <div><strong>Primary Tech Stack:</strong> {selectedEmployee.primaryTechStack || 'N/A'}</div>
            </div>

            <h4 style={{ margin: '16px 0 8px 0' }}>Hardware Custody Documentation ({selectedEmployee.hardwareItems?.length || 0})</h4>
            {selectedEmployee.hardwareItems?.length === 0 ? (
              <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>No company hardware currently in custody.</p>
            ) : (
              <table border="1" cellPadding="4" cellSpacing="0" style={{ width: '100%', marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Model</th>
                    <th>Serial Number</th>
                    <th>Assigned Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEmployee.hardwareItems.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.assetTag}</strong></td>
                      <td>{item.modelName}</td>
                      <td><code>{item.serialNumber}</code></td>
                      <td>{item.assignedDate}</td>
                      <td>{item.status}</td>
                      <td>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h4 style={{ margin: '16px 0 8px 0' }}>Recent Service Desk Requests ({selectedEmployee.recentTickets?.length || 0})</h4>
            {selectedEmployee.recentTickets?.length === 0 ? (
              <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>No recent tickets filed.</p>
            ) : (
              <table border="1" cellPadding="4" cellSpacing="0" style={{ width: '100%', marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Priority</th>
                    <th>Title</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEmployee.recentTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><strong>#{ticket.id}</strong></td>
                      <td>{ticket.priority}</td>
                      <td>{ticket.title}</td>
                      <td>{ticket.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setActiveTab('roster')}>
                ← Back to Roster
              </button>
              <button type="button" onClick={() => { setSelectedEmployee(null); setActiveTab('roster'); }}>
                Close Inspector
              </button>
            </div>
          </fieldset>
        )}

        {/* Tab 3: Onboard Employee (Admin/HR Only) */}
        {activeTab === 'onboard' && isAdmin && (
          <fieldset style={{ margin: 0 }}>
            <legend>New Employee Details</legend>
            <form onSubmit={handleCreateEmployee} style={{ marginTop: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <p>
                  <label htmlFor="fullName">Full Name: </label>
                  <br />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    style={{ width: '100%' }}
                    value={formData.fullName}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="workEmail">Work Email: </label>
                  <br />
                  <input
                    id="workEmail"
                    name="workEmail"
                    type="email"
                    required
                    style={{ width: '100%' }}
                    value={formData.workEmail}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="jobTitle">Job Title: </label>
                  <br />
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    required
                    style={{ width: '100%' }}
                    value={formData.jobTitle}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="employmentType">Employment Type: </label>
                  <br />
                  <select
                    id="employmentType"
                    name="employmentType"
                    style={{ width: '100%' }}
                    value={formData.employmentType}
                    onChange={handleFormChange}
                  >
                    <option value="ClientDedicated">Client Dedicated</option>
                    <option value="InternalCore">Internal Core</option>
                  </select>
                </p>

                <p>
                  <label htmlFor="role">System Role: </label>
                  <br />
                  <select
                    id="role"
                    name="role"
                    style={{ width: '100%' }}
                    value={formData.role}
                    onChange={handleFormChange}
                  >
                    <option value="Developer">Developer</option>
                    <option value="DanishClientLead">Danish Client Lead</option>
                    <option value="AdminHr">Admin / HR</option>
                  </select>
                </p>

                {formData.employmentType === 'ClientDedicated' && (
                  <p>
                    <label htmlFor="clientName">Danish Client Name: </label>
                    <br />
                    <input
                      id="clientName"
                      name="clientName"
                      type="text"
                      placeholder="e.g. Kobenhavn Tech A/S"
                      style={{ width: '100%' }}
                      value={formData.clientName}
                      onChange={handleFormChange}
                    />
                  </p>
                )}

                <p>
                  <label htmlFor="primaryTechStack">Primary Tech Stack: </label>
                  <br />
                  <input
                    id="primaryTechStack"
                    name="primaryTechStack"
                    type="text"
                    placeholder="e.g. .NET 8, React, PostgreSQL"
                    style={{ width: '100%' }}
                    value={formData.primaryTechStack}
                    onChange={handleFormChange}
                  />
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit">Submit Onboarding Record</button>
                <button type="button" onClick={() => setActiveTab('roster')}>Cancel</button>
              </div>
            </form>
          </fieldset>
        )}
      </div>
    </div>
  );
}
