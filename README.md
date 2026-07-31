# WebSoft Solutions POS — FEL + Correo + Tickets

## Archivos incluidos

```
src/lib/fel.ts                          → Servicio INFILE (sandbox/pruebas/produccion)
src/lib/email-factura.ts                → Factura por correo (Resend o SMTP)
src/lib/ticket-printer.ts              → Ticket 80mm para Epson TM-T30II
src/app/api/ventas/route.ts            → API ventas con hooks FEL + email
src/app/(dashboard)/pos/page.tsx       → POS actualizado
src/app/(dashboard)/fel/page.tsx       → Panel FEL
prisma/schema-venta-patch.prisma       → Campos FEL para agregar al schema
```

## Instalación

**1. Schema** — reemplaza el modelo `Venta` con el del patch y corre:

```bash
npx prisma@5.22.0 db push
```

**2. Variables en Vercel** — las mínimas para empezar:

```
FEL\_MODO=sandbox
```

Cuando tengas contrato con INFILE agrega:

```
FEL\_MODO=produccion
FEL\_USUARIO=tu\_usuario
FEL\_CLAVE=tu\_clave
FEL\_NIT\_EMISOR=115471413
FEL\_SERIE=A
```

Para correo (Resend es gratis hasta 3,000/mes):

```
EMAIL\_PROVIDER=resend
RESEND\_API\_KEY=re\_xxxxxxxxxxxx
EMAIL\_FROM=WebSoft Solutions <facturas@websoftsolutions.com.gt>
```

**3. Configuración en el sistema:**

* FEL: Configuración → FEL / SAT → activar
* Correo: Configuración → Ventas y Tickets → activar "Factura por correo"

**4. Copiar archivos** al proyecto y hacer redeploy.

## Cómo funciona

Cada venta en el POS:

1. Se guarda normalmente en la DB
2. Si FEL está activo → llama a INFILE y guarda el UUID en la venta
3. Si el cliente tiene correo → envía la factura en HTML

El ticket se imprime automáticamente al cobrar. Incluye el UUID y QR del SAT cuando FEL está en producción.

## Impresora Epson TM-T30II (USB)

La impresora aparece como impresora normal del sistema. Al imprimir:

* Seleccionar la Epson en el diálogo
* Papel: 80mm, sin márgenes, escala 100%
* Desactivar encabezado y pie de página del navegador

## INFILE

Contactar en infile.com.gt o al PBX 2261-9595. Pedir plan básico, te asignan usuario, clave y serie en 1-3 días hábiles.

….

