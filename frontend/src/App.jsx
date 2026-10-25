import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthView from './views/auth/AuthView';
import EmployeePortal from './views/portal/EmployeePortal';
import TicketingManagement from './views/ticketing/TicketingManagement';
import CommandPalette from './components/CommandPalette';
import { interactiveFX } from './utils/interactiveFX';
import {
  Building2,
  User,
  Ticket,
  ShieldAlert,
  Sparkles,
  Command,
  Search
} from 'lucide-react';

function HubShell() {
  const { currentUser, hasTicketingAccess, isSuperAdmin, isDevOpsAdmin, canAssignEmployees } = useAuth();
  const isInternal = Boolean(currentUser?.isInternal);
  const appMode = import.meta.env.VITE_APP_MODE || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') : null) || 'all';
  const initialDimension = appMode === 'ticketing' ? 'ticketing' : 'portal';
  const [activeDimension, setActiveDimension] = useState(initialDimension);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const ticketingUrl = import.meta.env.VITE_TICKETING_URL;
  const portalUrl = import.meta.env.VITE_PORTAL_URL;

  // Subscribe to Cmd+K / Ctrl+K keyboard shortcut from interactiveFX
  useEffect(() => {
    return interactiveFX.onCommandPaletteToggle(() => {
      setIsCommandPaletteOpen((prev) => !prev);
    });
  }, []);

  // If user is external, strictly ensure activeDimension remains on 'portal'
  useEffect(() => {
    if (!isInternal && activeDimension !== 'portal') {
      setActiveDimension('portal');
    }
  }, [isInternal, activeDimension]);

  if (!currentUser) {
    return <AuthView />;
  }

  const handleGlobalNavigate = (targetId) => {
    if (['queue', 'stats', 'departments', 'access', 'roster'].includes(targetId)) {
      if (hasTicketingAccess) {
        if (appMode === 'portal' && ticketingUrl) {
          window.location.href = ticketingUrl;
        } else {
          setActiveDimension('ticketing');
        }
      }
    } else {
      if (appMode === 'ticketing' && portalUrl) {
        window.location.href = portalUrl;
      } else {
        setActiveDimension('portal');
      }
    }
  };

  const appTitle =
    appMode === 'ticketing'
      ? 'Operations Service Desk'
      : appMode === 'portal'
      ? 'Employee Portal'
      : 'Employee Operations Hub';

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-zinc-50 font-sans select-none relative">
      {/* Global Futuristic Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleGlobalNavigate}
      />

      {/* Consolidated Single Modern Header Bar */}
      <header className="shrink-0 h-13 px-3 sm:px-6 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between gap-2 sm:gap-3 shadow-2xs z-30">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#13264C] to-[#0A152A] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 tracking-tight border border-white/20">
            M
          </div>
          <span className="text-xs sm:text-base font-bold text-zinc-950 tracking-tight truncate max-w-[140px] sm:max-w-none">
            {appTitle}
          </span>
        </div>

        {/* Center / Right: Quick Jump Pill & Dimension Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Futuristic Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-[#13264C]/40 text-xs font-medium text-zinc-600 transition-all cursor-pointer shadow-2xs group"
            title="Press ⌘K or Ctrl+K anywhere to jump"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#D61766] transition-colors" />
            <span className="text-[11px] font-semibold text-zinc-600">Quick Jump</span>
            <span className="flex items-center gap-0.5 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-zinc-500 border border-zinc-200">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </span>
          </button>

          {/* Dimension Switcher */}
          <nav className="flex items-center bg-zinc-100/90 p-0.5 rounded-xl border border-zinc-200/80 gap-0.5">
            <button
              type="button"
              data-ripple
              onClick={() => {
                if (appMode === 'ticketing' && portalUrl) {
                  window.location.href = portalUrl;
                } else {
                  setActiveDimension('portal');
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none whitespace-nowrap ${
                activeDimension === 'portal'
                  ? 'bg-[#13264C] text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Portal</span>
            </button>

            {/* Ticketing Management Tab */}
            {isInternal && (
              <button
                type="button"
                data-ripple
                onClick={() => {
                  if (hasTicketingAccess) {
                    if (appMode === 'portal' && ticketingUrl) {
                      window.location.href = ticketingUrl;
                    } else {
                      setActiveDimension('ticketing');
                    }
                  }
                }}
                disabled={!hasTicketingAccess}
                title={
                  hasTicketingAccess
                    ? 'Access Ticketing System Management'
                    : 'Requires operational desk access granted by DevOps Manager / Admin'
                }
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none focus:outline-none focus-visible:outline-none whitespace-nowrap ${
                  !hasTicketingAccess
                    ? 'text-zinc-400 cursor-not-allowed opacity-60'
                    : activeDimension === 'ticketing'
                    ? 'bg-[#13264C] text-white shadow-xs cursor-pointer'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/60 cursor-pointer'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Service Desk</span>
                {!hasTicketingAccess && (
                  <span className="text-[10px] font-normal text-zinc-400 hidden sm:inline">(Locked)</span>
                )}
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Dimension Body */}
      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        {activeDimension === 'portal' && (
          <EmployeePortal onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        )}

        {isInternal && activeDimension === 'ticketing' && (
          hasTicketingAccess ? (
            <TicketingManagement onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
          ) : (
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center">
              <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200/80 p-6 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-950 mb-1">Restricted Access</h3>
                <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                  You do not currently have operational desk access to the Ticketing System Management.
                </p>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px] text-zinc-600 text-left mb-4">
                  <div>Department: <strong className="text-zinc-900">{currentUser.departmentName || 'No Department'}</strong></div>
                  <div>Operational Role: <strong className="text-zinc-900">{currentUser.ticketingRole}</strong></div>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Please contact your System Administrator at{' '}
                  <a href="mailto:superadmin@company.io" className="text-[#13264C] font-semibold underline">
                    superadmin@company.io
                  </a>{' '}
                  for role elevation.
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
