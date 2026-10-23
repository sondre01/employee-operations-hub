import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthView from './views/auth/AuthView';
import EmployeePortal from './views/portal/EmployeePortal';
import TicketingManagement from './views/ticketing/TicketingManagement';

function HubShell() {
  const { currentUser, hasTicketingAccess, isSuperAdmin, isDevOpsAdmin, canAssignEmployees } = useAuth();
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
      {/* Consolidated Single Top Bar: Brand on left, Navigation Tabs on right */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #d1d5da',
          padding: '0 20px',
          boxSizing: 'border-box',
          minHeight: '48px',
          gap: '16px'
        }}
      >
        {/* Left Side: Brand and Description */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, padding: '8px 0' }}>
          <div>
            <div style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
              Enterprise Employee Operations Hub
            </div>
            <div style={{ margin: 0, color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>
              Workforce Management Platform &bull; Internal Service Desk &bull; Client Delivery Operations
            </div>
          </div>
        </div>

        {/* Right Side: Tab Navigation */}
        <nav style={{ display: 'flex', gap: '4px', margin: 0, flexShrink: 0, alignItems: 'stretch' }}>
          <button
            type="button"
            onClick={() => setActiveDimension('portal')}
            style={{
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              borderBottom: activeDimension === 'portal' ? '3px solid #0366d6' : '3px solid transparent',
              color: activeDimension === 'portal' ? '#0366d6' : '#586069'
            }}
          >
            👤 Employee Portal
          </button>

          {/* Ticketing System Management Dimension - strictly hidden for external employees */}
          {isInternal && (
            <button
              type="button"
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
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: hasTicketingAccess ? 'pointer' : 'not-allowed',
                border: 'none',
                background: 'none',
                borderBottom: activeDimension === 'ticketing' ? '3px solid #0366d6' : '3px solid transparent',
                color: activeDimension === 'ticketing' ? '#0366d6' : hasTicketingAccess ? '#586069' : '#959da5',
                opacity: hasTicketingAccess ? 1 : 0.6
              }}
            >
              🎫 Ticketing System Management
              {!hasTicketingAccess && (
                <span style={{ fontSize: '11px', marginLeft: '6px', color: '#cb2431', fontWeight: 'normal' }}>
                  (Access Required)
                </span>
              )}
            </button>
          )}
        </nav>
      </header>

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
