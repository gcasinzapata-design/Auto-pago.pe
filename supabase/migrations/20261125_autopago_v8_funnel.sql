-- Embudo del tasador: inserción anónima (solo escritura), lectura solo admin
create table if not exists public.ap_funnel_events (
  id bigint generated always as identity primary key,
  session_id text not null check (length(session_id) <= 64),
  event text not null check (event in ('tasador_start','step_complete','quote_shown','lock_click','lead_submitted','wa_open')),
  step text check (length(step) <= 32),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 2048),
  path text check (length(path) <= 200),
  created_at timestamptz not null default now()
);
alter table public.ap_funnel_events enable row level security;
create policy "public insert funnel" on public.ap_funnel_events for insert to anon, authenticated with check (true);
create policy "admin read funnel" on public.ap_funnel_events for select to authenticated using (public.ap_is_admin());
create index if not exists ap_funnel_events_created on public.ap_funnel_events(created_at desc);
