import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AccessControlView() {
  const { currentUser, isSuperAdmin, canAssignEmployees } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [editingEmp, setEditingEmp] = useState(null);
  const [formIsInternal, setFormIsInternal] = useState(false);
  const [formDeptId, setFormDeptId] = useState('');
  const [formRole, setFormRole] = useState('None');
  const [formHasAccess, setFormHasAccess] = useState(false);
  const [formCanAssign, setFormCanAssign] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch('http://localhost:5000/api/access/employees'),
        fetch('http://localhost:5000/api/departments')
      ]);

      if (!empRes.ok) throw new Error('Failed to load employee access roster');
      if (!deptRes.ok) throw new Error('Failed to load departments');

      const empData = await empRes.json();
      const deptData = await deptRes.json();
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (emp) => {
    setEditingEmp(emp);
    setFormIsInternal(emp.isInternal || false);
    setFormDeptId(emp.departmentId || '');
    setFormRole(emp.ticketingRole || 'None');
    setFormHasAccess(emp.hasTicketingAccess || false);
    setFormCanAssign(emp.canAssignEmployees || false);
    setSuccess('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        isInternal: formIsInternal,
        departmentId: formDeptId ? parseInt(formDeptId) : null,
        ticketingRole: formRole,
        hasTicketingAccess: formHasAccess,
        canAssignEmployees: formCanAssign
      };

      const res = await fetch(`http://localhost:5000/api/access/${editingEmp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update employee access');
      }

      setSuccess(`Permissions updated for ${editingEmp.fullName}`);
      setEditingEmp(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading employee RBAC roster...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Access Control & RBAC Management</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>
            Configure internal department assignments, operational ticketing access, and permission delegation.
          </p>
        </div>
        <button className="btn" onClick={loadData}>Refresh Roster</button>
      </div>

      {error && <div className="card" style={{ backgroundColor: '#ffeef0', borderColor: '#f97583', color: '#86181d', marginBottom: '12px' }}>{error}</div>}
      {success && <div className="card" style={{ backgroundColor: '#dcffe4', borderColor: '#56d364', color: '#165c26', marginBottom: '12px' }}>{success}</div>}

      {/* Editing Form Modal / Inline Box */}
      {editingEmp && (
        <div className="card" style={{ backgroundColor: '#fafbfc', border: '2px solid #0366d6', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>
            Modify Access: {editingEmp.fullName} ({editingEmp.workEmail})
          </h3>
          <p style={{ fontSize: '12px', color: '#586069' }}>
            Role in Organization: <strong>{editingEmp.jobTitle}</strong> | Type: <strong>{editingEmp.isInternal ? 'Internal' : 'External Client-Dedicated'}</strong>
          </p>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Employment Classification:
                </label>
                <select
                  value={formIsInternal ? 'internal' : 'external'}
                  onChange={(e) => {
                    const isInt = e.target.value === 'internal';
                    setFormIsInternal(isInt);
                    if (!isInt) {
                      setFormDeptId('');
                      setFormHasAccess(false);
                      setFormRole('None');
                    }
                  }}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <option value="external">External (Client-Dedicated)</option>
                  <option value="internal">Internal Core Staff (Company Operations)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Assigned Department:
                </label>
                <select
                  value={formDeptId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormDeptId(val);
                    if (val) {
                      setFormIsInternal(true);
                    }
                  }}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <option value="">-- No Department Assigned --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Ticketing System Role:
                </label>
                <select
                  value={formRole}
                  onChange={(e) => {
                    const r = e.target.value;
                    setFormRole(r);
                    if (r !== 'None') {
                      setFormHasAccess(true);
                    }
                  }}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <option value="None">None (Standard Employee Only)</option>
                  <option value="DepartmentMember">Department Member (Queue Resolver)</option>
                  <option value="DepartmentManager">Department Manager (Team Lead)</option>
                  <option value="DevOpsAdmin">DevOps Member (Queue Admin)</option>
                  {isSuperAdmin && <option value="SuperAdmin">Super Admin (DevOps Manager - Full System)</option>}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formHasAccess}
                    onChange={(e) => setFormHasAccess(e.target.checked)}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Grant Ticketing Desk Access</span>
                </label>

                {isSuperAdmin && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formCanAssign}
                      onChange={(e) => setFormCanAssign(e.target.checked)}
                    />
                    <span style={{ fontSize: '13px', color: '#0366d6', fontWeight: 600 }}>Allow Employee RBAC Delegation</span>
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
              <button type="button" className="btn" onClick={() => setEditingEmp(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Employee Name & Email</th>
              <th>Class</th>
              <th>Company Role</th>
              <th>Department</th>
              <th>Ticketing Role</th>
              <th>Desk Access</th>
              <th>Delegation Perm</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <strong>{emp.fullName}</strong>
                  <div style={{ fontSize: '11px', color: '#666' }}>{emp.workEmail}</div>
                </td>
                <td>
                  <span className={`badge ${emp.isInternal ? 'badge-internal' : 'badge-external'}`}>
                    {emp.isInternal ? 'Internal' : 'External'}
                  </span>
                </td>
                <td style={{ fontSize: '12px' }}>{emp.jobTitle}</td>
                <td>
                  {emp.departmentName ? (
                    <span style={{ fontWeight: 600 }}>{emp.departmentName}</span>
                  ) : (
                    <span style={{ color: '#999' }}>None</span>
                  )}
                </td>
                <td>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: emp.ticketingRole === 'SuperAdmin' ? '#f1e05a' : emp.ticketingRole === 'DevOpsAdmin' ? '#cbe8ff' : '#e1e4e8',
                    color: '#24292e'
                  }}>
                    {emp.ticketingRole}
                  </span>
                </td>
                <td>
                  {emp.hasTicketingAccess ? (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Permitted</span>
                  ) : (
                    <span style={{ color: '#cb2431' }}>✗ Denied</span>
                  )}
                </td>
                <td>
                  {emp.canAssignEmployees ? (
                    <span style={{ color: '#0366d6', fontWeight: 600 }}>Can Assign</span>
                  ) : (
                    <span style={{ color: '#999' }}>No</span>
                  )}
                </td>
                <td>
                  {(isSuperAdmin || canAssignEmployees) && (
                    <button
                      className="btn"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => handleEditClick(emp)}
                    >
                      Edit Access
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
