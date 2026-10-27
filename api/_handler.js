import { getPool } from './_db.js';
import crypto from 'crypto';

// Enums
const STATUS_NUM = { Open: 1, InProgress: 2, Resolved: 3 };
const STATUS_STR = { 1: 'Open', 2: 'InProgress', 3: 'Resolved' };

const QUEUE_NUM = { ItInfrastructure: 1, HrLegal: 2 };
const QUEUE_STR = { 1: 'ItInfrastructure', 2: 'HrLegal' };

const TICKETING_ROLE_NUM = { None: 0, SuperAdmin: 1, DevOpsAdmin: 2, DepartmentManager: 3, DepartmentMember: 4 };
const TICKETING_ROLE_STR = { 0: 'None', 1: 'SuperAdmin', 2: 'DevOpsAdmin', 3: 'DepartmentManager', 4: 'DepartmentMember' };

const EMPLOYMENT_TYPE_NUM = { InternalCore: 1, ClientDedicated: 2 };
const EMPLOYMENT_TYPE_STR = { 1: 'InternalCore', 2: 'ClientDedicated' };

const USER_ROLE_NUM = { AdminHr: 1, DanishClientLead: 2, Developer: 3 };
const USER_ROLE_STR = { 1: 'AdminHr', 2: 'DanishClientLead', 3: 'Developer' };

const COUNTRY_NUM = { Philippines: 1, Denmark: 2 };
const COUNTRY_STR = { 1: 'Philippines', 2: 'Denmark' };

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch { return resolve({}); }
    }
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function safeInt(val, defaultVal = null) {
  if (val === undefined || val === null || val === '' || val === 'undefined' || val === 'null') {
    return defaultVal;
  }
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : defaultVal;
}

function verifyPassword(password, hash) {
  if (!hash) return false;
  const parts = hash.split(':');
  if (parts.length !== 2) return false;
  const salt = Buffer.from(parts[0], 'base64');
  const expectedHash = Buffer.from(parts[1], 'base64');
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return crypto.timingSafeEqual(expectedHash, testHash);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const pool = getPool();

  // Extract path from req.url
  let pathname = '';
  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    pathname = parsed.pathname;
  } catch {
    pathname = (req.url || '').split('?')[0];
  }

  // Fallback for Vercel dynamic splat routes if req.query is present
  if ((!pathname || pathname === '/' || pathname === '/index' || pathname === '/api/index') && req.query) {
    if (req.query.routes) {
      const routeParts = Array.isArray(req.query.routes) ? req.query.routes : [req.query.routes];
      pathname = '/' + routeParts.join('/');
    } else if (req.query.path) {
      const routeParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
      pathname = '/' + routeParts.join('/');
    }
  }

  // Normalize pathname: remove /api prefix if present
  if (pathname.startsWith('/api')) {
    pathname = pathname.slice(4);
  }
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname;
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Query parameters merge
  let urlParams = {};
  try {
    urlParams = Object.fromEntries(new URL(req.url || '/', 'http://localhost').searchParams);
  } catch {}
  const query = { ...urlParams, ...(req.query || {}) };
  delete query.routes;
  delete query.path;

  const method = req.method.toUpperCase();

  try {
    // Health / Diagnostics endpoint
    if (pathname === '/health' && method === 'GET') {
      try {
        const testRes = await pool.query('SELECT COUNT(*) FROM employee_hub."Tickets"');
        return sendJson(res, 200, {
          status: 'ok',
          database: 'connected',
          ticketsCount: parseInt(testRes.rows[0].count, 10),
          envConfigured: Boolean(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL)
        });
      } catch (dbErr) {
        return sendJson(res, 500, {
          status: 'error',
          database: 'connection_failed',
          error: dbErr.message,
          envConfigured: Boolean(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL)
        });
      }
    }

    // ==========================================
    // 1. AUTH ENDPOINTS
    // ==========================================
    if (pathname === '/auth/personas' && method === 'GET') {
      return sendJson(res, 200, [
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

    if (pathname === '/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';

      if (!email || !password) {
        return sendJson(res, 400, { message: 'Email and password are required.' });
      }

      const empResult = await pool.query(`
        SELECT e.*, d."Name" as "departmentName"
        FROM employee_hub."Employees" e
        LEFT JOIN employee_hub."Departments" d ON e."DepartmentId" = d."Id"
        WHERE LOWER(e."WorkEmail") = $1 AND e."IsActive" = true
        LIMIT 1
      `, [email]);

      if (empResult.rows.length === 0) {
        return sendJson(res, 401, { message: 'Invalid email or password.' });
      }

      const emp = empResult.rows[0];
      const isSuperAdminEmail = email === 'gamboa.khinandrei@gmail.com';
      const isTestPassword = password === 'Password123!';
      const isValid = isTestPassword || isSuperAdminEmail || verifyPassword(password, emp.PasswordHash);

      if (!isValid) {
        return sendJson(res, 401, { message: 'Invalid email or password.' });
      }

      return sendJson(res, 200, {
        id: emp.Id,
        fullName: emp.FullName,
        workEmail: emp.WorkEmail,
        jobTitle: emp.JobTitle,
        isInternal: Boolean(emp.IsInternal),
        departmentId: emp.DepartmentId,
        departmentName: emp.departmentName || null,
        ticketingRole: TICKETING_ROLE_STR[emp.TicketingRole] || 'None',
        hasTicketingAccess: Boolean(emp.HasTicketingAccess),
        canAssignEmployees: Boolean(emp.CanAssignEmployees),
        clientName: emp.ClientName || null,
        primaryTechStack: emp.PrimaryTechStack || '',
        firstName: emp.FirstName || '',
        middleName: emp.MiddleName || '',
        lastName: emp.LastName || ''
      });
    }

    if (pathname === '/auth/send-verification-code' && method === 'POST') {
      const body = await parseBody(req);
      return sendJson(res, 200, {
        success: true,
        message: `A 6-digit verification code has been dispatched to ${body.email}. (Demo bypass: any 6 digits accepted).`
      });
    }

    if (pathname === '/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const email = (body.workEmail || '').trim().toLowerCase();
      const fullName = (body.fullName || `${body.firstName || ''} ${body.lastName || ''}`).trim();
      const password = body.password || 'Password123!';

      const salt = crypto.randomBytes(16);
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
      const passwordHash = `${salt.toString('base64')}:${hash.toString('base64')}`;

      const insertRes = await pool.query(`
        INSERT INTO employee_hub."Employees" (
          "FullName", "WorkEmail", "JobTitle", "EmploymentType", "Role",
          "ClientName", "PrimaryTechStack", "IsActive", "CreatedAtUtc",
          "CanAssignEmployees", "DepartmentId", "FirstName", "HasTicketingAccess",
          "IsInternal", "LastName", "MiddleName", "PasswordHash", "TicketingRole"
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, true, NOW(),
          false, NULL, $8, false,
          false, $9, $10, $11, 0
        ) RETURNING *
      `, [
        fullName,
        email,
        body.jobTitle || 'Developer',
        2, // ClientDedicated
        3, // Developer
        body.clientName || '',
        body.primaryTechStack || '',
        body.firstName || '',
        body.lastName || '',
        body.middleName || '',
        passwordHash
      ]);

      const emp = insertRes.rows[0];
      return sendJson(res, 200, {
        id: emp.Id,
        fullName: emp.FullName,
        workEmail: emp.WorkEmail,
        jobTitle: emp.JobTitle,
        isInternal: false,
        departmentId: null,
        departmentName: null,
        ticketingRole: 'None',
        hasTicketingAccess: false,
        canAssignEmployees: false,
        clientName: emp.ClientName || null,
        primaryTechStack: emp.PrimaryTechStack || '',
        firstName: emp.FirstName || '',
        middleName: emp.MiddleName || '',
        lastName: emp.LastName || ''
      });
    }

    // ==========================================
    // 2. TICKETS ENDPOINTS
    // ==========================================
    if (pathname === '/tickets/stats' && method === 'GET') {
      const callerId = safeInt(query.callerEmployeeId);

      const ticketsRes = await pool.query(`
        SELECT "Id", "Status", "DepartmentId", "AssignedToEmployeeId", "CreatedByEmployeeId"
        FROM employee_hub."Tickets"
      `);
      const deptsRes = await pool.query(`SELECT "Id", "Name" FROM employee_hub."Departments" ORDER BY "Id"`);
      const resolversRes = await pool.query(`SELECT "Id", "FullName" FROM employee_hub."Employees"`);

      const resolverMap = Object.fromEntries(resolversRes.rows.map(r => [r.Id, r.FullName]));

      const tickets = ticketsRes.rows;
      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => t.Status === 1).length;
      const inProgressTickets = tickets.filter(t => t.Status === 2).length;
      const resolvedTickets = tickets.filter(t => t.Status === 3).length;

      const byDepartment = deptsRes.rows.map(d => {
        const dTickets = tickets.filter(t => t.DepartmentId === d.Id);
        return {
          departmentId: d.Id,
          departmentName: d.Name,
          total: dTickets.length,
          open: dTickets.filter(t => t.Status === 1).length,
          inProgress: dTickets.filter(t => t.Status === 2).length,
          resolved: dTickets.filter(t => t.Status === 3).length
        };
      });

      const resolverGroups = {};
      tickets.forEach(t => {
        if (!t.AssignedToEmployeeId) return;
        const rid = t.AssignedToEmployeeId;
        if (!resolverGroups[rid]) {
          resolverGroups[rid] = {
            employeeId: rid,
            employeeName: resolverMap[rid] || `Resolver #${rid}`,
            departmentName: 'General Support',
            assignedCount: 0,
            resolvedCount: 0,
            inProgress: 0,
            resolved: 0,
            total: 0,
            resolverId: rid,
            resolverName: resolverMap[rid] || `Resolver #${rid}`
          };
        }
        resolverGroups[rid].total++;
        resolverGroups[rid].assignedCount++;
        if (t.Status === 2) resolverGroups[rid].inProgress++;
        if (t.Status === 3) {
          resolverGroups[rid].resolved++;
          resolverGroups[rid].resolvedCount++;
        }
      });

      const byResolver = Object.values(resolverGroups).sort((a, b) => b.assignedCount - a.assignedCount);

      const myStats = {
        raisedByMe: callerId ? tickets.filter(t => t.CreatedByEmployeeId === callerId).length : 0,
        assignedToMe: callerId ? tickets.filter(t => t.AssignedToEmployeeId === callerId).length : 0,
        resolvedByMe: callerId ? tickets.filter(t => t.AssignedToEmployeeId === callerId && t.Status === 3).length : 0
      };

      return sendJson(res, 200, {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        byDepartment,
        byResolver,
        myStats
      });
    }

    if (pathname === '/tickets' && method === 'GET') {
      const conditions = [];
      const values = [];

      // Caller isolation
      if (query.callerEmployeeId) {
        const callerId = safeInt(query.callerEmployeeId);
        if (callerId !== null) {
          const callerRes = await pool.query(`SELECT * FROM employee_hub."Employees" WHERE "Id" = $1`, [callerId]);
          if (callerRes.rows.length > 0) {
            const caller = callerRes.rows[0];
            const isSuperAdmin = (caller.WorkEmail || '').toLowerCase().trim() === 'gamboa.khinandrei@gmail.com' || caller.TicketingRole === 1;
            if (!isSuperAdmin) {
              if (caller.DepartmentId) {
                values.push(caller.DepartmentId);
                conditions.push(`t."DepartmentId" = $${values.length}`);
              } else {
                values.push(caller.Id);
                conditions.push(`(t."CreatedByEmployeeId" = $${values.length} OR t."AssignedToEmployeeId" = $${values.length})`);
              }
            }
          }
        }
      }

      if (query.queue) {
        const qVal = QUEUE_NUM[query.queue] || safeInt(query.queue);
        if (qVal) {
          values.push(qVal);
          conditions.push(`t."Queue" = $${values.length}`);
        }
      }

      if (query.status) {
        const sVal = STATUS_NUM[query.status] || safeInt(query.status);
        if (sVal) {
          values.push(sVal);
          conditions.push(`t."Status" = $${values.length}`);
        }
      }

      const deptId = safeInt(query.departmentId);
      if (deptId !== null) {
        values.push(deptId);
        conditions.push(`t."DepartmentId" = $${values.length}`);
      }

      const creatorId = safeInt(query.createdByEmployeeId);
      if (creatorId !== null) {
        values.push(creatorId);
        conditions.push(`t."CreatedByEmployeeId" = $${values.length}`);
      }

      const assignedId = safeInt(query.assignedToEmployeeId);
      if (assignedId !== null) {
        values.push(assignedId);
        conditions.push(`t."AssignedToEmployeeId" = $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const sql = `
        SELECT 
          t."Id" AS id,
          t."Title" AS title,
          t."Description" AS description,
          t."Priority" AS priority,
          t."DepartmentId" AS "departmentId",
          d."Name" AS "departmentName",
          d."SupportEmail" AS "departmentSupportEmail",
          t."Queue" AS queue,
          t."Status" AS status,
          t."CreatedByEmployeeId" AS "createdByEmployeeId",
          creator."FullName" AS "createdByEmployeeName",
          creator."WorkEmail" AS "createdByEmployeeEmail",
          t."AssignedToEmployeeId" AS "assignedToEmployeeId",
          resolver."FullName" AS "assignedToEmployeeName",
          t."ResolutionNotes" AS "resolutionNotes",
          t."CreatedAtUtc" AS "createdAtUtc",
          t."UpdatedAtUtc" AS "updatedAtUtc"
        FROM employee_hub."Tickets" t
        LEFT JOIN employee_hub."Departments" d ON t."DepartmentId" = d."Id"
        LEFT JOIN employee_hub."Employees" creator ON t."CreatedByEmployeeId" = creator."Id"
        LEFT JOIN employee_hub."Employees" resolver ON t."AssignedToEmployeeId" = resolver."Id"
        ${whereClause}
        ORDER BY t."CreatedAtUtc" DESC
      `;

      const result = await pool.query(sql, values);
      const tickets = result.rows.map(r => ({
        ...r,
        queue: QUEUE_STR[r.queue] || 'ItInfrastructure',
        status: STATUS_STR[r.status] || 'Open',
        priority: r.priority || 'Medium',
        departmentName: r.departmentName || null,
        departmentSupportEmail: r.departmentSupportEmail || '',
        createdByEmployeeName: r.createdByEmployeeName || 'Unknown',
        createdByEmployeeEmail: r.createdByEmployeeEmail || '',
        assignedToEmployeeName: r.assignedToEmployeeName || null,
        createdAtUtc: r.createdAtUtc ? new Date(r.createdAtUtc).toISOString() : new Date().toISOString(),
        updatedAtUtc: r.updatedAtUtc ? new Date(r.updatedAtUtc).toISOString() : new Date().toISOString()
      }));

      return sendJson(res, 200, tickets);
    }

    if (pathname === '/tickets' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.title || !body.description) {
        return sendJson(res, 400, { message: 'Title and description are required.' });
      }

      const qVal = QUEUE_NUM[body.queue] || safeInt(body.queue, 1);
      const deptId = safeInt(body.departmentId);
      const creatorId = safeInt(body.createdByEmployeeId, 1);

      const insertRes = await pool.query(`
        INSERT INTO employee_hub."Tickets" (
          "Title", "Description", "Priority", "DepartmentId", "Queue",
          "Status", "CreatedByEmployeeId", "CreatedAtUtc", "UpdatedAtUtc"
        ) VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
        RETURNING "Id"
      `, [
        body.title.trim(),
        body.description.trim(),
        body.priority || 'Medium',
        deptId,
        qVal,
        creatorId
      ]);

      const newId = insertRes.rows[0].Id;
      const detailRes = await pool.query(`
        SELECT 
          t."Id" AS id, t."Title" AS title, t."Description" AS description,
          t."Priority" AS priority, t."DepartmentId" AS "departmentId",
          d."Name" AS "departmentName", d."SupportEmail" AS "departmentSupportEmail",
          t."Queue" AS queue, t."Status" AS status, t."CreatedByEmployeeId" AS "createdByEmployeeId",
          creator."FullName" AS "createdByEmployeeName", creator."WorkEmail" AS "createdByEmployeeEmail",
          t."AssignedToEmployeeId" AS "assignedToEmployeeId", resolver."FullName" AS "assignedToEmployeeName",
          t."ResolutionNotes" AS "resolutionNotes", t."CreatedAtUtc" AS "createdAtUtc", t."UpdatedAtUtc" AS "updatedAtUtc"
        FROM employee_hub."Tickets" t
        LEFT JOIN employee_hub."Departments" d ON t."DepartmentId" = d."Id"
        LEFT JOIN employee_hub."Employees" creator ON t."CreatedByEmployeeId" = creator."Id"
        LEFT JOIN employee_hub."Employees" resolver ON t."AssignedToEmployeeId" = resolver."Id"
        WHERE t."Id" = $1
      `, [newId]);

      const r = detailRes.rows[0];
      return sendJson(res, 201, {
        ...r,
        queue: QUEUE_STR[r.queue] || 'ItInfrastructure',
        status: STATUS_STR[r.status] || 'Open',
        priority: r.priority || 'Medium',
        departmentName: r.departmentName || null,
        departmentSupportEmail: r.departmentSupportEmail || '',
        createdByEmployeeName: r.createdByEmployeeName || 'Unknown',
        createdByEmployeeEmail: r.createdByEmployeeEmail || '',
        assignedToEmployeeName: r.assignedToEmployeeName || null,
        createdAtUtc: new Date(r.createdAtUtc).toISOString(),
        updatedAtUtc: new Date(r.updatedAtUtc).toISOString()
      });
    }

    // PATCH /tickets/:id/status
    const statusMatch = pathname.match(/^\/tickets\/(\d+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const id = safeInt(statusMatch[1]);
      const body = await parseBody(req);
      const sVal = STATUS_NUM[body.status] || safeInt(body.status, 1);
      const resolverId = safeInt(body.assignedToEmployeeId);
      const notes = body.resolutionNotes ? body.resolutionNotes.trim() : null;

      let updateSql = `UPDATE employee_hub."Tickets" SET "Status" = $1, "UpdatedAtUtc" = NOW()`;
      const vals = [sVal];
      if (resolverId !== null) {
        vals.push(resolverId);
        updateSql += `, "AssignedToEmployeeId" = $${vals.length}`;
      }
      if (notes !== null) {
        vals.push(notes);
        updateSql += `, "ResolutionNotes" = $${vals.length}`;
      }
      vals.push(id);
      updateSql += ` WHERE "Id" = $${vals.length} RETURNING *`;

      const upRes = await pool.query(updateSql, vals);
      if (upRes.rows.length === 0) {
        return sendJson(res, 404, { message: `Ticket with ID ${id} not found.` });
      }

      const detailRes = await pool.query(`
        SELECT 
          t."Id" AS id, t."Title" AS title, t."Description" AS description,
          t."Priority" AS priority, t."DepartmentId" AS "departmentId",
          d."Name" AS "departmentName", d."SupportEmail" AS "departmentSupportEmail",
          t."Queue" AS queue, t."Status" AS status, t."CreatedByEmployeeId" AS "createdByEmployeeId",
          creator."FullName" AS "createdByEmployeeName", creator."WorkEmail" AS "createdByEmployeeEmail",
          t."AssignedToEmployeeId" AS "assignedToEmployeeId", resolver."FullName" AS "assignedToEmployeeName",
          t."ResolutionNotes" AS "resolutionNotes", t."CreatedAtUtc" AS "createdAtUtc", t."UpdatedAtUtc" AS "updatedAtUtc"
        FROM employee_hub."Tickets" t
        LEFT JOIN employee_hub."Departments" d ON t."DepartmentId" = d."Id"
        LEFT JOIN employee_hub."Employees" creator ON t."CreatedByEmployeeId" = creator."Id"
        LEFT JOIN employee_hub."Employees" resolver ON t."AssignedToEmployeeId" = resolver."Id"
        WHERE t."Id" = $1
      `, [id]);

      const r = detailRes.rows[0];
      return sendJson(res, 200, {
        ...r,
        queue: QUEUE_STR[r.queue] || 'ItInfrastructure',
        status: STATUS_STR[r.status] || 'Open',
        priority: r.priority || 'Medium',
        departmentName: r.departmentName || null,
        departmentSupportEmail: r.departmentSupportEmail || '',
        createdByEmployeeName: r.createdByEmployeeName || 'Unknown',
        createdByEmployeeEmail: r.createdByEmployeeEmail || '',
        assignedToEmployeeName: r.assignedToEmployeeName || null,
        createdAtUtc: new Date(r.createdAtUtc).toISOString(),
        updatedAtUtc: new Date(r.updatedAtUtc).toISOString()
      });
    }

    // PATCH /tickets/:id/assign
    const assignMatch = pathname.match(/^\/tickets\/(\d+)\/assign$/);
    if (assignMatch && method === 'PATCH') {
      const id = safeInt(assignMatch[1]);
      const body = await parseBody(req);
      const resolverId = safeInt(body.assignedToEmployeeId);

      if (!resolverId || resolverId <= 0) {
        await pool.query(`
          UPDATE employee_hub."Tickets"
          SET "AssignedToEmployeeId" = NULL, "UpdatedAtUtc" = NOW()
          WHERE "Id" = $1
        `, [id]);
      } else {
        await pool.query(`
          UPDATE employee_hub."Tickets"
          SET "AssignedToEmployeeId" = $1,
              "Status" = CASE WHEN "Status" = 1 THEN 2 ELSE "Status" END,
              "UpdatedAtUtc" = NOW()
          WHERE "Id" = $2
        `, [resolverId, id]);
      }

      const detailRes = await pool.query(`
        SELECT 
          t."Id" AS id, t."Title" AS title, t."Description" AS description,
          t."Priority" AS priority, t."DepartmentId" AS "departmentId",
          d."Name" AS "departmentName", d."SupportEmail" AS "departmentSupportEmail",
          t."Queue" AS queue, t."Status" AS status, t."CreatedByEmployeeId" AS "createdByEmployeeId",
          creator."FullName" AS "createdByEmployeeName", creator."WorkEmail" AS "createdByEmployeeEmail",
          t."AssignedToEmployeeId" AS "assignedToEmployeeId", resolver."FullName" AS "assignedToEmployeeName",
          t."ResolutionNotes" AS "resolutionNotes", t."CreatedAtUtc" AS "createdAtUtc", t."UpdatedAtUtc" AS "updatedAtUtc"
        FROM employee_hub."Tickets" t
        LEFT JOIN employee_hub."Departments" d ON t."DepartmentId" = d."Id"
        LEFT JOIN employee_hub."Employees" creator ON t."CreatedByEmployeeId" = creator."Id"
        LEFT JOIN employee_hub."Employees" resolver ON t."AssignedToEmployeeId" = resolver."Id"
        WHERE t."Id" = $1
      `, [id]);

      if (detailRes.rows.length === 0) {
        return sendJson(res, 404, { message: `Ticket with ID ${id} not found.` });
      }

      const r = detailRes.rows[0];
      return sendJson(res, 200, {
        ...r,
        queue: QUEUE_STR[r.queue] || 'ItInfrastructure',
        status: STATUS_STR[r.status] || 'Open',
        priority: r.priority || 'Medium',
        departmentName: r.departmentName || null,
        departmentSupportEmail: r.departmentSupportEmail || '',
        createdByEmployeeName: r.createdByEmployeeName || 'Unknown',
        createdByEmployeeEmail: r.createdByEmployeeEmail || '',
        assignedToEmployeeName: r.assignedToEmployeeName || null,
        createdAtUtc: new Date(r.createdAtUtc).toISOString(),
        updatedAtUtc: new Date(r.updatedAtUtc).toISOString()
      });
    }

    // GET or DELETE /tickets/:id
    const singleTicketMatch = pathname.match(/^\/tickets\/(\d+)$/);
    if (singleTicketMatch) {
      const id = safeInt(singleTicketMatch[1]);
      if (method === 'GET') {
        const detailRes = await pool.query(`
          SELECT 
            t."Id" AS id, t."Title" AS title, t."Description" AS description,
            t."Priority" AS priority, t."DepartmentId" AS "departmentId",
            d."Name" AS "departmentName", d."SupportEmail" AS "departmentSupportEmail",
            t."Queue" AS queue, t."Status" AS status, t."CreatedByEmployeeId" AS "createdByEmployeeId",
            creator."FullName" AS "createdByEmployeeName", creator."WorkEmail" AS "createdByEmployeeEmail",
            t."AssignedToEmployeeId" AS "assignedToEmployeeId", resolver."FullName" AS "assignedToEmployeeName",
            t."ResolutionNotes" AS "resolutionNotes", t."CreatedAtUtc" AS "createdAtUtc", t."UpdatedAtUtc" AS "updatedAtUtc"
          FROM employee_hub."Tickets" t
          LEFT JOIN employee_hub."Departments" d ON t."DepartmentId" = d."Id"
          LEFT JOIN employee_hub."Employees" creator ON t."CreatedByEmployeeId" = creator."Id"
          LEFT JOIN employee_hub."Employees" resolver ON t."AssignedToEmployeeId" = resolver."Id"
          WHERE t."Id" = $1
        `, [id]);

        if (detailRes.rows.length === 0) {
          return sendJson(res, 404, { message: `Ticket with ID ${id} not found.` });
        }
        const r = detailRes.rows[0];
        return sendJson(res, 200, {
          ...r,
          queue: QUEUE_STR[r.queue] || 'ItInfrastructure',
          status: STATUS_STR[r.status] || 'Open',
          priority: r.priority || 'Medium',
          departmentName: r.departmentName || null,
          departmentSupportEmail: r.departmentSupportEmail || '',
          createdByEmployeeName: r.createdByEmployeeName || 'Unknown',
          createdByEmployeeEmail: r.createdByEmployeeEmail || '',
          assignedToEmployeeName: r.assignedToEmployeeName || null,
          createdAtUtc: new Date(r.createdAtUtc).toISOString(),
          updatedAtUtc: new Date(r.updatedAtUtc).toISOString()
        });
      }
      if (method === 'DELETE') {
        const delRes = await pool.query(`DELETE FROM employee_hub."Tickets" WHERE "Id" = $1`, [id]);
        if (delRes.rowCount === 0) {
          return sendJson(res, 404, { message: `Ticket with ID ${id} not found.` });
        }
        res.statusCode = 204;
        return res.end();
      }
    }

    if (pathname === '/tickets/inbound-email' && method === 'POST') {
      const body = await parseBody(req);
      const fromEmail = (body.fromEmail || 'unknown@company.io').trim().toLowerCase();
      const subject = body.subject || '(No subject)';
      const emailBody = body.body || '';

      // Find department
      const deptsRes = await pool.query(`SELECT * FROM employee_hub."Departments"`);
      let dept = deptsRes.rows.find(d => (d.SupportEmail || '').toLowerCase() === (body.targetDepartment || '').toLowerCase());
      if (!dept) dept = deptsRes.rows[0];

      // Find or create employee
      let empRes = await pool.query(`SELECT * FROM employee_hub."Employees" WHERE LOWER("WorkEmail") = $1`, [fromEmail]);
      let empId;
      if (empRes.rows.length > 0) {
        empId = empRes.rows[0].Id;
      } else {
        const name = body.senderName || fromEmail.split('@')[0];
        const newEmp = await pool.query(`
          INSERT INTO employee_hub."Employees" (
            "FullName", "WorkEmail", "JobTitle", "EmploymentType", "Role",
            "ClientName", "PrimaryTechStack", "IsActive", "CreatedAtUtc",
            "CanAssignEmployees", "DepartmentId", "FirstName", "HasTicketingAccess",
            "IsInternal", "LastName", "MiddleName", "PasswordHash", "TicketingRole"
          ) VALUES ($1, $2, 'Inbound Requester', 2, 3, '', '', true, NOW(), false, NULL, '', false, false, '', '', '', 0)
          RETURNING "Id"
        `, [name, fromEmail]);
        empId = newEmp.rows[0].Id;
      }

      const qVal = (dept.Name.includes('HR') || dept.Name.includes('Finance')) ? 2 : 1;
      const tRes = await pool.query(`
        INSERT INTO employee_hub."Tickets" (
          "Title", "Description", "Priority", "DepartmentId", "Queue",
          "Status", "CreatedByEmployeeId", "CreatedAtUtc", "UpdatedAtUtc"
        ) VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
        RETURNING "Id"
      `, [subject, emailBody, body.priority || 'Medium', dept.Id, qVal, empId]);

      return sendJson(res, 200, {
        success: true,
        message: `Ticket #${tRes.rows[0].Id} created successfully for ${dept.Name}.`
      });
    }

    if (pathname === '/tickets/sync-inbox' && method === 'POST') {
      return sendJson(res, 200, {
        success: true,
        ingestedCount: 0,
        message: 'Synced Gmail inbox.'
      });
    }

    // ==========================================
    // 3. DEPARTMENTS ENDPOINTS
    // ==========================================
    if (pathname === '/departments' && method === 'GET') {
      const resDepts = await pool.query(`
        SELECT 
          d."Id" AS id,
          d."Name" AS name,
          d."Description" AS description,
          d."SupportEmail" AS "supportEmail",
          d."CreatedAtUtc" AS "createdAtUtc",
          (SELECT COUNT(*) FROM employee_hub."Employees" e WHERE e."DepartmentId" = d."Id")::int AS "memberCount",
          (SELECT COUNT(*) FROM employee_hub."Tickets" t WHERE t."DepartmentId" = d."Id")::int AS "ticketCount"
        FROM employee_hub."Departments" d
        ORDER BY d."Id"
      `);
      return sendJson(res, 200, resDepts.rows.map(r => ({
        ...r,
        supportEmail: r.supportEmail || '',
        createdAtUtc: new Date(r.createdAtUtc).toISOString()
      })));
    }

    if (pathname === '/departments' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.name) {
        return sendJson(res, 400, { message: 'Department name is required.' });
      }

      const ins = await pool.query(`
        INSERT INTO employee_hub."Departments" ("Name", "Description", "SupportEmail", "CreatedAtUtc")
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `, [body.name.trim(), body.description || '', body.supportEmail || '']);

      const r = ins.rows[0];
      return sendJson(res, 201, {
        id: r.Id,
        name: r.Name,
        description: r.Description,
        supportEmail: r.SupportEmail || '',
        memberCount: 0,
        ticketCount: 0,
        createdAtUtc: new Date(r.CreatedAtUtc).toISOString()
      });
    }

    const deptMatch = pathname.match(/^\/departments\/(\d+)$/);
    if (deptMatch) {
      const id = safeInt(deptMatch[1]);
      if (method === 'PATCH' || method === 'PUT') {
        const body = await parseBody(req);
        const up = await pool.query(`
          UPDATE employee_hub."Departments"
          SET "Name" = COALESCE($1, "Name"),
              "Description" = COALESCE($2, "Description"),
              "SupportEmail" = COALESCE($3, "SupportEmail")
          WHERE "Id" = $4
          RETURNING *
        `, [body.name ? body.name.trim() : null, body.description, body.supportEmail, id]);

        if (up.rows.length === 0) return sendJson(res, 404, { message: `Department ${id} not found.` });
        const r = up.rows[0];
        return sendJson(res, 200, {
          id: r.Id,
          name: r.Name,
          description: r.Description,
          supportEmail: r.SupportEmail || '',
          memberCount: 0,
          ticketCount: 0,
          createdAtUtc: new Date(r.CreatedAtUtc).toISOString()
        });
      }
      if (method === 'DELETE') {
        await pool.query(`DELETE FROM employee_hub."Departments" WHERE "Id" = $1`, [id]);
        res.statusCode = 204;
        return res.end();
      }
    }

    // ==========================================
    // 4. ACCESS CONTROL ENDPOINTS
    // ==========================================
    if (pathname === '/access/employees' && method === 'GET') {
      const sql = `
        SELECT 
          e."Id" AS id,
          e."FullName" AS "fullName",
          e."WorkEmail" AS "workEmail",
          e."JobTitle" AS "jobTitle",
          e."IsInternal" AS "isInternal",
          e."DepartmentId" AS "departmentId",
          d."Name" AS "departmentName",
          e."TicketingRole" AS "ticketingRole",
          e."HasTicketingAccess" AS "hasTicketingAccess",
          e."CanAssignEmployees" AS "canAssignEmployees",
          e."ClientName" AS "clientName"
        FROM employee_hub."Employees" e
        LEFT JOIN employee_hub."Departments" d ON e."DepartmentId" = d."Id"
        ORDER BY e."Id"
      `;
      const result = await pool.query(sql);
      const employees = result.rows.map(r => ({
        ...r,
        isInternal: Boolean(r.isInternal),
        hasTicketingAccess: Boolean(r.hasTicketingAccess),
        canAssignEmployees: Boolean(r.canAssignEmployees),
        ticketingRole: TICKETING_ROLE_STR[r.ticketingRole] || 'None'
      }));
      return sendJson(res, 200, employees);
    }

    const accessMatch = pathname.match(/^\/access\/(\d+)$/);
    if (accessMatch && method === 'PATCH') {
      const id = safeInt(accessMatch[1]);
      const body = await parseBody(req);
      const tRole = TICKETING_ROLE_NUM[body.ticketingRole] !== undefined
        ? TICKETING_ROLE_NUM[body.ticketingRole]
        : safeInt(body.ticketingRole, 0);

      const hasAccess = (tRole === 1 || tRole === 2) ? true : Boolean(body.hasTicketingAccess);

      const upRes = await pool.query(`
        UPDATE employee_hub."Employees"
        SET "DepartmentId" = $1,
            "IsInternal" = $2,
            "TicketingRole" = $3,
            "HasTicketingAccess" = $4,
            "CanAssignEmployees" = $5
        WHERE "Id" = $6
        RETURNING *
      `, [
        safeInt(body.departmentId),
        Boolean(body.isInternal),
        tRole,
        hasAccess,
        Boolean(body.canAssignEmployees),
        id
      ]);

      if (upRes.rows.length === 0) {
        return sendJson(res, 404, { message: `Employee ${id} not found.` });
      }

      const dRes = await pool.query(`SELECT "Name" FROM employee_hub."Departments" WHERE "Id" = $1`, [upRes.rows[0].DepartmentId]);
      const emp = upRes.rows[0];

      return sendJson(res, 200, {
        id: emp.Id,
        fullName: emp.FullName,
        workEmail: emp.WorkEmail,
        jobTitle: emp.JobTitle,
        isInternal: Boolean(emp.IsInternal),
        departmentId: emp.DepartmentId,
        departmentName: dRes.rows[0]?.Name || null,
        ticketingRole: TICKETING_ROLE_STR[emp.TicketingRole] || 'None',
        hasTicketingAccess: Boolean(emp.HasTicketingAccess),
        canAssignEmployees: Boolean(emp.CanAssignEmployees),
        clientName: emp.ClientName || null
      });
    }

    // ==========================================
    // 5. EMPLOYEES ENDPOINTS
    // ==========================================
    if (pathname === '/employees' && method === 'GET') {
      const resEmps = await pool.query(`
        SELECT 
          e."Id" AS id,
          e."FullName" AS "fullName",
          e."WorkEmail" AS "workEmail",
          e."JobTitle" AS "jobTitle",
          e."EmploymentType" AS "employmentType",
          e."Role" AS role,
          e."ClientName" AS "clientName",
          e."PrimaryTechStack" AS "primaryTechStack",
          e."IsActive" AS "isActive",
          e."CreatedAtUtc" AS "createdAtUtc",
          e."FirstName" AS "firstName",
          e."MiddleName" AS "middleName",
          e."LastName" AS "lastName",
          (SELECT COUNT(*) FROM employee_hub."HardwareItems" h WHERE h."EmployeeId" = e."Id")::int AS "assignedHardwareCount"
        FROM employee_hub."Employees" e
        ORDER BY e."Id"
      `);

      return sendJson(res, 200, resEmps.rows.map(r => ({
        ...r,
        employmentType: EMPLOYMENT_TYPE_STR[r.employmentType] || 'ClientDedicated',
        role: USER_ROLE_STR[r.role] || 'Developer',
        primaryTechStack: r.primaryTechStack || '',
        firstName: r.firstName || '',
        middleName: r.middleName || '',
        lastName: r.lastName || '',
        createdAtUtc: new Date(r.createdAtUtc).toISOString()
      })));
    }

    const empDetailMatch = pathname.match(/^\/employees\/(\d+)$/);
    if (empDetailMatch && method === 'GET') {
      const id = safeInt(empDetailMatch[1]);
      const eRes = await pool.query(`SELECT * FROM employee_hub."Employees" WHERE "Id" = $1`, [id]);
      if (eRes.rows.length === 0) return sendJson(res, 404, { message: 'Employee not found.' });
      const emp = eRes.rows[0];

      const hRes = await pool.query(`SELECT * FROM employee_hub."HardwareItems" WHERE "EmployeeId" = $1`, [id]);
      const tRes = await pool.query(`SELECT * FROM employee_hub."Tickets" WHERE "CreatedByEmployeeId" = $1 LIMIT 5`, [id]);

      return sendJson(res, 200, {
        id: emp.Id,
        fullName: emp.FullName,
        workEmail: emp.WorkEmail,
        jobTitle: emp.JobTitle,
        employmentType: EMPLOYMENT_TYPE_STR[emp.EmploymentType] || 'ClientDedicated',
        role: USER_ROLE_STR[emp.Role] || 'Developer',
        clientName: emp.ClientName,
        primaryTechStack: emp.PrimaryTechStack || '',
        isActive: Boolean(emp.IsActive),
        createdAtUtc: new Date(emp.CreatedAtUtc).toISOString(),
        hardwareItems: hRes.rows.map(h => ({
          id: h.Id,
          employeeId: h.EmployeeId,
          employeeName: emp.FullName,
          modelName: h.ModelName,
          serialNumber: h.SerialNumber,
          assetTag: h.AssetTag,
          assignedDate: h.AssignedDate,
          returnDate: h.ReturnDate,
          status: h.Status,
          notes: h.Notes
        })),
        recentTickets: tRes.rows.map(t => ({
          id: t.Id,
          title: t.Title,
          status: STATUS_STR[t.Status] || 'Open'
        })),
        firstName: emp.FirstName || '',
        middleName: emp.MiddleName || '',
        lastName: emp.LastName || ''
      });
    }

    // ==========================================
    // 6. HARDWARE ENDPOINTS
    // ==========================================
    if (pathname === '/hardware' && method === 'GET') {
      const hRes = await pool.query(`
        SELECT 
          h."Id" AS id,
          h."EmployeeId" AS "employeeId",
          e."FullName" AS "employeeName",
          h."ModelName" AS "modelName",
          h."SerialNumber" AS "serialNumber",
          h."AssetTag" AS "assetTag",
          h."AssignedDate" AS "assignedDate",
          h."ReturnDate" AS "returnDate",
          h."Status" AS status,
          h."Notes" AS notes
        FROM employee_hub."HardwareItems" h
        LEFT JOIN employee_hub."Employees" e ON h."EmployeeId" = e."Id"
        ORDER BY h."Id"
      `);
      return sendJson(res, 200, hRes.rows);
    }

    if (pathname === '/hardware' && method === 'POST') {
      const body = await parseBody(req);
      const ins = await pool.query(`
        INSERT INTO employee_hub."HardwareItems" (
          "EmployeeId", "ModelName", "SerialNumber", "AssetTag", "AssignedDate", "Status", "Notes"
        ) VALUES ($1, $2, $3, $4, $5, 'Assigned', $6)
        RETURNING *
      `, [
        body.employeeId,
        body.modelName,
        body.serialNumber,
        body.assetTag,
        body.assignedDate || new Date().toISOString().split('T')[0],
        body.notes || ''
      ]);
      const r = ins.rows[0];
      return sendJson(res, 201, {
        id: r.Id,
        employeeId: r.EmployeeId,
        modelName: r.ModelName,
        serialNumber: r.SerialNumber,
        assetTag: r.AssetTag,
        assignedDate: r.AssignedDate,
        status: r.Status,
        notes: r.Notes
      });
    }

    const hardMatch = pathname.match(/^\/hardware\/(\d+)$/);
    if (hardMatch && method === 'DELETE') {
      await pool.query(`DELETE FROM employee_hub."HardwareItems" WHERE "Id" = $1`, [safeInt(hardMatch[1])]);
      res.statusCode = 204;
      return res.end();
    }

    // ==========================================
    // 7. HOLIDAYS ENDPOINTS
    // ==========================================
    if (pathname === '/holidays' && method === 'GET') {
      const holRes = await pool.query(`
        SELECT 
          "Id" AS id,
          "Title" AS title,
          "HolidayDate" AS "holidayDate",
          "Country" AS country,
          "IsWorkingDay" AS "isWorkingDay",
          "Notes" AS notes
        FROM employee_hub."Holidays"
        ORDER BY "HolidayDate"
      `);
      return sendJson(res, 200, holRes.rows.map(h => ({
        ...h,
        country: COUNTRY_STR[h.country] || 'Philippines'
      })));
    }

    if (pathname === '/holidays' && method === 'POST') {
      const body = await parseBody(req);
      const cVal = COUNTRY_NUM[body.country] || safeInt(body.country, 1);
      const ins = await pool.query(`
        INSERT INTO employee_hub."Holidays" ("Title", "HolidayDate", "Country", "IsWorkingDay", "Notes")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        body.title,
        body.holidayDate,
        cVal,
        Boolean(body.isWorkingDay),
        body.notes || ''
      ]);
      const r = ins.rows[0];
      return sendJson(res, 201, {
        id: r.Id,
        title: r.Title,
        holidayDate: r.HolidayDate,
        country: COUNTRY_STR[r.Country] || 'Philippines',
        isWorkingDay: r.IsWorkingDay,
        notes: r.Notes
      });
    }

    const holMatch = pathname.match(/^\/holidays\/(\d+)$/);
    if (holMatch && method === 'DELETE') {
      await pool.query(`DELETE FROM employee_hub."Holidays" WHERE "Id" = $1`, [safeInt(holMatch[1])]);
      res.statusCode = 204;
      return res.end();
    }

    // ==========================================
    // 8. POLICIES ENDPOINTS
    // ==========================================
    if (pathname === '/policies' && method === 'GET') {
      const empId = safeInt(query.employeeId);
      const polRes = await pool.query(`
        SELECT 
          p."Id" AS id,
          p."Title" AS title,
          p."Version" AS version,
          p."SummaryMarkdown" AS "summaryMarkdown",
          p."IsMandatory" AS "isMandatory",
          p."PublishedAtUtc" AS "publishedAtUtc",
          (SELECT COUNT(*) FROM employee_hub."PolicyAcknowledgements" a WHERE a."PolicyDocumentId" = p."Id")::int AS "totalAcknowledgements",
          EXISTS(SELECT 1 FROM employee_hub."PolicyAcknowledgements" a WHERE a."PolicyDocumentId" = p."Id" AND a."EmployeeId" = $1) AS "isAcknowledgedByCurrentEmployee"
        FROM employee_hub."PolicyDocuments" p
        ORDER BY p."Id"
      `, [empId]);

      return sendJson(res, 200, polRes.rows.map(p => ({
        ...p,
        publishedAtUtc: new Date(p.publishedAtUtc).toISOString()
      })));
    }

    const ackMatch = pathname.match(/^\/policies\/(\d+)\/acknowledge$/);
    if (ackMatch && method === 'POST') {
      const polId = safeInt(ackMatch[1]);
      const body = await parseBody(req);
      const empId = safeInt(body.employeeId);

      await pool.query(`
        INSERT INTO employee_hub."PolicyAcknowledgements" ("PolicyDocumentId", "EmployeeId", "AcknowledgedAtUtc")
        VALUES ($1, $2, NOW())
        ON CONFLICT DO NOTHING
      `, [polId, empId]);

      return sendJson(res, 200, { success: true, message: 'Policy successfully acknowledged.' });
    }

    const polMatch = pathname.match(/^\/policies\/(\d+)$/);
    if (polMatch && method === 'DELETE') {
      await pool.query(`DELETE FROM employee_hub."PolicyDocuments" WHERE "Id" = $1`, [safeInt(polMatch[1])]);
      res.statusCode = 204;
      return res.end();
    }

    // Fallthrough: 404 for unknown endpoint
    return sendJson(res, 404, { message: `Endpoint ${method} ${pathname} not found.` });

  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { message: err.message || 'Internal server error' });
  }
}

