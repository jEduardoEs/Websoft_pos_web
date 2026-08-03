# DATA_FLOW.md - FLUJO DE DATOS Y TRANSFORMACIÓN EN "DESCUENTOS"

## 1. FLUJO DE CONSULTA (`GET /api/descuentos`)
- **Origen**: Base de Datos PostgreSQL (Tabla `Descuento`).
- **Transformación API**: `prisma.descuento.findMany({ orderBy: { id: 'desc' } })`.
- **Formato Respondedor**: JSON `Descuento[]`.
- **Consumo UI**: `setDescuentos(data)` en `DescuentosPage`.

---

## 2. FLUJO DE CREACIÓN / EDICIÓN (`POST /api/descuentos`)
- **Entrada UI**: Objeto `form` (`codigo`, `descripcion`, `tipo`, `valor`, `minimoCompra`, `usosMaximos`, `fechaInicio`, `fechaFin`).
- **Validación API**: Verifica presencia de `codigo` y `valor`. Formatea `codigo.toUpperCase()`.
- **Transformación de Tipos**:
  - `valor`: String/Number -> `+valor` (Float).
  - `minimoCompra`: String/Number -> `+minimoCompra || 0`.
  - `usosMaximos`: String/Number -> `+usosMaximos || 0`.
  - `fechaInicio`: String ISO -> `new Date(fechaInicio)` o `null`.
  - `fechaFin`: String ISO -> `new Date(fechaFin)` o `null`.
- **Persistencia**: `prisma.descuento.create` o `prisma.descuento.update`.

---

## 3. FLUJO DE VALIDACIÓN EN VENTA (`POST /api/descuentos/validar`)
- **Entrada**: `{ codigo: string, total: number }`.
- **Normalización**: `codigo.toUpperCase()`.
- **Evaluaciones**:
  1. `findUnique` por código.
  2. `now < fechaInicio` -> Rechazo.
  3. `now > fechaFin` -> Rechazo.
  4. `total < minimoCompra` -> Rechazo.
  5. `usosActuales >= usosMaximos` -> Rechazo.
- **Salida**: Objeto `{ ok: true, porcentaje: number, descuento: Descuento }`.
