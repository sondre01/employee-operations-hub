import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function TicketStatsView() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('kpi'); // 'kpi' | 'departments' | 'operators'

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Ticketing Analytics &amp; Operational Stats</h2>

        {/* Sub-tabs to eliminate vertical scrolling */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e1e4e8', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('kpi')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'kpi' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'kpi' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'kpi' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            📊 KPI Metrics &amp; Personal Stats
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'departments' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'departments' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'departments' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            🏢 Department Queue Breakdown ({stats.byDepartment?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operators')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'operators' ? 600 : 400,
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'operators' ? '2px solid #0366d6' : '2px solid transparent',
              color: activeTab === 'operators' ? '#0366d6' : '#586069',
              cursor: 'pointer'
            }}
          >
            👥 Resolver &amp; Operator Workload ({stats.byResolver?.length || 0})
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Tab 1: KPI Cards & Personal Stats */}
        {activeTab === 'kpi' && (
          <div>
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
                <small style={{ color: '#166534' }}>Completed &amp; documented</small>
              </fieldset>
            </div>

            <fieldset style={{ background: '#f8fafc', margin: 0 }}>
              <legend>👤 Your Personal Metrics ({currentUser.fullName})</legend>
              <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', padding: '8px 4px' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Tickets Raised by You</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{stats.myStats.raisedByMe}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Tickets Assigned to You</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#0284c7' }}>{stats.myStats.assignedToMe}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Tickets Resolved by You</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#16a34a' }}>{stats.myStats.resolvedByMe}</div>
                </div>
              </div>
            </fieldset>
          </div>
        )}

        {/* Tab 2: Breakdown by Department */}
        {activeTab === 'departments' && (
          <div>
            <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%', margin: 0 }}>
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
                      <td><span style={{ color: '#166534', fontWeight: '600' }}>{d.resolved}</span></td>
                      <td>
                        <strong>{rate}%</strong> ({d.resolved}/{d.total})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Operator Resolver Workload */}
        {activeTab === 'operators' && (
          <div>
            <table border="1" cellPadding="6" cellSpacing="0" style={{ width: '100%', margin: 0 }}>
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
                    <td colSpan="5" align="center" style={{ padding: '24px' }}>No tickets assigned to operators yet.</td>
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
        )}
      </div>
    </div>
  );
}
