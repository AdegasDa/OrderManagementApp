Review the current changes or the specified file/module against this project's standards.

Project standards to enforce:
- TypeScript strict mode — no `any`, no non-null assertions without justification
- No duplicated code — extract shared logic to `src/lib/` or a shared hook
- Feature-based folder structure — files must live under `src/features/<module>/`
- Server Actions must validate all inputs with Zod before touching the database
- No raw SQL — all DB access goes through Prisma
- UI text must be in Portuguese (pt-BR)
- Components must support dark mode via Tailwind `dark:` variants
- Mobile-first responsive layouts

## Review checklist

### Correctness
- Logic errors, off-by-one, missing awaits, unhandled promise rejections
- Numeric inputs: are they using `e.target.valueAsNumber` (not `e.target.value`) with `z.number()`?
- Auto-calculated fields: does `useWatch` + `form.setValue` include `{ shouldDirty: true }`?

### Type safety
- Missing types, unsafe casts, implicit `any`
- `zodResolver` must be cast: `resolver: zodResolver(schema) as never` — otherwise RHF v7 / Zod v4 type clash
- No `z.coerce.number()` — use `z.number()` instead

### @base-ui/react Select (critical — causes runtime crashes)
- Every `<Select>` must have `items={array.map(i => ({ value: i.id, label: i.name }))}` — without it, `SelectValue` shows the raw ID/code
- `value` prop must never switch between `undefined` and a string — use `value={x || null}` (`null` = no selection)
- `onValueChange` returns `string | null` — always guard: `(v) => field.onChange(v ?? "")`
- No `asChild` on `DialogTrigger` / `SheetTrigger` — use controlled `open`/`onOpenChange` state instead
- No `justify-between` inside `SelectItem` — popup is `overflow-x-hidden` + `w-(--anchor-width)`, price/secondary text will be clipped; use `flex-col` instead
- For wide dropdowns (name + price): add `className="min-w-64" alignItemWithTrigger={false}` to `SelectContent`

### Number inputs
- `e.target.valueAsNumber` is `NaN` when field is cleared — guard both directions:
  - `onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}`
  - `value={isNaN(field.value) ? "" : field.value}`

### Security
- Unvalidated Server Action inputs, missing authorization checks, exposed sensitive data

### Architecture
- Wrong layer for the logic (e.g., business logic in a component, data fetch in a Client Component)
- Prisma client imported outside `src/lib/prisma.ts`

### Prisma v7
- N+1 queries, missing `include`/`select`
- Mutations outside Server Actions
- `skipDuplicates` in `createMany` — removed in v7, use `upsert` loops
- `autoincrement()` on non-`@id` fields — not supported in SQLite, generate in code
- Schema change without restarting dev server → `Unknown argument` runtime errors

### UI standards
- Dark mode via `dark:` variants
- Mobile-first layout
- pt-BR text
- `formatCurrency` / `formatDate` from `src/lib/utils.ts` for all money/date display

For each finding, output:
- File and line reference
- Severity: `critical` / `warning` / `suggestion`
- What the issue is and how to fix it

Target: $ARGUMENTS
