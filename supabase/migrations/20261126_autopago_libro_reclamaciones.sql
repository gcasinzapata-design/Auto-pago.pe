-- Libro de Reclamaciones virtual (D.S. 011-2011-PCM y modificatorias)
create sequence if not exists public.ap_reclamos_seq;
create table if not exists public.ap_reclamos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('reclamo','queja')),
  nombre text not null check (length(nombre) between 2 and 120),
  doc_tipo text not null check (doc_tipo in ('DNI','CE','Pasaporte','RUC')),
  doc_numero text not null check (length(doc_numero) between 6 and 15),
  domicilio text not null check (length(domicilio) between 3 and 200),
  telefono text check (length(telefono) <= 20),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 120),
  menor_edad boolean not null default false,
  apoderado text check (length(apoderado) <= 120),
  bien_tipo text not null check (bien_tipo in ('producto','servicio')),
  bien_descripcion text not null check (length(bien_descripcion) between 3 and 300),
  monto numeric check (monto >= 0 and monto < 10000000),
  moneda text check (moneda in ('PEN','USD')),
  detalle text not null check (length(detalle) between 10 and 3000),
  pedido text not null check (length(pedido) between 3 and 1500),
  estado text not null default 'pendiente' check (estado in ('pendiente','en_proceso','respondido')),
  respuesta text,
  respondido_at timestamptz,
  acciones text
);
alter table public.ap_reclamos enable row level security;
create policy "admin read reclamos" on public.ap_reclamos for select to authenticated using (public.ap_is_admin());
create policy "admin update reclamos" on public.ap_reclamos for update to authenticated using (public.ap_is_admin()) with check (public.ap_is_admin());
-- ap_submit_reclamo(jsonb): ver migración aplicada (security definer, devuelve código correlativo LR-AAAA-NNNNNN)
