import React, { useState } from 'react';
import ProfileView from './ProfileView';
import MyTicketsView from './MyTicketsView';
import CrossBorderCalendarView from '../CrossBorderCalendarView';
import PolicyComplianceView from '../PolicyComplianceView';
import UserProfileNavCard from '../../components/UserProfileNavCard';

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', overflow: 'hidden', minHeight: 0 }}>
      {/* Left Navigation Bar - Fixed on Left */}
      <aside
        style={{
          width: '240px',
          borderRight: '1px solid #e1e4e8',
          backgroundColor: '#f6f8fa',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px 16px 12px 16px', borderBottom: '1px solid #e1e4e8', marginBottom: '4px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6a737d', fontWeight: 600 }}>
            Employee Portal
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: '#24292e' }}>
            Workforce Services
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'profile' ? '#ffffff' : 'transparent',
              borderLeft: activeTab === 'profile' ? '3px solid #0366d6' : '3px solid transparent',
              fontWeight: activeTab === 'profile' ? 600 : 400,
              color: activeTab === 'profile' ? '#0366d6' : '#24292e',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px'
            }}
          >
            👤 Profile &amp; Summary
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mytickets')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'mytickets' ? '#ffffff' : 'transparent',
              borderLeft: activeTab === 'mytickets' ? '3px solid #0366d6' : '3px solid transparent',
              fontWeight: activeTab === 'mytickets' ? 600 : 400,
              color: activeTab === 'mytickets' ? '#0366d6' : '#24292e',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px'
            }}
          >
            🎫 Support Tickets
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'calendar' ? '#ffffff' : 'transparent',
              borderLeft: activeTab === 'calendar' ? '3px solid #0366d6' : '3px solid transparent',
              fontWeight: activeTab === 'calendar' ? 600 : 400,
              color: activeTab === 'calendar' ? '#0366d6' : '#24292e',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px'
            }}
          >
            🗓️ Dual Operations Calendar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'policies' ? '#ffffff' : 'transparent',
              borderLeft: activeTab === 'policies' ? '3px solid #0366d6' : '3px solid transparent',
              fontWeight: activeTab === 'policies' ? 600 : 400,
              color: activeTab === 'policies' ? '#0366d6' : '#24292e',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px'
            }}
          >
            📜 Policies &amp; Compliance
          </button>
        </div>

        {/* User Identity & Role docked at bottom of left nav bar */}
        <UserProfileNavCard />
      </aside>

      {/* Main Content Area - Scrollable Independently */}
      <main style={{ flex: 1, height: '100%', padding: '24px 32px', overflowY: 'auto', backgroundColor: '#ffffff', minWidth: 0, minHeight: 0 }}>
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'mytickets' && <MyTicketsView />}
        {activeTab === 'calendar' && <CrossBorderCalendarView />}
        {activeTab === 'policies' && <PolicyComplianceView />}
      </main>
    </div>
  );
}
