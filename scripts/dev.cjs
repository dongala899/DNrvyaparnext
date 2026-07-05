const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');

function run(name, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...env },
  });

  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`);
    if (name !== 'electron') {
      shutdown(code || 0);
    }
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

if (process.platform === 'win32') {
  children.push(run('vite', 'cmd.exe', ['/c', path.join(root, 'node_modules', '.bin', 'vite.cmd')]));
} else {
  children.push(run('vite', path.join(root, 'node_modules', '.bin', 'vite'), []));
}

const electronExe = path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe');
if (fs.existsSync(electronExe)) {
  const electronEnv = { ...process.env, NODE_ENV: 'development' };
  delete electronEnv.ELECTRON_RUN_AS_NODE;
  const electronChild = spawn(electronExe, ['.'], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: electronEnv,
  });

  electronChild.on('exit', (code) => {
    console.log(`[dev] electron exited with code ${code}`);
    if (code !== 0) {
      console.warn('[dev] Electron failed, falling back to browser at http://localhost:5000');
      spawn('cmd.exe', ['/c', 'start', '', 'http://localhost:5000'], {
        cwd: root,
        stdio: 'ignore',
        shell: false,
        detached: true,
      }).unref();
    }
  });
} else {
  console.warn('[dev] Electron binary not found at', electronExe);
  spawn('cmd.exe', ['/c', 'start', '', 'http://localhost:5000'], {
    cwd: root,
    stdio: 'ignore',
    shell: false,
    detached: true,
  }).unref();
}
