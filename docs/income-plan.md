# Income Tracking Feature Plan

## Context

The app currently tracks expenses only. The goal is to introduce income tracking so users can see **savings per month** (income - expenses). This requires a new database table, CRUD operations, a dedicated `/income` page, CSV import support, and dashboard updates (KPI card + monthly trend chart).

---

## Phase 1: Database Schema & Migration

**File: `src/db/schema.ts`**

Add `incomesTable`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | text | PK |
| `income_date` | text | YYYY-MM-DD |
| `description` | text | |
| `amount_cents` | integer | |
| `source` | text | default "Other" |
| `currency` | text | default "CAD" |
| `fingerprint` | text | UNIQUE, for dedup |
| `import_id` | text | FK → imports.id, nullable |
| `created_at` | integer | unix timestamp |

Add `type` column to `importsTable` and `importDuplicatesTable`:
- `type: text("type", { enum: ["transaction", "income"] }).notNull().default("transaction")`
- Backward-compatible — existing rows default to `"transaction"`

Export types: `IncomeRow`, `NewIncomeRow`

**Run**: `npx drizzle-kit generate` then `npx drizzle-kit push`

- [x] Complete

---

## Phase 2: Income Sources Constants

**New file: `src/lib/income-sources.ts`**

Follow the pattern in `src/lib/categories.ts`:
- `DEFAULT_INCOME_SOURCES`: `"Salary"`, `"Freelance"`, `"Investment"`, `"Rental"`, `"Gift"`, `"Refund"`, `"Other"`
- `getSourceColor(source)` — badge color mapping
- Reuse `findCaseInsensitive` helper from categories (or extract to shared util)

- [ ] Complete

---

## Phase 3: Query Layer

**New file: `src/db/queries/income.ts`**
- `listIncomes(filters)` — paginated list with search, source filter, sorting
- `createIncome(input)` — insert single income entry (generates UUID + fingerprint)
- `updateIncome(id, input)` — update fields on an income entry
- `deleteIncomes(ids)` — bulk delete
- `getDistinctSources()` — for filter dropdowns
- All use `cacheTag("income")`

**Modify: `src/db/queries/dashboard.ts`**
- Add `getDashboardIncomeTotals(range)` → `{ totalIncomeCents, incomeCount }`
- Add `getDashboardMonthlyIncomeTrend(range)` → `[{ month, totalCents }]`
- Both use `cacheTag("income")`

- [ ] Complete

---

## Phase 4: Income CSV Import Pipeline

**New file: `src/db/queries/income-imports.ts`**
- `processIncomeImportFile(...)` — parallels the existing transaction import logic in `src/db/queries/imports.ts`
- Expected CSV headers: `date`, `description`, `amount`, `source` (source optional, defaults to "Other")
- Fingerprint dedup against `incomesTable`
- Inserts into `importsTable` with `type: "income"`, duplicates into `importDuplicatesTable` with `type: "income"`

Reuse existing utilities from `src/lib/imports/`:
- `validateCsvFileInput`, `decodeCsvBytes` from `csv-utils.ts`
- Create parallel `income-row-validator.ts` for income-specific row validation

- [ ] Complete

---

## Phase 5: Server Actions

**New file: `src/lib/actions/income.ts`**

Follow patterns from `src/lib/actions/transactions.ts`:
- `createIncomeAction(prevState, formData)` — Zod-validated form action
- `updateIncomeAction(prevState, formData)` — edit income entry
- `deleteIncomesAction(ids)` — bulk delete
- `uploadIncomeImportAction(prevState, formData)` — CSV import
- All call `updateTag("income")` on success

- [ ] Complete

---

## Phase 6: Income Page (`/income`)

**New files:**
- `src/app/income/page.tsx` — page with Suspense boundaries
- `src/app/income/_lib/search-params.ts` — search param parsing
- `src/app/income/_components/income-page-content.tsx` — server component fetching data
- `src/app/income/_components/income-page-content-skeleton.tsx` — loading skeleton

**New components in `src/components/income/`:**

| Component | Based on | Purpose |
|-----------|----------|---------|
| `income-table.tsx` | `transaction-table.tsx` | Table with checkbox, date, description, source, amount columns, pagination |
| `income-filters.tsx` | `transaction-filters.tsx` | Search input, source dropdown, sort toggles |
| `add-income-dialog.tsx` | `add-transaction-dialog.tsx` | Form: date, description, amount, source (select from defaults + custom) |
| `edit-income-dialog.tsx` | — | Edit dialog for all fields |
| `delete-income-dialog.tsx` | `delete-transaction-dialog.tsx` | Confirmation dialog |
| `income-import-card.tsx` | `import-upload-form.tsx` | CSV upload card for income |
| `source-badge.tsx` | `category-badge.tsx` | Colored badge for income sources |
| `bulk-action-bar.tsx` | `transactions/bulk-action-bar.tsx` | Floating bar for bulk delete/source assignment |

- [ ] Complete

---

## Phase 7: Dashboard Updates

**Modify: `src/components/dashboard/kpi-cards.tsx`**
- Fetch `getDashboardIncomeTotals(range)` alongside existing `getDashboardTotals(range)`
- Add 2 new KPI cards: **Total Income** and **Net Savings** (income - expenses)
- Update grid layout for 6 cards
- Update `KpiCardsFallback` skeleton count

**Modify: `src/components/dashboard/monthly-trend-card.tsx`**
- Fetch `getDashboardMonthlyIncomeTrend(range)` alongside expense trend
- Pass income data to `MonthlyTrendChart` (only when no category filter is active)

**Modify: `src/components/dashboard/monthly-trend-chart.tsx`**
- Accept optional `incomeData` prop
- When income data is present: merge into combined dataset `{ month, expenseDollars, incomeDollars, savingsDollars }`
- Add chart config entries for income (green) and savings (blue) series
- Bar view: grouped bars (expenses + income) with savings line
- Area view: expense area + income line + savings line overlay
- When category filter is active: revert to expense-only (current behavior)

- [ ] Complete

---

## Phase 8: Navigation

**Modify: `src/components/navbar.tsx`**
- Add `{ label: "Income", href: "/income" }` to `NAV_ITEMS` (between Transactions and Imports)

- [ ] Complete

---

## Implementation Order

1. Schema + migration (Phase 1)
2. Income sources constants (Phase 2)
3. Query layer (Phase 3)
4. CSV import pipeline (Phase 4)
5. Server actions (Phase 5)
6. Navigation update (Phase 8)
7. Income page + components (Phase 6)
8. Dashboard updates (Phase 7)

## Verification

1. Run `npx drizzle-kit generate` and `npx drizzle-kit push`, verify migration applies cleanly
2. Navigate to `/income`, add an income entry via dialog, verify it appears in the table
3. Upload a test CSV with columns `date,description,amount,source`, verify entries created
4. Edit and delete income entries, verify changes persist
5. Verify "Total Income" and "Net Savings" KPI cards show correct values
6. Verify income + savings series appear on the monthly trend chart (no category filter)
7. Run `pnpm run build` — no type errors
8. Run `pnpm run lint` — Biome passes
