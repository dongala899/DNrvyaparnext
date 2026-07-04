const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { createSqliteAdapter } = require('./adapters/sqlite-adapter.cjs');
const { createMigrationRunner } = require('./adapters/migration-runner.cjs');
const bcrypt = require('bcryptjs');

const LOG_PATH = path.join(process.cwd(), 'app-debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  try { fs.appendFileSync(LOG_PATH, line + '\n'); } catch(e) {}
  console.log(line);
}
log('=== APP STARTING ===');

let mainWindow = null;
let storage = null;

function getDistPath() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '..', 'dist', 'index.html');
  }
  return path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
}

function getPreloadPath() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, 'preload.js');
  }
  return path.join(process.resourcesPath, 'preload.js');
}

function createWindow() {
  const preloadPath = getPreloadPath();
  log('[Main] Preload path: ' + preloadPath);
  log('[Main] __dirname: ' + __dirname);
  log('[Main] resourcesPath: ' + (process.resourcesPath || 'N/A'));
  log('[Main] app.getAppPath(): ' + app.getAppPath());
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'DNR Vyapar Next',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(getDistPath());
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log('[Main] Page failed to load: ' + errorCode + ' - ' + errorDescription);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log('[Main] Render process gone: ' + JSON.stringify(details));
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    log('[Main] Preload error at ' + preloadPath + ': ' + error.message);
  });
}

async function initializeDatabase() {
  log('[Main] Initializing database...');
  try {
    storage = createSqliteAdapter(app);
    await storage.init();
    log('[Main] Database initialized');
  } catch (e) {
    log('[Main] Database init error: ' + e.message + '\n' + e.stack);
    throw e;
  }
  
  const migrationRunner = createMigrationRunner(storage, app);
  const result = await migrationRunner.runAllMigrations();
  log(`[Main] Migrations complete: ${result.migrated} applied`);

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
    log('[Main] Default admin user created (password: admin123)');
  }

  log('[Main] Database ready');
}

function registerAllIpcHandlers() {
  ipcMain.handle('storage:query', async (event, payload) => {
    try {
      const result = storage.runQuery(payload);
      return result;
    } catch (error) {
      console.error('[IPC] storage:query error:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('storage:migrate', async (event, payload) => {
    try {
      const result = storage.runMigration(payload.name, payload.sql);
      return result;
    } catch (error) {
      console.error('[IPC] storage:migrate error:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('storage:readFile', async (event, { filePath }) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:hashPassword', async (event, { password }) => {
    const hash = await bcrypt.hash(password, 10);
    return { success: true, hash };
  });

  ipcMain.handle('auth:verifyPassword', async (event, { hash, password }) => {
    const valid = await bcrypt.compare(password, hash);
    return { success: true, valid };
  });

  const TRIAL_FILE = path.join(app.getPath('userData'), '.trial_info');

  function getTrialInfo() {
    try {
      if (fs.existsSync(TRIAL_FILE)) {
        return JSON.parse(fs.readFileSync(TRIAL_FILE, 'utf8'));
      }
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

  ipcMain.handle('license:validate', async (event, { key }) => {
    if (!key || typeof key !== 'string' || key.trim().length < 10) {
      return { success: false, error: 'Invalid license key' };
    }
    saveTrialInfo({ activatedKey: key.trim(), installDate: getTrialInfo()?.installDate || new Date().toISOString(), expiryDate: null });
    return { success: true, data: { valid: true } };
  });

  ipcMain.handle('license:getInfo', async () => {
    const status = getTrialStatus();
    return { success: true, data: status };
  });

  ipcMain.handle('license:activate', async (event, { key }) => {
    if (!key || typeof key !== 'string' || key.trim().length < 10) {
      return { success: false, error: 'Invalid license key. Minimum 10 characters.' };
    }
    saveTrialInfo({ activatedKey: key.trim(), installDate: getTrialInfo()?.installDate || new Date().toISOString(), expiryDate: null });
    return { success: true };
  });

  ipcMain.handle('print:savePdf', async (event, { title, docData }) => {
    try {
      const { generatePdf } = require('./adapters/pdf-adapter.cjs');
      const downloadsDir = app.getPath('downloads');
      const safeName = (title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeName}_${Date.now()}.pdf`;
      const filePath = path.join(downloadsDir, fileName);
      const result = await generatePdf(docData, filePath);
      return result;
    } catch (error) {
      console.error('[PDF] Generation failed:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('print:send', async (event, { html, printer, copies = 1 }) => {
    console.log('[Print] Send to printer:', { printer, copies });
    return { success: true, sent: true };
  });

  ipcMain.handle('print:getPrinters', async () => {
    return { success: true, printers: [] };
  });

  ipcMain.handle('data:exportCsv', async (event, { filename, content }) => {
    try {
      const filePath = path.join(app.getPath('downloads'), filename);
      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('data:importCsv', async () => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, error: 'No focused window' };
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'CSV Files', extensions: ['csv'] }, { name: 'All Files', extensions: ['*'] }],
      });
      if (result.canceled || !result.filePaths?.length) {
        return { success: false, canceled: true };
      }
      const content = fs.readFileSync(result.filePaths[0], 'utf8');
      return { success: true, data: content, filePath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('branding:saveImage', async (event, { companyId, kind, dataUrl }) => {
    try {
      const base64 = dataUrl.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const dir = path.join(app.getPath('userData'), 'branding', companyId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${kind}.png`);
      fs.writeFileSync(filePath, buffer);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('branding:deleteImage', async (event, { companyId, kind }) => {
    try {
      const filePath = path.join(app.getPath('userData'), 'branding', companyId, `${kind}.png`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('storage:backupCreate', async (event, payload) => {
    try {
      const result = await storage.backup.create(payload.type || 'sqlite');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('storage:backupRestore', async (event, payload) => {
    try {
      const result = await storage.backup.restore(payload.filename, payload.type || 'sqlite');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('storage:exportJson', async () => {
    return { success: true, filePath: 'exports/current.json' };
  });

  ipcMain.handle('storage:importJson', async (event, payload) => {
    try {
      const result = await storage.import.json(payload.filePath);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('storage:migrationRun', async (event, payload) => {
    try {
      const result = await storage.migration.runOldApp(payload.sourcePath);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:openFile', async (event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No focused window' };
    const result = await win.webContents.showOpenDialog(win, {
      properties: ['openFile'],
      filters: options?.filters || [],
      defaultPath: options?.defaultPath,
    });
    return { success: !result.canceled, data: result.filePaths };
  });

  ipcMain.handle('dialog:saveFile', async (event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No focused window' };
    const result = await win.webContents.showSaveDialog(win, {
      filters: options?.filters || [],
      defaultPath: options?.defaultPath,
    });
    return { success: !result.canceled, data: result.filePath ? [result.filePath] : [] };
  });

  ipcMain.handle('dialog:messageBox', async (event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No focused window' };
    const result = await win.webContents.showMessageBox(win, {
      type: options?.type || 'info',
      title: options?.title || 'DNR Vyapar',
      message: options?.message || '',
      buttons: options?.buttons || ['OK'],
    });
    return { success: true, data: { buttonIndex: result.response } };
  });

  ipcMain.handle('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
    return { success: true };
  });

  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
    return { success: true };
  });

  ipcMain.handle('window:close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
    return { success: true };
  });

  console.log('[IPC] All handlers registered');
}

app.whenReady().then(async () => {
  log('App ready event fired');
  try {
    await initializeDatabase();
    log('Database initialized, registering IPC handlers');
    registerAllIpcHandlers();
    log('IPC handlers registered, creating window');
    createWindow();
    log('Window created, visible=' + mainWindow.isVisible());
  } catch (e) {
    log('FATAL: ' + e.message + '\n' + e.stack);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
log('whenReady callback registered');

app.on('window-all-closed', () => {
  log('All windows closed, platform=' + process.platform);
  if (storage) storage.close();
  if (process.platform !== 'darwin') {
    log('Quitting app');
    app.quit();
  }
});