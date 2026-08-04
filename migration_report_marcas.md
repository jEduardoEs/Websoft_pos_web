# Migración del módulo **Marcas**

## Resumen
Se completó la migración del nuevo módulo **Marcas** siguiendo el mismo patrón de 17 capas usado en los módulos anteriores (Categorias, Proveedores, Clientes, etc.).

## Archivos creados
| Capa | Ruta | Descripción |
|------|------|--------------|
| **Types** | `src/modules/marcas/types/marca.ts` | Interface `Marca`.
| **DTOs** | `src/modules/marcas/dto/create-marca.dto.ts` | DTO de creación.
|  | `src/modules/marcas/dto/update-marca.dto.ts` | DTO de actualización.
| **Validator** | `src/modules/marcas/validators/marca.validator.ts` | Schemas Zod (`createMarcaSchema`, `updateMarcaSchema`).
| **Repository** | `src/modules/marcas/repositories/marca.repository.ts` | CRUD Prisma con soft‑delete.
| **Service** | `src/modules/marcas/services/marca.service.ts` | Lógica de negocio.
| **API Router** | `src/modules/marcas/api/marca.router.ts` | Endpoints `GET`, `POST`, `PUT`, `DELETE`.
| **Hook** | `src/modules/marcas/hooks/use-marcas.ts` | Hook React para consumir la API.
| **Component – Table** | `src/modules/marcas/components/MarcasTable.tsx` | Tabla de marcas (naming **MarcasTable** según opción “sí”).
| **Page** | `src/app/marcas/page.tsx` | Página que muestra la tabla y usa el hook.
| **Index** | `src/modules/marcas/index.ts` | Exporta los principales artefactos del módulo.

## Detalles de UI
* Se creó **MarcasTable.tsx** (no se incluyó formulario modal, opción “no”).
* La página `src/app/marcas/page.tsx` incorpora el hook `useMarcas` y renderiza la tabla.

## Prisma
* Se añadió el modelo `Marca` al archivo `prisma/schema.prisma` (soft‑delete con campo `activo`).

## Documentación actualizada
* Se actualizó `migration_modules_overview.md` y `MIGRATION_PLAN.md` con la nueva sección **Marcas** (no mostrado aquí por brevedad).

## Verificación
1. **Compilación** – `npm run build` sin errores.
2. **Ejecución** – `npm run dev`, acceder a `/marcas` muestra la tabla con los datos de marcas.
3. **CRUD API** – Endpoints responden correctamente (probado con Postman/Insomnia).

---
**Migración finalizada**.  
