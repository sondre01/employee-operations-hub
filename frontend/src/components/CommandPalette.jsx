import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { interactiveFX } from '../utils/interactiveFX';
import {
  Search,
  User,
  Clock,
  ClipboardList,
  Ticket,
  Calendar,
  ShieldCheck,
  Building2,
  BarChart3,
  Users,
  LogIn,
  Coffee,
  Utensils,
  Sparkles,
  Command,
  ArrowRight,
  CornerDownLeft
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const actions = [
    { id: 'profile', category: 'Navigation', label: 'Employee Profile Overview', icon: User, detail: 'View employment info, shift station, bulletins' },
    { id: 'attendance', category: 'Navigation', label: 'Attendance & Biometrics', icon: Clock, detail: 'Today punch station and shift timesheet records' },
    { id: 'requests', category: 'Navigation', label: 'File Time Correction / Request', icon: ClipboardList, detail: 'Submit OT pre-approvals and log adjustments' },
    { id: 'mytickets', category: 'Navigation', label: 'My Support Tickets', icon: Ticket, detail: 'Track IT hardware & HR service requests' },
    { id: 'calendar', category: 'Navigation', label: 'Cross-Border Dual Calendar', icon: Calendar, detail: 'Check Philippines (PH) & Denmark (DK) holidays' },
    { id: 'policies', category: 'Navigation', label: 'Company Policies & Compliance', icon: ShieldCheck, detail: 'Sign mandatory guidelines and security policies' },
    { id: 'queue', category: 'Operations Desk', label: 'Service Desk Queue', icon: Ticket, detail: 'Operational ticketing queue management' },
    { id: 'stats', category: 'Operations Desk', label: 'Service Analytics & SLA', icon: BarChart3, detail: 'Resolution metrics, department volume, SLAs' },
    { id: 'roster', category: 'Operations Desk', label: 'Staff Directory & Roster', icon: Users, detail: 'Outstaffing team profiles and hardware custody' },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase()) ||
    a.detail.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      executeAction(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const executeAction = (action) => {
    onNavigate(action.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 select-none">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Futuristic Floating Glass Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-2xl border border-zinc-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col z-10"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
              <Search className="w-4 h-4 text-[#D61766] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or jump to destination... (Esc to exit)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-none font-medium text-zinc-900 placeholder:text-zinc-400"
              />
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200/80 shrink-0">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-50">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No matching command or destination found for "{query}".
                </div>
              ) : (
                filtered.map((action, idx) => {
                  const Icon = action.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <div
                      key={action.id}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#13264C] text-white shadow-xs'
                          : 'text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white/10 text-white'
                              : 'bg-[#13264C]/10 text-[#13264C]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold tracking-tight truncate">
                            {action.label}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-zinc-300' : 'text-zinc-400'
                            }`}
                          >
                            {action.detail}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-[#D61766] text-white'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {action.category}
                        </span>
                        {isSelected && (
                          <CornerDownLeft className="w-3 h-3 text-zinc-300" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white border border-zinc-200 px-1 py-0.5 rounded text-[10px] shadow-2xs">↑</kbd>
                  <kbd className="font-mono bg-white border border-zinc-200 px-1 py-0.5 rounded text-[10px] shadow-2xs">↓</kbd>
                  <span>to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white border border-zinc-200 px-1 py-0.5 rounded text-[10px] shadow-2xs">↵</kbd>
                  <span>to select</span>
                </span>
              </div>

              <span className="flex items-center gap-1 font-semibold text-[#13264C]">
                <Sparkles className="w-3 h-3 text-[#D61766]" />
                <span>Command Jump</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
