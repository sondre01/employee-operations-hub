const { Pool } = require('pg');

function getDbConfig() {
  const raw = process.env.SUPABASE_DB_URL || 
              process.env.DATABASE_URL || 
              process.env.POSTGRES_URL || 
              'Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.hynwlirtofxkqzsxotia;Password=P@55w0rdKag!()!!;SSL Mode=Require;Trust Server Certificate=true;Pooling=true;SearchPath=employee_hub,public;';

  if (raw.startsWith('postgres://') || raw.startsWith('postgresql://')) {
    return {
      connectionString: raw,
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

module.exports = { getPool };
