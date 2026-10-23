import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function DepartmentManagementView() {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Department Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/departments');
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await apiRequest('/departments', {
        method: 'POST',
        body: { name, description },
      });
      setFormSuccess(`Department "${name}" created successfully!`);
      setName('');
      setDescription('');
      setActiveTab('list');
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = currentUser.ticketingRole === 'SuperAdmin';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Department Management</h2>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'list' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'list' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'list' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            🏢 Registered Departments ({departments.length})
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === 'create' ? 600 : 400,
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'create' ? '2px solid #0366d6' : '2px solid transparent',
                color: activeTab === 'create' ? '#0366d6' : '#586069',
                cursor: 'pointer'
              }}
            >
              ➕ Register New Department
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

        {/* Tab 1: Departments Table */}
        {activeTab === 'list' && (
          <div>
            {loading && <p>Loading departments...</p>}
            {error && <p><strong>Error:</strong> {error}</p>}

            {!loading && (
              <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Department Name</th>
                    <th>Scope &amp; Description</th>
                    <th>Staff Members</th>
                    <th>Total Tickets Filed</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id}>
                      <td><strong>#{d.id}</strong></td>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.description}</td>
                      <td>{d.memberCount} employee(s)</td>
                      <td>{d.ticketCount} ticket(s)</td>
                      <td>{new Date(d.createdAtUtc).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Create Department Form (Super Admin Only) */}
        {activeTab === 'create' && isSuperAdmin && (
          <fieldset style={{ margin: 0 }}>
            <legend>Register New Company Department</legend>
            <form onSubmit={handleCreateDepartment} style={{ marginTop: '8px' }}>
              <p>
                <label htmlFor="deptName">Department Name:</label>
                <br />
                <input
                  id="deptName"
                  type="text"
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="e.g. Legal & Compliance or Cloud Security"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </p>

              <p>
                <label htmlFor="deptDesc">Description &amp; Scope:</label>
                <br />
                <input
                  id="deptDesc"
                  type="text"
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="e.g. Handles contract reviews, NDA tracking, and statutory licensing."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Register Department'}
                </button>
                <button type="button" onClick={() => setActiveTab('list')}>
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
