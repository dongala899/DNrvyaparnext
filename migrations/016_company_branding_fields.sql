ALTER TABLE companies ADD COLUMN primary_color TEXT;
ALTER TABLE companies ADD COLUMN secondary_color TEXT;
ALTER TABLE companies ADD COLUMN is_active INTEGER DEFAULT 1;