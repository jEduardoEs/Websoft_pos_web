# FUNCTION_INVENTORY.md - INVENTARIO GRANULAR DE FUNCIONES

| Función | Archivo | Responsabilidad | Entradas | Salidas | Side Effects | Capa Destino V2 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `load()` | `page.tsx` | Carga asíncrona del listado | Ninguna | `Promise<void>` | Mutó estado `descuentos` | `hooks/useDescuentos.ts` |
| `save()` | `page.tsx` | Persiste alta/edición | Ninguna (`form`) | `Promise<void>` | HTTP POST, Toast, Mutó estado | `hooks/useDescuentos.ts` |
| `del()` | `page.tsx` | Desactiva un código | `d: Descuento` | `Promise<void>` | HTTP DELETE, Toast, Mutó estado | `hooks/useDescuentos.ts` |
| `GET` | `api/descuentos/route.ts` | Endpoint de consulta | `req` | `NextResponse` | Consulta a PostgreSQL | `api/descuentoHandler.ts` |
| `POST` | `api/descuentos/route.ts` | Endpoint de creación/edición | `req` | `NextResponse` | Inserción/Update PostgreSQL | `api/descuentoHandler.ts` |
| `DELETE` | `api/descuentos/route.ts` | Endpoint de desactivación | `req` | `NextResponse` | Soft Delete PostgreSQL | `api/descuentoHandler.ts` |
| `POST (Validar)` | `api/descuentos/validar/route.ts` | Endpoint de validación | `req` | `NextResponse` | Lectura PostgreSQL | `logic/validarDescuento.ts` |
