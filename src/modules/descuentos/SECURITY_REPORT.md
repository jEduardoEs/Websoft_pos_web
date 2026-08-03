# SECURITY_REPORT.md - REPORTE DE SEGURIDAD Y PROTECCIÓN DE DATOS

- **Módulo**: `Descuentos` (`src/modules/descuentos/`)

---

## 1. CONTROL DE ACCESO Y AUTORIZACIÓN (RBAC)
- **Rutas Administrativas (`POST`, `DELETE`)**: Protegidas explícitamente verificando la sesión activa `auth()` y la restricción de rol `session.user.role === 'admin'`.
- **Ruta de Consulta (`GET`)**: Exige sesión activa de usuario del ERP.

---

## 2. SANITIZACIÓN Y VALIDACIÓN DE INSUMOS
- Todos los payloads de entrada se procesan mediante validadores Zod (`descuentoValidator.ts`), previniendo inyecciones de datos o tipos inesperados.
- Los códigos se sanitizan y convierten automáticamente a mayúsculas (`codigo.toUpperCase()`).

---

## 3. AISLAMIENTO DE LA CAPA DE DATOS (DATABASE BOUNDARY)
- Prohibido el acceso a Prisma ORM desde el cliente.
- Toda consulta se canaliza a través de `descuentosRepository.ts`, aislando las credenciales de PostgreSQL en el servidor.
