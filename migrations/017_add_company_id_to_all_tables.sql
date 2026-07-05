ALTER TABLE customers ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);

ALTER TABLE vendors ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_vendors_company_id ON vendors(company_id);

ALTER TABLE items ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_items_company_id ON items(company_id);

ALTER TABLE payments ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);

ALTER TABLE vendor_payments ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_vendor_payments_company_id ON vendor_payments(company_id);

ALTER TABLE purchase_orders ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_po_company_id ON purchase_orders(company_id);

ALTER TABLE po_lines ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_po_lines_company_id ON po_lines(company_id);

ALTER TABLE grns ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_grns_company_id ON grns(company_id);

ALTER TABLE grn_lines ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_grn_lines_company_id ON grn_lines(company_id);

ALTER TABLE purchases ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON purchases(company_id);

ALTER TABLE purchase_lines ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_purchase_lines_company_id ON purchase_lines(company_id);

ALTER TABLE customer_orders ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_customer_orders_company_id ON customer_orders(company_id);
