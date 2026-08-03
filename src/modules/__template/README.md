# MÓDULO __TEMPLATE__ - ARQUITECTURA V2 (PLANTILLA OFICIAL)

- **Nombre del Módulo**: `__template__` (Reemplazar por el nombre del módulo)
- **Ubicación**: `src/modules/{modulo}/`
- **Estado**: **PLANTILLA ARQUITECTÓNICA V2**

---

## 1. DESCRIPCIÓN GENERAL
Plantilla patrón oficial de arquitectura empresarial V2 basada en el Golden Module `src/modules/descuentos/`.

---

## 2. ESTRUCTURA DE 17 CAPAS OBLIGATORIA
```text
src/modules/{modulo}/
├── dto/                    # DTOs de Request / Response / Validaciones
├── types/                  # Interfaces e Identificadores locales
├── constants/              # Mensajes, defaults y enums
├── validators/             # Esquemas de validación Zod
├── mappers/                # Transformaciones Prisma <-> DTO <-> UI
├── repositories/           # Persistencia aislada con Prisma Client
├── logic/                  # Reglas de negocio puras
├── services/               # Cliente HTTP de aplicación
├── hooks/                  # Hook único de orquestación (use{Modulo})
├── components/             # Componentes atómicos de UI
├── views/                  # Vista ensambladora principal
└── index.ts                # Public API del módulo
```
