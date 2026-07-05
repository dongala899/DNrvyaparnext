ALTER TABLE invoices ADD COLUMN po_number TEXT;
ALTER TABLE invoices ADD COLUMN po_date TEXT;
ALTER TABLE invoices ADD COLUMN shipping_address TEXT;
ALTER TABLE invoices ADD COLUMN customer_purchase_order_id TEXT;
ALTER TABLE invoices ADD COLUMN round_off INTEGER DEFAULT 1;
ALTER TABLE invoices ADD COLUMN round_off_amount REAL DEFAULT 0;