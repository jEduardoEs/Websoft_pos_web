# NAMING.md - CONVENCIONES DE NOMBRADO ARQUITECTURA V2

## 1. NOMBRADO DE ARCHIVOS Y CARPETAS
- **Carpetas de Módulo**: `kebab-case` (ej. `cuentas-cobrar`, `ordenes-trabajo`).
- **Carpetas de Capa**: `camelCase` (ej. `components`, `views`, `logic`, `hooks`, `services`).
- **Componentes / Vistas React**: `PascalCase.tsx` (ej. `VentaTabla.tsx`, `CotizacionView.tsx`).
- **Custom Hooks**: `camelCase.ts` prefijado con `use` (ej. `useVenta.ts`, `useDebounce.ts`).
- **Servicios HTTP**: `camelCase.ts` sufijado con `Service` (ej. `ventasService.ts`).
- **Repositorios**: `camelCase.ts` sufijado con `Repository` (ej. `ventasRepository.ts`).
- **Mappers**: `camelCase.ts` sufijado con `Mapper` (ej. `ventaMapper.ts`).
- **DTOs**: `PascalCase.ts` sufijado con `DTO` (ej. `CrearVentaDTO.ts`).
- **Validators**: `camelCase.ts` sufijado con `Schema` o `Validator` (ej. `ventaSchema.ts`).
- **Tipos / Interfaces**: `camelCase.ts` o `PascalCase.ts` (ej. `api.types.ts`, `Venta.ts`).

## 2. VARIABLES Y FUNCIONES
- Variables y Funciones: `camelCase` (ej. `calcularSubtotal`, `isLoading`).
- Constantes Globales: `UPPER_SNAKE_CASE` (ej. `MAX_PAGE_SIZE`, `DEFAULT_CURRENCY`).
- Componentes / Interfaces / Types / Enums: `PascalCase` (ej. `VentaStatus`, `UserRole`).
