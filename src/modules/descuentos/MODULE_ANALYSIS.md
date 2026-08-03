# MODULE_ANALYSIS.md - AUDITORÍA E INGENIERÍA INVERSA DEL MÓDULO "DESCUENTOS"

---

## 1. INVENTARIO DE ARCHIVOS EXISTENTES
- **Página UI (Client Component)**: `src/app/(dashboard)/descuentos/page.tsx` (111 líneas).
- **Endpoint API CRUD**: `src/app/api/descuentos/route.ts` (54 líneas - `GET`, `POST`, `DELETE`).
- **Endpoint API Validación**: `src/app/api/descuentos/validar/route.ts` (31 líneas - `POST`).
- **Modelo Prisma**: `Descuento` en `prisma/schema.prisma` (L178-L193).

---

## 2. ANÁLISIS DE ESTADO EN REACT (`page.tsx`)
- `descuentos`: Arreglo local `Descuento[]` mediante `useState`.
- `showModal`: Estado booleano de visibilidad del formulario modal (`useState`).
- `form`: Estado del formulario (`any`) inicializado en objeto `empty`.
- `loading`: Estado booleano de guardado (`useState`).
- `useEffect`: Dispara la función `load()` al montar el componente.

---

## 3. ANÁLISIS DE REGLAS DE NEGOCIO IDENTIFICADAS
1. **Obligatoriedad de Insumos**: Código y valor son requeridos (`if (!form.codigo || !form.valor)`).
2. **Normalización de Código**: Los códigos se convierten a mayúsculas (`codigo.toUpperCase()`).
3. **Tipo de Descuento**:
   - `porcentaje`: Aplica un porcentaje sobre el total.
   - `fijo`: Aplica un monto fijo en Quetzales.
4. **Validaciones de Vigencia**:
   - `fechaInicio`: Si `now < fechaInicio`, rechazar por "aún no está vigente".
   - `fechaFin`: Si `now > fechaFin`, rechazar por "expiró".
5. **Mínimo de Compra**: Si `total < minimoCompra`, rechazar por "Mínimo de compra: Q X".
6. **Límite de Usos**: Si `usosMaximos > 0` y `usosActuales >= usosMaximos`, rechazar por "Código agotado".
7. **Cálculo de Porcentaje Equivalente**: Si el tipo es `fijo`, el porcentaje equivalente se calcula como `(valor / total * 100)`.

---

## 4. ANÁLISIS DE ENDPOINTS DE LA API
- **`GET /api/descuentos`**: Retorna lista completa ordenada por `id desc`. Requiere sesión activa.
- **`POST /api/descuentos`**: Crea o actualiza un descuento. Requiere rol `admin`.
- **`DELETE /api/descuentos?id=X`**: Desactivación lógica (`activo: false`). Requiere rol `admin`.
- **`POST /api/descuentos/validar`**: Valida un código y retorna `{ ok: true, porcentaje, descuento }`. Requiere sesión activa.

---

## 5. ANÁLISIS DE LA BASE DE DATOS (MODELO PRISMA `Descuento`)
- `id`: Int @id @default(autoincrement())
- `codigo`: String @unique
- `descripcion`: String?
- `tipo`: String @default("porcentaje")
- `valor`: Float
- `minimoCompra`: Float @default(0)
- `usosMaximos`: Int @default(0)
- `usosActuales`: Int @default(0)
- `fechaInicio`: DateTime?
- `fechaFin`: DateTime?
- `activo`: Boolean @default(true)
- `createdAt`: DateTime @default(now())
- `updatedAt`: DateTime @updatedAt
