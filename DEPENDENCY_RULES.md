# DEPENDENCY_RULES.md - REGLAS DE IMPORTACIÓN Y DEPENDENCIAS DE LA ARQUITECTURA V2

Este documento establece la política estricta de acoplamiento de código para **WebSoft POS / ERP**. Ningún archivo puede romper la jerarquía de dependencias establecida a continuación.

---

## 1. JERARQUÍA DE CAPAS Y FLUJO PERMITIDO

El flujo de dependencias en la Arquitectura V2 es estrictamente **descendente (unidireccional)**:

```
[ Capa de Presentación: UI / Components / Views ]
                       │
                       ▼
          [ Capa de Orquestación: Hooks ]
                       │
                       ▼
          [ Capa de Aplicación: Services ]
                       │
                       ▼
      [ Capa de Dominio: Logic / Validators / DTO ]
                       │
                       ▼
     [ Capa de Persistencia: API / Repositories / Mappers ]
                       │
                       ▼
               [ ORM: Prisma Client ]
```

---

## 2. PROHIBICIONES ARQUITECTÓNICAS EXPLICITAS

Queda estrictamente prohibido que:
1. ❌ **View acceda a Prisma**: Las Vistas y Componentes React jamás pueden importar `@prisma/client` ni `@/lib/prisma`.
2. ❌ **View haga `fetch()` directamente**: Las Vistas jamás pueden ejecutar `fetch()` o llamadas HTTP directas; deben consumir Servicios a través de Custom Hooks.
3. ❌ **View tenga lógica de negocio**: Las Vistas jamás pueden ejecutar fórmulas contables, cálculo de impuestos o reglas del ERP.
4. ❌ **View valide reglas**: Las Vistas jamás pueden validar reglas complejas de dominio (deben usar Validators Zod y Casos de Uso en Logic).
5. ❌ **View transforme datos**: Las Vistas jamás pueden transformar DTOs o adaptar modelos de datos (deben recibir los datos listos desde Mappers/Logic).
6. ❌ **Logic conozca React**: La capa de dominio (`logic/`) no puede importar React, Hooks, JSX, elementos del DOM ni dependencias del UI.
7. ❌ **Repositories conozcan UI**: La capa de persistencia (`repositories/`) jamás puede depender de componentes de interfaz ni elementos visuales.
8. ❌ **Services dependan de componentes**: La capa de aplicación (`services/`) no puede importar componentes de React ni hooks de UI.

---

## 3. MATRIZ DETALLADA DE PERMISOS DE IMPORTACIÓN

| Capa Origen | PUEDE Importar A | PROHIBIDO Importar A |
| :--- | :--- | :--- |
| **Views / Components** | Hooks, Types, DTOs, Design System (`src/ui/`) | Prisma, Repositories, Services, `fetch()`, API Handlers |
| **Hooks** | Services, Logic, Validators, DTOs, React | Prisma, Views, Componentes UI, API Route Handlers |
| **Services** | Client HTTP, DTOs, Validators | Componentes React, Hooks, Views, Prisma Client (en frontend) |
| **Logic (Domain)** | DTOs, Validators, Helpers puros | React, Views, Hooks, Services, Prisma Client, DOM |
| **Repositories** | Prisma Client, Mappers, DTOs | Views, Components, React, Hooks |
| **API Handlers** | Repositories, Logic, Validators, Auth (`@/lib/auth`) | Componentes React, Views, Hooks |

---

## 4. MATRIZ DE AISLAMIENTO ENTRE MÓDULOS

- Un módulo **jamás** puede acceder a los archivos privados internos de otro módulo (`import ... from '@/modules/ventas/components/Tabla'` está prohibido).
- Únicamente se permite la importación del punto de entrada público `index.ts` del módulo de destino.
- Si dos módulos requieren compartir interfaces o lógica común, dicha lógica debe ser promovida a `src/shared/` o `src/types/`.
