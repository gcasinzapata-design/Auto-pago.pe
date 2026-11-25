-- AutoPago v8 — aplicar SOLO cuando la v8 esté en producción (la v26 deja de poder editar inventario/config).
drop policy if exists "anon can insert inventory" on public.ap_inventory;
drop policy if exists "anon can update inventory" on public.ap_inventory;
drop policy if exists "anon can delete inventory" on public.ap_inventory;
drop policy if exists "public_write_config" on public.ap_admin_config;
create policy "admin write config" on public.ap_admin_config for all to authenticated
  using (public.ap_is_admin()) with check (public.ap_is_admin());
