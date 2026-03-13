# AutoPago — paquete estático

## Qué incluye
- `index.html`
- `assets/styles.css`
- `assets/app.js`
- `assets/vdb.js`

## Qué quedó resuelto
- Formularios de **Compramos**, **Consigna** y **Préstamo** siempre devuelven un resultado.
- La **pre-oferta** se calcula sobre el valor de mercado estimado:
  - 20% debajo para orígenes `european`, `american`, `japanese`, `english`
  - 25% debajo para el resto
- **Consigna** muestra:
  - valor mínimo
  - valor recomendado
  - valor máximo (valor de mercado estimado)
  - slider que cambia días estimados de venta
- **Préstamo** usa un valor conservador por debajo del mercado y luego aplica LTV, edad máxima y cuotas.
- Admin responsive con tabs de:
  - Dashboard
  - Web pública
  - Pricing
  - Inventario
  - Usuarios
  - Sync
- El admin se abre con **7 taps al logo**.

## Importante sobre cambios globales
Para que ocultar módulos, editar pricing o cambiar inventario impacte a **todos** los usuarios, debes activar el tab **Sync** en admin:
1. ingresar tu `Bin ID`
2. ingresar tu `API key`
3. publicar cambios

Sin sync remota, los cambios solo quedan en el navegador local.

## Credenciales por defecto
- `gc.asin.zapata@gmail.com`
- `autopago2025`

## Subida a GitHub
1. Reemplaza los archivos del repo por este paquete.
2. Haz commit y push.
3. Si usas GitHub Pages, publica la rama correspondiente.

## Meta para sync pública
En `index.html` deja el Bin ID final aquí cuando lo tengas:
```html
<meta name="ap-bin-id" content="TU_BIN_ID_AQUI">
```
