-- Add indexes for common query patterns to improve performance
-- These indexes cover the most frequent filter/join operations

CREATE INDEX IF NOT EXISTS "orders_orderDate_idx" ON "orders"("orderDate");
CREATE INDEX IF NOT EXISTS "orders_clientId_idx" ON "orders"("clientId");
CREATE INDEX IF NOT EXISTS "orders_statusId_idx" ON "orders"("statusId");
