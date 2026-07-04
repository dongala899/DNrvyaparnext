CREATE TABLE IF NOT EXISTS customer_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  customer_address TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_gstin TEXT,
  order_date TEXT NOT NULL,
  expected_date TEXT,
  delivery_address TEXT,
  reference TEXT,
  notes TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  round_off REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS customer_order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT,
  description TEXT,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Nos',
  rate REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  gst_rate REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cust_orders_customer ON customer_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_orders_status ON customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_cust_order_lines_order ON customer_order_lines(order_id);
