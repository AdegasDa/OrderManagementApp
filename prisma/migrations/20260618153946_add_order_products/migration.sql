-- CreateTable
CREATE TABLE "order_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "order_products_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- MigrateData: copy existing single product into order_products
INSERT INTO "order_products" ("id", "orderId", "productId", "quantity")
SELECT lower(hex(randomblob(9))), "id", "productId", 1 FROM "orders";

-- AlterTable: drop old productId column
ALTER TABLE "orders" DROP COLUMN "productId";
