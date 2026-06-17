# Invoice Creator

A minimal invoice creator built with Next.js 15, App Router, TypeScript, Tailwind CSS v3, Cloudflare D1, and OpenNext for Cloudflare Workers.

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
- OpenNext for Cloudflare Workers
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
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://pub-<your-r2-domain>
```

For deployed Workers, the logo upload route also reads `COMPANY_LOGO_PUBLIC_BASE_URL` from
[`wrangler.jsonc`](/mnt/f/AI/inv-creator/wrangler.jsonc:1) as a fallback.

3. Apply the D1 schema migration.

The schema lives in [cloudflare/migrations/0001_init.sql](/mnt/f/AI/inv-creator/cloudflare/migrations/0001_init.sql:1).

The migration config lives in [wrangler.d1.toml](/mnt/f/AI/inv-creator/wrangler.d1.toml:1) and points the `DB` binding at the configured D1 database.

```bash
npm run d1:migrations:list
npm run d1:migrations:apply
```

You can also execute the migration file directly if needed:

```bash
npx wrangler d1 execute DB --config wrangler.d1.toml --remote --file=cloudflare/migrations/0001_init.sql
```

4. Start local Next.js development:

```bash
npm run dev
```

5. Preview the Worker runtime locally:

```bash
npm run preview
```

## Worker Deploy

This repository now explicitly supports the OpenNext-on-Workers deployment path.

The Worker deployment config lives in [wrangler.jsonc](/mnt/f/AI/inv-creator/wrangler.jsonc:1). It explicitly:

- names the Worker `inv-creator`
- binds the D1 database as `DB`
- binds the company logo R2 bucket as `COMPANY_LOGO_BUCKET`
- sets `COMPANY_LOGO_PUBLIC_BASE_URL` for the logo upload route fallback
- configures the self-reference service binding to the same Worker name
- points assets to `.open-next/assets`

Company logos are uploaded through `POST /api/company-logo/upload`, stored in Cloudflare R2, and
saved to the existing `companies.logo_url` field as a public object URL. The route prefers
`COMPANY_LOGO_PUBLIC_BASE_URL` from `wrangler.jsonc`, then falls back to
`CLOUDFLARE_R2_PUBLIC_BASE_URL` from the environment.

You can also check the runtime config with `GET /api/company-logo/upload`. It returns whether the
R2 binding and public base URL are both configured.

For Cloudflare Workers Builds, use:

- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy`

Useful commands:

```bash
npm run preview
npm run deploy
npm run upload
```

The expected production URL for this deployment path is the Worker URL:

```text
https://inv-creator.<your-account>.workers.dev
```

## Project Structure

- `app/`: App Router pages, layout, global styles, and server actions
- `components/`: Reusable UI pieces and invoice-specific components
- `lib/d1/`: Cloudflare D1 client utilities and queries
- `lib/validation/`: Zod schemas and form defaults
- `lib/utils/`: Formatting, mapping, and invoice calculation helpers
- `cloudflare/migrations/`: D1 schema migration files
- `wrangler.d1.toml`: D1 migration-only configuration
- `wrangler.jsonc`: OpenNext Worker deployment configuration
- `open-next.config.ts`: OpenNext Cloudflare adapter configuration

## Database Notes

The app uses these main tables:

- `clients`
- `companies`
- `invoices`
- `invoice_items`

Invoices reference a saved company profile through `company_id` and may also reference a saved client profile through `client_id`. Each company stores its own `invoice_start_number`, and new invoices use a company-specific numeric sequence. Edits replace the associated line items for an invoice after updating the parent invoice. Deleting an invoice also deletes its line items through `on delete cascade`.

When running on Cloudflare Workers, the app prefers the bound D1 database from `env.DB`. Outside that runtime it falls back to the Cloudflare D1 HTTP API using the environment variables above.

## Auth

The current D1 version does not include an application auth system. The old Supabase Auth and admin user management flow was removed during the backend switch. The `/login` and `/admin/users` routes now document that limitation instead of providing a live auth flow.
