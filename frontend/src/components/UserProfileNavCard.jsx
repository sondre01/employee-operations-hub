import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function UserProfileNavCard() {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid #e1e4e8',
        backgroundColor: '#ffffff',
        padding: '12px 14px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '2px', wordBreak: 'break-word' }}>
        {currentUser.fullName}{' '}
        <span style={{ fontWeight: 400, color: '#64748b', fontSize: '11px' }}>
          ({currentUser.workEmail})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginTop: '4px', marginBottom: '10px' }}>
        <span className={`badge ${currentUser.isInternal ? 'badge-internal' : 'badge-external'}`}>
          {currentUser.isInternal ? 'Internal Core' : 'External Client'}
        </span>
        <span style={{ fontSize: '11px', color: '#475569' }}>
          {currentUser.departmentName || 'External Team'}
        </span>
        <span style={{ color: '#94a3b8' }}>&bull;</span>
        <span style={{ fontWeight: 600, color: '#0366d6', fontSize: '11px' }}>
          {currentUser.ticketingRole}
        </span>
      </div>

      <button
        type="button"
        onClick={logout}
        className="btn"
        style={{
          width: '100%',
          background: '#ffeef0',
          borderColor: '#f97583',
          color: '#cb2431',
          fontWeight: 600,
          fontSize: '11px',
          padding: '5px 8px',
          cursor: 'pointer'
        }}
        title="Sign out of this session"
      >
        Sign Out
      </button>
    </div>
  );
}
