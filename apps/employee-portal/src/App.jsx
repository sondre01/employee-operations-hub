import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthView from './views/auth/AuthView';
import EmployeePortal from './views/portal/EmployeePortal';
import CommandPalette from './components/CommandPalette';
import { interactiveFX } from './utils/interactiveFX';
import {
  ExternalLink,
  Search,
  Command,
  Ticket
} from 'lucide-react';

function PortalShell() {
  const { currentUser, hasTicketingAccess } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Link to the separate Ticketing Desk (port 5174 locally or Vercel URL in prod)
  const ticketingUrl = import.meta.env.VITE_TICKETING_URL || 'http://localhost:5174';

  useEffect(() => {
    return interactiveFX.onCommandPaletteToggle(() => {
      setIsCommandPaletteOpen((prev) => !prev);
    });
  }, []);

  if (!currentUser) {
    return <AuthView />;
  }

  const handleGlobalNavigate = (targetId) => {
    if (['queue', 'stats', 'departments', 'access', 'roster'].includes(targetId)) {
      window.location.href = ticketingUrl;
    }
  };

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
              Employee Portal
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

          {/* External Link to Dedicated Ticketing Desk */}
          {currentUser.isInternal && (
            <a
              href={ticketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-[#13264C] text-zinc-700 hover:text-white border border-zinc-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
              title="Open Operations Service Desk in separate website"
            >
              <Ticket className="w-3.5 h-3.5 text-[#13264C] group-hover:text-white transition-colors" />
              <span>Service Desk</span>
              <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-white/80 transition-colors ml-0.5" />
            </a>
          )}
        </div>
      </header>

      {/* Main Dimension Body - 100% Dedicated to Employee Portal */}
      <main className="flex-1 w-full flex flex-col overflow-hidden min-h-0">
        <EmployeePortal onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PortalShell />
    </AuthProvider>
  );
}
