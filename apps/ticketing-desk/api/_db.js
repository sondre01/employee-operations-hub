import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg.default || pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase live pooler default fallback (AWS Tokyo pooler for this project)
const DEFAULT_SUPABASE_URL = 'postgresql://postgres.hynwlirtofxkqzsxotia:P%4055w0rdKag%21%28%29%21%21@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

function getDbConfig() {
  let raw = process.env.SUPABASE_DB_URL || 
            process.env.DATABASE_URL || 
            process.env.POSTGRES_URL || 
            process.env.POSTGRES_PRISMA_URL ||
            process.env.POSTGRES_URL_NON_POOLING;

  // Check individual environment variables (Vercel Postgres / standard PG)
  if (!raw && (process.env.POSTGRES_HOST || process.env.PGHOST)) {
    return {
      host: process.env.POSTGRES_HOST || process.env.PGHOST,
      port: parseInt(process.env.POSTGRES_PORT || process.env.PGPORT || '5432', 10),
      database: process.env.POSTGRES_DATABASE || process.env.PGDATABASE || 'postgres',
      user: process.env.POSTGRES_USER || process.env.PGUSER,
      password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false }
    };
  }

  // Local fallback: load connection string from backend appsettings.json if on local disk
  if (!raw) {
    const candidatePaths = [
      path.resolve(__dirname, '../backend/src/EmployeeHub.Api/appsettings.json'),
      path.resolve(__dirname, '../../backend/src/EmployeeHub.Api/appsettings.json'),
      path.resolve(__dirname, '../../../backend/src/EmployeeHub.Api/appsettings.json'),
      path.resolve(process.cwd(), 'backend/src/EmployeeHub.Api/appsettings.json')
    ];
    for (const cp of candidatePaths) {
      if (fs.existsSync(cp)) {
        try {
          const cfg = JSON.parse(fs.readFileSync(cp, 'utf8'));
          raw = cfg?.ConnectionStrings?.DefaultConnection;
          if (raw) break;
        } catch {}
      }
    }
  }

  // Production fallback to ensure Vercel never crashes even if env vars weren't redeployed
  if (!raw) {
    raw = DEFAULT_SUPABASE_URL;
  }

  if (raw.startsWith('postgres://') || raw.startsWith('postgresql://')) {
    // Strip ?sslmode=... from connection string to allow ssl: { rejectUnauthorized: false } for Supabase poolers
    const cleanConnStr = raw.replace(/[?&]sslmode=[^&]+/g, '').replace(/\?$/, '');
    return {
      connectionString: cleanConnStr,
      ssl: { rejectUnauthorized: false }
    };
  }

  const parts = raw.split(';').map(p => p.trim()).filter(Boolean);
  const config = { ssl: { rejectUnauthorized: false } };
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim().toLowerCase();
    const val = part.slice(eqIdx + 1).trim();
    if (key === 'host') config.host = val;
    else if (key === 'port') config.port = parseInt(val, 10);
    else if (key === 'database') config.database = val;
    else if (key === 'username' || key === 'user id' || key === 'uid') config.user = val;
    else if (key === 'password' || key === 'pwd') config.password = val;
  }
  return config;
}

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      ...getDbConfig(),
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export { getPool };
