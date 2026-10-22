import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthView() {
  const { login, register, quickLogin, quickPersonas } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up form state - all users register as normal employees
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    workEmail: '',
    password: '',
    jobTitle: '',
    primaryTechStack: '',
  });

  const handleQuickLogin = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      await register(signupForm);
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
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
      <header
        style={{
          flexShrink: 0,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #d1d5da',
          padding: '14px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 2px 0', fontSize: '18px' }}>
            Enterprise Employee Operations Hub
          </h1>
          <p style={{ margin: 0, color: '#586069', fontSize: '12px' }}>
            Workforce Operations Platform &bull; Service Desk &amp; Role-Based Access Control (RBAC)
          </p>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Environment: <strong>Local Workspace Server (SQLite)</strong>
        </div>
      </header>

      <div style={{ flex: 1, padding: '24px 32px', boxSizing: 'border-box', width: '100%', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start', width: '100%' }}>
          {/* Left Column: Quick 1-Click Role Login Buttons */}
          <fieldset style={{ backgroundColor: '#ffffff', height: '100%', margin: 0 }}>
            <legend>⚡ Quick 1-Click Role Login (Demo &amp; Testing Accounts)</legend>
            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 14px 0' }}>
              Select an operational role below to sign in instantly and verify access permissions across Employee Portal and Ticketing System Management:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {quickPersonas.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(p.email, p.password)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{p.label}</strong>
                  <div style={{ color: '#0366d6', fontFamily: 'monospace', fontSize: '11px' }}>{p.email}</div>
                  <small style={{ color: '#64748b' }}>Dept: {p.departmentName || 'Client Team'}</small>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px', padding: '10px 12px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', color: '#475569' }}>
              <em>Pre-seeded password for all persona accounts: <code>Password123!</code></em>
            </div>
          </fieldset>

          {/* Right Column: Form Tabs: Sign In / Sign Up */}
          <fieldset style={{ backgroundColor: '#ffffff', margin: 0 }}>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                style={{
                  fontWeight: mode === 'login' ? '700' : '400',
                  background: mode === 'login' ? '#1e293b' : '#ffffff',
                  color: mode === 'login' ? '#ffffff' : '#334155',
                  padding: '8px 16px'
                }}
              >
                Sign In with Credentials
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                style={{
                  fontWeight: mode === 'signup' ? '700' : '400',
                  background: mode === 'signup' ? '#1e293b' : '#ffffff',
                  color: mode === 'signup' ? '#ffffff' : '#334155',
                  padding: '8px 16px'
                }}
              >
                Sign Up New Account
              </button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px' }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit}>
                <p>
                  <label htmlFor="loginEmail">Work Email Address:</label>
                  <br />
                  <input
                    id="loginEmail"
                    type="email"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. superadmin@company.io"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </p>

                <p>
                  <label htmlFor="loginPassword">Password:</label>
                  <br />
                  <input
                    id="loginPassword"
                    type="password"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="Enter password..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </p>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit}>
                <p>
                  <label htmlFor="fullName">Full Name:</label>
                  <br />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. Alex Morgan"
                    value={signupForm.fullName}
                    onChange={handleSignupChange}
                  />
                </p>

                <p>
                  <label htmlFor="workEmail">Work Email Address:</label>
                  <br />
                  <input
                    id="workEmail"
                    name="workEmail"
                    type="email"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. alex.morgan@company.io"
                    value={signupForm.workEmail}
                    onChange={handleSignupChange}
                  />
                </p>

                <p>
                  <label htmlFor="password">Password:</label>
                  <br />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="At least 6 characters..."
                    value={signupForm.password}
                    onChange={handleSignupChange}
                  />
                </p>

                <p>
                  <label htmlFor="jobTitle">Job Title:</label>
                  <br />
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. Full-Stack Developer or DevOps Engineer"
                    value={signupForm.jobTitle}
                    onChange={handleSignupChange}
                  />
                </p>

                <p>
                  <label htmlFor="primaryTechStack">Primary Tech Stack / Skills:</label>
                  <br />
                  <input
                    id="primaryTechStack"
                    name="primaryTechStack"
                    type="text"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. .NET 8, React, PostgreSQL"
                    value={signupForm.primaryTechStack}
                    onChange={handleSignupChange}
                  />
                </p>

                <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '4px', marginBottom: '14px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                  ℹ️ <strong>Standard Registration:</strong> All newly registered accounts start as normal employees with access to the <strong>Employee Portal</strong>. The Super Admin or designated DevOps manager reviews accounts in the Access &amp; RBAC console to assign departments and determine operational <strong>Ticketing System Management</strong> permissions.
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
                  {loading ? 'Creating Account...' : 'Complete Sign Up'}
                </button>
              </form>
            )}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
