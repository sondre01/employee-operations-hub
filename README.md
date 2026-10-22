# Malayo International — Employee Operations Hub (MVP)

A foundational full-stack operations platform designed for **Malayo International** (an IT outstaffing firm managing software engineers in Manila for Danish clients in Denmark).

Built with **ASP.NET Core Web API (.NET 8)**, **Entity Framework Core (Code-First PostgreSQL)**, and an **intentionally unstyled, raw HTML5 React frontend** designed as a clean canvas for your own design system.

---

## 🏛️ Architectural Overview

```text
proposal-employee-hub/
├── backend/
│   ├── src/Malayo.EmployeeHub.Api/
│   │   ├── Controllers/             # HTTP routing, DTO bindings, status codes
│   │   ├── Services/                # Business logic & domain rules
│   │   ├── Data/                    # AppDbContext, DbInitializer (seed data), Migrations
│   │   ├── Models/
│   │   │   ├── Entities/            # EF Core entities (Employee, Hardware, Ticket, Holiday, Policy)
│   │   │   └── Enums/               # EmploymentType, UserRole, TicketQueue, TicketStatus, CountryLocation
│   │   └── DTOs/                    # Data Transfer Objects (protects internal DB schema)
│   └── Dockerfile                   # Multi-stage .NET 8 build
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # Pure fetch API client
│   │   ├── context/                 # AuthContext (Mock RBAC Persona Switcher)
│   │   ├── views/                   # 100% unstyled semantic HTML5 views
│   │   │   ├── EmployeeDirectoryView.jsx
│   │   │   ├── HardwareCustodyView.jsx
│   │   │   ├── ServiceDeskView.jsx
│   │   │   ├── CrossBorderCalendarView.jsx
│   │   │   └── PolicyComplianceView.jsx
│   │   ├── App.jsx                  # Main view shell & unstyled navigation
│   │   └── main.jsx                 # Pure React entry point (zero CSS)
│   ├── nginx.conf                   # Reverse proxy configuration
│   └── Dockerfile                   # Multi-stage Node + Nginx build
│
└── docker-compose.yml               # Orchestrates Postgres 16, ASP.NET API, and React Web
```

---

## 🚀 Quickstart Guide

### Option 1: Run with Docker Compose (Recommended)

To start the database, backend API, and frontend web server in a single command:

```bash
docker compose up --build
```

- **Frontend (Web App)**: [http://localhost:8080](http://localhost:8080)
- **Backend API & Swagger**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **PostgreSQL Database**: `localhost:5432` (`user: postgres`, `password: postgres`, `db: malayo_hub`)

---

### Option 2: Run Locally (Bare-Metal Development)

#### 1. Start PostgreSQL (e.g. via Docker or local service)
```bash
docker run -d --name malayo_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=malayo_hub -p 5432:5432 postgres:16-alpine
```

#### 2. Start the ASP.NET Core API
```bash
cd backend/src/Malayo.EmployeeHub.Api
dotnet run
```
The API starts on `http://localhost:5000`. On first launch, `DbInitializer` will automatically apply EF Core migrations and populate realistic seed data.

#### 3. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` calls directly to `http://localhost:5000`.

---

## 🎯 Core Features & Persona Simulation

### 1. Mock RBAC Persona Switcher
In the header, use the unstyled `<select>` dropdown to switch between:
- **Maria Santos** (`AdminHr`): Access to onboarding forms, hardware asset registry, ticket status resolver, holiday authoring, and policy publishing.
- **Christian Reyes** (`AdminHr`): IT & DevOps resolver for infrastructure queues.
- **Jesper Nielsen** (`DanishClientLead`): Danish client stakeholder viewing assigned team roster and submitting tickets.
- **Arnel Cruz** / **Bianca Mendoza** (`Developer`): Manila software engineers viewing allocated laptops, signing GDPR read-receipts, and checking dual holidays.

### 2. Operational Features Implemented
1. **Employee Directory & Outstaffing Roster**:
   - Filter between `InternalCore` (hub ops) and `ClientDedicated` (assigned to Danish accounts like *Kobenhavn Tech A/S* and *Nordic Logistics Group*).
   - View assigned tech stack and hardware custody count.
   - Expand profile to inspect assigned hardware and recent tickets.
2. **Hardware Custody Management**:
   - Track device models (MacBook Pro 16 M3, ThinkPad P16s, 4K monitors) with serial numbers and asset tags.
   - Filter by status (`Active`, `InRepair`, `Returned`).
3. **Operational Service Desk**:
   - Queue routing: `IT Infrastructure` (hardware/VPN) vs `HR / Legal` (COE, HMO, statutory contributions).
   - Lifecycle transitions: `Open` $\rightarrow$ `InProgress` $\rightarrow$ `Resolved` (with required resolution notes).
4. **Cross-Border Dual Calendar**:
   - Compares 2026 Philippine public holidays (Araw ng Kagitingan, Independence Day, etc.) with Danish public holidays (Kristi Himmelfartsdag, Grundlovsdag, 2. Pinsedag).
   - Explicitly flags operational impacts (e.g., *Manila hub non-working vs Danish client operating*).
5. **Company Policies & Read-Receipts**:
   - HR-published policies (GDPR compliance, remote work hardware agreement, Philippine statutory benefits).
   - One-click read-receipt checkbox/button with real-time tracking of company-wide acknowledgements.

---

## 🎨 Frontend Styling Guide for the Junior Developer

Notice how all components in `frontend/src/views/` use **only plain HTML5 semantic elements** (`<table>`, `<form>`, `<fieldset>`, `<details>`, `<select>`, `<input>`).

### How to apply your custom design system:
1. **Tailwind CSS**:
   - Run `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p` inside `frontend/`.
   - Add class names (e.g. `className="border border-gray-300 p-2"`) directly onto existing semantic tags.
2. **CSS Modules or Vanilla CSS**:
   - Create a CSS file (e.g. `src/styles/hub.css`) and import it in `src/main.jsx`.
3. **Component Libraries (e.g. Shadcn/UI, Chakra, MUI)**:
   - Replace `<button>`, `<select>`, and `<table>` with the library's equivalents. All state handlers (`onChange`, `value`, `onClick`) and API async hooks are already connected and working!
