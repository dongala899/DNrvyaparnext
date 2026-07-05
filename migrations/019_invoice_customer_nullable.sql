CREATE TABLE invoices_new (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  company_id TEXT,
  date TEXT NOT NULL,
  due_date TEXT,
  quotation_id TEXT,
  po_number TEXT,
  po_date TEXT,
  shipping_address TEXT,
  customer_purchase_order_id TEXT,
  round_off INTEGER DEFAULT 1,
  round_off_amount REAL DEFAULT 0,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  terms TEXT,
  einvoice_enabled INTEGER DEFAULT 0,
  einvoice_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO invoices_new(id, invoice_number, customer_id, customer_name, company_id, date, due_date, quotation_id, po_number, po_date, shipping_address, customer_purchase_order_id, round_off, round_off_amount, subtotal, tax_amount, discount_amount, total_amount, status, notes, terms, einvoice_enabled, einvoice_status, created_at, updated_at) 
SELECT id, invoice_number, customer_id, customer_name, company_id, date, due_date, quotation_id, po_number, po_date, shipping_address, NULL, round_off, round_off_amount, subtotal, tax_amount, discount_amount, total_amount, status, notes, terms, einvoice_enabled, einvoice_status, created_at, updated_at FROM invoices;
DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
