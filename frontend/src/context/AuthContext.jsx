import React, { createContext, useContext, useState } from 'react';

export const MOCK_PERSONAS = [
  {
    id: 1,
    name: 'Maria Santos',
    email: 'maria.santos@malayo.io',
    role: 'AdminHr',
    title: 'HR & People Operations Lead (Manila)',
  },
  {
    id: 2,
    name: 'Christian Reyes',
    email: 'christian.reyes@malayo.io',
    role: 'AdminHr',
    title: 'IT & Infrastructure Specialist (Manila)',
  },
  {
    id: 3,
    name: 'Jesper Nielsen',
    email: 'jn@kobenhavntech.dk',
    role: 'DanishClientLead',
    title: 'Client Delivery Lead (Kobenhavn Tech A/S - Denmark)',
  },
  {
    id: 5,
    name: 'Arnel Cruz',
    email: 'arnel.cruz@malayo.io',
    role: 'Developer',
    title: 'Senior Full-Stack Engineer (Manila)',
  },
  {
    id: 6,
    name: 'Bianca Mendoza',
    email: 'bianca.mendoza@malayo.io',
    role: 'Developer',
    title: 'Frontend Engineer (Manila)',
  },
];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentPersona, setCurrentPersona] = useState(MOCK_PERSONAS[0]);

  return (
    <AuthContext.Provider value={{ currentPersona, setCurrentPersona, personas: MOCK_PERSONAS }}>
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
