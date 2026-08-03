# MODULE_STRUCTURE.md - ESTRUCTURA Y ANATOMÍA OFICIAL DE MÓDULOS V2

Anatomía técnica de 17 capas obligatoria para cualquier módulo del ERP:

```
src/modules/[nombre-modulo]/
├── api/             # DTOs de endpoints y handlers locales
├── repositories/    # Persistencia desacoplada de Prisma
├── mappers/         # Transformación bidireccional (Entity <-> DTO <-> PrismaModel)
├── dto/             # Objetos de transferencia de datos (Entrada / Salida)
├── adapters/        # Integraciones externas locales (FEL, impresoras, webhooks)
├── state/           # Estado local o tienda cliente del módulo
├── permissions/     # Reglas de autorización finas del módulo
├── constants/       # Constantes y enums del módulo
├── tests/           # Pruebas unitarias e integración (unit, integration)
├── components/      # Componentes visuales atómicos del módulo
├── views/           # Vistas principales de página
├── logic/           # Reglas de negocio puras (Casos de uso de dominio)
├── hooks/           # Custom hooks de orquestación de estado y servicios
├── services/        # Cliente HTTP local del módulo
├── validators/      # Esquemas Zod de validación de datos
├── types/           # Interfaces y tipos TypeScript locales
├── utils/           # Helpers puros del módulo
├── index.ts         # Public API del módulo (Exportaciones oficiales)
└── README.md        # Documentación interna del módulo
```
