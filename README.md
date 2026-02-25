# Expense Tracker

Single-user CAD expense tracker built with Next.js 16, TypeScript, SQLite, and Drizzle ORM.

The app imports CSV files, deduplicates expenses across uploads, and renders dashboard analytics.

## Requirements

- pnpm

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env` and set `DB_URL` (and `DB_AUTH_TOKEN` only for remote Turso/libSQL).

3. Run DB migrations:

```bash
pnpm exec drizzle-kit migrate
```

4. Start the app:

```bash
pnpm run dev
```

Open `http://localhost:3000`.

## Environment Profiles

- Local development: use a `file:` URL in `DB_URL` (e.g. `file:./mydb.sqlite`)
- Production (Turso/libSQL):

```bash
DB_URL=libsql://<your-db-host>
DB_AUTH_TOKEN=<your-auth-token>
```

## Routes

- `/` - expense dashboard (KPIs, monthly trend, category breakdown, top vendors, recent expenses)
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
pnpm run dev      # start local dev server
pnpm run build    # production build
pnpm run start    # run production server
pnpm run lint     # Biome checks
pnpm run format   # apply Biome formatting
pnpm run test     # run test suite
```

## Tech Stack

- Next.js App Router + React 19
- TypeScript
- SQLite via libSQL (`file:` locally, Turso/libSQL remotely)
- Drizzle ORM + Drizzle Kit
- Biome
