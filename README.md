# AutoPago v8

Vite + React + Supabase. Producción: autopago.pe (Vercel).

- `/` tasador público con pre-oferta (catálogo + avisos reales + precios manuales)
- `/seminuevos`, `/faq`
- `/revendedores` portal mayorista con ofertas (Supabase Auth, aprobación manual)
- `/admin` CRM de leads, inventario, revendedores, tasación y ajustes (Supabase Auth, rol admin)

## Desarrollo
npm install && npm run dev

## Base de datos
Migraciones en `supabase/migrations/`. Aplicar `*_core.sql` antes del primer deploy;
`*_lockdown.sql` solo cuando la v8 reemplace a la v26 en producción.
