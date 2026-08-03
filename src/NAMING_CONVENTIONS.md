# CONVENCIONES CONSTITUCIONALES DE NOMBRADO EN LA ARQUITECTURA V2

Este documento es de cumplimiento obligatorio para todo el código de la V2.

---

## 1. TABLA CONSTITUCIONAL DE NOMBRES

| Categoría / Capa | Convención de Caso | Ejemplo de Nombre | Ubicación |
| :--- | :--- | :--- | :--- |
| **Módulos** | `kebab-case` | `cuentas-cobrar`, `ordenes-trabajo` | `src/modules/` |
| **Carpetas de Capa** | `camelCase` | `components`, `repositories`, `mappers` | dentro del módulo |
| **Componentes UI / Views** | `PascalCase.tsx` | `VentaTabla.tsx`, `CotizacionView.tsx` | `components/`, `views/`, `src/ui/` |
| **Custom Hooks** | `camelCase.ts` (`use*`) | `useVenta.ts`, `useDebounce.ts` | `hooks/`, `src/shared/hooks/` |
| **Services** | `camelCase.ts` (`*Service`) | `ventasService.ts`, `felService.ts` | `services/`, `src/services/` |
| **Repositories** | `camelCase.ts` (`*Repository`) | `ventasRepository.ts` | `repositories/` |
| **Mappers** | `camelCase.ts` (`*Mapper`) | `ventaMapper.ts` | `mappers/` |
| **DTOs** | `PascalCase.ts` (`*DTO`) | `CrearVentaDTO.ts`, `VentaResponseDTO.ts` | `dto/`, `src/shared/dto/` |
| **Validators** | `camelCase.ts` (`*Schema` / `*Validator`)| `ventaSchema.ts` | `validators/` |
| **Interfaces** | `PascalCase.ts` (`I*` o `PascalCase`)| `IUseCase.ts`, `Venta.ts` | `interfaces/`, `types/` |
| **Enums** | `PascalCase.ts` | `VentaEstadoEnum`, `UserRoleEnum` | `constants/`, `types/` |
| **Types / Alias** | `PascalCase.ts` | `ApiResponseType`, `PaymentMethod` | `types/` |
| **Constants Globales** | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `DEFAULT_TAX_RATE` | `constants/`, `config/` |
