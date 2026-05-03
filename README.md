# Simple Invoice Creator

A minimal invoice creator built with Next.js 15, App Router, TypeScript, Tailwind CSS v3, and Supabase PostgreSQL.

## Features

- Dashboard for saved invoices
- Company profile management with reusable sender details
- Company-specific invoice numbering with configurable start numbers
- Client profile management with reusable billing details
- Supabase email/password login for user-scoped client profiles
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
- Supabase Auth SSR helpers
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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
- [supabase/migrations/20260502090000_add_company_invoice_start_number.sql](/mnt/c/Users/edcas/My%20Drive/AI/InvoiceCreator/supabase/migrations/20260502090000_add_company_invoice_start_number.sql:1)

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

The app uses these main tables:

- `clients`
- `companies`
- `invoices`
- `invoice_items`
- `profiles`

Invoices reference a saved company profile through `company_id` and may also reference a saved client profile through `client_id`. Each company stores its own `invoice_start_number`, and new invoices use a company-specific numeric sequence. Edits replace the associated line items for an invoice after updating the parent invoice. Deleting an invoice also deletes its line items through `on delete cascade`.

## Auth

The app uses Supabase Auth with admin-managed accounts:

- Visit `/login` to log in with email and password
- Public signup is intentionally not exposed
- Admin users can manage accounts at `/admin/users`
- User creation and auth admin mutations run server-side with `SUPABASE_SERVICE_ROLE_KEY`
- Profiles live in `public.profiles` and link `profiles.id` to `auth.users.id`
- Roles are `admin` and `user`

Set these environment variables locally:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The `profiles` table is protected with RLS. Users can read their own profile, while admins can read and manage all profiles. The `clients` table remains user-scoped through `user_id = auth.uid()`.

For the first admin, create or update one Supabase Auth user from the Supabase dashboard and set that user's `public.profiles.role` to `admin`. After that, use `/admin/users` for account management.

## Local Development Command

```bash
npm run dev
```
