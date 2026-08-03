# MIGRATION_PLAN.md - PLAN DE MIGRACIÓN ESPECÍFICO DEL MÓDULO "DESCUENTOS"

Plan maestro de ejecución paso a paso para la Fase 5 (Migración Piloto de Descuentos).

---

## 1. OBJETIVO DEL MÓDULO PILOTO
Migrar el módulo de Descuentos desde su estado monolítico en `src/app/(dashboard)/descuentos/page.tsx` a la estructura desacoplada de 17 capas en `src/modules/descuentos/` manteniendo cero deuda técnica y compatibilidad absoluta.

---

## 2. LISTA DE VERIFICACIÓN PRE-MIGRACIÓN
- [x] Auditoría completa de código legacy realizada (`MODULE_ANALYSIS.md`).
- [x] Matriz de responsabilidades de las 17 capas definida (`RESPONSIBILITY_MATRIX.md`).
- [x] Mapa de dependencias e interfaces creado (`DEPENDENCY_MAP.md`).
- [x] Secuencia ordenada de extracción definida (`EXTRACTION_ORDER.md`).
- [x] Análisis de riesgos y mitigación documentado (`RISK_ANALYSIS.md`).

---

## 3. PASOS DE EJECUCIÓN FÍSICA PARA LA FASE 5
1. **Paso 1**: Crear los archivos de dominio DTO y Types (`src/modules/descuentos/dto/DescuentoDTO.ts`, `types/index.ts`).
2. **Paso 2**: Crear los validadores Zod (`validators/descuentoValidator.ts`).
3. **Paso 3**: Crear la lógica de negocio pura (`logic/validarDescuento.ts`) y sus unit tests (`tests/unit/validarDescuento.test.ts`).
4. **Paso 4**: Crear el mapper (`mappers/descuentoMapper.ts`) y repositorio (`repositories/descuentosRepository.ts`).
5. **Paso 5**: Crear el servicio HTTP (`services/descuentosService.ts`).
6. **Paso 6**: Crear el custom hook y ViewModel (`hooks/useDescuentos.ts`).
7. **Paso 7**: Crear los componentes UI y vista (`components/`, `views/DescuentosView.tsx`) usando el Design System (`src/ui/`).
8. **Paso 8**: Exportar la API pública en `src/modules/descuentos/index.ts` y conectar la vista en `src/app/(dashboard)/descuentos/page.tsx`.
9. **Paso 9**: Ejecutar la suite de pruebas y compilación `npm run build`.
