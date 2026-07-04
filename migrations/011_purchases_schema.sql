CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  bill_number TEXT UNIQUE NOT NULL,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT,
  grn_id TEXT,
  po_id TEXT,
  date TEXT NOT NULL,
  due_date TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_lines (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  item_id TEXT,
  item_name TEXT,
  quantity REAL NOT NULL,
  rate REAL NOT NULL,
  discount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 18,
  subtotal REAL NOT NULL,
  total REAL NOT NULL,
  input_tax_credit INTEGER DEFAULT 1,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_purchases_bill ON purchases(bill_number);
CREATE INDEX IF NOT EXISTS idx_purchases_vendor ON purchases(vendor_id);