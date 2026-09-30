-- Shiny Hunter Pro : table de synchronisation (une ligne par utilisateur).
-- À exécuter dans Supabase → SQL Editor.

create table if not exists public.shiny_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  doc jsonb not null default '{}'::jsonb,
  client_stamp bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.shiny_data enable row level security;

drop policy if exists "Lecture de ses données" on public.shiny_data;
create policy "Lecture de ses données" on public.shiny_data
  for select using (auth.uid() = user_id);

drop policy if exists "Création de ses données" on public.shiny_data;
create policy "Création de ses données" on public.shiny_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "Modification de ses données" on public.shiny_data;
create policy "Modification de ses données" on public.shiny_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Suppression de ses données" on public.shiny_data;
create policy "Suppression de ses données" on public.shiny_data
  for delete using (auth.uid() = user_id);

-- Temps réel : les autres appareils sont prévenus des changements.
alter publication supabase_realtime add table public.shiny_data;
