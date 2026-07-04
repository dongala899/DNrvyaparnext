const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const bcrypt = require('bcryptjs');
const { createSqliteAdapter } = require('../electron/adapters/sqlite-adapter.cjs');
const { createMigrationRunner } = require('../electron/adapters/migration-runner.cjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DOWNLOADS_DIR = path.join(DATA_DIR, 'downloads');
const BRANDING_DIR = path.join(DATA_DIR, 'branding');
for (const dir of [DATA_DIR, DOWNLOADS_DIR, BRANDING_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const fakeApp = {
  getPath(name) {
    if (name === 'downloads') return DOWNLOADS_DIR;
    return DATA_DIR;
  },
};

let storage = null;

async function initializeDatabase() {
  storage = createSqliteAdapter(fakeApp);
  await storage.init();

  const migrationRunner = createMigrationRunner(storage, fakeApp);
  const result = await migrationRunner.runAllMigrations();
  console.log(`[Server] Migrations complete: ${result.migrated} applied`);

  const existingAdmin = await storage.runQuery({
    table: 'auth_users',
    where: { username: 'admin' },
    limit: 1,
  });

  if (!existingAdmin.data || existingAdmin.data.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await storage.runQuery({
      type: 'insert',
      table: 'auth_users',
      values: {
        id: crypto.randomUUID(),
        username: 'admin',
        password_hash: hashedPassword,
        full_name: 'Administrator',
        role_id: 'admin',
        is_active: 1,
      },
    });
    console.log('[Server] Default admin user created (username: admin, password: admin123)');
  }
}

const TRIAL_FILE = path.join(DATA_DIR, '.trial_info');
function getTrialInfo() {
  try {
    if (fs.existsSync(TRIAL_FILE)) return JSON.parse(fs.readFileSync(TRIAL_FILE, 'utf8'));
  } catch (e) {}
  return null;
}
function saveTrialInfo(info) {
  fs.writeFileSync(TRIAL_FILE, JSON.stringify(info), 'utf8');
}
function getTrialStatus() {
  const stored = getTrialInfo();
  if (stored && stored.activatedKey) {
    return { type: 'licensed', key: stored.activatedKey, expiryDate: stored.expiryDate || null, valid: true };
  }
  const installDate = stored ? new Date(stored.installDate) : new Date();
  if (!stored) {
    saveTrialInfo({ installDate: installDate.toISOString() });
  }
  const daysElapsed = Math.floor((Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = 15 - daysElapsed;
  return { type: 'trial', daysLeft: Math.max(0, daysLeft), valid: daysLeft > 0 };
}

const handlers = {
  'storage:query': async (payload) => {
    try {
      return storage.runQuery(payload);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'storage:migrate': async (payload) => {
    try {
      return storage.runMigration(payload.name, payload.sql);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'storage:readFile': async ({ filePath } = {}) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      return { success: true, data: fs.readFileSync(filePath, 'utf8') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'auth:hashPassword': async ({ password }) => {
    const hash = await bcrypt.hash(password, 10);
    return { success: true, hash };
  },
  'auth:verifyPassword': async ({ hash, password }) => {
    const valid = await bcrypt.compare(password, hash);
    return { success: true, valid };
  },
  'license:validate': async ({ key } = {}) => {
    if (!key || typeof key !== 'string' || key.trim().length < 10) {
      return { success: false, error: 'Invalid license key' };
    }
    saveTrialInfo({ activatedKey: key.trim(), installDate: getTrialInfo()?.installDate || new Date().toISOString(), expiryDate: null });
    return { success: true, data: { valid: true } };
  },
  'license:getInfo': async () => ({ success: true, data: getTrialStatus() }),
  'license:activate': async ({ key } = {}) => {
    if (!key || typeof key !== 'string' || key.trim().length < 10) {
      return { success: false, error: 'Invalid license key. Minimum 10 characters.' };
    }
    saveTrialInfo({ activatedKey: key.trim(), installDate: getTrialInfo()?.installDate || new Date().toISOString(), expiryDate: null });
    return { success: true };
  },
  'print:savePdf': async ({ title, docData } = {}) => {
    try {
      const { generatePdf } = require('../electron/adapters/pdf-adapter.cjs');
      const safeName = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeName}_${Date.now()}.pdf`;
      const filePath = path.join(DOWNLOADS_DIR, fileName);
      return await generatePdf(docData, filePath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'print:send': async () => ({ success: true, sent: true }),
  'print:getPrinters': async () => ({ success: true, printers: [] }),
  'data:exportCsv': async ({ filename, content } = {}) => {
    try {
      const filePath = path.join(DOWNLOADS_DIR, filename);
      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'data:importCsv': async () => ({ success: false, canceled: true, error: 'File import dialogs are not available in the browser preview.' }),
  'branding:saveImage': async ({ companyId, kind, dataUrl } = {}) => {
    try {
      const base64 = dataUrl.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const dir = path.join(BRANDING_DIR, companyId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${kind}.png`);
      fs.writeFileSync(filePath, buffer);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'branding:deleteImage': async ({ companyId, kind } = {}) => {
    try {
      const filePath = path.join(BRANDING_DIR, companyId, `${kind}.png`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'storage:backupCreate': async (payload = {}) => {
    try {
      return await storage.backup.create(payload.type || 'sqlite');
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'storage:backupRestore': async (payload = {}) => {
    try {
      return await storage.backup.restore(payload.filename, payload.type || 'sqlite');
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'storage:exportJson': async () => ({ success: true, filePath: 'exports/current.json' }),
  'storage:importJson': async (payload = {}) => {
    try {
      return await storage.import.json(payload.filePath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  'storage:migrationRun': async (payload = {}) => {
    try {
      return await storage.migration.runOldApp(payload.sourcePath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

const PORT = process.env.PORT || 3001;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ipc') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { channel, payload } = JSON.parse(body || '{}');
        const handler = handlers[channel];
        if (!handler) {
          sendJson(res, 404, { success: false, error: `Unknown channel: ${channel}` });
          return;
        }
        const result = await handler(payload || {});
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 500, { success: false, error: error.message });
      }
    });
    return;
  }

  sendJson(res, 404, { success: false, error: 'Not found' });
});

initializeDatabase()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`[Server] Backend listening on http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[Server] Failed to initialize database:', error);
    process.exit(1);
  });
