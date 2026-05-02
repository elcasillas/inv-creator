alter table public.clients enable row level security;

grant select, insert, update, delete on table public.clients to authenticated;

drop policy if exists "Users can view their own clients" on public.clients;
create policy "Users can view their own clients"
on public.clients
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own clients" on public.clients;
create policy "Users can insert their own clients"
on public.clients
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own clients" on public.clients;
create policy "Users can update their own clients"
on public.clients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own clients" on public.clients;
create policy "Users can delete their own clients"
on public.clients
for delete
to authenticated
using (auth.uid() = user_id);
