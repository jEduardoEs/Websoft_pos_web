# ARCHITECTURE_V2.md - ARQUITECTURA EMPRESARIAL V2 (MODULAR MONOLITH)

## 1. FILOSOFÍA DE LA ARQUITECTURA V2

El objetivo primario de la Arquitectura V2 para **WebSoft POS / ERP** es erradicar la deuda técnica acumulada por el patrón *Smart UI / Fat Controllers* sin reescribir la lógica de negocio, sin alterar la experiencia de usuario y sin interrumpir la operación del sistema monolítico actual.

La arquitectura adopta un enfoque de **Monolito Modular (Modular Monolith)** guiado por principios de **Clean Architecture** y **Domain-Driven Design (DDD) ligero**.

### Principios Fundamentales
1. **Aislamiento por Módulos (Bounded Contexts)**: Cada capacidad del ERP (ej. Ventas, Inventario, Contabilidad) reside dentro de su propio módulo con fronteras claras e independientes.
2. **Separación Estricta de Capas**: La interfaz visual (UI) jamás interactúa directamente con la base de datos ni ejecuta lógica de negocio.
3. **Flujo Unidireccional y Bidireccional de Datos**: La información fluye de forma estrictamente controlada entre las capas de presentación, aplicación, dominio e infraestructura.
4. **Migración Fricción Cero**: El sistema V2 coexiste con el sistema Legacy sin romper funcionalidades existentes durante la transición progresiva.

---

## 2. ARQUITECTURA DE CAPAS Y RESPONSABILIDADES

La arquitectura se divide en 4 capas concéntricas con responsabilidades delimitadas:

```
+-----------------------------------------------------------------------+
| CAPA 1: PRESENTACIÓN (UI / Vistas / Componentes)                      |
| Responsabilidad: Renderizado, captura de eventos, feedback visual.     |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
| CAPA 2: ORQUESTACIÓN Y APLICACIÓN (Hooks / Services / State)          |
| Responsabilidad: Estado cliente, llamadas HTTP, contratos de API.    |
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
| CAPA 3: DOMINIO Y LÓGICA DE NEGOCIO (Logic / Validators / Mappers)    |
| Responsabilidad: Reglas del ERP, cálculos contables, DTOs, validación.|
+-----------------------------------------------------------------------+
                                  │
                                  ▼
+-----------------------------------------------------------------------+
| CAPA 4: INFRAESTRUCTURA Y PERSISTENCIA (Repositories / Prisma / API)   |
| Responsabilidad: Acceso a base de datos PostgreSQL, FEL, Stripe.       |
+-----------------------------------------------------------------------+
```

---

## 3. FLUJO OFICIAL BIDIRECCIONAL DE DATOS

### Flujo de Solicitud (Ida: De la UI a la Base de Datos)
```
[ View (JSX) ]
     │ 1. Evento de usuario (onClick)
     ▼
[ Hook (Custom Hook) ]
     │ 2. Ejecuta acción del cliente
     ▼
[ Service (Frontend HTTP Client) ]
     │ 3. Petición JSON HTTP (fetch)
     ▼
[ API Route Handler (Next.js App Router) ]
     │ 4. Validación de Sesión y Permisos
     ▼
[ Logic / Use Case (Dominio) ]
     │ 5. Aplica Reglas de Negocio / Validaciones
     ▼
[ Repository (Infraestructura) ]
     │ 6. Invoca consulta desacoplada
     ▼
[ Mapper ]
     │ 7. Convierte DTO a Modelo de DB
     ▼
[ Prisma Client ]
     │ 8. Sentencia SQL en PostgreSQL
     ▼
[ Database (PostgreSQL) ]
```

### Flujo de Respuesta (Regreso: De la Base de Datos a la UI)
```
[ Database (PostgreSQL) ]
     │ 1. Retorno de registros SQL
     ▼
[ Prisma Client ]
     │ 2. Objeto tipado Prisma
     ▼
[ Repository ]
     │ 3. Captura resultado
     ▼
[ Mapper ]
     │ 4. Transforma PrismaModel -> DomainEntity / DTO
     ▼
[ Logic / Use Case ]
     │ 5. Formatea o aplica cálculos finales
     ▼
[ API Route Handler ]
     │ 6. Retorna NextResponse.json(DTO)
     ▼
[ Service ]
     │ 7. Parsea respuesta JSON tipada
     ▼
[ Hook ]
     │ 8. Actualiza React State (isLoading: false, data)
     ▼
[ View (Render JSX) ]
```

---

## 4. ESTRUCTURA GLOBAL DEL PROYECTO

```
src/
├── app/                  # Next.js 14 App Router (Rutas de la app y API Handlers)
├── modules/              # Módulos del dominio funcional (Modular Monolith V2)
│   ├── __template/       # Plantilla oficial estándar de 17 capas para nuevos módulos
│   └── [modulo]/         # Módulos del negocio aislados (ej. ventas, inventario)
├── shared/               # Recursos globales compartidos entre módulos (utils, formatters)
├── core/                 # Infraestructura central del sistema (Auth, DB, Logger, Errors)
├── ui/                   # Design System atómico compartidos (Buttons, Tables, Modals)
├── services/             # Servicios HTTP compartidos de infraestructura
├── hooks/                # Custom hooks globales reutilizables
├── types/                # Definiciones de TypeScript globales y DTOs compartidos
└── config/               # Configuraciones globales de la aplicación
```
