Design or review Prisma schema changes for this Order Management App.

Project context:
- Prisma ORM **v7** with SQLite (dev) / PostgreSQL (prod) — schema must be compatible with both
- Generator: `prisma-client-js` (NOT the new `prisma-client` — that requires mandatory DB adapters)
- Core entities: Client, Product, Order, OrderPhoto, PaymentType, OrderStatus
- Always generate migrations via `prisma migrate dev`, never edit the database directly
- Run `prisma generate` after every schema change, then **restart the dev server**

## Prisma v7 schema rules (breaking changes from v5/v6)
1. **No `url` in `datasource db {}`** — the connection URL moved to `prisma.config.ts`:
   ```ts
   datasource db { provider = "sqlite" }   // schema.prisma — NO url here
   ```
   ```ts
   // prisma.config.ts
   datasource: { url: process.env.DATABASE_URL }
   ```
2. **`autoincrement()` only on `@id` fields in SQLite** — for non-PK sequential fields (e.g. `orderNumber`), generate the value in code:
   ```ts
   const last = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
   const next = (last?.orderNumber ?? 0) + 1;
   ```
3. **`skipDuplicates` removed from `createMany`** — use `upsert` loops instead:
   ```ts
   for (const item of items) {
     await prisma.model.upsert({ where: { uniqueField: item.name }, update: {}, create: item });
   }
   ```
4. **Seed runner**: set `migrations.seed = "tsx prisma/seed.ts"` in `prisma.config.ts`; add `import "dotenv/config"` as the first line of the seed file
5. **After `prisma generate`**: always restart the dev server — Turbopack caches the old client binary and throws `Unknown argument` errors until restarted

## Schema design rules
- Use `@@map` / `@map` to keep Prisma model names PascalCase while DB column names stay snake_case
- Add `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` to every entity
- Prefer `String` over Prisma enums for status/source fields in SQLite (enums are stored as text anyway, but avoid enum syntax for SQLite compat)
- OrderPhoto stores a file path/URL string — do not store binary data in the DB
- PaymentType and OrderStatus are lookup/reference tables — seed them via `prisma/seed.ts`
- Flag any field that behaves differently between SQLite and PostgreSQL (e.g., `Json` type, full-text search, `Float` vs `Decimal`)

After proposing schema changes, also provide:
- The `prisma migrate dev --name <migration-name>` command to run
- Any seed data updates needed in `prisma/seed.ts`
- A reminder to restart the dev server

Task: $ARGUMENTS
