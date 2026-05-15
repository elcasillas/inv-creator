# Simple Invoice Creator

A minimal invoice creator built with Next.js 15, App Router, TypeScript, Tailwind CSS v3, and Cloudflare D1.

## Features

- Dashboard for saved invoices
- Company profile management with reusable sender details
- Company-specific invoice numbering with configurable start numbers
- Client profile management with reusable billing details
- Create, edit, view, print, and delete invoices
- Dynamic line items with automatic subtotal, tax, and total calculation
- Cloudflare D1-backed persistence using server actions
- Zod validation and React Hook Form integration
- Clean responsive UI with print-friendly invoice detail pages

## Tech Stack

- Next.js 15
- App Router
- TypeScript strict mode
- Tailwind CSS v3
- Cloudflare D1
- React Hook Form
- Zod

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in:

```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=54e5cb8c2066084f27e65ea99836e6a0
CLOUDFLARE_D1_DATABASE_ID=6e483d82-680a-4e56-959c-abfcd0ab2bd1
```

3. Apply the D1 schema migration.

The schema lives in [cloudflare/migrations/0001_init.sql](/mnt/f/AI/inv-creator/cloudflare/migrations/0001_init.sql:1).

The repo-level Wrangler config lives in [wrangler.toml](/mnt/f/AI/inv-creator/wrangler.toml:1) and points the `DB` binding at the configured D1 database.

To apply pending migrations to the remote database:

```bash
npm run d1:migrations:apply
```

To preview pending migrations before applying them:

```bash
npm run d1:migrations:list
```

To apply against Wrangler's local D1 database instead of the remote database:

```bash
npm run d1:migrations:apply:local
```

To run an ad hoc SQL command against the remote database:

```bash
npm run d1:execute -- --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You can also execute the migration file directly if you need a one-off bootstrap:

```bash
npx wrangler d1 execute DB --config wrangler.toml --remote --file=cloudflare/migrations/0001_init.sql
```

4. Start local development:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

If the environment variables are not set yet, the dashboard still loads and shows a setup notice instead of crashing the app.

## Project Structure

- `app/`: App Router pages, layout, global styles, and server actions
- `components/`: Reusable UI pieces and invoice-specific components
- `lib/d1/`: Dedicated Cloudflare D1 client utilities and queries
- `lib/validation/`: Zod schemas and form defaults
- `lib/utils/`: Formatting, mapping, and invoice calculation helpers
- `cloudflare/migrations/`: D1 schema migration files
- `wrangler.toml`: Cloudflare D1 binding and migration configuration

## Database Notes

The app uses these main tables:

- `clients`
- `companies`
- `invoices`
- `invoice_items`

Invoices reference a saved company profile through `company_id` and may also reference a saved client profile through `client_id`. Each company stores its own `invoice_start_number`, and new invoices use a company-specific numeric sequence. Edits replace the associated line items for an invoice after updating the parent invoice. Deleting an invoice also deletes its line items through `on delete cascade`.

## Auth

The current D1 version does not include an application auth system. The old Supabase Auth and admin user management flow was removed during the backend switch. The `/login` and `/admin/users` routes now document that limitation instead of providing a live auth flow.

## Local Development Command

```bash
npm run dev
```
