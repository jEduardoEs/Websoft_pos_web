# hooks/ (Orquestación de Estado y Servicios)

## Responsabilidad
Custom hooks de React que administran el estado local de la vista, efectos secundarios y coordinan las llamadas al servicio HTTP (`services/`).

## Reglas
- Retornan objetos planos con propiedades de lectura y métodos de acción.
- No renderizan elementos JSX.
