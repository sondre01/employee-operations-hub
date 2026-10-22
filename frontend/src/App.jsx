import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthView from './views/auth/AuthView';
import EmployeePortal from './views/portal/EmployeePortal';
import TicketingManagement from './views/ticketing/TicketingManagement';

function HubShell() {
  const { currentUser, logout, hasTicketingAccess, isSuperAdmin, isDevOpsAdmin, canAssignEmployees } = useAuth();
  const isInternal = Boolean(currentUser?.isInternal);
  const [activeDimension, setActiveDimension] = useState('portal'); // 'portal' | 'ticketing'

  // If user is external, strictly ensure activeDimension remains on 'portal'
  useEffect(() => {
    if (!isInternal && activeDimension !== 'portal') {
      setActiveDimension('portal');
    }
  }, [isInternal, activeDimension]);

  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Identity Header - Fixed */}
      <header
        style={{
          flexShrink: 0,
          borderBottom: '1px solid #d1d5da',
          backgroundColor: '#ffffff',
          padding: '12px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 2px 0', fontSize: '18px' }}>
            Enterprise Employee Operations Hub
          </h1>
          <p style={{ margin: 0, color: '#586069', fontSize: '12px' }}>
            Workforce Management Platform &bull; Internal Service Desk &bull; Client Delivery Operations
          </p>
        </div>

        {/* User Identity & Logout Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: '#f6f8fa',
              border: '1px solid #d1d5da',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '12px',
              textAlign: 'right'
            }}
          >
            <div>
              <strong>{currentUser.fullName}</strong> ({currentUser.workEmail})
            </div>
            <div style={{ color: '#586069', marginTop: '2px' }}>
              <span className={`badge ${currentUser.isInternal ? 'badge-internal' : 'badge-external'}`} style={{ marginRight: '6px' }}>
                {currentUser.isInternal ? 'Internal Core' : 'External Client-Dedicated'}
              </span>
              <span>{currentUser.departmentName || 'External Team'}</span> &bull; 
              <span style={{ fontWeight: 600, color: '#0366d6', marginLeft: '4px' }}>
                {currentUser.ticketingRole}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn"
            style={{ background: '#ffeef0', borderColor: '#f97583', color: '#cb2431', fontWeight: 600 }}
            title="Log out of this session"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Two Dimensions Switcher - Fixed */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: '8px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #d1d5da',
          padding: '0 28px',
          boxSizing: 'border-box'
        }}
      >
        <button
          onClick={() => setActiveDimension('portal')}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeDimension === 'portal' ? '3px solid #0366d6' : '3px solid transparent',
            color: activeDimension === 'portal' ? '#0366d6' : '#586069'
          }}
        >
          👤 1. Employee Portal
        </button>

        {/* Ticketing System Management Dimension - strictly hidden for external employees */}
        {isInternal && (
          <button
            onClick={() => {
              if (hasTicketingAccess) {
                setActiveDimension('ticketing');
              }
            }}
            disabled={!hasTicketingAccess}
            title={
              hasTicketingAccess
                ? 'Access Ticketing System Management'
                : 'Requires operational desk access granted by DevOps Manager / Admin'
            }
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: hasTicketingAccess ? 'pointer' : 'not-allowed',
              border: 'none',
              background: 'none',
              borderBottom: activeDimension === 'ticketing' ? '3px solid #0366d6' : '3px solid transparent',
              color: activeDimension === 'ticketing' ? '#0366d6' : hasTicketingAccess ? '#586069' : '#959da5',
              opacity: hasTicketingAccess ? 1 : 0.6
            }}
          >
            🎫 2. Ticketing System Management
            {!hasTicketingAccess && (
              <span style={{ fontSize: '11px', marginLeft: '6px', color: '#cb2431', fontWeight: 'normal' }}>
                (Access Required)
              </span>
            )}
          </button>
        )}
      </div>

      {/* Dimension Body - Contained & Non-scrolling shell */}
      <main style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden', minHeight: 0 }}>
        {activeDimension === 'portal' && <EmployeePortal />}

        {isInternal && activeDimension === 'ticketing' && (
          hasTicketingAccess ? (
            <TicketingManagement />
          ) : (
            <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
              <div className="card" style={{ backgroundColor: '#fffbdd', borderColor: '#f1e05a' }}>
                <h3 style={{ marginTop: 0 }}>Restricted Access</h3>
                <p>
                  You do not currently have operational desk access to the Ticketing System Management.
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#586069' }}>
                  Your account is currently registered under <strong>{currentUser.departmentName || 'No Department'}</strong> with role <strong>{currentUser.ticketingRole}</strong>.
                  If you are an internal team member needing queue resolver or administrative permissions, please contact your System Administrator (<code>superadmin@company.io</code>).
                </p>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HubShell />
    </AuthProvider>
  );
}
