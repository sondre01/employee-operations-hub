import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ProfileView() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div>
      <h2>Employee Profile & Summary</h2>
      <p>Personal employment profile, cross-border assignment, and hardware custody documentation.</p>

      {/* Main Profile Card */}
      <fieldset style={{ marginBottom: '16px' }}>
        <legend>Employment Information</legend>
        <table style={{ margin: 0 }}>
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

      {/* Hardware Custody Card */}
      <fieldset style={{ marginBottom: '16px' }}>
        <legend>Company Hardware Custody ({profile.hardwareItems?.length || 0} Assets)</legend>
        {profile.hardwareItems?.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>No company hardware currently registered under your custody.</p>
        ) : (
          <table border="1" cellPadding="6" cellSpacing="0">
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

      {/* Recent Activity Card */}
      <fieldset>
        <legend>My Recent Tickets Summary</legend>
        {profile.recentTickets?.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>You have not raised any support requests yet.</p>
        ) : (
          <ul>
            {profile.recentTickets.map((t) => (
              <li key={t.id} style={{ marginBottom: '6px' }}>
                <strong>#{t.id} [{t.priority}]:</strong> {t.title} — <em>{t.status}</em>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  );
}
