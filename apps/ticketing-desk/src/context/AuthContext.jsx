import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = 
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.port === '5500'
    ? 'http://localhost:5000/api'
    : '/api');

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ops_hub_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Fetch personas for quick 1-click test login & sync latest permissions
  useEffect(() => {
    fetchPersonas();
    if (currentUser?.id) {
      fetch(`${API_BASE}/access/employees`)
        .then((res) => (res.ok ? res.json() : []))
        .then((list) => {
          if (Array.isArray(list)) {
            const fresh = list.find((e) => e.id === currentUser.id);
            if (fresh) {
              setCurrentUser((prev) => {
                const updated = {
                  ...prev,
                  isInternal: fresh.isInternal,
                  departmentId: fresh.departmentId,
                  departmentName: fresh.departmentName,
                  ticketingRole: fresh.ticketingRole,
                  hasTicketingAccess: fresh.hasTicketingAccess,
                  canAssignEmployees: fresh.canAssignEmployees
                };
                localStorage.setItem('ops_hub_user', JSON.stringify(updated));
                return updated;
              });
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const fetchPersonas = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/personas`);
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch {
      // Fallback if backend is booting
      setPersonas([
        {
          key: 'superadmin',
          label: '👑 Super Admin (Khin Andrei Gamboa)',
          email: 'gamboa.khinandrei@gmail.com',
          password: 'Password123!',
          roleDescription: 'Director of Dev Operations & Super Admin. Full Access: Manage all tickets, overall stats, add departments, manage employee access.',
          ticketingRole: 'SuperAdmin',
          departmentName: 'Dev Operation'
        },
        {
          key: 'devops',
          label: '🛠️ DevOps Member (Normal Admin)',
          email: 'devops@company.io',
          password: 'Password123!',
          roleDescription: 'Dev Ops team member. Has access to Dev Team tickets, self stats, and permission to assign newly registered staff.',
          ticketingRole: 'DevOpsAdmin',
          departmentName: 'Dev Operation'
        },
        {
          key: 'hrmanager',
          label: '📋 HR Department Manager',
          email: 'hr.manager@company.io',
          password: 'Password123!',
          roleDescription: 'Department Manager for HR/Recruitment. Manages HR queue (COE, HMO, leaves) and team stats.',
          ticketingRole: 'DepartmentManager',
          departmentName: 'HR/Recruitment'
        },
        {
          key: 'itspecialist',
          label: '💻 IT Team Specialist',
          email: 'it.specialist@company.io',
          password: 'Password123!',
          roleDescription: 'Department Member in IT Team. Resolves hardware custody, VPN, and workstation tickets.',
          ticketingRole: 'DepartmentMember',
          departmentName: 'IT Team'
        },
        {
          key: 'finance',
          label: '💼 Finance Specialist',
          email: 'finance@company.io',
          password: 'Password123!',
          roleDescription: 'Department Member in Finance. Handles payroll, invoices, and statutory deduction inquiries.',
          ticketingRole: 'DepartmentMember',
          departmentName: 'Finance'
        },
        {
          key: 'externaldev',
          label: '👨‍💻 Client Dedicated Dev (External)',
          email: 'dev.arnel@company.io',
          password: 'Password123!',
          roleDescription: 'External developer dedicated to client project. Accesses Employee Portal (Profile & My Tickets).',
          ticketingRole: 'None',
          departmentName: 'Client Dedicated (External)'
        }
      ]);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid email or password');
      }

      const user = await res.json();
      setCurrentUser(user);
      localStorage.setItem('ops_hub_user', JSON.stringify(user));
      return user;
    } catch (err) {
      // If network fails (e.g. backend server is booting or running standalone Live Server)
      // seamlessly authenticate matching seed personas
      const matchedPersona = personas.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matchedPersona && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed'))) {
        const parts = (matchedPersona.label || '').replace(/^[^\s]+\s+/, '').split(' ');
        const deptIdMap = {
          superadmin: 1,
          devops: 1,
          hrmanager: 3,
          itspecialist: 2,
          finance: 4,
          externaldev: null
        };
        const fallbackUser = {
          id: matchedPersona.key === 'superadmin' ? 9 : matchedPersona.key === 'devops' ? 2 : matchedPersona.key === 'hrmanager' ? 3 : matchedPersona.key === 'itspecialist' ? 4 : matchedPersona.key === 'finance' ? 5 : 6,
          firstName: matchedPersona.key === 'superadmin' ? 'Khin Andrei' : (parts[0] || 'Team'),
          lastName: matchedPersona.key === 'superadmin' ? 'Gamboa' : (parts[1] || 'Member'),
          middleName: matchedPersona.key === 'superadmin' ? 'Roque' : '',
          fullName: matchedPersona.label.replace(/^[^\s]+\s+/, ''),
          workEmail: matchedPersona.email,
          jobTitle: matchedPersona.ticketingRole,
          departmentName: matchedPersona.departmentName,
          departmentId: deptIdMap[matchedPersona.key] ?? null,
          isInternal: matchedPersona.key !== 'externaldev',
          hasTicketingAccess: matchedPersona.ticketingRole !== 'None',
          ticketingRole: matchedPersona.ticketingRole,
          canAssignEmployees: matchedPersona.key === 'superadmin' || matchedPersona.key === 'devops',
          employmentType: matchedPersona.key === 'externaldev' ? 'ClientDedicated' : 'InternalCore'
        };
        setCurrentUser(fallbackUser);
        localStorage.setItem('ops_hub_user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password = 'Password123!') => {
    return login(email, password);
  };

  const register = async (registerData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Registration failed');
      }

      const user = await res.json();
      setCurrentUser(user);
      localStorage.setItem('ops_hub_user', JSON.stringify(user));
      return user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async (email) => {
    const res = await fetch(`${API_BASE}/auth/send-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send verification code');
    }
    return data;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ops_hub_user');
  };

  // RBAC flags
  const isSuperAdmin = currentUser?.ticketingRole === 'SuperAdmin';
  const isDevOpsAdmin = currentUser?.ticketingRole === 'DevOpsAdmin' || isSuperAdmin;
  const isDepartmentManager = currentUser?.ticketingRole === 'DepartmentManager';
  const hasTicketingAccess = Boolean(currentUser?.hasTicketingAccess || isSuperAdmin);
  const canAssignEmployees = Boolean(currentUser?.canAssignEmployees || isSuperAdmin);

  // Backward compatibility alias for older views expecting `currentPersona`
  const currentPersona = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.fullName,
        email: currentUser.workEmail,
        role: currentUser.isInternal ? 'AdminHr' : 'Developer',
        title: `${currentUser.jobTitle || 'Team Member'} (${currentUser.departmentName || 'External'})`
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentPersona,
        personas,
        quickPersonas: personas,
        loading,
        authError,
        login,
        quickLogin,
        register,
        sendVerificationCode,
        logout,
        fetchPersonas,
        isSuperAdmin,
        isDevOpsAdmin,
        isDepartmentManager,
        hasTicketingAccess,
        canAssignEmployees
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
