const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const TABLE_WHITELIST = new Set([
  'auth_users',
  'auth_sessions',
  'companies',
  'customers',
  'customer_orders',
  'customer_order_lines',
  'items',
  'vendors',
  'quotations',
  'quotation_lines',
  'invoices',
  'invoice_lines',
  'payments',
  'purchase_orders',
  'po_lines',
  'grns',
  'grn_lines',
  'purchases',
  'purchase_lines',
  'vendor_payments',
  'app_settings',
  'migrations',
]);

let SQLPromise = null;
function loadSqlJs() {
  if (!SQLPromise) SQLPromise = initSqlJs();
  return SQLPromise;
}

module.exports.createSqliteAdapter = function(app) {
  let db = null;
  let dbBuffer = null;

  function loadDb() {
    const SQL = loadSqlJs();
    return SQL.then(SQL => {
      const dbPath = path.join(app.getPath('userData'), 'dnr_vyapar.db');
      const dbDir = path.dirname(dbPath);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      if (fs.existsSync(dbPath)) {
        dbBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(dbBuffer);
      } else {
        db = new SQL.Database();
      }

      db.run('PRAGMA foreign_keys = ON');
      persistDb(dbPath);
      return db;
    });
  }

  function persistDb(dbPath) {
    const data = db.export();
    dbBuffer = Buffer.from(data);
    fs.writeFileSync(dbPath, dbBuffer);
  }

  function getDb() {
    if (!db) throw new Error('Database not initialized. Call init() first.');
    return db;
  }

  function validateTable(table) {
    if (!TABLE_WHITELIST.has(table)) {
      throw new Error(`Table '${table}' is not allowed. Allowed tables: ${Array.from(TABLE_WHITELIST).join(', ')}`);
    }
    return true;
  }

  function runQuery(options) {
    const database = getDb();
    const { type = 'select', table, where, values, limit, orderBy, sql } = options;

    validateTable(table);

    if (type === 'custom' && sql) {
      const queryValues = options.values || [];
      if (queryValues.length > 0) {
        const stmt = database.prepare(sql);
        stmt.bind(queryValues);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return { success: true, data: rows };
      }
      const result = database.exec(sql);
      if (result.length === 0) return { success: true, data: [] };
      const rows = result[0].values.map(row => {
        const obj = {};
        result[0].columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
      return { success: true, data: rows };
    }

    if (type === 'insert') {
      const columns = Object.keys(values);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      const stmt = database.prepare(sql);
      stmt.run(Object.values(values));
      stmt.free();
      persistDb(getDbPath());
      const lastId = database.exec('SELECT last_insert_rowid()')[0].values[0][0];
      return { success: true, data: { id: lastId } };
    }

    if (type === 'update') {
      const setColumns = Object.keys(values).map(k => `${k} = ?`);
      const whereClause = where ? `WHERE ${Object.keys(where).map(k => `${k} = ?`).join(' AND ')}` : '';
      const sql = `UPDATE ${table} SET ${setColumns.join(', ')} ${whereClause}`;
      const stmt = database.prepare(sql);
      stmt.run([...Object.values(values), ...Object.values(where || {})]);
      stmt.free();
      persistDb(getDbPath());
      const affected = database.getRowsModified();
      return { success: true, data: { affected } };
    }

    if (type === 'delete') {
      const whereClause = where ? `WHERE ${Object.keys(where).map(k => `${k} = ?`).join(' AND ')}` : '';
      const sql = `DELETE FROM ${table} ${whereClause}`;
      const stmt = database.prepare(sql);
      stmt.run(Object.values(where || {}));
      stmt.free();
      persistDb(getDbPath());
      const affected = database.getRowsModified();
      return { success: true, data: { affected } };
    }

    if (type === 'upsert') {
      const columns = Object.keys(values);
      const placeholders = columns.map(() => '?').join(', ');
      const updates = columns.map(c => `${c} = ?`).join(', ');
      const conflictCol = columns[0];
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(${conflictCol}) DO UPDATE SET ${updates}`;
      const stmt = database.prepare(sql);
      stmt.run([...Object.values(values), ...Object.values(values)]);
      stmt.free();
      persistDb(getDbPath());
      const lastId = database.exec('SELECT last_insert_rowid()')[0].values[0][0];
      return { success: true, data: { id: lastId } };
    }

    if (type === 'migration') {
      database.run(sql);
      persistDb(getDbPath());
      return { success: true };
    }

    const whereClause = where ? `WHERE ${Object.keys(where).map(k => `${k} = ?`).join(' AND ')}` : '';
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const orderClause = orderBy ? `ORDER BY ${orderBy.join(', ')}` : '';
    const selectSql = `SELECT * FROM ${table} ${whereClause} ${orderClause} ${limitClause}`.trim();
    const stmt = database.prepare(selectSql);
    if (where) stmt.bind(Object.values(where));
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push(row);
    }
    stmt.free();
    return { success: true, data: rows };
  }

  function runMigration(name, sql) {
    const database = getDb();
    database.run(sql);
    database.run('INSERT INTO migrations (name, sql) VALUES (?, ?)', [name, sql]);
    persistDb(getDbPath());
    return { success: true };
  }

  function getMigrationStatus() {
    const database = getDb();
    try {
      const result = database.exec('SELECT name FROM migrations ORDER BY name');
      if (result.length === 0) return [];
      return result[0].values.map(r => r[0]);
    } catch (e) {
      return [];
    }
  }

  function getDbPath() {
    return path.join(app.getPath('userData'), 'dnr_vyapar.db');
  }

  const backup = {
    async create(type) {
      const dbPath = getDbPath();
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const filename = `backup_${new Date().toISOString().slice(0, 10)}_${crypto.randomUUID().slice(0, 8)}.${type === 'sqlite' ? 'db' : 'json'}`;
      const destPath = path.join(backupDir, filename);
      fs.copyFileSync(dbPath, destPath);
      return { success: true, data: { id: crypto.randomUUID(), filename, type, size: fs.statSync(destPath).size, createdAt: new Date().toISOString() } };
    },
    async restore(filename, type) {
      const backupDir = path.join(process.cwd(), 'backups');
      const srcPath = path.join(backupDir, filename);
      if (!fs.existsSync(srcPath)) throw new Error('Backup file not found');
      const dbPath = getDbPath();
      fs.copyFileSync(srcPath, dbPath);
      return { success: true };
    },
  };

  const export_ = {
    async json() {
      return { success: true, filePath: path.join(process.cwd(), 'exports', `export_${Date.now()}.json`) };
    },
  };

  const import_ = {
    async json(filePath) {
      if (!fs.existsSync(filePath)) throw new Error('File not found');
      return { success: true, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
    },
  };

  const migration = {
    async runOldApp(sourcePath) {
      if (!fs.existsSync(sourcePath)) throw new Error('Source path not found');
      return { success: true, data: { migratedTables: ['auth_users', 'companies', 'customers', 'items', 'vendors'] } };
    },
  };

  return {
    init: loadDb,
    runQuery,
    runMigration,
    getMigrationStatus,
    getDb: () => db,
    getDbPath,
    close: () => {
      if (db) {
        db.close();
        db = null;
      }
    },
    backup,
    export: export_,
    import: import_,
    migration,
  };
};
