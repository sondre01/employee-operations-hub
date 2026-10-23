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

  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'add'

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
      setActiveTab('calendar');
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Cross-Border Dual Calendar (Philippines &amp; Denmark)</h2>

        {/* Sub-tabs to eliminate vertical scrolling */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'calendar' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'calendar' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'calendar' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            🗓️ Cross-Border Holidays ({holidays.length})
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeTab === 'add' ? 600 : 400,
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'add' ? '2px solid #0366d6' : '2px solid transparent',
                color: activeTab === 'add' ? '#0366d6' : '#586069',
                cursor: 'pointer'
              }}
            >
              ➕ Register Holiday (Admin/HR)
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

        {/* Tab 1: Calendar Table & Filters */}
        {activeTab === 'calendar' && (
          <div>
            <fieldset style={{ marginBottom: '16px' }}>
              <legend>Calendar Filters</legend>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label htmlFor="countryFilter">Country: </label>
                  <select
                    id="countryFilter"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                  >
                    <option value="">Both (Philippines &amp; Denmark)</option>
                    <option value="Philippines">Philippines Only</option>
                    <option value="Denmark">Denmark Only</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="yearFilter">Year: </label>
                  <select
                    id="yearFilter"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {loading && <p>Loading dual calendar...</p>}
            {error && <p><strong>Error:</strong> {error}</p>}

            {!loading && (
              <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Country</th>
                    <th>Holiday Name</th>
                    <th>Operational Working Status</th>
                    <th>Cross-Border Impact &amp; Notes</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} align="center" style={{ padding: '24px' }}>No holiday records found.</td>
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
                              <button type="button" onClick={() => handleDeleteHoliday(h.id, h.title)} style={{ fontSize: '11px', color: '#cb2431' }}>
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
          </div>
        )}

        {/* Tab 2: Register Holiday Form */}
        {activeTab === 'add' && isAdmin && (
          <fieldset style={{ margin: 0 }}>
            <legend>Register Cross-Border Holiday</legend>
            <form onSubmit={handleCreateHoliday} style={{ marginTop: '8px' }}>
              <p>
                <label htmlFor="holidayTitle">Holiday Name: </label>
                <br />
                <input
                  id="holidayTitle"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. National Heroes Day"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={formData.title}
                  onChange={handleFormChange}
                />
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <p>
                  <label htmlFor="holidayDate">Date: </label>
                  <br />
                  <input
                    id="holidayDate"
                    name="holidayDate"
                    type="date"
                    required
                    style={{ width: '100%' }}
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
                    style={{ width: '100%' }}
                    value={formData.country}
                    onChange={handleFormChange}
                  >
                    <option value="Philippines">Philippines</option>
                    <option value="Denmark">Denmark</option>
                  </select>
                </p>
              </div>

              <p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    name="isWorkingDay"
                    type="checkbox"
                    checked={formData.isWorkingDay}
                    onChange={handleFormChange}
                  />
                  <span>Is this a special working day? (Leave unchecked for standard holidays)</span>
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
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit">Save Holiday</button>
                <button type="button" onClick={() => setActiveTab('calendar')}>Cancel</button>
              </div>
            </form>
          </fieldset>
        )}
      </div>
    </div>
  );
}
