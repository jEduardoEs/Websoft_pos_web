# CHANGELOG.md - REGISTRO DE CAMBIOS DEL MÓDULO DESCUENTOS

Todos los cambios notables realizados en este módulo se documentan en este archivo.

---

## [1.0.0-GOLDEN] - 2026-08-03
### Añadido
- Creación de DTOs fuertemente tipados (`DescuentoDTO.ts`).
- Creación de esquema Zod de validación (`descuentoValidator.ts`).
- Creación de mappers bidireccionales (`descuentoMapper.ts`).
- Creación del repositorio desacoplado Prisma (`descuentosRepository.ts`).
- Creación de la lógica pura de reglas de negocio (`validarDescuento.ts` y `descuentosLogic.ts`).
- Creación del servicio de aplicación HTTP (`descuentosService.ts`).
- Creación del hook único `useDescuentos.ts`.
- Extracción de componentes atómicos: `DescuentoToolbar`, `DescuentosTabla`, `DescuentoForm`, `DescuentoFormModal`, `DescuentoEmptyState`, `DescuentoLoadingState`, `DescuentoConfirmDeleteDialog`.
- Creación de la Vista de ensamblado `DescuentosView.tsx`.
- Creación del Barrel exporter `index.ts`.
- Certificación oficial de Golden Module.

### Cambiado
- Refactorización de `src/app/(dashboard)/descuentos/page.tsx` a 5 líneas.
- Refactorización de `src/app/api/descuentos/route.ts` y `src/app/api/descuentos/validar/route.ts` a adaptadores HTTP ultra-delgados.

### Corregido
- Corregido error de tipo preexistente en Prisma al consultar cupones por el campo único `codigo`.
- Corregida entidad de comillas sin escapar en `DescuentoConfirmDeleteDialog.tsx`.
