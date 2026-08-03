# src/core/ (Infraestructura Central del Sistema)

## Responsabilidad
Esta carpeta aloja los **8 dominios de infraestructura central** indispensables para la operación segura, confiable y desacoplada del ERP/POS.

## Estructura de Subcarpetas
1. **`auth/`**: Autenticación, JWT, roles, permisos y sesiones (`NextAuth`).
2. **`database/`**: Cliente Prisma ORM, gestión de transacciones y pool de conexiones PostgreSQL.
3. **`security/`**: Sanitización de insumos, encriptación y protección XSS/CSRF/BFLA.
4. **`logger/`**: Abstracción de logging centralizado y auditoría del sistema.
5. **`errors/`**: Jerarquía de clases de error personalizadas (`AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`).
6. **`config/`**: Configuración global leída de variables de entorno (`appConfig`).
7. **`constants/`**: Constantes globales de plataforma (códigos de estado HTTP, expresiones regulares).
8. **`providers/`**: Context providers globales de React (`Providers.tsx`).

## Reglas
- Contiene la infraestructura fundamental que da soporte al ERP.
- No debe importar código alojado dentro de `src/modules/[modulo]`.
