# EXTRACTION_ORDER.md - SECUENCIA DE EXTRACCIÓN DEL MÓDULO "ROLES" V2

```
[1. DTO & Types] ──> [2. Constants] ──> [3. Business Logic] ──> [4. Repository] ──> [5. Service] ──> [6. Hook] ──> [7. Views & UI]
```

1. **Paso 1**: Crear `dto/RolDTO.ts` y `types/index.ts`.
2. **Paso 2**: Crear `constants/index.ts` registrando `ROLES_BASE` y paleta `COLORES`.
3. **Paso 3**: Crear `logic/rolesRules.ts` encapsulando `mergeRoles()`, `slugify()`, y reglas de eliminación.
4. **Paso 4**: Crear `repositories/rolesRepository.ts`.
5. **Paso 5**: Crear `services/rolesService.ts`.
6. **Paso 6**: Crear `hooks/useRoles.ts`.
7. **Paso 7**: Crear `components/RolCard.tsx`, `components/RolFormModal.tsx` y `views/RolesView.tsx`.
8. **Paso 8**: Conectar la vista en `src/app/(dashboard)/roles/page.tsx`.
