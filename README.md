# AutoPago (Landing + Legal + Admin)

## Qué incluye
- `/` landing (pre-oferta + WhatsApp)
- `/privacidad.html`, `/terminos.html`, `/cookies.html`
- `/admin/` dashboard protegido con Netlify Identity (código/link al correo)
- Netlify Functions + Netlify Blobs para almacenar leads y estados

## Paso a paso (Netlify)
1) En Netlify: **Site settings → Identity → Enable**
2) Identity → **Registration preferences**: “Invite only” (recomendado)
3) Identity → **Invite users**: invita **gc.asin.zapata@gmail.com** y acepta desde tu correo.
4) Deploy (desde GitHub) normalmente.

## Cómo se guardan los leads
- El formulario manda el lead a `/.netlify/functions/createLead`
- Luego abre WhatsApp con el mensaje completo

## Admin
- Entra a `/admin/`
- Presiona “Ingresar” → Netlify te manda código/link al correo
- Verás la tabla y podrás marcar estado + precio acordado + notas
