import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthView from './views/auth/AuthView';
import TicketingManagement from './views/ticketing/TicketingManagement';
import CommandPalette from './components/CommandPalette';
import { interactiveFX } from './utils/interactiveFX';
import {
  ExternalLink,
  Search,
  Command,
  User,
  ShieldAlert,
  LogOut
} from 'lucide-react';

function TicketingShell() {
  const { currentUser, hasTicketingAccess, isSuperAdmin, logout, getCrossAppUrl } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Link to the separate Employee Portal (port 5173 locally or Vercel URL in prod)
  const portalUrl = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173';

  useEffect(() => {
    return interactiveFX.onCommandPaletteToggle(() => {
      setIsCommandPaletteOpen((prev) => !prev);
    });
  }, []);

  if (!currentUser) {
    return <AuthView />;
  }

  const handleGlobalNavigate = (targetId) => {
    if (!['queue', 'stats', 'departments', 'access', 'roster'].includes(targetId)) {
      window.location.href = getCrossAppUrl(portalUrl);
    }
  };

  const canAccessDesk = Boolean(
    isSuperAdmin ||
    hasTicketingAccess ||
    (currentUser.isInternal && currentUser.ticketingRole && currentUser.ticketingRole !== 'None')
  );

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-zinc-50 font-sans select-none relative">
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleGlobalNavigate}
      />

      {/* Header Bar */}
      <header className="shrink-0 h-13 px-3 sm:px-6 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 flex items-center justify-between gap-2 sm:gap-3 shadow-2xs z-30">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#13264C] to-[#0A152A] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 tracking-tight border border-white/20">
            M
          </div>
          <div>
            <span className="text-xs sm:text-base font-bold text-zinc-950 tracking-tight block">
              Operations Service Desk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Jump Cmd+K */}
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

          {/* External Link back to Employee Portal */}
          <a
            href={getCrossAppUrl(portalUrl)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-[#13264C] text-zinc-700 hover:text-white border border-zinc-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
            title="Open Employee Portal with your active session"
          >
            <User className="w-3.5 h-3.5 text-[#13264C] group-hover:text-white transition-colors" />
            <span>Employee Portal</span>
            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-white/80 transition-colors ml-0.5" />
          </a>

          {/* User Profile & Sign Out / Switch Account */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[11px] font-bold text-zinc-900 leading-tight truncate max-w-[120px]">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">
                  {currentUser.ticketingRole && currentUser.ticketingRole !== 'None' ? currentUser.ticketingRole : 'No Desk Access'}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 border border-zinc-200/80 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Sign out or switch account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Dimension Body - 100% Dedicated to Ticketing System */}
      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        {canAccessDesk ? (
          <TicketingManagement onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        ) : (
          <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200/80 p-6 shadow-sm text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 mb-1">Service Desk Access Required</h3>
              <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                You do not currently have operational desk access to the Ticketing System Management. Newly registered accounts start in the Employee Portal until desk permissions are delegated.
              </p>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px] text-zinc-600 text-left mb-4">
                <div>Department: <strong className="text-zinc-900">{currentUser.departmentName || 'No Department'}</strong></div>
                <div>Operational Role: <strong className="text-zinc-900">{currentUser.ticketingRole || 'None'}</strong></div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <a
                  href={getCrossAppUrl(portalUrl)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#13264C] text-white text-xs font-bold shadow-2xs hover:bg-[#0E1D3B] transition-all cursor-pointer"
                >
                  Go to Employee Portal (Seamless Sign In)
                </a>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer border border-zinc-200"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                  Sign Out / Switch Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TicketingShell />
    </AuthProvider>
  );
}
