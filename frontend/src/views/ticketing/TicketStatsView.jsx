import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function TicketStatsView() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest(`/tickets/stats?callerEmployeeId=${currentUser.id}`);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentUser.id]);

  if (loading) return <p>Loading ticket statistics...</p>;
  if (error) return <p><strong>Error:</strong> {error}</p>;
  if (!stats) return null;

  return (
    <div>
      <h2>Ticketing Analytics & Operational Stats</h2>
      <p>Overall operational metrics across departments, operator workloads, and personal statistics.</p>

      {/* Overall KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <fieldset style={{ margin: 0, textAlign: 'center', background: '#ffffff' }}>
          <legend>Total Raised</legend>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{stats.totalTickets}</div>
          <small style={{ color: '#64748b' }}>Across all departments</small>
        </fieldset>

        <fieldset style={{ margin: 0, textAlign: 'center', background: '#fffbeb', borderColor: '#fde68a' }}>
          <legend style={{ color: '#92400e' }}>Open Queue</legend>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#b45309' }}>{stats.openTickets}</div>
          <small style={{ color: '#92400e' }}>Awaiting operator pick-up</small>
        </fieldset>

        <fieldset style={{ margin: 0, textAlign: 'center', background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <legend style={{ color: '#0369a1' }}>In Progress</legend>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0284c7' }}>{stats.inProgressTickets}</div>
          <small style={{ color: '#0369a1' }}>Under active investigation</small>
        </fieldset>

        <fieldset style={{ margin: 0, textAlign: 'center', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <legend style={{ color: '#166534' }}>Resolved</legend>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>{stats.resolvedTickets}</div>
          <small style={{ color: '#166534' }}>Completed & documented</small>
        </fieldset>
      </div>

      {/* Personal Stats for Caller */}
      <fieldset style={{ marginBottom: '20px', background: '#f8fafc' }}>
        <legend>👤 Your Personal Metrics ({currentUser.fullName})</legend>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <strong>Tickets Raised by You:</strong>{' '}
            <span style={{ fontSize: '16px', fontWeight: '700' }}>{stats.myStats.raisedByMe}</span>
          </div>
          <div>
            <strong>Tickets Assigned to You:</strong>{' '}
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#0284c7' }}>{stats.myStats.assignedToMe}</span>
          </div>
          <div>
            <strong>Tickets Resolved by You:</strong>{' '}
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a' }}>{stats.myStats.resolvedByMe}</span>
          </div>
        </div>
      </fieldset>

      {/* Breakdown by Department */}
      <h3>Department Queue Breakdown</h3>
      <table border="1" cellPadding="6" cellSpacing="0" style={{ marginBottom: '24px' }}>
        <thead>
          <tr>
            <th>Department Name</th>
            <th>Total Tickets</th>
            <th>Open</th>
            <th>In Progress</th>
            <th>Resolved</th>
            <th>Resolution Rate</th>
          </tr>
        </thead>
        <tbody>
          {stats.byDepartment.map((d) => {
            const rate = d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
            return (
              <tr key={d.departmentId}>
                <td><strong>{d.departmentName}</strong></td>
                <td>{d.total}</td>
                <td><span style={{ color: '#b45309', fontWeight: '600' }}>{d.open}</span></td>
                <td><span style={{ color: '#0284c7', fontWeight: '600' }}>{d.inProgress}</span></td>
                <td><span style={{ color: '#16a34a', fontWeight: '600' }}>{d.resolved}</span></td>
                <td>
                  <strong>{rate}%</strong> ({d.resolved}/{d.total})
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Operator Resolver Workload */}
      <h3>Operator & Resolver Workload</h3>
      <table border="1" cellPadding="6" cellSpacing="0">
        <thead>
          <tr>
            <th>Operator Name</th>
            <th>Department</th>
            <th>Assigned Tickets</th>
            <th>Resolved Tickets</th>
            <th>Active Workload</th>
          </tr>
        </thead>
        <tbody>
          {stats.byResolver.length === 0 ? (
            <tr>
              <td colSpan="5" align="center">No tickets assigned to operators yet.</td>
            </tr>
          ) : (
            stats.byResolver.map((r) => (
              <tr key={r.employeeId}>
                <td><strong>{r.employeeName}</strong></td>
                <td>{r.departmentName}</td>
                <td>{r.assignedCount}</td>
                <td><span style={{ color: '#16a34a', fontWeight: '600' }}>{r.resolvedCount}</span></td>
                <td>
                  <span style={{ fontWeight: '600', color: r.assignedCount - r.resolvedCount > 0 ? '#ea580c' : '#16a34a' }}>
                    {r.assignedCount - r.resolvedCount} active
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
