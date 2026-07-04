CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  hsn_code TEXT,
  unit TEXT DEFAULT 'PCS',
  purchase_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  opening_stock REAL DEFAULT 0,
  low_stock_alert REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_hsn ON items(hsn_code);