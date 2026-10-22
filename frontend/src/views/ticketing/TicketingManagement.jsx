import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TicketQueueView from './TicketQueueView';
import TicketStatsView from './TicketStatsView';
import DepartmentManagementView from './DepartmentManagementView';
import AccessControlView from './AccessControlView';
import EmployeeDirectoryView from '../EmployeeDirectoryView';

export default function TicketingManagement() {
  const { currentUser, isSuperAdmin, canAssignEmployees } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', overflow: 'hidden', minHeight: 0 }}>
      {/* Left Navigation Bar for Ticketing System - Fixed on Left */}
      <div
        style={{
          width: '240px',
          borderRight: '1px solid #e1e4e8',
          backgroundColor: '#f6f8fa',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexShrink: 0,
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid #e1e4e8', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6a737d', fontWeight: 600 }}>
            Ticketing Operations
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: '#24292e' }}>
            {currentUser?.departmentName || 'General Desk'}
          </div>
          <div style={{ fontSize: '11px', color: '#586069' }}>
            Role: <strong>{currentUser?.ticketingRole}</strong>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('queue')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            border: 'none',
            background: activeTab === 'queue' ? '#fff' : 'transparent',
            borderLeft: activeTab === 'queue' ? '3px solid #0366d6' : '3px solid transparent',
            fontWeight: activeTab === 'queue' ? 600 : 400,
            color: activeTab === 'queue' ? '#0366d6' : '#24292e',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px'
          }}
        >
          <span>📋 Ticket Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            border: 'none',
            background: activeTab === 'stats' ? '#fff' : 'transparent',
            borderLeft: activeTab === 'stats' ? '3px solid #0366d6' : '3px solid transparent',
            fontWeight: activeTab === 'stats' ? 600 : 400,
            color: activeTab === 'stats' ? '#0366d6' : '#24292e',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px'
          }}
        >
          <span>📊 Ticket Stats & Analytics</span>
        </button>

        {/* Super Admin Only: Department Configuration */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('departments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'departments' ? '#fff' : 'transparent',
              borderLeft: activeTab === 'departments' ? '3px solid #0366d6' : '3px solid transparent',
              fontWeight: activeTab === 'departments' ? 600 : 400,
              color: activeTab === 'departments' ? '#0366d6' : '#24292e',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px'
            }}
          >
            <span>🏢 Department Config</span>
            <span style={{ fontSize: '10px', background: '#ffeef0', color: '#cb2431', padding: '1px 4px', borderRadius: '3px' }}>Admin</span>
          </button>
        )}

        {/* Super Admin or DevOps with Delegation Permission: Access & RBAC */}
        {(isSuperAdmin || canAssignEmployees) && (
          <button
            onClick={() => setActiveTab('access')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'access' ? '#fff' : 'transparent',
              borderLeft: activeTab === 'access' ? '3px solid #0366d6' : '3px solid transparent',
              fontWeight: activeTab === 'access' ? 600 : 400,
              color: activeTab === 'access' ? '#0366d6' : '#24292e',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px'
            }}
          >
            <span>🔐 Access & RBAC</span>
            <span style={{ fontSize: '10px', background: '#e1e4e8', color: '#24292e', padding: '1px 4px', borderRadius: '3px' }}>Staff</span>
          </button>
        )}

        {/* Outstaffing Roster & Directory */}
        <button
          onClick={() => setActiveTab('roster')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            border: 'none',
            background: activeTab === 'roster' ? '#fff' : 'transparent',
            borderLeft: activeTab === 'roster' ? '3px solid #0366d6' : '3px solid transparent',
            fontWeight: activeTab === 'roster' ? 600 : 400,
            color: activeTab === 'roster' ? '#0366d6' : '#24292e',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '13px'
          }}
        >
          <span>👥 Outstaffing Roster</span>
        </button>
      </div>

      {/* Main Content Area - Scrollable Independently */}
      <div style={{ flex: 1, height: '100%', padding: '24px 32px', overflowY: 'auto', backgroundColor: '#fff', minWidth: 0, minHeight: 0 }}>
        {activeTab === 'queue' && <TicketQueueView />}
        {activeTab === 'stats' && <TicketStatsView />}
        {activeTab === 'departments' && isSuperAdmin && <DepartmentManagementView />}
        {activeTab === 'access' && (isSuperAdmin || canAssignEmployees) && <AccessControlView />}
        {activeTab === 'roster' && <EmployeeDirectoryView />}
      </div>
    </div>
  );
}
