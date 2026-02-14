# Expense Tracker

Single-user CAD expense tracker built with Next.js 16, TypeScript, SQLite, and Drizzle ORM.

The app imports CSV files, deduplicates transactions across uploads, and renders dashboard analytics.

## Requirements

- Bun (recommended; project scripts use Bun by default)

## Quick Start

1. Install dependencies:

```bash
bun install
```

2. Create `.env` at the project root:

```bash
DB_URL=file:mydb.sqlite
DB_AUTH_TOKEN= # only required for remote Turso/libSQL URLs
```

3. Run DB migrations:

```bash
bunx drizzle-kit migrate
```

4. Start the app:

```bash
bun run dev
```

Open `http://localhost:3000`.

## Environment Profiles

- Local development: `DB_URL=file:mydb.sqlite`
- Production (Turso/libSQL):

```bash
DB_URL=libsql://<your-db-host>
DB_AUTH_TOKEN=<your-auth-token>
```

## Routes

- `/` - expense dashboard (KPIs, monthly trend, category breakdown, top vendors, recent transactions)
- `/imports` - CSV upload and import history

## CSV Import Contract

Required headers (case-insensitive): `date,vendor,amount,category`

Validation rules:
- `date`: strict `YYYY-MM-DD` and must be a real calendar date
- `vendor`: required, non-empty after trim + whitespace normalization
- `amount`: required, numeric, positive, up to 2 decimals
- `category`: required, non-empty after trim + whitespace normalization
- all-or-nothing import: one invalid row fails the whole file

Dedup key input:
- `date|vendor_lower|amount_cents|category_lower|CAD` (SHA-256 fingerprint)

Sample CSV:
- `public/samples/expenses-sample.csv`

## Available Scripts

```bash
bun run dev      # start local dev server
bun run build    # production build
bun run start    # run production server
bun run lint     # Biome checks
bun run format   # apply Biome formatting
bun run test     # run test suite
```

## Tech Stack

- Next.js App Router + React 19
- TypeScript
- SQLite via libSQL (`file:` locally, Turso/libSQL remotely)
- Drizzle ORM + Drizzle Kit
- Biome
