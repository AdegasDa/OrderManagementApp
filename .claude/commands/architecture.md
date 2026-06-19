Analyze or design the architecture for this Next.js 15 App Router project.

Project context:
- Next.js 15 + React 19 + TypeScript strict mode
- Feature-based folder structure under `src/features/<module>/`
- Backend via Server Actions (no separate API routes unless needed)
- Prisma ORM v7 with SQLite (dev) / PostgreSQL (prod)
- Core modules: Orders, Agenda, Clients, Products, Payments, Statuses

When analyzing or designing architecture:
1. Follow App Router conventions: layouts, loading.tsx, error.tsx, page.tsx per route segment
2. Co-locate Server Actions in `actions.ts` inside each feature folder
3. Keep data fetching in Server Components; push interactivity to Client Components only when needed
4. Use Zod schemas for all Server Action inputs — define them alongside the action
5. Share types via `src/types/` or co-located `types.ts` inside the feature
6. Zustand stores live in `src/store/` and handle only client-side UI state (never server data)
7. shadcn/ui components go in `src/components/ui/`; composite feature components go in `src/features/<module>/components/`
8. Avoid "god" server actions — one action per mutation

## Prisma v7 gotchas (learned in production)
- The `url` field is GONE from `datasource db {}` in `schema.prisma` — connection URL lives in `prisma.config.ts`
- Use `prisma-client-js` generator (not the new `prisma-client`) to avoid mandatory adapter setup for local SQLite
- `autoincrement()` only works on `@id` fields in SQLite — generate sequential numbers in application code (query `findFirst({ orderBy: { field: "desc" } })` and increment)
- `skipDuplicates` was removed from `createMany` in v7 — use `upsert` loops in seed scripts
- Run seeds with `tsx` not `ts-node` (set `migrations.seed = "tsx prisma/seed.ts"` in `prisma.config.ts`)
- After every `prisma generate`, **restart the dev server** — Turbopack caches the old generated client and will throw `Unknown argument` errors until restarted

## React Hook Form + Zod v4 + @hookform/resolvers v5
- `zodResolver` v5 has a generic type mismatch with RHF v7 — always cast: `resolver: zodResolver(schema) as never`
- Use `z.number()` not `z.coerce.number()` for numeric fields; wire `onChange={(e) => field.onChange(e.target.valueAsNumber)}` on number inputs
- When using `useWatch` to auto-calculate derived fields (e.g. total = price + fee), set the derived field with `form.setValue("field", value, { shouldDirty: true })`

Task: $ARGUMENTS
