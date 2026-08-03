# FOLDER_RULES.md - REGLAS DE ORGANIZACIÓN DE CARPETAS V2

1. **`src/app/`**: Exclusivamente rutas de Next.js App Router y API Route Handlers. No colocar componentes pesados ni lógica de dominio.
2. **`src/modules/`**: Módulos aislados del ERP/POS. Cada módulo contiene sus 17 capas privadas.
3. **`src/shared/`**: Recursos globales reutilizables por 3+ módulos (`utils`, `validators`, `formatters`, `hooks`).
4. **`src/core/`**: Infraestructura central del sistema (`auth`, `database`, `security`, `logger`, `errors`, `config`, `providers`).
5. **`src/ui/`**: Componentes visuales atómicos del Design System.
6. **`src/services/`**: Clientes HTTP de infraestructura y servicios de comunicación con la API.
7. **`src/types/`**: Interfaces TypeScript y DTOs globales.
8. **`src/config/`**: Configuraciones globales estáticas y variables de entorno.
