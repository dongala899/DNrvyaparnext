const fs = require('fs');
const path = require('path');

module.exports.createMigrationRunner = function(storage, app) {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');

  async function runAllMigrations() {
    const ensureTable = `CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      sql TEXT,
      applied_at TEXT DEFAULT (datetime('now'))
    )`;
    await storage.runQuery({ type: 'custom', table: 'migrations', sql: ensureTable });

    console.log('[Migration] Looking for migrations at:', migrationsDir);
    if (!fs.existsSync(migrationsDir)) {
      console.log('[Migration] No migrations directory found at', migrationsDir);
      return { success: true, migrated: 0 };
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let migrated = 0;

    for (const file of files) {
      const name = file.replace('.sql', '');
      const fullSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      const existing = await storage.runQuery({
        table: 'migrations',
        where: { name },
        limit: 1,
      });

      if (existing.data && existing.data.length > 0) {
        console.log(`[Migration] Skipping ${name} (already applied)`);
        continue;
      }

      const statements = fullSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await storage.runQuery({
            type: 'migration',
            table: 'migrations',
            sql: statement,
          });
        } catch (err) {
          if (err.message.includes('duplicate column name')) {
            console.log(`[Migration] Skipping column (already exists): ${statement.substring(0, 60)}...`);
          } else {
            console.error(`[Migration] Error in ${name}: ${err.message}`);
          }
        }
      }

      await storage.runQuery({
        type: 'insert',
        table: 'migrations',
        values: { name, sql: fullSql },
      });

      console.log(`[Migration] Applied ${name}`);
      migrated++;
    }

    return { success: true, migrated };
  }

  return { runAllMigrations };
}