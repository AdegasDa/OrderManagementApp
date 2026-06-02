# Order Management App

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goal
Build an order management system for a custom products business.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Watch mode for tests |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check only |
| `npx prisma migrate dev --name <name>` | Create + apply a migration |
| `npx prisma db seed` | Re-seed payment types and statuses |
| `npx prisma generate` | Regenerate client after schema change — **restart dev server after** |

## Tech Stack

Frontend: Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui v4 (`@base-ui/react`)
Backend: Next.js Server Actions
Database: Prisma v7 ORM · SQLite (dev) · PostgreSQL (prod)
Forms: React Hook Form v7 · Zod v4 · @hookform/resolvers v5
State: Zustand (client UI only)
Calendar: FullCalendar
Tables: TanStack Table
Icons: Lucide React

## Architecture

```
src/
  app/(dashboard)/          # route group — sidebar layout
    orders/                 # list + new + [id] edit
    agenda/
    clients/
    products/
    payments/
    statuses/
  features/<module>/
    actions.ts              # Server Actions (Zod-validated)
    schema.ts               # Zod schemas
    components/             # Client + Server components
  components/
    ui/                     # shadcn/ui primitives
    layout/                 # Sidebar, MobileNav
  lib/
    prisma.ts               # PrismaClient singleton
    utils.ts                # cn(), formatCurrency(), formatDate()
```

## Core Modules

Orders · Agenda/Calendar · Clients · Products · Payments · Statuses

## Database Entities

Client · Product · Order · OrderPhoto · PaymentType · OrderStatus

## UI Rules

- Mobile first, responsive (375 / 768 / 1280 breakpoints)
- Dark mode via Tailwind `dark:` variants
- Portuguese (pt-BR) for all user-facing text
- Clean modern dashboard aesthetic

## Coding Rules

- TypeScript strict mode — `resolver: zodResolver(schema) as never` for RHF forms
- Feature-based folder structure
- Reusable components, no duplicated code
- Generate migrations through Prisma — restart dev server after `prisma generate`
- Numeric inputs: use `z.number()` + `e.target.valueAsNumber`; guard NaN: `isNaN(v) ? 0 : v`

## @base-ui/react Select rules (critical)
- Always pass `items={array.map(i => ({ value, label }))}` — without it SelectValue shows raw IDs
- Always use `value={x || null}` (never `undefined`) — switching controlled/uncontrolled throws
- `onValueChange` returns `string | null` — always guard with `?? ""`
- Dropdowns with name + price: use `flex-col` layout inside SelectItem (not `justify-between`)
- Extra-wide dropdowns: pass `className="min-w-64" alignItemWithTrigger={false}` to SelectContent
- No `asChild` on DialogTrigger — use controlled `open`/`onOpenChange` state

## Workflow

1. Analyze first
2. Plan
3. Implement step by step
4. Keep code production ready
