# DEPENDENCY_MAP.md - MAPA DE DEPENDENCIAS DEL MÓDULO "DESCUENTOS"

---

## 1. DEPENDENCIAS INTERNAS DEL ERP
- `@/lib/prisma`: Conexión directa al ORM de Prisma (acoplamiento fuerte en legacy).
- `@/lib/auth`: Autenticación de NextAuth para lectura de sesión y rol de usuario.
- `@/lib/utils`: Utilidades de formateo `fmt` (moneda) y `fmtDate` (fechas).
- `sonner`: Biblioteca de alertas Toast (`toast.success`, `toast.error`).

---

## 2. DEPENDENCIAS EXTERNAS
- `next/server`: `NextRequest`, `NextResponse`.
- `react`: `useState`, `useEffect`.

---

## 3. DEPENDENCIAS DE OTROS MÓDULOS HACIA DESCUENTOS
- **Módulo POS / Ventas**: Invocan la API `POST /api/descuentos/validar` para verificar y aplicar un cupón al carrito de compra.

---

## 4. PLAN DE DESACOPLAMIENTO V2
- Sustituir `@/lib/utils` por `@/shared/formatters` (`formatGTQ`, `formatDate`).
- Sustituir `@/lib/prisma` en la UI por la abstracción de `descuentosRepository.ts`.
- Sustituir llamadas `fetch` inline por `descuentosService.ts` usando `fetchClient`.
- Sustituir la UI ad-hoc por los componentes del Design System `src/ui/`.
