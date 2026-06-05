# WebSoft Solutions — FEL + Correo + Tickets
## Instrucciones de integración

---

## Archivos incluidos

```
src/
  lib/
    fel.ts              ← Servicio INFILE (FEL) con sandbox/pruebas/produccion
    email-factura.ts    ← Envío de factura media carta por email (Resend/SMTP)
    ticket-printer.ts   ← Generador ticket térmico 80mm Epson TM-T30II
  app/
    api/ventas/
      route.ts          ← API de ventas actualizada con hooks FEL + email
    (dashboard)/
      pos/page.tsx      ← POS actualizado (ticket mejorado, correo, FEL status)
      fel/page.tsx      ← Panel FEL (estado, historial DTEs, guía)
prisma/
  schema-venta-patch.prisma  ← Campos FEL para agregar al schema
```

---

## PASO 1 — Actualizar schema.prisma

Abre `prisma/schema.prisma` y reemplaza el modelo `Venta` con el que está en
`prisma/schema-venta-patch.prisma`.

Los campos nuevos son:
- `clienteCorreo` — correo del receptor (opcional)
- `felUuid` — UUID de autorización SAT
- `felSerie` — serie asignada por INFILE
- `felNumero` — número correlativo DTE
- `felCertificacion` — fecha y hora de certificación
- `felXml` — XML DTE firmado (para respaldo)
- `felEstado` — "sandbox" | "certificado" | "anulado"

Luego ejecutar:
```bash
npx prisma@5.22.0 db push
```

---

## PASO 2 — Instalar dependencias (solo si usas SMTP)

Si vas a usar Gmail SMTP en lugar de Resend:
```bash
npm install nodemailer @types/nodemailer
```

Para Resend no se necesita instalar nada (usa fetch nativo).

---

## PASO 3 — Variables de entorno

Agrega en **Vercel → Settings → Environment Variables**:

### FEL (cuando tengas contrato con INFILE)
```
FEL_MODO=sandbox               # sandbox | pruebas | produccion
FEL_USUARIO=tu@correo.com      # Usuario INFILE
FEL_CLAVE=tu_clave_infile      # Clave/token INFILE (NUNCA en DB)
FEL_NIT_EMISOR=115471413       # NIT sin guion
FEL_NOMBRE_EMISOR=WebSoft Solutions
FEL_DIRECCION=Barrio el Calvario, Guastatoya, El Progreso
FEL_CODIGO_POSTAL=22001
FEL_DEPARTAMENTO=El Progreso
FEL_MUNICIPIO=Guastatoya
FEL_CORREO_EMISOR=info@websoftsolutions.com.gt
FEL_SERIE=A                    # Serie asignada por INFILE
```

### Email (elige uno)
```
# Opción A: Resend (recomendado, gratis hasta 3000/mes)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=WebSoft Solutions <facturas@websoftsolutions.com.gt>

# Opción B: Gmail SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=tu_app_password       # Generar en myaccount.google.com/apppasswords
EMAIL_FROM=WebSoft Solutions <tu@gmail.com>
```

---

## PASO 4 — Configurar en el sistema

### Activar FEL:
1. Ve a **Configuración → FEL / SAT**
2. Activa "Estado de FEL"
3. Selecciona certificador: INFILE
4. Elige ambiente: `sandbox` (mientras pruebas) → `pruebas` (con creds INFILE) → `produccion`
5. Ingresa NIT Emisor y Nombre Emisor
6. Guarda

### Activar correo:
1. Ve a **Configuración → Ventas y Tickets**
2. Activa "Factura por correo"
3. Guarda

### También agregar a la tabla `config` en la DB:
```sql
INSERT INTO config (clave, valor) VALUES
  ('fel_activo',           'false'),
  ('email_factura_activo', 'false'),
  ('ticket_mostrar_fel',   'true')
ON CONFLICT (clave) DO NOTHING;
```

---

## PASO 5 — Copiar archivos al proyecto

Copia cada archivo a su ruta correspondiente en el proyecto.
Los archivos existentes que se reemplazan son:
- `src/app/api/ventas/route.ts` — agrega import de fel y email
- `src/app/(dashboard)/pos/page.tsx` — agrega import ticket-printer, campo correo
- `src/app/(dashboard)/fel/page.tsx` — reemplaza completamente

---

## Flujo completo después de la integración

```
Cajero hace venta en POS
        ↓
/api/ventas POST
        ↓
1. Crea venta en DB
2. Actualiza stock + kardex
        ↓
3. Si FEL activo:
   - Construye JSON DTE
   - Llama a INFILE API
   - Guarda UUID + serie en venta
        ↓
4. Si email activo y cliente tiene correo:
   - Genera HTML factura media carta
   - Envía vía Resend o SMTP
        ↓
5. Retorna { ok, venta, fel, email }
        ↓
POS muestra UUID en modal de cobro
Ticket incluye UUID + QR de SAT
```

---

## Impresora Epson TM-T30II — USB

### Configuración Windows:
1. Instala el driver Epson (TM-T30II USB)
2. En Chrome/Edge: cuando imprimas, selecciona la impresora Epson
3. Configura: Papel = 80mm, sin márgenes, escala = 100%, sin encabezado/pie

### Para impresión silenciosa (sin diálogo):
Instalar **QZ Tray** (https://qz.io) — plugin gratuito que permite imprimir
desde web sin diálogo del navegador. Requiere configuración adicional.

### Ticket incluye:
- Logo WebSoft (configurable)
- Datos empresa (nombre, NIT, dirección, teléfono)
- Número de factura
- Fecha y hora
- Cliente y NIT
- Cajero
- Items con cantidad × precio unitario = total
- Descuentos
- Subtotal / IVA / TOTAL
- Recibido / Cambio
- Método de pago
- **Sección FEL** (si tiene UUID):
  - Número de autorización completo
  - Serie y número DTE
  - Fecha de certificación
  - Nombre del certificador
  - QR con link de verificación SAT
- Leyendas ISR / IVA
- Mensaje personalizable

---

## INFILE — Obtener contrato

1. Visita https://infile.com.gt
2. Llama al PBX: 2261-9595 (Guatemala)
3. Solicita plan "Pequeño Contribuyente" o "General"
4. Proporciona: NIT, nombre comercial, dirección, correo
5. Tiempo de activación: 1-3 días hábiles
6. Te darán: usuario, clave, y serie asignada

Cuando tengas las credenciales:
1. Agrega FEL_USUARIO, FEL_CLAVE, FEL_SERIE en Vercel
2. Cambia FEL_MODO a "pruebas" para validar
3. Cuando todo funcione, cambia a "produccion"
