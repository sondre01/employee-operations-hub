# Enterprise Employee Operations Hub — User & Operations Guide (Non-Technical)

**Target Audience:** Employees, Team Leads, Department Heads (IT/HR/Finance), Operations Managers, and Executives  
**Version:** 2.0  
**Last Updated:** October 2026  

---

## 1. Executive Summary & Purpose

The **Enterprise Employee Operations Hub** is an all-in-one digital workplace and internal helpdesk created specifically for cross-border teams operating between the **Philippines** and **Denmark**.

In remote and distributed companies, team members frequently encounter:
- **Timezone Confusion:** Trying to calculate whether colleagues in Manila or Copenhagen are online, on lunch, or finished for the day.
- **Scattered Requests:** Support queries sent across Slack, Gmail, WhatsApp, and spreadsheets where they get lost or delayed.
- **Equipment Oversight:** Unclear records of company-issued Apple MacBooks, monitors, and peripherals in team custody.
- **Holiday Disconnects:** Danish public holidays (e.g., *Store Bededag*, *Ascension Day*) differing completely from Philippine national and special non-working holidays.

The Hub unites all these critical daily functions into two modern, clean portals that require zero training to use.

---

## 2. The Two Areas of the Platform

The platform is split into two specialized workspaces designed for different daily activities:

```
+-----------------------------------------------------------------------------------+
|                        ENTERPRISE EMPLOYEE OPERATIONS HUB                         |
+-----------------------------------------+-----------------------------------------+
|                                         |                                         |
|      1. THE EMPLOYEE PORTAL             |      2. THE OPERATIONS SERVICE DESK     |
|      (For all team members)             |      (For IT, HR & Operations staff)    |
|                                         |                                         |
|  * Personal Profile & Hardware Custody  |  * Interactive Kanban Ticket Board      |
|  * Live Manila & Copenhagen Clocks      |  * Automated Email Ingestion Desks      |
|  * 1-Click Attendance Time Clock        |  * Service Analytics & Resolution KPIs  |
|  * Submit Support Tickets               |  * Department Team Management           |
|  * Joint PH & DK Holiday Calendar       |  * Staff Directory & RBAC Permissions   |
|  * Mandatory Policy Acknowledgement     |  * Hardware Asset Registry              |
|                                         |                                         |
+-----------------------------------------+-----------------------------------------+
```

---

## 3. Step-by-Step Guide for Employees

### 3.1 Logging In & Switching Accounts
1. Open the **Employee Portal** in your web browser.
2. In the login screen, enter your company email and password.
3. **Quick 1-Click Testing:** If you are exploring the system, click any of the **Quick 1-Click Role Logins** (e.g. *DevOps Lead*, *HR Manager*, *Client Developer*) to log in instantly without typing.

### 3.2 Using the Daily Time Clock
At the top of your dashboard, you will find live digital clocks showing both **Manila (PH)** and **Copenhagen (DK)** times side-by-side.
- **Clock In:** Click the blue **"Clock In"** button when you start your shift.
- **Lunch Breaks:** Click **"Start Lunch"** when you step away for your meal break, and **"End Lunch"** when you return.
- **Clock Out:** Click **"Clock Out"** at the end of your working day.
- Your hours and attendance history are automatically recorded in the **Attendance** tab.

### 3.3 Raising an Internal Support Ticket
Need a new mouse, VPN assistance, or a Certificate of Employment?
1. Click the **"Tickets"** tab in the top navigation.
2. Click the pink **"Raise Ticket"** button.
3. Choose the relevant department (*IT Support*, *Human Resources*, or *Finance*).
4. Enter a clear title and description.
5. Select the urgency level (*Low*, *Medium*, *High*, or *Critical*).
6. Click **"Submit Ticket"**. Your request will immediately appear on the IT or HR team's live service desk.

### 3.4 Checking Your Issued Hardware
1. On your main Dashboard or under your profile card, check the **Assigned Equipment** section.
2. Here you will see your issued laptop model (e.g., *MacBook Pro 16" M3 Max*), serial number, and official asset tag.

### 3.5 Reading and Signing Company Policies
1. Click **"Policies"** in the top navigation bar.
2. Review company guidelines, information security protocols, and data privacy handbooks.
3. When you have finished reading a mandatory policy, click **"Acknowledge & Sign"**. The date and time of your signature will be permanently logged.

---

## 4. Guide for Helpdesk Agents & Department Managers

Authorized staff (IT, HR, and Operations) have access to the **Operations Service Desk**:

### 4.1 Triaging the Ticket Queue
- **Kanban Board:** View requests organized by **Open**, **In Progress**, and **Resolved**.
- **Assigning Tickets:** Click **"Assign to Me"** or select a colleague from the assignment dropdown.
- **Updating Status:** When work begins, move the ticket to *In Progress*. Once fixed, mark it *Resolved* and enter brief resolution notes explaining what was done.

### 4.2 Email-to-Ticket Auto-Ingestion
The Hub supports automated email ingestion:
- When an employee sends an email from their company Gmail to `it-support@malayo.com`, `hr-helpdesk@malayo.com`, or `finance@malayo.com`, the system automatically parses the email, identifies the sender, and opens a ticket in the appropriate queue.
- Use the **"Simulate Inbound Email"** modal on the Service Desk to test this workflow in real time.

### 4.3 Service Desk Analytics
Click the **"Analytics"** tab to view operational KPIs:
- Total tickets resolved this month.
- Average first-response time.
- Breakdown of requests by department (*IT Support*, *HR*, *Finance*).
- Identification of recurring technical bottlenecks (e.g., repeated VPN resets).

---

## 5. Cross-Border Collaboration (Philippines $\leftrightarrow$ Denmark)

### 5.1 Time Zone Overlap
- **Manila Time (PHT):** UTC+8
- **Copenhagen Time (CEST/CET):** UTC+1 (Winter) / UTC+2 (Summer)
- **Golden Overlap Hours:** Between **2:00 PM and 6:00 PM Manila Time** (which corresponds to **7:00 AM to 11:00 AM Copenhagen Time**). This 4-hour window is ideal for team standups, sprint reviews, and real-time pairing sessions.

### 5.2 Combined Holiday Calendars
- Danish national holidays (such as *Maundy Thursday*, *Great Prayer Day*, and *Constitution Day*) are observed in Copenhagen.
- Philippine national and special holidays (such as *Araw ng Kagitingan*, *Independence Day*, and *Rizal Day*) are observed in Manila.
- The **Holidays** tab displays both countries' holiday schedules side-by-side, preventing last-minute surprises when scheduling release deadlines.

### 5.3 Philippine Statutory & HR Support
The HR queue provides dedicated workflows for mandatory Philippine employee requirements:
- **BIR Form 2316** (Annual Certificate of Compensation Payment / Tax Withheld).
- **SSS, PhilHealth, and Pag-IBIG** government contribution verification and loan requests.
- **Certificate of Employment (COE)** generation for visa and bank applications.

---

## 6. Pre-Configured Test Accounts

You can test any role immediately using the password **`Password123!`**:

| Role / Title | Login Email | Department | Key Capabilities |
|---|---|---|---|
| **Super Admin** | `gamboa.khinandrei@gmail.com` | DevOps | Full access to all queues, analytics, user permissions, and policies |
| **DevOps Admin** | `devops@company.io` | DevOps | Technical ticket management, server configuration, IT escalation |
| **HR Manager** | `hr.manager@company.io` | Human Resources | Onboarding, leave requests, statutory benefit inquiries |
| **IT Specialist** | `it.specialist@company.io` | IT Support | Hardware asset allocation, laptop repair tracking, VPN setup |
| **Finance Officer** | `finance@company.io` | Finance | Expense claims, invoice inquiries, payroll schedules |
| **Client Developer 1** | `dev.arnel@company.io` | Client Team | Dedicated to Danish client; personal time clock and portal only |
| **Client Developer 2** | `dev.bianca@company.io` | Client Team | Dedicated to Danish client; personal time clock and portal only |

---

## 7. Frequently Asked Questions (FAQ)

**Q: Can client-dedicated developers see other client projects or internal company tickets?**  
*A: No. Privacy and data separation are strictly maintained. Dedicated developers can only view their own profile, their personal time clock, and the tickets they have raised.*

**Q: What happens if I forget to clock in or out?**  
*A: You can submit an adjustment request through the Time Requests tab, which notifies your team lead to approve the corrected time.*

**Q: Where can I download the official documentation PDFs?**  
*A: All compiled, high-resolution documentation PDFs are saved in the `documentation/pdf/` folder of this repository.*
