-- AutoPago v8 — esquema base (aplicar una sola vez en el proyecto ueleianrtxaupxwuzxnm)
-- Es aditivo salvo por quitar permisos anónimos que la v26 no usa
-- (leer/editar leads, gestionar overrides/listings, leer ap_admin_users).
-- Se mantienen las escrituras anónimas a ap_inventory y ap_admin_config para que la v26 siga funcionando;
-- ver 20261125_autopago_v8_lockdown.sql para cerrarlas cuando la v8 pase a producción.

-- ── Perfiles y roles ──
create table if not exists public.ap_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  company text,
  role text not null default 'reseller' check (role in ('admin','reseller')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.ap_profiles enable row level security;

create or replace function public.ap_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ap_profiles where user_id = auth.uid() and role = 'admin' and approved);
$$;
create or replace function public.ap_is_reseller() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from ap_profiles where user_id = auth.uid() and approved);
$$;

-- El rol admin nunca se toma de la metadata del registro: solo el correo de GC lo recibe.
create or replace function public.ap_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into ap_profiles(user_id, email, name, phone, company, role, approved)
  values (
    new.id, new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'company',
    case when lower(new.email) = 'gc.asin.zapata@gmail.com' then 'admin' else 'reseller' end,
    lower(new.email) = 'gc.asin.zapata@gmail.com'
  ) on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists ap_on_auth_user_created on auth.users;
create trigger ap_on_auth_user_created after insert on auth.users
  for each row execute function public.ap_handle_new_user();

create policy "own profile read" on public.ap_profiles for select to authenticated using (user_id = auth.uid() or public.ap_is_admin());
create policy "admin manage profiles" on public.ap_profiles for update to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());
create policy "admin delete profiles" on public.ap_profiles for delete to authenticated using (public.ap_is_admin());

-- ── Leads / CRM ──
alter table public.ap_leads
  add column if not exists stage text not null default 'nuevo',
  add column if not exists tier text,
  add column if not exists notes text,
  add column if not exists next_action_at timestamptz,
  add column if not exists offer_usd numeric,
  add column if not exists market_value_usd numeric,
  add column if not exists lost_reason text;
alter table public.ap_leads alter column created_at set default now();
alter table public.ap_leads alter column updated_at set default now();

drop policy if exists "anon can read leads" on public.ap_leads;          -- exponía 102 teléfonos/correos
drop policy if exists "anon can update lead status" on public.ap_leads;
drop policy if exists "anon can insert leads" on public.ap_leads;
create policy "public insert leads" on public.ap_leads for insert to anon, authenticated
  with check (stage = 'nuevo' and tier is null and notes is null);
create policy "admin read leads" on public.ap_leads for select to authenticated using (public.ap_is_admin());
create policy "admin update leads" on public.ap_leads for update to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());
create policy "admin delete leads" on public.ap_leads for delete to authenticated using (public.ap_is_admin());

create table if not exists public.ap_lead_events (
  id bigint generated always as identity primary key,
  lead_id text not null references public.ap_leads(id) on delete cascade,
  kind text not null default 'nota',
  body text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.ap_lead_events enable row level security;
create policy "admin all events" on public.ap_lead_events for all to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());
create index if not exists ap_lead_events_lead on public.ap_lead_events(lead_id, created_at desc);

-- ── Inventario: costo y datos mayoristas fuera de la tabla pública ──
create table if not exists public.ap_inventory_private (
  inventory_id text primary key references public.ap_inventory(id) on delete cascade,
  wholesale boolean not null default false,
  wholesale_price_usd numeric,
  min_bid_usd numeric,
  auction_ends_at timestamptz,
  cost_usd numeric,
  notes text,
  updated_at timestamptz not null default now()
);
alter table public.ap_inventory_private enable row level security;
create policy "admin all inventory private" on public.ap_inventory_private for all to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());

create policy "auth read inventory" on public.ap_inventory for select to authenticated using (true);
create policy "admin write inventory" on public.ap_inventory for all to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());

-- ── Pujas ──
create table if not exists public.ap_bids (
  id bigint generated always as identity primary key,
  inventory_id text not null references public.ap_inventory(id) on delete cascade,
  reseller_id uuid not null default auth.uid() references public.ap_profiles(user_id) on delete cascade,
  amount_usd numeric not null check (amount_usd > 0),
  status text not null default 'activa' check (status in ('activa','aceptada','rechazada')),
  created_at timestamptz not null default now()
);
alter table public.ap_bids enable row level security;
create index if not exists ap_bids_inv on public.ap_bids(inventory_id, amount_usd desc);
create policy "reseller insert own bid" on public.ap_bids for insert to authenticated
  with check (reseller_id = auth.uid() and public.ap_is_reseller() and status = 'activa');
create policy "reseller read own bids" on public.ap_bids for select to authenticated using (reseller_id = auth.uid() or public.ap_is_admin());
create policy "admin manage bids" on public.ap_bids for update to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());
create policy "admin delete bids" on public.ap_bids for delete to authenticated using (public.ap_is_admin());

create or replace function public.ap_validate_bid() returns trigger
language plpgsql security definer set search_path = public as $$
declare p ap_inventory_private; st text; top numeric;
begin
  select * into p from ap_inventory_private where inventory_id = new.inventory_id;
  select status into st from ap_inventory where id = new.inventory_id;
  if p.inventory_id is null or not p.wholesale or st = 'vendido' then raise exception 'Este auto no está disponible para ofertas'; end if;
  if p.auction_ends_at is not null and p.auction_ends_at < now() then raise exception 'La subasta ya cerró'; end if;
  if p.min_bid_usd is not null and new.amount_usd < p.min_bid_usd then raise exception 'La oferta está por debajo del mínimo'; end if;
  select max(amount_usd) into top from ap_bids where inventory_id = new.inventory_id and status = 'activa';
  if top is not null and new.amount_usd < top + 100 then raise exception 'La oferta debe superar la mejor en al menos US$ 100'; end if;
  return new;
end $$;
drop trigger if exists ap_bids_validate on public.ap_bids;
create trigger ap_bids_validate before insert on public.ap_bids for each row execute function public.ap_validate_bid();

-- Lista mayorista para revendedores aprobados (sin costo interno ni identidad de otros postores)
create or replace function public.ap_wholesale_list()
returns table (id text, brand text, model text, year int, km int, fuel text, transmission text, color text,
  status text, img text, images jsonb, sort_order int, wholesale_price_usd numeric, min_bid_usd numeric,
  auction_ends_at timestamptz, max_bid numeric, bid_count bigint)
language sql stable security definer set search_path = public as $$
  select i.id, i.brand, i.model, i.year, i.km, i.fuel, i.transmission, i.color, i.status, i.img, i.images, i.sort_order,
    p.wholesale_price_usd, p.min_bid_usd, p.auction_ends_at,
    (select max(b.amount_usd) from ap_bids b where b.inventory_id = i.id and b.status = 'activa'),
    (select count(*) from ap_bids b where b.inventory_id = i.id and b.status = 'activa')
  from ap_inventory i join ap_inventory_private p on p.inventory_id = i.id
  where p.wholesale and i.status <> 'vendido' and public.ap_is_reseller()
  order by i.sort_order;
$$;
revoke execute on function public.ap_wholesale_list() from anon, public;
grant execute on function public.ap_wholesale_list() to authenticated;

-- ── Precios de mercado (lectura pública para el tasador; escritura solo admin) ──
drop policy if exists "anon insert listings" on public.ap_market_listings;
create policy "auth read listings" on public.ap_market_listings for select to authenticated using (true);
create policy "admin write listings" on public.ap_market_listings for all to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());
create index if not exists ap_market_listings_bmy on public.ap_market_listings(lower(brand), lower(model), year);
create unique index if not exists ap_market_listings_src on public.ap_market_listings(source, source_id);

drop policy if exists "anon manage overrides" on public.ap_price_overrides;
create policy "auth read overrides" on public.ap_price_overrides for select to authenticated using (true);
create policy "admin write overrides" on public.ap_price_overrides for all to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());

drop policy if exists "anon insert market prices" on public.ap_market_prices;

-- ── ap_admin_users (legado): nadie anónimo debe leer pin_hash ──
drop policy if exists "anon full access admin users" on public.ap_admin_users;
