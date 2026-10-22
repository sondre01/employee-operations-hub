# Employee Operations Hub (MVP)

A foundational, templated full-stack operations platform designed for workforce management, internal service desk operations, and client delivery management.

Built with **ASP.NET Core Web API (.NET 8)**, **Entity Framework Core (SQLite / PostgreSQL)**, and a **clean enterprise React frontend**.

---

## 🏛️ Architectural Overview

```text
proposal-employee-hub/
├── backend/
│   ├── src/EmployeeHub.Api/
│   │   ├── Controllers/             # HTTP routing, DTO bindings, status codes
│   │   ├── Services/                # Business logic & domain rules
│   │   ├── Data/                    # AppDbContext, DbInitializer (seed data), Migrations
│   │   ├── Models/
│   │   │   ├── Entities/            # EF Core entities (Employee, Department, Hardware, Ticket, Holiday, Policy)
│   │   │   └── Enums/               # EmploymentType, UserRole, TicketingRole, TicketStatus, CountryLocation
│   │   └── DTOs/                    # Data Transfer Objects (protects internal DB schema)
│   └── Dockerfile                   # Multi-stage .NET 8 build
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # Pure fetch API client
│   │   ├── context/                 # AuthContext (Real Auth & RBAC Persona Switcher)
│   │   ├── views/                   # Semantic enterprise views
│   │   │   ├── auth/                # Sign In / Sign Up & 1-Click Role Login
│   │   │   ├── portal/              # Dimension 1: Employee Portal (Profile, My Tickets)
│   │   │   └── ticketing/           # Dimension 2: Ticketing System (Queue, Stats, Depts, RBAC Matrix)
│   │   ├── App.jsx                  # Main view shell & dual dimension navigation
│   │   └── main.jsx                 # React entry point
│   ├── nginx.conf                   # Reverse proxy configuration
│   └── Dockerfile                   # Multi-stage Node + Nginx build
│
└── docker-compose.yml               # Orchestrates Postgres 16, ASP.NET API, and React Web
```

---

## 🚀 Quickstart Guide

### Option 1: Run Locally (Fastest Zero-Config)

#### 1. Start the ASP.NET Core API
```bash
dotnet run --project backend/src/EmployeeHub.Api --launch-profile http
```
The API starts on `http://localhost:5000` with pre-seeded test personas and departments in SQLite.

#### 2. Start the Frontend
- **Via VS Code Live Server**: Click **"Go Live"** on port `5500`.
- **Or via Vite Dev Server**:
  ```bash
  npm --prefix frontend run dev
  ```
  Open `http://localhost:5173`.

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
- **👑 Super Admin / DevOps Manager**: `superadmin@company.io` — Full access across all queues, stats, department configuration, and employee access delegation.
- **🛠️ DevOps Member**: `devops@company.io` — DevOps ticket queue and delegated employee role assignment.
- **👥 Department Manager (HR)**: `hr.manager@company.io` — Departmental queue management.
- **💻 Department Specialist (IT)**: `it.specialist@company.io` — Technical support and resolution.
- **💼 Department Specialist (Finance)**: `finance@company.io` — Financial inquiries and disbursements.
- **👤 External Client Dedicated Developers**: `dev.arnel@company.io` / `dev.bianca@company.io` — Standard employees with Employee Portal access.
