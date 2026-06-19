Design or implement dashboard UI for this Order Management App.

Project context:
- Next.js 15 + React 19 + TypeScript
- UI: Tailwind CSS + **shadcn/ui v4** (uses `@base-ui/react` internally, NOT `@radix-ui`)
- Icons: Lucide React
- Tables: TanStack Table
- Calendar: FullCalendar
- Language: Portuguese (all user-facing text in pt-BR)
- Rules: mobile-first, responsive, dark mode support, clean modern dashboard

## CRITICAL: shadcn/ui v4 uses @base-ui/react, not @radix-ui

The components installed by `npx shadcn@latest` in this project are built on `@base-ui/react`.
This has several breaking differences from classic Radix-based shadcn:

### Dialog / Sheet
- **No `asChild` prop** on `DialogTrigger` / `SheetTrigger`
- Use **controlled dialogs** instead — keep `open`/`onOpenChange` state and trigger with a plain `<Button onClick={() => setOpen(true)}>`:
  ```tsx
  const [open, setOpen] = useState(false);
  <Button onClick={() => setOpen(true)}>Abrir</Button>
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>...</DialogContent>
  </Dialog>
  ```

### Select
- `Select.Root` (`<Select>`) must always be **fully controlled** — never mix `value=undefined` (uncontrolled) with `value=string` (controlled) across re-renders or @base-ui throws a fatal error
  - Correct: `value={field.value || null}` — `null` means "no selection", never pass `undefined`
- **`SelectValue` shows the raw value (ID/code) unless you pass `items`** to `Select.Root`:
  ```tsx
  <Select
    value={field.value || null}
    onValueChange={(v) => field.onChange(v ?? "")}
    items={clients.map((c) => ({ value: c.id, label: c.name }))}
  >
  ```
  Without `items`, `SelectValue` falls back to serializing the raw `value` string (e.g. the cuid).
- `onValueChange` signature is `(value: string | null) => void` — always handle null: `onValueChange={(v) => setState(v ?? "")}`
- **Never use `justify-between` inside `SelectItem` children** — `SelectContent` is locked to `w-(--anchor-width)` + `overflow-x-hidden`, so side-by-side layouts get clipped. Use `flex-col` to stack lines vertically instead
- For dropdowns that need extra width (e.g. product+price), pass `className="min-w-64"` and `alignItemWithTrigger={false}` to `SelectContent`

### Number inputs
- `e.target.valueAsNumber` returns `NaN` when the field is cleared — always guard: `onChange={(e) => field.onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}`
- Likewise for the display value: `value={isNaN(field.value) ? "" : field.value}` to avoid rendering the literal text "NaN"

### Forms with React Hook Form
- Wrap `useForm` resolver: `resolver: zodResolver(schema) as never` (type incompatibility between RHF v7 / Zod v4 / resolvers v5)
- Use `z.number()` (not `z.coerce.number()`) and wire number inputs with `onChange={(e) => field.onChange(e.target.valueAsNumber)}`
- Use `useWatch` to derive computed fields (e.g. auto-calculated total); apply with `form.setValue("field", value, { shouldDirty: true })`

## General UI guidelines
1. Mobile-first: design the small-screen layout first, then expand with `md:` / `lg:` breakpoints
2. Dark mode: use Tailwind `dark:` variants — never hardcode light-only colors
3. Use shadcn/ui primitives (Card, Button, Badge, etc.) before building custom components
4. For data tables use TanStack Table with shadcn/ui `<Table>` as the rendering layer
5. For the Agenda module use FullCalendar — import locale with `import ptLocale from "@fullcalendar/core/locales/pt"`
6. Use Lucide React icons — `size={16}` for inline/button icons, `size={20}` for standalone
7. Sidebar navigation for desktop; bottom tab bar for mobile (max 5 items)
8. All labels, placeholders, toasts, and error messages must be in Portuguese (pt-BR)

When building a new UI section:
- Start with the page layout and skeleton states
- Then implement the data-connected version
- Verify responsiveness at 375px, 768px, and 1280px widths

Task: $ARGUMENTS
