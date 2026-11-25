-- Las funciones de trigger y helpers no deben ser llamables como RPC públicas
revoke execute on function public.ap_handle_new_user() from public, anon, authenticated;
revoke execute on function public.ap_validate_bid() from public, anon, authenticated;
revoke execute on function public.ap_is_admin() from public, anon;
revoke execute on function public.ap_is_reseller() from public, anon;
grant execute on function public.ap_is_admin() to authenticated;
grant execute on function public.ap_is_reseller() to authenticated;
