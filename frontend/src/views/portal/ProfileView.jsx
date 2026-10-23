import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ProfileView() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('employment'); // 'employment' | 'hardware' | 'tickets'

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest(`/employees/${currentUser.id}`);
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser.id]);

  if (loading) return <p>Loading employee profile...</p>;
  if (error) return <p><strong>Error:</strong> {error}</p>;
  if (!profile) return null;

  const hardwareCount = profile.hardwareItems?.length || 0;
  const ticketCount = profile.recentTickets?.length || 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Employee Profile &amp; Summary</h2>

        {/* Sub-tabs to eliminate vertical scrolling */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('employment')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'employment' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'employment' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'employment' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            👤 Employment Information
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'hardware' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'hardware' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'hardware' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            💻 Hardware Custody ({hardwareCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'tickets' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'tickets' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'tickets' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            🎫 Recent Support Requests ({ticketCount})
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Employment Information Tab */}
        {activeTab === 'employment' && (
          <fieldset style={{ margin: 0 }}>
            <legend>Employment Details</legend>
            <table style={{ margin: 0, width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '220px', fontWeight: '600' }}>Full Name:</td>
                  <td>{profile.fullName}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Work Email:</td>
                  <td><code>{profile.workEmail}</code></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Job Title:</td>
                  <td>{profile.jobTitle}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Employment Classification:</td>
                  <td>
                    <span style={{ fontWeight: '600', color: currentUser.isInternal ? '#0369a1' : '#15803d' }}>
                      {currentUser.isInternal ? '🏢 Internal Core Staff' : '🌍 External Client-Dedicated'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Assigned Department:</td>
                  <td>{currentUser.departmentName || 'Not Assigned / External Team'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Client Assignment:</td>
                  <td>{profile.clientName || 'Internal Company Operations (Core Hub)'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Primary Tech Stack:</td>
                  <td>{profile.primaryTechStack || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Ticketing Operator Role:</td>
                  <td><code>{currentUser.ticketingRole}</code> {currentUser.hasTicketingAccess ? ' (Permitted Operator)' : ' (Standard Employee)'}</td>
                </tr>
              </tbody>
            </table>
          </fieldset>
        )}

        {/* Hardware Custody Tab */}
        {activeTab === 'hardware' && (
          <fieldset style={{ margin: 0 }}>
            <legend>Company Hardware Custody ({hardwareCount} Assets)</legend>
            {hardwareCount === 0 ? (
              <p style={{ margin: 0, color: '#64748b' }}>No company hardware currently registered under your custody.</p>
            ) : (
              <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Device / Model</th>
                    <th>Serial Number</th>
                    <th>Assigned Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.hardwareItems.map((item) => (
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
          </fieldset>
        )}

        {/* Recent Tickets Tab */}
        {activeTab === 'tickets' && (
          <fieldset style={{ margin: 0 }}>
            <legend>Recent Support Tickets ({ticketCount})</legend>
            {ticketCount === 0 ? (
              <p style={{ margin: 0, color: '#64748b' }}>You have not raised any support requests yet.</p>
            ) : (
              <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Priority</th>
                    <th>Subject</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recentTickets.map((t) => (
                    <tr key={t.id}>
                      <td><strong>#{t.id}</strong></td>
                      <td>
                        <span style={{
                          fontWeight: '600',
                          color: t.priority === 'Urgent' ? '#b91c1c' : t.priority === 'High' ? '#c2410c' : '#334155'
                        }}>
                          {t.priority}
                        </span>
                      </td>
                      <td>{t.title}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </fieldset>
        )}
      </div>
    </div>
  );
}
