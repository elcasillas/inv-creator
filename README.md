# Simple Invoice Creator

A minimal invoice creator built with Next.js 15, App Router, TypeScript, Tailwind CSS v3, and Supabase PostgreSQL.

## Features

- Dashboard for saved invoices
- Company profile management with reusable sender details
- Client profile management with reusable billing details
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

3. Run the Supabase migration.

If you use the Supabase CLI:

```bash
supabase db push
```

Or run the SQL in [supabase/migrations/20260501131500_create_invoices.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260501131500_create_invoices.sql:1) from the Supabase SQL editor.

If you already created the tables and hit a Row Level Security error such as `new row violates row-level security policy for table "invoices"`, run the follow-up policy migration too:

- [supabase/migrations/20260501190000_enable_invoice_rls.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260501190000_enable_invoice_rls.sql:1)
- [supabase/migrations/20260501203000_add_companies.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260501203000_add_companies.sql:1)
- [supabase/migrations/20260501203500_enable_company_rls.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260501203500_enable_company_rls.sql:1)
- [supabase/migrations/20260501213000_add_clients.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260501213000_add_clients.sql:1)
- [supabase/migrations/20260501213500_enable_client_rls.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260501213500_enable_client_rls.sql:1)

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

- `clients`
- `companies`
- `invoices`
- `invoice_items`

Invoices reference a saved company profile through `company_id` and may also reference a saved client profile through `client_id`. Edits replace the associated line items for an invoice after updating the parent invoice. Deleting an invoice also deletes its line items through `on delete cascade`.

## Auth Readiness

Supabase Auth is optional in this version. The app is structured with dedicated Supabase utilities in `lib/supabase` so authenticated server and browser clients can be introduced later without reshaping the page and form layers.

Because this version allows invoice creation and company management without sign-in, the included RLS policies currently allow `anon` and `authenticated` access to the `companies`, `invoices`, and `invoice_items` tables. Once auth is added, these policies should be tightened to user-scoped rules.

The `clients` table is already user-scoped. Its policies allow authenticated users to manage only their own client records via `user_id = auth.uid()`. That means reusable client profiles require a real Supabase auth session, while manual invoice client entry still works without one.

## Local Development Command

```bash
npm run dev
```
