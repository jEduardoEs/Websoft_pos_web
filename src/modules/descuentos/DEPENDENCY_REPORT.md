# DEPENDENCY_REPORT.md - REPORTE DE DEPENDENCIAS Y AISLAMIENTO

- **Módulo**: `Descuentos` (`src/modules/descuentos/`)

---

## 1. ANÁLISIS DE IMPORTACIONES INTERNAS
- `views/DescuentosView.tsx` ──> consume `hooks/useDescuentos`, `components/DescuentoToolbar`, `components/DescuentosTabla`, `components/DescuentoFormModal`, `@/ui`.
- `hooks/useDescuentos.ts` ──> consume `services/descuentosService`, `dto/DescuentoDTO`, `types`, `sonner`.
- `services/descuentosService.ts` ──> consume `@/services/http` (`fetchClient`), `dto/DescuentoDTO`.
- `repositories/descuentosRepository.ts` ──> consume `@/lib/prisma`, `mappers/descuentoMapper`, `dto/DescuentoDTO`.
- `logic/validarDescuento.ts` ──> consume `dto/DescuentoDTO` (Sin dependencias de infraestructura ni React).

---

## 2. VERIFICACIÓN DE LÍMITES Y PUBLIC API
- La Public API se exporta limpiamente desde [`src/modules/descuentos/index.ts`](file:///c:/Users/Tecnico%20WS/Desktop/WebSoft_POS/Websoft_pos_web-main/src/modules/descuentos/index.ts).
- No existen importaciones privadas no autorizadas desde otros módulos hacia `descuentos`. **[VERIFICADO]**
