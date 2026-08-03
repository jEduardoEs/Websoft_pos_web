# MIGRATION_PLAN.md - PLAN MAESTRO DE MIGRACIÓN PROGRESIVA A ARQUITECTURA V2

---

## FASE 1: AUDITORÍA Y DIAGNÓSTICO (COMPLETADA)
- **Objetivos**: Radiografía técnica completa del sistema monolítico actual (32 páginas, 60 APIs, 38 tablas Prisma).
- **Entregables**: Informe de auditoría arquitectónica detallado.
- **Criterios de Aceptación**: Aprobación completa por la arquitectura.

---

## FASE 2: PREPARACIÓN E INFRAESTRUCTURA (FASE ACTUAL - EN PERFECCIONAMIENTO)
- **Objetivos**: Construir la infraestructura V2 en `src/`, Design System en `src/ui/`, 8 dominios en `src/core/`, 7 categorías en `src/shared/` y plantilla empresarial de 17 capas en `src/modules/__template/`.
- **Entregables**:
  - Estructura `src/core/` (auth, database, security, logger, errors, config, constants, providers).
  - Estructura `src/shared/` (utils, validators, constants, formatters, helpers, schemas, types).
  - Design System `src/ui/` (buttons, inputs, forms, cards, tables, badges, chips, alerts, dialogs, dropdowns, layouts, navigation, icons, skeletons, loading).
  - Plantilla empresarial `src/modules/__template/` (17 capas completas).
  - Documentos `ARCHITECTURE_V2.md`, `CODING_STANDARDS.md`, `MIGRATION_PLAN.md`, `MODULE_GUIDE.md`, `DEPENDENCY_RULES.md`.
- **Criterios de Aceptación**: Cero interferencia con el código legacy, compilación exitosa y aprobación del diseño por la arquitectura.

---

## FASE 3: MIGRACIÓN PILOTO
- **Objetivos**: Migrar un módulo de prueba de bajo riesgo a la arquitectura V2 para validar la cadena completa (`UI -> Hook -> Logic -> Service -> API -> Repository -> Mapper -> Prisma`).
- **Criterios de Aceptación**: Funcionamiento idéntico en UI y backend con cero regresiones.

---

## FASE 4: VALIDACIÓN Y AJUSTES
- **Objetivos**: Someter a prueba el módulo piloto, verificar testabilidad unitaria y consumo de memoria antes de la migración masiva.

---

## FASE 5: MIGRACIÓN PROGRESIVA DE MÓDULOS
- **Objetivos**: Migrar de forma independiente los 26 módulos restantes ordenados por criticidad.

---

## FASE 6: LIMPIEZA Y CONSOLIDACIÓN
- **Objetivos**: Remoción de código legacy e infraestructura duplicada desfasada (`src/prisma/schema.prisma`), consolidación final del repositorio.
