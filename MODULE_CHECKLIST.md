# MODULE_CHECKLIST.md - CHECKLIST DE MIGRACIÓN DE MÓDULOS V2

Antes de dar por completada la migración de cualquier módulo funcional del ERP, se debe verificar el cumplimiento del 100% de esta lista:

- [ ] 1. El módulo reside en `src/modules/[nombre-modulo]/`.
- [ ] 2. Sigue la plantilla de 17 capas (`src/modules/__template/`).
- [ ] 3. La vista principal (`views/[Modulo]View.tsx`) no contiene llamadas `fetch()` directas.
- [ ] 4. La vista principal no consulta Prisma directamente.
- [ ] 5. Las reglas de negocio están aisladas en `logic/` como funciones puras.
- [ ] 6. El estado y las llamadas HTTP se coordinan a través de `hooks/` y `services/`.
- [ ] 7. Los datos de entrada/salida están fuertemente tipados con DTOs en `dto/`.
- [ ] 8. El módulo expone únicamente sus contratos públicos a través de `index.ts`.
- [ ] 9. Ninguna vista ni componente supera las 250 líneas de código.
- [ ] 10. El módulo cuenta con pruebas unitarias en `tests/unit/`.
