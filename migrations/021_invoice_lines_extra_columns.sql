ALTER TABLE invoice_lines ADD COLUMN description TEXT;
ALTER TABLE invoice_lines ADD COLUMN hsn_sac TEXT;
ALTER TABLE invoice_lines ADD COLUMN unit TEXT DEFAULT 'Nos';