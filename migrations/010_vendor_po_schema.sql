CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT,
  date TEXT NOT NULL,
  expected_date TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS po_lines (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  item_id TEXT,
  item_name TEXT,
  quantity REAL NOT NULL,
  received_quantity REAL DEFAULT 0,
  rate REAL NOT NULL,
  discount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  subtotal REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grns (
  id TEXT PRIMARY KEY,
  grn_number TEXT UNIQUE NOT NULL,
  po_id TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grn_lines (
  id TEXT PRIMARY KEY,
  grn_id TEXT NOT NULL,
  po_line_id TEXT,
  item_id TEXT,
  quantity REAL NOT NULL,
  rate REAL NOT NULL,
  FOREIGN KEY (grn_id) REFERENCES grns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_grn_number ON grns(grn_number);