# DEPENDENCY_MAP.md - MAPA DE DEPENDENCIAS DEL MÓDULO "ROLES"

---

## 1. DEPENDENCIAS INTERNAS
- `@/lib/permisos`: Catálogo central de módulos `MODULOS` y parseador `parsePermisos`.
- `/api/config`: API REST de lectura y persistencia de configuración global.
- `/api/usuarios`: API REST de consulta de lista de usuarios para conteo por rol.

---

## 2. PLAN DE DESACOPLAMIENTO V2
- Mover la constante `ROLES_BASE` y catálogo de módulos a `src/config/permissions.ts`.
- Abstraer las llamadas `/api/config` y `/api/usuarios` dentro de `rolesService.ts`.
- Desacoplar los componentes de tarjeta e insumos usando `src/ui/cards/Card.tsx`, `Button`, `Modal` y `Badge`.
