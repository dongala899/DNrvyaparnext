const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

function run(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`);
    shutdown(code || 0);
  });

  return child;
}

const children = [];
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

children.push(run('server', process.execPath, [path.join(root, 'server', 'index.cjs')]));
children.push(run('vite', path.join(root, 'node_modules', '.bin', 'vite'), []));
