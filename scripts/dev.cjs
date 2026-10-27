const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[1m\x1b[36m%s\x1b[0m', '=============================================================');
console.log('\x1b[1m\x1b[32m%s\x1b[0m', '  EMPLOYEE OPERATIONS HUB — DECOUPLED LOCAL APPS');
console.log('\x1b[1m\x1b[36m%s\x1b[0m', '=============================================================');
console.log('  App 1 (Employee Portal):  \x1b[1m\x1b[34mhttp://localhost:5173\x1b[0m');
console.log('  App 2 (Ticketing Desk):   \x1b[1m\x1b[35mhttp://localhost:5174\x1b[0m');
console.log('  Backend API (Supabase):   \x1b[1m\x1b[33mhttp://localhost:5000\x1b[0m');
console.log('\x1b[1m\x1b[36m%s\x1b[0m', '=============================================================');
console.log('Starting both independent Vite dev servers in parallel...\n');

const rootDir = path.resolve(__dirname, '..');

function startProcess(name, prefix, color, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const printWithPrefix = (data, isError = false) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        console.log(`${color}[${prefix}]\x1b[0m ${line}`);
      }
    });
  };

  child.stdout.on('data', (d) => printWithPrefix(d));
  child.stderr.on('data', (d) => printWithPrefix(d, true));

  child.on('error', (err) => {
    console.error(`${color}[${prefix}] ERROR:\x1b[0m`, err);
  });

  return child;
}

const portalProcess = startProcess(
  'Portal',
  'PORTAL:5173',
  '\x1b[34m',
  'npm',
  ['--prefix', 'apps/employee-portal', 'run', 'dev'],
  rootDir
);

const ticketsProcess = startProcess(
  'Tickets',
  'TICKETS:5174',
  '\x1b[35m',
  'npm',
  ['--prefix', 'apps/ticketing-desk', 'run', 'dev'],
  rootDir
);

function shutdown() {
  console.log('\nShutting down dev servers...');
  portalProcess.kill();
  ticketsProcess.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
