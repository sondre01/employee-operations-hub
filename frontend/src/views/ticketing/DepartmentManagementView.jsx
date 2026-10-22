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
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = currentUser.ticketingRole === 'SuperAdmin';

  return (
    <div>
      <h2>Department Management</h2>
      <p>Configure operational queues and teams for ticketing routing and access scoping.</p>

      {/* Add Department Form (Super Admin only) */}
      {isSuperAdmin && (
        <fieldset style={{ marginBottom: '24px' }}>
          <legend>+ Add New Company Department (Super Admin Only)</legend>
          {formSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px' }}>
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateDepartment}>
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
              <label htmlFor="deptDesc">Description & Scope:</label>
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

            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Register Department'}
            </button>
          </form>
        </fieldset>
      )}

      {/* Departments Table */}
      <h3>Registered Departments ({departments.length})</h3>

      {loading && <p>Loading departments...</p>}
      {error && <p><strong>Error:</strong> {error}</p>}

      {!loading && (
        <table border="1" cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department Name</th>
              <th>Scope & Description</th>
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
  );
}
