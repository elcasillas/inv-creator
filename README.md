# Simple Invoice Creator

A minimal invoice creator built with Next.js 15, App Router, TypeScript, Tailwind CSS v3, and Supabase PostgreSQL.

## Features

- Dashboard for saved invoices
- Create, edit, view, print, and delete invoices
- Dynamic line items with automatic subtotal, tax, and total calculation
- Supabase-backed persistence using server actions
- Zod validation and React Hook Form integration
- Clean responsive UI with print-friendly invoice detail pages

## Tech Stack

- Next.js 15
- App Router
- TypeScript strict mode
- Tailwind CSS v3
- Supabase PostgreSQL
- React Hook Form
- Zod

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the Supabase migration.

If you use the Supabase CLI:

```bash
supabase db push
```

Or run the SQL in [supabase/migrations/20260501131500_create_invoices.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260501131500_create_invoices.sql:1) from the Supabase SQL editor.

4. Start local development:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

If the environment variables are not set yet, the dashboard still loads and shows a setup notice instead of crashing the app.

## Project Structure

- `app/`: App Router pages, layout, global styles, and server actions
- `components/`: Reusable UI pieces and invoice-specific components
- `lib/supabase/`: Dedicated Supabase client utilities and queries
- `lib/validation/`: Zod schemas and form defaults
- `lib/utils/`: Formatting, mapping, and invoice calculation helpers
- `supabase/migrations/`: SQL migration files

## Database Notes

The app uses two tables:

- `invoices`
- `invoice_items`

Edits replace the associated line items for an invoice after updating the parent invoice. Deleting an invoice also deletes its line items through `on delete cascade`.

## Auth Readiness

Supabase Auth is optional in this version. The app is structured with dedicated Supabase utilities in `lib/supabase` so authenticated server and browser clients can be introduced later without reshaping the page and form layers.

## Local Development Command

```bash
npm run dev
```
