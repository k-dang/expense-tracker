# Expense Tracker v1 Specification (Source of Truth)

## Summary
Build a single-user expense tracker web app that imports CSV files (`date,vendor,amount,category`), stores expenses in SQLite, deduplicates across repeated imports, and renders dashboard aggregations/charts.  
Tech baseline is existing Next.js 16 + TypeScript app, with SQLite + Drizzle ORM.

## Product Scope

### Goals
- Import expense CSV files repeatedly over time.
- Persist imports and transactions in a database.
- Prevent duplicate expenses from being inserted.
- Show key totals and aggregations in a dashboard.
- Provide clear import validation feedback.

### Non-Goals (v1)
- Multi-user accounts/auth.
- Multi-currency support.
- Manual transaction editing UI.
- Refund/income modeling (negative values).
- Advanced fuzzy deduplication.

## Locked Decisions
- User scope: single-user only.
- DB: SQLite.
- Data access: Drizzle ORM with migrations.
- CSV dedup: strict composite (`date + vendor + amount + category` after normalization).
- Import validation policy: all-or-nothing (any invalid row rejects file).
- Date parsing: `YYYY-MM-DD` only.
- Amount semantics: positive expenses only.
- Default currency: CAD.
- Categories: use CSV category as-is, normalize whitespace/casing only.
- Dashboard charts: core 4 (monthly trend, category breakdown, top vendors, recent expenses table).

## Architecture
- Framework: Next.js App Router.
- Backend pattern: Route Handlers under `src/app/api/**`.
- DB layer: `src/lib/db/**` with Drizzle schema, client, query modules.
- UI: pages/components in `src/app/**` and `src/components/**`.
- Runtime: Node.js (not serverless ephemeral disk), SQLite file on persistent storage.

## Data Model (Drizzle)

### `imports`
- `id` TEXT PK (cuid/uuid).
- `filename` TEXT NOT NULL.
- `uploaded_at` DATETIME NOT NULL DEFAULT now.
- `row_count_total` INTEGER NOT NULL.
- `row_count_inserted` INTEGER NOT NULL.
- `row_count_duplicates` INTEGER NOT NULL.
- `status` TEXT NOT NULL (`succeeded | failed`).
- `error_message` TEXT NULL.

### `expenses`
- `id` TEXT PK.
- `txn_date` TEXT NOT NULL (`YYYY-MM-DD`).
- `vendor` TEXT NOT NULL (display-normalized).
- `amount_cents` INTEGER NOT NULL (> 0).
- `category` TEXT NOT NULL (display-normalized).
- `currency` TEXT NOT NULL DEFAULT `CAD`.
- `fingerprint` TEXT NOT NULL UNIQUE.
- `import_id` TEXT NOT NULL FK -> `imports.id`.
- `created_at` DATETIME NOT NULL DEFAULT now.

### Indexes
- `expenses(txn_date)`.
- `expenses(category)`.
- `expenses(description)`.
- `expenses(import_id)`.
- unique `expenses(fingerprint)` for dedup.

## Canonicalization + Dedup Rules
- Trim leading/trailing whitespace for `vendor`, `category`.
- Collapse internal repeated whitespace to single space.
- Dedup comparison uses lowercased `vendor` and `category`.
- `amount` parsed to cents with exact 2-decimal handling.
- Fingerprint input format:
  - `${txn_date}|${vendor_normalized_lower}|${amount_cents}|${category_normalized_lower}|CAD`
- Fingerprint algorithm: SHA-256 hex string.

## CSV Contract
- Required headers (case-insensitive): `date,vendor,amount,category`.
- Column order can vary; mapping by header name.
- UTF-8 text CSV, comma delimiter.
- Validation per row:
  - `date`: required, strict `YYYY-MM-DD`, real calendar date.
  - `vendor`: required, non-empty after trim.
  - `amount`: required, numeric, > 0.
  - `category`: required, non-empty after trim.
- All-or-nothing:
  - If any row invalid, import fails and no transaction rows are inserted.
  - Return row-level validation errors (row number + field + message).

## API Interfaces

### `POST /api/imports`
- Request: `multipart/form-data` with `file`.
- Response success `200`:
  - `importId`, `totalRows`, `insertedRows`, `duplicateRows`, `status`.
- Response failure `400`:
  - `status: failed`, `errors: [{ row, field, message }]`.

### `GET /api/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns:
  - `totals`: total spend, transaction count, avg per transaction.
  - `monthlyTrend`: [{ month, totalCents }].
  - `categoryBreakdown`: [{ category, totalCents, percent }].
  - `topVendors`: [{ vendor, totalCents, count }].
  - `recentTransactions`: [{ id, txnDate, vendor, category, amountCents }].

### `GET /api/imports`
- Returns import history for audit/debug.

## UI/UX Spec

### Routes
- `/` dashboard.
- `/imports` import page + import history table.

### Dashboard widgets
- KPI cards:
  - Total spend (selected range).
  - Total transactions.
  - Average transaction amount.
- Charts:
  - Monthly spend line/bar.
  - Category spend pie/donut.
  - Top vendors bar chart.
- Table:
  - Recent transactions (date, vendor, category, amount CAD).

### Import page
- Drag/drop or file picker for CSV.
- Pre-submit checks for file type and empty file.
- Import result summary:
  - total, inserted, duplicates.
- Failed import panel:
  - validation errors with row references.

## Implementation Plan (for coding agents)

1. Set up persistence layer.
- Add Drizzle + SQLite dependencies.
- Add schema, migration config, migration scripts.
- Create DB client and query helpers.

2. Implement CSV ingestion pipeline.
- Parse CSV stream.
- Validate headers and rows.
- Normalize values.
- Build fingerprints.
- Transactional write:
  - all-or-nothing for validation failures.
  - dedup via unique fingerprint.
- Write import metadata.

3. Implement API routes.
- `POST /api/imports`.
- `GET /api/dashboard`.
- `GET /api/imports`.
- Standardize response/error format.

4. Build app pages/components.
- Replace scaffold example page with dashboard.
- Add `/imports` page and import history.
- Add chart components and table.

5. Add seed/sample data and docs.
- Example CSV in `public/samples/expenses-sample.csv`.
- Update README for run/import steps.

## Test Cases and Scenarios

### Unit
- Date parser accepts valid ISO and rejects invalid/non-ISO.
- Amount parser converts to cents and rejects <= 0.
- Canonicalization produces stable normalized strings.
- Fingerprint function deterministic for equivalent inputs.

### Integration
- Import valid CSV inserts expected rows.
- Import with one invalid row inserts zero rows (all-or-nothing).
- Re-import same CSV yields duplicate count > 0 and no duplicate inserts.
- Overlapping files only insert new unique rows.
- Dashboard endpoint returns correct aggregated totals for fixed fixture data.

### UI/E2E
- User can upload CSV and see import result.
- Dashboard renders 4 required visualizations.
- Date-range changes refresh KPIs/charts correctly.
- Import failure displays row-level error messages.

## Acceptance Criteria
- Multiple CSV uploads across days persist cumulatively in SQLite.
- Duplicate rows are blocked by dedup logic.
- Invalid CSV rows fail entire import with actionable errors.
- Dashboard shows correct totals/aggregations from DB data.
- Project runs with `pnpm run dev`, builds with `pnpm run build`, passes lint.

## Assumptions and Defaults
- Currency is always CAD in v1.
- Transaction date is date-only (no timezone conversion).
- Single local workspace/user context.
- SQLite DB file stored at project root data path (for dev) and persistent volume in production.
- If no date range provided, dashboard defaults to last 12 full months including current month.
