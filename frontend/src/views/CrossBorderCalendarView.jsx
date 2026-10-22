import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CrossBorderCalendarView() {
  const { currentPersona } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [countryFilter, setCountryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('2026');

  // New Holiday Form State
  const [formData, setFormData] = useState({
    title: '',
    holidayDate: '2026-05-01',
    country: 'Philippines',
    isWorkingDay: false,
    notes: '',
  });
  const [formSuccess, setFormSuccess] = useState(null);

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.append('year', yearFilter);
      if (countryFilter) params.append('country', countryFilter);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest(`/holidays${query}`);
      setHolidays(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [countryFilter, yearFilter]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    try {
      await apiRequest('/holidays', {
        method: 'POST',
        body: formData,
      });
      setFormSuccess(`Added holiday "${formData.title}" to calendar.`);
      setFormData({
        title: '',
        holidayDate: '2026-05-01',
        country: 'Philippines',
        isWorkingDay: false,
        notes: '',
      });
      fetchHolidays();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteHoliday = async (id, title) => {
    if (!window.confirm(`Delete holiday "${title}"?`)) return;
    try {
      await apiRequest(`/holidays/${id}`, { method: 'DELETE' });
      fetchHolidays();
    } catch (err) {
      alert(`Error deleting holiday: ${err.message}`);
    }
  };

  const isAdmin = currentPersona.role === 'AdminHr';

  return (
    <section>
      <h2>Cross-Border Dual Calendar (Philippines & Denmark)</h2>
      <p>
        Aligns Manila engineering operations (UTC+8) with Danish client leadership (UTC+1/+2).
        Helps client leads and developers anticipate office closures and team availability.
      </p>

      {/* Filter Bar */}
      <fieldset>
        <legend>Calendar Filters</legend>
        <label htmlFor="countryFilter">Country: </label>
        <select
          id="countryFilter"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option value="">Both (Philippines & Denmark)</option>
          <option value="Philippines">Philippines Only</option>
          <option value="Denmark">Denmark Only</option>
        </select>
        {' | '}

        <label htmlFor="yearFilter">Year: </label>
        <select
          id="yearFilter"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
      </fieldset>

      <br />

      {loading && <p>Loading dual calendar...</p>}
      {error && <p><strong>Error:</strong> {error}</p>}

      {/* Holiday Table */}
      {!loading && (
        <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Country</th>
              <th>Holiday Name</th>
              <th>Operational Working Status</th>
              <th>Cross-Border Impact & Notes</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} align="center">No holiday records found.</td>
              </tr>
            ) : (
              holidays.map((h) => {
                const isPH = h.country === 'Philippines';
                const operationalImpact = isPH
                  ? 'Manila Hub Closed (PH Non-Working Day) — Danish Clients Operating'
                  : 'Danish Client Closed — Manila Developers Operating Normally';

                return (
                  <tr key={h.id}>
                    <td><strong>{h.holidayDate}</strong></td>
                    <td>
                      {isPH ? '🇵🇭 Philippines' : '🇩🇰 Denmark'}
                    </td>
                    <td>{h.title}</td>
                    <td>
                      {h.isWorkingDay ? 'Working Day' : 'Office Closed (Non-Working)'}
                    </td>
                    <td>
                      {h.notes || operationalImpact}
                    </td>
                    {isAdmin && (
                      <td>
                        <button type="button" onClick={() => handleDeleteHoliday(h.id, h.title)}>
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {/* Add Holiday Form for Admin/HR */}
      {isAdmin && (
        <>
          <br />
          <details>
            <summary><strong>+ Add Cross-Border Holiday (Admin/HR Only)</strong></summary>
            <form onSubmit={handleCreateHoliday}>
              <fieldset>
                <legend>Register Holiday</legend>
                {formSuccess && <p><strong>Success:</strong> {formSuccess}</p>}

                <p>
                  <label htmlFor="holidayTitle">Holiday Name: </label>
                  <br />
                  <input
                    id="holidayTitle"
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. National Heroes Day"
                    value={formData.title}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="holidayDate">Date: </label>
                  <br />
                  <input
                    id="holidayDate"
                    name="holidayDate"
                    type="date"
                    required
                    value={formData.holidayDate}
                    onChange={handleFormChange}
                  />
                </p>

                <p>
                  <label htmlFor="country">Country: </label>
                  <br />
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleFormChange}
                  >
                    <option value="Philippines">Philippines</option>
                    <option value="Denmark">Denmark</option>
                  </select>
                </p>

                <p>
                  <label>
                    <input
                      name="isWorkingDay"
                      type="checkbox"
                      checked={formData.isWorkingDay}
                      onChange={handleFormChange}
                    />
                    {' '}Is this a special working day? (Leave unchecked for standard holidays)
                  </label>
                </p>

                <p>
                  <label htmlFor="holidayNotes">Operational Notes: </label>
                  <br />
                  <input
                    id="holidayNotes"
                    name="notes"
                    type="text"
                    placeholder="e.g. Regular Holiday under DOLE proclamation"
                    style={{ width: '350px' }}
                    value={formData.notes}
                    onChange={handleFormChange}
                  />
                </p>

                <button type="submit">Save Holiday</button>
              </fieldset>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
