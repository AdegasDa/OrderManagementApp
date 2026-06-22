-- Add index on Client.name for faster search queries
CREATE INDEX IF NOT EXISTS "clients_name_idx" ON "clients"("name");

-- Add indexes on Order for common filter/sort columns
CREATE INDEX IF NOT EXISTS "orders_orderDate_idx" ON "orders"("orderDate");
CREATE INDEX IF NOT EXISTS "orders_clientId_idx" ON "orders"("clientId");
CREATE INDEX IF NOT EXISTS "orders_statusId_idx" ON "orders"("statusId");
