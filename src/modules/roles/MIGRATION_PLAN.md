# MIGRATION_PLAN.md - PLAN DE MIGRACIÓN DEL MÓDULO "ROLES"

Plan maestro de ejecución paso a paso para la migración del módulo Roles a la V2.

---

## 1. OBJETIVO
Migrar la gestión de roles de `src/app/(dashboard)/roles/page.tsx` a `src/modules/roles/` utilizando las 17 capas desacopladas.

---

## 2. PASOS DE EJECUCIÓN
1. Crear DTOs y constantes (`dto/RolDTO.ts`, `constants/index.ts`).
2. Implementar `logic/rolesRules.ts` con pruebas unitarias para `mergeRoles` y `slugify`.
3. Crear `repositories/rolesRepository.ts` y `services/rolesService.ts`.
4. Construir `hooks/useRoles.ts` y componentes de presentación (`components/RolCard.tsx`, `views/RolesView.tsx`).
5. Exportar la API pública en `src/modules/roles/index.ts` y conectar la vista en App Router.
