# Employee Operations Hub (MVP)

A foundational, templated full-stack operations platform designed for workforce management, internal service desk operations, and client delivery management.

Built with **ASP.NET Core Web API (.NET 8)**, **Entity Framework Core (SQLite / PostgreSQL)**, and a **clean enterprise React frontend**.

---

## 🏛️ Architectural Overview

```text
proposal-employee-hub/
├── backend/                         # ASP.NET Core API (.NET 8) connected to Supabase PostgreSQL
│   └── src/EmployeeHub.Api/
│
├── apps/
│   ├── employee-portal/             # [APP 1] Standalone Employee Portal (Port 5173)
│   │   ├── src/                     # Profile, Attendance, Leaves, Compliance, Calendar
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── ticketing-desk/              # [APP 2] Standalone Operations Service Desk (Port 5174)
│       ├── src/                     # Kanban Ticket Queue, Stats, Department SLAs, RBAC
│       ├── package.json
│       └── vite.config.js
│
└── package.json                     # Root orchestrator (npm run dev runs both)
```

---

## 🚀 Quickstart Guide

### Option 1: Run Locally (Decoupled Frontends + Supabase Backend)

#### 1. Start the ASP.NET Core API
```bash
dotnet run --project backend/src/EmployeeHub.Api --launch-profile http
```
The API starts on `http://localhost:5000` connected to Supabase PostgreSQL.

#### 2. Start Both Web Apps (One Command)
```bash
npm run dev
```
This runs both applications concurrently:
- **Employee Portal**: [http://localhost:5173](http://localhost:5173)
- **Operations Service Desk**: [http://localhost:5174](http://localhost:5174)

*Or start them individually:*
```bash
npm run dev:portal    # Only Employee Portal (port 5173)
npm run dev:tickets   # Only Ticketing Desk (port 5174)
```

---

### Option 2: Run with Docker Compose

```bash
docker compose up --build
```

- **Frontend (Web App)**: [http://localhost:8080](http://localhost:8080)
- **Backend API & Swagger**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **PostgreSQL Database**: `localhost:5432` (`user: postgres`, `password: postgres`, `db: employee_hub`)

---

## 🎯 Role-Based Access Control (RBAC) Personas

Pre-seeded testing credentials with password `Password123!`:
- **👑 Super Admin / Director of Dev Operations**: `gamboa.khinandrei@gmail.com` (Khin Andrei Gamboa) — Full access across all queues, stats, department configuration, and employee access delegation.
- **🛠️ DevOps Member**: `devops@company.io` — DevOps ticket queue and delegated employee role assignment.
- **👥 Department Manager (HR)**: `hr.manager@company.io` — Departmental queue management.
- **💻 Department Specialist (IT)**: `it.specialist@company.io` — Technical support and resolution.
- **💼 Department Specialist (Finance)**: `finance@company.io` — Financial inquiries and disbursements.
- **👤 External Client Dedicated Developers**: `dev.arnel@company.io` / `dev.bianca@company.io` — Standard employees with Employee Portal access.
