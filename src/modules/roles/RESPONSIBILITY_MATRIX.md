# RESPONSIBILITY_MATRIX.md - MATRIZ DE RESPONSABILIDADES DEL MÓDULO "ROLES" V2

| Capa V2 | Archivo Destino V2 | Responsabilidad Extraída |
| :--- | :--- | :--- |
| **View** | `views/RolesView.tsx` | Renderizado principal de la matriz de tarjetas de roles. |
| **Component** | `components/RolFormModal.tsx` | Diálogo modal para selección de permisos por agrupadores. |
| **Component** | `components/RolCard.tsx` | Tarjeta individual de rol con badge de color y conteo de usuarios. |
| **ViewModel / Hook**| `hooks/useRoles.ts` | Estado `roles`, `usuariosPorRol`, `openNew`, `openEdit`, `togglePermiso`, `save`. |
| **Logic** | `logic/rolesRules.ts` | Reglas puras de combinación entre `ROLES_BASE` y `customRoles`, cálculo de `slugify` y validaciones de eliminación. |
| **Service** | `services/rolesService.ts` | Obtención y actualización de `roles_personalizados` mediante `fetchClient`. |
| **Repository** | `repositories/rolesRepository.ts` | Acceso a la tabla `Configuracion` y conteo en `Usuario`. |
| **DTO** | `dto/RolDTO.ts` | Tipado estricto `RolDefDTO`, `GuardarRolesDTO`. |
| **Constants** | `constants/index.ts` | `ROLES_BASE`, `COLORES`, `GROUPS`. |
