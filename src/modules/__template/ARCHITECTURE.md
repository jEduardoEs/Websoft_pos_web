# ARQUITECTURA DEL MÓDULO __TEMPLATE__

- **Estatus**: **PLANTILLA V2**

---

## 1. CAPAS Y RESPONSABILIDADES
- **View (`views/`)**: Ensamblado puro sin lógica ni llamadas `fetch`.
- **Components (`components/`)**: Componentes visuales desacoplados.
- **Hook (`hooks/`)**: Manejo de `useState`, `useEffect` y orquestación.
- **Logic (`logic/`)**: Funciones puras de cálculo y validación de reglas de negocio.
- **Service (`services/`)**: Cliente de aplicación HTTP con `fetchClient`.
- **Repository (`repositories/`)**: Punto único de acceso a Prisma Client.
- **Mappers (`mappers/`)**: Conversión bidireccional entre la base de datos y la UI.
