import React, { useState } from 'react';
import ProfileView from './ProfileView';
import AttendanceView from './AttendanceView';
import TimeRequestsView from './TimeRequestsView';
import MyTicketsView from './MyTicketsView';
import CrossBorderCalendarView from '../CrossBorderCalendarView';
import PolicyComplianceView from '../PolicyComplianceView';
import FuturisticSidebar from '../../components/FuturisticSidebar';
import {
  User,
  Clock,
  ClipboardList,
  Ticket,
  Calendar,
  ShieldCheck,
  Menu
} from 'lucide-react';

export default function EmployeePortal({ onOpenCommandPalette }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'attendance', label: 'Attendance', icon: Clock },
    { key: 'requests', label: 'Requests', icon: ClipboardList, badge: '3' },
    { key: 'mytickets', label: 'Tickets', icon: Ticket, badge: '2' },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'policies', label: 'Policies', icon: ShieldCheck }
  ];

  const handleSelectTab = (key) => {
    setActiveTab(key);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden min-h-0 bg-zinc-50 relative">
      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Left Navigation Bar - Dynamic, Modern, Futuristic */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 h-full transition-transform duration-200 ease-in-out ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <FuturisticSidebar
          title=""
          subtitle=""
          navItems={navItems}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenCommandPalette={onOpenCommandPalette}
          onClose={() => setMobileNavOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full min-w-0 min-h-0 box-border bg-zinc-50/50 flex flex-col overflow-hidden p-0">
        {/* Mobile Navigation Toggle Bar */}
        <div className="md:hidden flex items-center justify-between p-2.5 border-b border-zinc-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-800 shadow-2xs"
          >
            <Menu className="w-4 h-4 text-[#13264C]" />
            <span>Menu &bull; {navItems.find(n => n.key === activeTab)?.label}</span>
          </button>
          <span className="text-[10px] font-semibold text-zinc-500">
            Workforce Portal
          </span>
        </div>

        <div
          className={`h-full w-full flex flex-col box-border select-none ${
            activeTab === 'calendar'
              ? 'overflow-hidden p-2 sm:p-3 pb-2 gap-2.5 min-h-0'
              : 'overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 pb-12 gap-4'
          }`}
        >
          {activeTab === 'profile' && <ProfileView onNavigateTab={handleSelectTab} />}
          {activeTab === 'attendance' && <AttendanceView onNavigateTab={handleSelectTab} />}
          {activeTab === 'requests' && <TimeRequestsView />}
          {activeTab === 'mytickets' && <MyTicketsView />}
          {activeTab === 'calendar' && <CrossBorderCalendarView />}
          {activeTab === 'policies' && <PolicyComplianceView />}
        </div>
      </main>
    </div>
  );
}
