# Publicar CamisfutMadrid

## 1. Supabase

1. Crea el proyecto.
2. Ejecuta `supabase/schema.sql`.
3. Ejecuta todas las migraciones en orden.
4. Crea tu usuario.
5. Convierte tu perfil en administrador.

## 2. Stripe

1. Crea una cuenta Stripe.
2. Añade las claves en Vercel.
3. Crea el webhook:
   - URL: `https://TU-DOMINIO/api/stripe/webhook`
   - Eventos:
     - `checkout.session.completed`
     - `checkout.session.expired`
4. Copia el secreto del webhook.

## 3. Resend

1. Verifica tu dominio.
2. Configura:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`

## 4. Vercel

1. Sube el proyecto a GitHub.
2. Importa el repositorio en Vercel.
3. Añade todas las variables de `.env.example`.
4. Despliega.

## 5. Dominio

Conecta el dominio desde Vercel y actualiza:

`NEXT_PUBLIC_SITE_URL=https://tu-dominio.com`

## 6. Verificación antes de vender

- Compra de prueba con Stripe.
- Transferencia de prueba.
- Confirmación de email.
- Descuento de stock.
- Cancelación y devolución de stock.
- Cupón.
- Cuenta de cliente.
- Panel administrador.
