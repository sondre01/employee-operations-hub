import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function HardwareCustodyView() {
  const { currentPersona } = useAuth();
  const [hardwareList, setHardwareList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');

  // New Hardware Item Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    modelName: '',
    serialNumber: '',
    assetTag: '',
    assignedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [formSuccess, setFormSuccess] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter ? `?status=${statusFilter}` : '';
      const [hardware, empList] = await Promise.all([
        apiRequest(`/hardware${statusParam}`),
        apiRequest('/employees'),
      ]);
      setHardwareList(hardware);
      setEmployees(empList);
      if (empList.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: empList[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateHardware = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    try {
      await apiRequest('/hardware', {
        method: 'POST',
        body: {
          ...formData,
          employeeId: parseInt(formData.employeeId, 10),
        },
      });
      setFormSuccess(`Successfully logged custody of ${formData.modelName} (Tag: ${formData.assetTag})`);
      setFormData({
        employeeId: employees[0]?.id || '',
        modelName: '',
        serialNumber: '',
        assetTag: '',
        assignedDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHardware = async (id, assetTag) => {
    if (!window.confirm(`Are you sure you want to delete hardware record ${assetTag}?`)) return;
    try {
      await apiRequest(`/hardware/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(`Error deleting hardware: ${err.message}`);
    }
  };

  const isAdmin = currentPersona.role === 'AdminHr';

  return (
    <section>
      <h2>Hardware Custody & Asset Management</h2>
      <p>
        Tracks laptop models, serial numbers, and IT assets assigned to developers across Manila.
      </p>

      {/* Filter Bar */}
      <fieldset>
        <legend>Filter by Custody Status</legend>
        <label htmlFor="statusFilter">Status: </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="InRepair">In Repair</option>
          <option value="Returned">Returned</option>
        </select>
        {' '}
        <button type="button" onClick={() => setStatusFilter('')}>Reset</button>
      </fieldset>

      <br />

      {loading && <p>Loading hardware inventory...</p>}
      {error && <p><strong>Error:</strong> {error}</p>}

      {/* Hardware Table */}
      {!loading && (
        <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Asset Tag</th>
              <th>Device / Model</th>
              <th>Serial Number</th>
              <th>Assigned Custodian</th>
              <th>Assigned Date</th>
              <th>Status</th>
              <th>Notes</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {hardwareList.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} align="center">No hardware records found.</td>
              </tr>
            ) : (
              hardwareList.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td><strong>{item.assetTag}</strong></td>
                  <td>{item.modelName}</td>
                  <td><code>{item.serialNumber}</code></td>
                  <td>{item.employeeName}</td>
                  <td>{item.assignedDate}</td>
                  <td>{item.status}</td>
                  <td>{item.notes || '-'}</td>
                  {isAdmin && (
                    <td>
                      <button type="button" onClick={() => handleDeleteHardware(item.id, item.assetTag)}>
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Add Hardware Form for Admin/IT */}
      {isAdmin && (
        <>
          <br />
          <details>
            <summary><strong>+ Register & Assign Hardware Item (Admin/IT Only)</strong></summary>
            <form onSubmit={handleCreateHardware}>
              <fieldset>
                <legend>Asset Registration</legend>
                {formSuccess && <p><strong>Success:</strong> {formSuccess}</p>}

                <p>
                  <label htmlFor="employeeId">Assign to Developer / Custodian: </label>
                  <br />
                  <select
                    id="employeeId"
                    name="employeeId"
                    required
                    value={formData.employeeId}
                    onChange={handleFormChange}
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.jobTitle}) - {emp.clientName || 'Internal'}
                      </option>
                    ))}
                  </select>
                </p>

                <p>
                  <label htmlFor="modelName">Device Model: </label>
                  <br />
                  <input
                    id="modelName"
                    name="modelName"
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro 16 M3 Max (36GB RAM)"
                    value={formData.modelName}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="serialNumber">Manufacturer Serial Number: </label>
                  <br />
                  <input
                    id="serialNumber"
                    name="serialNumber"
                    type="text"
                    required
                    placeholder="e.g. C02XYZ12345"
                    value={formData.serialNumber}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="assetTag">Internal Asset Tag: </label>
                  <br />
                  <input
                    id="assetTag"
                    name="assetTag"
                    type="text"
                    required
                    placeholder="e.g. MAL-MBP-2024-099"
                    value={formData.assetTag}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="assignedDate">Assignment Date: </label>
                  <br />
                  <input
                    id="assignedDate"
                    name="assignedDate"
                    type="date"
                    required
                    value={formData.assignedDate}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="notes">Notes / Peripherals: </label>
                  <br />
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    cols="40"
                    placeholder="Includes USB-C charger, Magic Mouse, HDMI adapter"
                    value={formData.notes}
                    onChange={handleFormChange}
                  />
                </p>

                <button type="submit">Save Hardware Custody Record</button>
              </fieldset>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
