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
    if (selectedEmployee && selectedEmployee.id === id) {
      setSelectedEmployee(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const detail = await apiRequest(`/employees/${id}`);
      setSelectedEmployee(detail);
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
      if (selectedEmployee?.id === id) setSelectedEmployee(null);
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
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  const isDanishLead = currentPersona.role === 'DanishClientLead';
  const isAdmin = currentPersona.role === 'AdminHr';

  return (
    <section>
      <h2>Employee Directory & Outstaffing Roster</h2>
      <p>
        Tracks internal operations talent and Danish client-dedicated engineers in Manila.
      </p>

      {/* Filter Bar */}
      <fieldset>
        <legend>Filters & Search</legend>
        <div>
          <label htmlFor="typeFilter">Employment Type: </label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="InternalCore">Internal Core (Ops / IT / HR)</option>
            <option value="ClientDedicated">Client Dedicated (Danish Accounts)</option>
          </select>
          {' | '}

          <label htmlFor="roleFilter">Role: </label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="AdminHr">Admin / HR</option>
            <option value="DanishClientLead">Danish Client Lead</option>
            <option value="Developer">Developer</option>
          </select>
          {' | '}

          <label htmlFor="clientSearch">Client Name: </label>
          <input
            id="clientSearch"
            type="text"
            placeholder="e.g. Kobenhavn Tech"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
          {' '}
          <button type="button" onClick={() => { setTypeFilter(''); setRoleFilter(''); setClientSearch(''); }}>
            Reset Filters
          </button>
        </div>
      </fieldset>

      <br />

      {/* Status Messages */}
      {loading && <p>Loading employee directory...</p>}
      {error && <p><strong>Error:</strong> {error}</p>}

      {/* Employee Table */}
      {!loading && (
        <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Work Email</th>
              <th>Job Title</th>
              <th>Employment Type</th>
              <th>Assigned Danish Client</th>
              <th>Primary Tech Stack</th>
              <th>Assigned Hardware</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="10" align="center">No employees found matching filter criteria.</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td><strong>{emp.fullName}</strong></td>
                  <td>{emp.workEmail}</td>
                  <td>{emp.jobTitle}</td>
                  <td>
                    {emp.employmentType === 'InternalCore' ? 'Internal Core' : 'Client Dedicated'}
                  </td>
                  <td>{emp.clientName || 'Malayo Hub (Internal)'}</td>
                  <td>{emp.primaryTechStack || 'N/A'}</td>
                  <td>{emp.assignedHardwareCount} item(s)</td>
                  <td>{emp.role}</td>
                  <td>
                    <button type="button" onClick={() => handleSelectEmployee(emp.id)}>
                      {selectedEmployee?.id === emp.id ? 'Close Details' : 'View Profile'}
                    </button>
                    {isAdmin && (
                      <>
                        {' '}
                        <button type="button" onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}>
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

      {/* Selected Employee Detailed Profile */}
      {selectedEmployee && (
        <>
          <br />
          <fieldset>
            <legend>Profile Details: {selectedEmployee.fullName} (ID: #{selectedEmployee.id})</legend>
            <p><strong>Job Title:</strong> {selectedEmployee.jobTitle}</p>
            <p><strong>Email:</strong> {selectedEmployee.workEmail}</p>
            <p><strong>Employment Type:</strong> {selectedEmployee.employmentType}</p>
            <p><strong>Client Assignment:</strong> {selectedEmployee.clientName || 'Internal Hub'}</p>
            <p><strong>Primary Tech Stack:</strong> {selectedEmployee.primaryTechStack}</p>
            
            <h4>Hardware Custody Documentation ({selectedEmployee.hardwareItems?.length || 0})</h4>
            {selectedEmployee.hardwareItems?.length === 0 ? (
              <p>No company hardware currently in custody.</p>
            ) : (
              <table border="1" cellPadding="4" cellSpacing="0">
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
                      <td>{item.assetTag}</td>
                      <td>{item.modelName}</td>
                      <td>{item.serialNumber}</td>
                      <td>{item.assignedDate}</td>
                      <td>{item.status}</td>
                      <td>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h4>Recent Service Desk Requests ({selectedEmployee.recentTickets?.length || 0})</h4>
            {selectedEmployee.recentTickets?.length === 0 ? (
              <p>No recent tickets filed.</p>
            ) : (
              <ul>
                {selectedEmployee.recentTickets.map((ticket) => (
                  <li key={ticket.id}>
                    <strong>#{ticket.id} [{ticket.queue}]:</strong> {ticket.title} — <em>{ticket.status}</em>
                  </li>
                ))}
              </ul>
            )}
            <br />
            <button type="button" onClick={() => setSelectedEmployee(null)}>Close Profile View</button>
          </fieldset>
        </>
      )}

      {/* Onboard Form for Admin/HR */}
      {isAdmin && (
        <>
          <br />
          <details>
            <summary><strong>+ Onboard New Employee (Admin/HR Only)</strong></summary>
            <form onSubmit={handleCreateEmployee}>
              <fieldset>
                <legend>New Employee Details</legend>
                {formSuccess && <p><strong>Success:</strong> {formSuccess}</p>}
                
                <p>
                  <label htmlFor="fullName">Full Name: </label>
                  <br />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
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
                    value={formData.primaryTechStack}
                    onChange={handleFormChange}
                  />
                </p>

                <button type="submit">Submit Onboarding Record</button>
              </fieldset>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
