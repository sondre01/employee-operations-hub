import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TicketQueueView from './TicketQueueView';
import TicketStatsView from './TicketStatsView';
import DepartmentManagementView from './DepartmentManagementView';
import AccessControlView from './AccessControlView';
import EmployeeDirectoryView from '../EmployeeDirectoryView';
import FuturisticSidebar from '../../components/FuturisticSidebar';
import {
  Inbox,
  BarChart3,
  Building2,
  ShieldCheck,
  Users,
  Menu
} from 'lucide-react';

export default function TicketingManagement({ onOpenCommandPalette }) {
  const { currentUser, isSuperAdmin, canAssignEmployees } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { key: 'queue', label: 'Ticket Queue', icon: Inbox },
    { key: 'stats', label: 'Service Analytics', icon: BarChart3 },
    ...(isSuperAdmin ? [{ key: 'departments', label: 'Departments', icon: Building2, badge: 'Admin' }] : []),
    ...(isSuperAdmin || canAssignEmployees ? [{ key: 'access', label: 'Access & RBAC', icon: ShieldCheck, badge: 'Staff' }] : []),
    { key: 'roster', label: 'Staff Directory', icon: Users }
  ];

  const handleSelectTab = (key) => {
    setActiveTab(key);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden min-h-0 bg-zinc-50 font-sans select-none relative">
      {/* Mobile Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Futuristic Left Sidebar Navigation */}
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
      <main
        className={`flex-1 h-full min-w-0 min-h-0 box-border bg-zinc-50/50 flex flex-col ${
          activeTab === 'queue' ? 'p-2 sm:p-3 overflow-hidden' : 'p-4 sm:p-6 overflow-y-auto'
        }`}
      >
        {/* Mobile Toggle Bar */}
        <div className="md:hidden flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-800 shadow-2xs"
          >
            <Menu className="w-4 h-4 text-[#13264C]" />
            <span>Menu &bull; {navItems.find(n => n.key === activeTab)?.label}</span>
          </button>
          <span className="text-[10px] font-semibold text-zinc-500">
            Operations Desk
          </span>
        </div>

        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          {activeTab === 'queue' && <TicketQueueView />}
          {activeTab === 'stats' && <TicketStatsView />}
          {activeTab === 'departments' && isSuperAdmin && <DepartmentManagementView />}
          {activeTab === 'access' && (isSuperAdmin || canAssignEmployees) && <AccessControlView />}
          {activeTab === 'roster' && <EmployeeDirectoryView />}
        </div>
      </main>
    </div>
  );
}
