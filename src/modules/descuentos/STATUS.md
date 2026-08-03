# STATUS: CERTIFIED - GOLDEN MODULE

- **Módulo**: `Descuentos` (`src/modules/descuentos/`)
- **Estado Oficial**: **GOLDEN MODULE (MÓDULO DE REFERENCIA INMUTABLE)**
- **Arquitectura**: Arquitectura V2 (100% Cumplida)
- **Modo de Operación**: **ESTRUCTURA CONGELADA (SOLO BUGFIXES PERMITIDOS)**

---

## 1. DECLARACIÓN DE CERTIFICACIÓN
El módulo **Descuentos** se declara oficialmente como el **Golden Module** de **WebSoft POS / ERP**. Sirve como el estándar inmutable de referencia para guiar la migración sistemática del resto de módulos del ERP en la **Fase F5**:

1. `roles`
2. `usuarios`
3. `config`
4. `clientes`
5. `productos`
6. `inventario`
7. `compras`
8. `ventas`
9. `caja`
10. `reportes`

---

## 2. REGLAS DE CONGELAMIENTO
- Se prohíben refactorizaciones estructurales o modificaciones de arquitectura en este módulo.
- Únicamente se admiten correcciones críticas de errores (bugfixes) que conserven los contratos de la Public API.
