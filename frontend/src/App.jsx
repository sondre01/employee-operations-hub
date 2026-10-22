import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import EmployeeDirectoryView from './views/EmployeeDirectoryView';
import HardwareCustodyView from './views/HardwareCustodyView';
import ServiceDeskView from './views/ServiceDeskView';
import CrossBorderCalendarView from './views/CrossBorderCalendarView';
import PolicyComplianceView from './views/PolicyComplianceView';

function HubShell() {
  const { currentPersona, setCurrentPersona, personas } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');

  const handlePersonaChange = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const found = personas.find((p) => p.id === selectedId);
    if (found) setCurrentPersona(found);
  };

  return (
    <div>
      <header>
        <h1>Malayo International — Employee Operations Hub</h1>
        <p>
          Internal Operations Prototype for Manila Engineering Hub & Danish Client Outstaffing
        </p>

        {/* Mock Persona Switcher (RBAC) */}
        <fieldset>
          <legend>Active User Persona (Simulate RBAC)</legend>
          <label htmlFor="personaSelect">Logged in as: </label>
          <select
            id="personaSelect"
            value={currentPersona.id}
            onChange={handlePersonaChange}
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} [{p.role}] — {p.title}
              </option>
            ))}
          </select>
          <br />
          <small>
            Active Role: <strong>{currentPersona.role}</strong> | Email: <code>{currentPersona.email}</code>
          </small>
        </fieldset>

        <br />

        {/* Navigation Bar */}
        <nav>
          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            disabled={activeTab === 'employees'}
          >
            1. Employee Directory & Profiles
          </button>
          {' | '}
          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            disabled={activeTab === 'hardware'}
          >
            2. Hardware Custody
          </button>
          {' | '}
          <button
            type="button"
            onClick={() => setActiveTab('servicedesk')}
            disabled={activeTab === 'servicedesk'}
          >
            3. Operational Service Desk
          </button>
          {' | '}
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            disabled={activeTab === 'calendar'}
          >
            4. Dual Calendar (PH / DK)
          </button>
          {' | '}
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            disabled={activeTab === 'policies'}
          >
            5. Policies & Handbooks
          </button>
        </nav>
      </header>

      <hr />

      <main>
        {activeTab === 'employees' && <EmployeeDirectoryView />}
        {activeTab === 'hardware' && <HardwareCustodyView />}
        {activeTab === 'servicedesk' && <ServiceDeskView />}
        {activeTab === 'calendar' && <CrossBorderCalendarView />}
        {activeTab === 'policies' && <PolicyComplianceView />}
      </main>

      <hr />

      <footer>
        <p>
          <small>
            <strong>Frontend Architecture Note:</strong> This UI is intentionally unstyled and raw HTML5.
            All component states, form bindings, and API calls are functioning cleanly so that you can
            readily add your own CSS design system, Tailwind, or component framework anytime.
          </small>
        </p>
      </footer>
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
