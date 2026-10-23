import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Briefcase,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building2,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function AuthView() {
  const { login, register, quickLogin, quickPersonas } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePersonaKey, setActivePersonaKey] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up form state
  const [signupForm, setSignupForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    workEmail: '',
    password: '',
    jobTitle: '',
  });

  const handleQuickLogin = async (persona) => {
    setError(null);
    setLoading(true);
    setActivePersonaKey(persona.key);
    try {
      await quickLogin(persona.email, persona.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setActivePersonaKey(null);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...signupForm,
        fullName: [signupForm.firstName, signupForm.middleName, signupForm.lastName].filter(Boolean).join(' '),
      };
      await register(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignupForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-zinc-50 font-sans select-none">
      {/* Top Header Bar */}
      <header className="shrink-0 h-14 px-6 bg-white border-b border-zinc-200/80 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#13264C] text-white flex items-center justify-center font-black text-sm shadow-xs">
            M
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-950 tracking-tight">
              Enterprise Employee Operations Hub
            </div>
            <div className="text-[11px] text-zinc-500">
              Workforce Operations Platform &bull; Service Desk &amp; Role-Based Access Control (RBAC)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Local Environment (SQLite)
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-start justify-center min-h-0">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          
          {/* LEFT: Quick 1-Click Persona Login Station */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-[#13264C]/10 text-[#13264C]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-950 tracking-tight m-0">
                    Quick 1-Click Role Logins
                  </h2>
                </div>
                <p className="text-xs text-zinc-500 mt-1 mb-0">
                  Select a test persona below to instantly inspect role permissions and workflow access:
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D61766]/10 text-[#D61766] border border-[#D61766]/20">
                Demo Accounts
              </span>
            </div>

            {/* Persona Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickPersonas.map((p) => {
                const isSelected = activePersonaKey === p.key;
                return (
                  <motion.button
                    key={p.key}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(p)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                      isSelected
                        ? 'border-[#13264C] bg-[#13264C]/5 ring-2 ring-[#13264C]/20 shadow-xs'
                        : 'border-zinc-200/90 bg-zinc-50/70 hover:bg-white hover:border-[#13264C]/50 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#13264C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {p.label.replace(/[^A-Za-z]/g, '')[0] || 'U'}
                        </div>
                        <span className="text-xs font-bold text-zinc-900 truncate">
                          {p.label.replace(/^[^\w\s]+/, '').trim()}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#D61766] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>

                    <div className="font-mono text-[11px] font-semibold text-[#13264C] truncate mb-1">
                      {p.email}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <span className="font-medium text-zinc-700 truncate">
                        {p.departmentName || 'External Delivery'}
                      </span>
                      <span>&bull;</span>
                      <span className="text-[#D61766] font-semibold">
                        {p.ticketingRole}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                Pre-seeded universal password:
              </span>
              <code className="text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200 font-mono text-[11px] font-bold">
                Password123!
              </code>
            </div>
          </div>

          {/* RIGHT: Credentials Sign In / Sign Up Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs flex flex-col">
            {/* Segmented Mode Switcher */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 mb-5">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#13264C] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#13264C] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Staff</span>
              </button>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. superadmin@company.io"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter password..."
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] transition-all shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to Hub'}</span>
                </motion.button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      First Name *
                    </label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      placeholder="e.g. Danilo"
                      value={signupForm.firstName}
                      onChange={handleSignupChange}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      name="lastName"
                      type="text"
                      required
                      placeholder="e.g. Navarro"
                      value={signupForm.lastName}
                      onChange={handleSignupChange}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Middle Name (Optional)
                  </label>
                  <input
                    name="middleName"
                    type="text"
                    placeholder="e.g. Santos"
                    value={signupForm.middleName}
                    onChange={handleSignupChange}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Official Work Email *
                  </label>
                  <input
                    name="workEmail"
                    type="email"
                    required
                    placeholder="e.g. employee@company.io"
                    value={signupForm.workEmail}
                    onChange={handleSignupChange}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Job Title / Designation *
                  </label>
                  <input
                    name="jobTitle"
                    type="text"
                    required
                    placeholder="e.g. Software Engineer / Operations Specialist"
                    value={signupForm.jobTitle}
                    onChange={handleSignupChange}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Account Password *
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Create secure password..."
                    value={signupForm.password}
                    onChange={handleSignupChange}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#13264C] focus:ring-2 focus:ring-[#13264C]/10 transition-all font-medium text-zinc-900"
                  />
                </div>

                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#13264C] hover:bg-[#0E1D3B] transition-all shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating Profile...' : 'Complete Staff Registration'}</span>
                </motion.button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Encrypted Session
              </span>
              <span>Enterprise Identity Guard</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
