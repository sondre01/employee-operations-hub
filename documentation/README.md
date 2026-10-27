# Enterprise Employee Operations Hub — Documentation Center

Welcome to the documentation suite for the **Enterprise Employee Operations Hub**.

All documents are available in both **Markdown format** (for instant viewing on GitHub and code editors) and **compiled PDF format** (for printing, offline viewing, and executive presentations).

---

## Directory Structure

```
documentation/
├── README.md                              # This documentation index
├── build.sh                               # Automated script to compile all PDFs
│
├── pdf/                                   # Dedicated directory containing all compiled PDF files
│   ├── technical_documentation.pdf        # System Architecture, Database & API Specifications PDF
│   ├── non_technical_documentation.pdf    # Plain-Language User & Operations Handbook PDF
│   └── main.pdf                           # Master Comprehensive Operations Guide PDF
│
├── technical/                             # Technical Documentation Source Files
│   ├── TECHNICAL_DOCUMENTATION.md         # Comprehensive Technical Architecture & API Guide
│   └── technical_documentation.tex        # LaTeX source for technical_documentation.pdf
│
└── non-technical/                         # Non-Technical Documentation Source Files
    ├── NON_TECHNICAL_DOCUMENTATION.md     # Step-by-Step User & Operations Guide (Plain Language)
    └── non_technical_documentation.tex    # LaTeX source for non_technical_documentation.pdf
```

---

## 1. Technical Documentation

Designed for **software engineers, DevOps administrators, systems architects, and technical auditors**.

- **Markdown Version:** [technical/TECHNICAL_DOCUMENTATION.md](technical/TECHNICAL_DOCUMENTATION.md)
- **PDF Version:** [pdf/technical_documentation.pdf](pdf/technical_documentation.pdf)

### Topics Covered:
- **System Architecture & Cloud Topology:** Dual deployment model (Vercel Node.js Serverless Functions + Vite SPA; alternative Dockerized ASP.NET Core 8 Web API).
- **Physical Database Schema:** Complete data dictionary for all 9 normalized tables in the `employee_hub` PostgreSQL schema.
- **RESTful API Contract Specifications:** Detailed endpoints, query parameters, request payloads, and status codes for Auth, Employees, Tickets, Hardware, Access Control, Holidays, and Policies.
- **Security & RBAC Enforcement:** Role hierarchy (`SuperAdmin`, `Admin`, `Agent`, `Employee`), PBKDF2 password hashing (10,000 iterations, SHA-256), and row-level data isolation.
- **Inbound Email Ingestion Engine:** Domain routing, automated queue classification (IT, Billing, HR, Support), and synthetic ticket generation.
- **Troubleshooting & Maintenance:** Connection string truncation failover (`aws-0-`), safe parameter parsing (`safeInt`), and error runbook.

---

## 2. Non-Technical Documentation (User & Operations Handbook)

Designed for **employees, team leaders, HR managers, IT support agents, and executives**.

- **Markdown Version:** [non-technical/NON_TECHNICAL_DOCUMENTATION.md](non-technical/NON_TECHNICAL_DOCUMENTATION.md)
- **PDF Version:** [pdf/non_technical_documentation.pdf](pdf/non_technical_documentation.pdf)

### Topics Covered:
- **Executive Summary & Business Context:** Solving cross-border collaboration challenges between Manila and Copenhagen.
- **Step-by-Step Employee Guide:**
  - Clocking in, logging lunch breaks, and clocking out with live dual world clocks.
  - Raising internal support tickets (IT, equipment, HR inquiries).
  - Checking company hardware custody and serial numbers.
  - Reviewing and digitally signing mandatory company policies.
- **Service Desk Operations Guide:**
  - Triaging requests on the interactive Kanban board.
  - Assigning tickets and logging diagnostic resolution notes.
  - Simulating email-to-ticket auto-ingestion.
  - Monitoring service KPIs and resolution turnaround times.
- **Cross-Border Collaboration Reference:**
  - Golden collaboration window: Overlapping core hours (2:00 PM – 6:00 PM Manila / 7:00 AM – 11:00 AM Copenhagen).
  - Joint Philippine and Danish holiday calendars.
  - Dedicated workflows for Philippine statutory compliance (BIR 2316, SSS, PhilHealth, Pag-IBIG).
- **Pre-Configured Test Personas:** Walkthrough guide for evaluating system features using 1-click test roles.

---

## 3. Recompiling the PDFs

If you make modifications to the `.tex` source files, rebuild all PDFs cleanly into the `pdf/` folder with one command:

```bash
./documentation/build.sh
```

The script will automatically compile all LaTeX files using `pdflatex`, place the generated `.pdf` documents directly into `documentation/pdf/`, and clean up any intermediate build artifacts (`.aux`, `.log`, `.toc`, `.out`).
