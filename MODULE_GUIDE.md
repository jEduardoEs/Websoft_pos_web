# MODULE_GUIDE.md - GUÍA OFICIAL DE ESTRUCTURA Y CREACIÓN DE MÓDULOS

Esta guía explica la arquitectura de 17 capas para módulos empresariales dentro de `src/modules/` en **WebSoft POS / ERP**.

---

## 1. ESTRUCTURA EMPRESARIAL DE UN MÓDULO (17 CAPAS)

Cada módulo se ubica en `src/modules/[nombre-modulo]/` y sigue la plantilla de `src/modules/__template/`:

```
src/modules/[nombre-modulo]/
├── api/             # DTOs de endpoints y handlers locales
├── repositories/    # Abstracción de acceso a persistencia (Clean Architecture)
├── mappers/         # Transformación bidireccional (Entity <-> DTO <-> PrismaModel)
├── dto/             # Objetos de transferencia de datos (Data Transfer Objects)
├── adapters/        # Adaptadores de servicios e integraciones externas locales (FEL, impresoras)
├── state/           # Manejo de estado local o global del módulo
├── permissions/     # Reglas de autorización específicas del módulo (RBAC local)
├── constants/       # Constantes y enums locales del módulo
├── tests/           # Pruebas unitarias e integración del módulo (unit, integration)
├── components/      # Componentes UI atómicos del módulo
├── views/           # Vistas de página principales del módulo
├── logic/           # Reglas de negocio puras (cálculos y casos de uso de dominio)
├── hooks/           # Custom hooks de orquestación de estado y servicios
├── services/        # Cliente HTTP de llamadas API asociadas al módulo
├── validators/      # Esquemas Zod de validación de datos
├── types/           # Interfaces y tipos TypeScript
├── utils/           # Helpers puros del módulo
├── index.ts         # Public API del módulo (Exportaciones oficiales)
└── README.md        # Documentación interna del módulo
```

---

## 2. MATRIZ DE RESPONSABILIDADES Y LÍMITES POR CAPA

| Capa | Responsabilidad | Qué PUEDE Hacer | Qué NO PUEDE Hacer |
| :--- | :--- | :--- | :--- |
| **`views/`** | Vistas principales contenedoras. | Consumir Hooks locales, maquetar layouts. | Hacer `fetch()`, usar Prisma, ejecutar lógica. |
| **`components/`** | Renderizar piezas de UI secundarias. | Recibir props, aplicar clases visuales. | Acceder a base de datos, guardar estado global. |
| **`logic/`** | Casos de uso y reglas de negocio puras. | Ejecutar fórmulas contables, calcular totales. | Usar React hooks, manipular DOM, hacer I/O. |
| **`hooks/`** | Orquestar estado de UI y coordinar servicios. | Usar `useState`, `useEffect`, invocar `services`. | Renderizar JSX, consultar Prisma. |
| **`services/`** | Comunicación HTTP con APIs backend. | Ejecutar `fetch()`, tipar respuestas. | Usar estado de React, manipular DOM. |
| **`repositories/`** | Persistencia y consultas a base de datos. | Consultar Prisma Client de forma aislada. | Depender de componentes UI de React. |
| **`mappers/`** | Transformar formatos de datos. | Convertir objetos Prisma a Entidades/DTOs. | Ejecutar lógica de presentación. |
| **`dto/`** | Definir estructuras de entrada/salida. | Declarar contratos de comunicación API. | Contener lógica ejecutable. |
| **`adapters/`** | Conectar integraciones de terceros. | Formatear peticiones a FEL, Stripe, etc. | Mezclar reglas de negocio del ERP. |
| **`permissions/`** | Validar permisos finos del módulo. | Evaluar si usuario puede cancelar/descontar. | Renderizar interfaces visuales. |
| **`tests/`** | Pruebas unitarias e integración. | Probar `logic`, `mappers`, `validators`. | Ejecutar pruebas sin aislamiento. |

---

## 3. PASO A PASO PARA CREAR / MIGRAR UN MÓDULO

1. **Copiar la Plantilla**: Copiar `src/modules/__template/` a `src/modules/[nombre-modulo]/`.
2. **Definir DTOs y Tipos (`dto/`, `types/`)**: Declarar contratos de datos de entrada/salida.
3. **Definir Mappers (`mappers/`)**: Construir los transformadores de modelos.
4. **Implementar Repositorios (`repositories/`)**: Crear la capa de persistencia aislada de Prisma.
5. **Implementar Casos de Uso (`logic/`)**: Escribir las reglas puras del negocio.
6. **Construir el Servicio HTTP (`services/`)**: Implementar el cliente API del frontend.
7. **Crear Hooks de Orquestación (`hooks/`)**: Coordinar estados y servicios para la vista.
8. **Enlazar la Vista (`views/`)**: Componer la vista de usuario limpia.
9. **Exportar en `index.ts`**: Exponer únicamente los contratos públicos.
