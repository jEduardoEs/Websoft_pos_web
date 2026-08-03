# MODULE_CONTRACT.md - CONTRATO UNIVERSAL E INMUTABLE DE MÓDULOS

Este contrato rige de forma obligatoria para **TODOS** los módulos funcionales de WebSoft POS / ERP en la Arquitectura V2.

## 1. OBLIGATORIEDAD DE ESTRUCTURA
1. Todo módulo debe ubicarse en `src/modules/[nombre-modulo]/`.
2. Todo módulo debe implementar las 17 capas estandarizadas de `src/modules/__template/`.
3. Ningún módulo puede alterar el esquema de subcarpetas ni renombrar las capas predefinidas.

## 2. PRIVACIDAD Y FRONTERAS (ISOLATION CONTRACT)
1. Todas las subcarpetas del módulo (`components`, `views`, `logic`, `hooks`, `services`, `repositories`, `mappers`, `dto`, `validators`, `types`, `utils`) son **PRIVADAS**.
2. Los componentes o servicios externos **ÚNICAMENTE** pueden importar desde el archivo público `src/modules/[nombre-modulo]/index.ts`.
3. Prohibido realizar importaciones profundas (deep imports) a archivos internos de un módulo desde otro módulo.

## 3. CONTRATO DE RESPONSABILIDADES
- **UI (Views / Components)**: 0% lógica de negocio, 0% Prisma, 0% `fetch()`.
- **ViewModels / Hooks**: 100% orquestación de estado cliente e invocación de servicios.
- **Logic (Use Cases)**: 100% funciones puras de reglas del ERP. Sin dependencias de React ni DOM.
- **Services**: 100% clientes HTTP abstraídos.
- **Repositories**: 100% persistencia a datos. Sin dependencias de UI.
