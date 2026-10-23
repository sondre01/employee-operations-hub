import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function FuturisticSidebar({
  title = '',
  subtitle = '',
  navItems = [],
  activeTab = '',
  onSelectTab,
  onOpenCommandPalette
}) {
  const { currentUser, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const manilaTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <aside className="relative h-full w-20 shrink-0 bg-white border-r border-zinc-200/80 shadow-2xs flex flex-col justify-between overflow-hidden z-20 select-none">
      {/* Top Subtle Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#13264C] via-[#D61766] to-[#13264C] opacity-40 pointer-events-none rounded-tl-xl" />

      {/* TOP: Brand Identity */}
      <div className="p-3 border-b border-zinc-100 flex flex-col items-center justify-center shrink-0">
        <div
          className="relative w-9 h-9 rounded-xl bg-[#13264C] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none cursor-default"
          title="Malayo Operations Hub"
        >
          <span>M</span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D61766] ring-2 ring-white" />
        </div>
        {(title || subtitle) && (
          <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider text-center mt-1 truncate max-w-full">
            {title || subtitle}
          </div>
        )}
      </div>

      {/* MIDDLE: Dynamic Nav Items (Icon on top, Name below) */}
      <div className="flex-1 flex flex-col gap-1.5 p-1.5 sm:p-2 min-h-0 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;

          return (
            <div key={item.key} className="relative group">
              <button
                type="button"
                onClick={() => onSelectTab(item.key)}
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 cursor-pointer outline-none focus:outline-none border-0 select-none ${
                  isActive
                    ? 'bg-zinc-200 text-[#13264C] font-bold'
                    : 'text-zinc-500 hover:text-[#13264C] hover:bg-zinc-100 font-semibold'
                }`}
                title={item.label}
              >
                <div className="relative flex items-center justify-center">
                  {Icon ? (
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-[#13264C]' : 'text-zinc-500 group-hover:text-[#13264C]'
                      }`}
                    />
                  ) : null}
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[14px] h-3.5 rounded-full bg-[#D61766] text-white text-[9px] font-bold flex items-center justify-center shadow-2xs">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                <span className="text-[10px] sm:text-[11px] tracking-tight leading-tight mt-1 text-center truncate max-w-full">
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* BOTTOM SECTION: Manila Telemetry & User Session */}
      <div className="shrink-0 flex flex-col border-t border-zinc-100 p-2 items-center gap-1.5">
        {/* Manila Time Strip */}
        <div className="flex flex-col items-center text-center py-0.5" title={`Live Manila Time: ${manilaTime}`}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D61766]" />
            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">PHT</span>
          </div>
          <span className="font-mono font-bold text-[10px] text-zinc-700">{manilaTime.replace(/:\d\d\s/, ' ')}</span>
        </div>

        {/* User Avatar & Logout */}
        {currentUser && (
          <div className="w-full flex items-center justify-between p-1 rounded-xl bg-zinc-100/80 border border-zinc-200/70 mt-0.5">
            <div
              className="w-7 h-7 rounded-lg bg-[#13264C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs cursor-default"
              title={`${currentUser.fullName} (${currentUser.workEmail})`}
            >
              {(currentUser.fullName ? currentUser.fullName[0] : 'U').toUpperCase()}
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
