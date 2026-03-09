-- Create "No Supplier" default supplier entry
-- Run this ONCE as admin to set up the system

INSERT INTO suppliers (name, email, phone, city, country)
VALUES ('No Supplier', 'system@nosupplier.local', 'N/A', 'System', 'System')
ON CONFLICT DO NOTHING;

-- Optional: If you need to get the ID for reference
-- SELECT id FROM suppliers WHERE name = 'No Supplier';
