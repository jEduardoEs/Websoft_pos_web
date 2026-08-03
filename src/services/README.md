# src/services/

## Responsabilidad
Esta carpeta aloja los clientes de servicios HTTP compartidos de infraestructura que conectan el frontend de la aplicación con los API Route Handlers (`src/app/api/`) o servicios externos.

## Reglas de la Carpeta
1. Los servicios encapsulan las llamadas `fetch()` HTTP y retornan promesas fuertemente tipadas.
2. No contienen elementos visuales de React ni Hooks de estado.
3. Se encargan del manejo y tipado estricto de errores HTTP.
