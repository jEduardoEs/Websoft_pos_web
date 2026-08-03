# CODING_STANDARDS.md - ESTÁNDARES Y CONVENCIONES DE CÓDIGO V2

## 1. LÍMITES MÁXIMOS DE TAMAÑO DE ARCHIVO

Para evitar la existencia de archivos monolíticos gigantes e inmanejables, ningún archivo de la Arquitectura V2 podrá superar los siguientes límites recomendados:

| Tipo de Archivo / Capa | Máximo Recomendado | Acción si Supera el Límite |
| :--- | :--- | :--- |
| **Views (`views/`)** | **250 líneas** | Dividir la vista en subcomponentes atómicos en `components/`. |
| **Logic / Casos de Uso (`logic/`)** | **150 líneas** | Separar el caso de uso en sub-funciones o servicios de dominio. |
| **Repositories (`repositories/`)** | **200 líneas** | Dividir en repositorios especializados por sub-entidad. |
| **Components (`components/`)** | **120 líneas** | Extraer piezas visuales secundarias. |
| **Hooks (`hooks/`)** | **150 líneas** | Dividir en hooks de estado y hooks de integración. |
| **Services (`services/`)** | **120 líneas** | Dividir servicios por dominio de endpoint. |
| **Validators (`validators/`)** | **100 líneas** | Modularizar esquemas Zod en sub-archivos. |
| **Mappers (`mappers/`)** | **100 líneas** | Separar mapeos de entrada y salida. |
| **DTOs / Types (`dto/`, `types/`)** | **100 líneas** | Agrupar tipos en archivos temáticos. |

---

## 2. REGLAS DE NOMBRADO, SUFIJOS Y PREFIJOS

### Carpetas
- Usar **`kebab-case`** para carpetas de módulos y rutas (ej. `src/modules/cuentas-cobrar`, `src/app/(dashboard)/cuentas`).
- Usar **`camelCase`** para subcarpetas de capas (ej. `components`, `views`, `logic`, `hooks`, `services`, `repositories`, `mappers`).

### Archivos
- **Componentes React / Vistas**: `PascalCase.tsx` (ej. `VentaTabla.tsx`, `CotizacionFormView.tsx`).
- **Hooks**: `camelCase.ts` prefijado con `use` (ej. `useVenta.ts`, `useCotizacionList.ts`).
- **Services**: `camelCase.ts` sufijado con `Service` (ej. `ventasService.ts`, `felService.ts`).
- **Repositories**: `camelCase.ts` sufijado con `Repository` (ej. `ventasRepository.ts`).
- **Mappers**: `camelCase.ts` sufijado con `Mapper` (ej. `ventaMapper.ts`).
- **DTOs**: `PascalCase.ts` sufijado con `DTO` (ej. `CrearVentaDTO.ts`, `VentaResponseDTO.ts`).
- **Validators**: `camelCase.ts` sufijado con `Schema` o `Validator` (ej. `ventaSchema.ts`).
- **Types / Interfaces**: `camelCase.ts` o `PascalCase.ts` (ej. `ventaTypes.ts`, `Venta.ts`).
- **Utils / Helpers**: `camelCase.ts` (ej. `currencyUtils.ts`, `dateUtils.ts`).

---

## 3. CONVENCIONES DE TYPESCRIPT Y RECT

1. **Tipado Estricto**: Prohibido usar `any`. Utilizar `unknown` con type guards o tipos genéricos explícitos.
2. **Interfaces vs Types**:
   - Usar `interface` para definir estructuras de objetos de dominio, props de componentes y contratos de repositorios.
   - Usar `type` para uniones, intersecciones, primitivos y alias de funciones.
3. **Desestructuración de Props**: Siempre desestructurar props con valores por defecto explícitos si aplica.
4. **Sin Lógica de Negocio en JSX**: Prohibido incluir cálculos matemáticos, transformaciones complejas de arreglos o llamados a endpoints directamente en el cuerpo del JSX.

---

## 4. CONVENCIONES DE EXPORTS E INDEX.TS

1. **Public API de Módulo (`index.ts`)**: Cada módulo exporta únicamente sus interfaces públicas, Vistas y Servicios a través de su archivo `index.ts` raíz.
2. **No Exportar Elementos Internos**: Queda prohibido exportar componentes de soporte visual atómico o helpers privados fuera del módulo.

---

## 5. CONVENCIONES DE IMPORTS Y ALIASES

### Orden Estándar de Imports
1. React / Next.js e integraciones de marco.
2. Librerías de terceros (Lucide, Recharts, Sonner, Zod).
3. Infraestructura Core y Shared (`@/core`, `@/shared`, `@/ui`, `@/lib`).
4. Recursos locales del módulo (`../components`, `../services`, `../logic`).
5. Tipos e interfaces (`../types`, `../dto`).

### Path Aliases Oficiales (`tsconfig.json`)
- `@/modules/*` -> `src/modules/*`
- `@/shared/*` -> `src/shared/*`
- `@/ui/*` -> `src/ui/*`
- `@/core/*` -> `src/core/*`
- `@/services/*` -> `src/services/*`
- `@/hooks/*` -> `src/hooks/*`
- `@/types/*` -> `src/types/*`
- `@/lib/*` -> `src/lib/*`
