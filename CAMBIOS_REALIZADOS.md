# Cambios realizados

## Rebuild integral
Se rehizo la web como paquete estático más limpio y mantenible.

## Formularios
- Se eliminó la dependencia de match exacto obligatorio.
- Los 3 formularios ahora siempre devuelven resultado.
- Se quitaron campos redundantes en los módulos públicos.
- La marca y modelo aceptan entrada libre con sugerencias por datalist.

## Lógica de valuación
- `marketValue`: valor de mercado estimado.
- `preOffer`: descuento sobre mercado según origen.
- `conservativeValue`: haircut para crédito.
- `consignRange`: mínimo / recomendado / máximo.

## Admin
- Diseño responsive más limpio.
- Tabs separadas para web pública, pricing, inventario, usuarios y sync.
- Inventario y usuarios editables.
- Publicación remota con JSONBin.

## Persistencia
- Estado local por navegador.
- Broadcast entre tabs del mismo navegador.
- Polling remoto + refresh al volver al tab.

## Importante
Los leads siguen siendo locales salvo que conectes un webhook CRM. Config, pricing, inventario y usuarios sí se pueden volver globales usando Sync.
