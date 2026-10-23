import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield } from 'lucide-react';

export default function UserProfileNavCard() {
  const { currentUser, logout } = useAuth();
  if (!currentUser) return null;

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-zinc-50/80 p-3 box-border">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-8 h-8 rounded-full bg-[#13264C] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
          {(currentUser.fullName ? currentUser.fullName[0] : 'U').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-zinc-900 truncate">
            {currentUser.fullName}
          </div>
          <div className="text-[10px] text-zinc-500 truncate">
            {currentUser.workEmail}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold border bg-zinc-100 text-zinc-800 border-zinc-200">
          {currentUser.isInternal ? 'Internal Core' : 'External Client'}
        </span>
        <span className="text-[10px] text-zinc-500 truncate">
          {currentUser.departmentName || 'External Team'}
        </span>
      </div>

      <button
        type="button"
        onClick={logout}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
        title="Sign out of session"
      >
        <LogOut className="w-3 h-3" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
