# src/hooks/

## Responsabilidad
Esta carpeta contiene los **Custom Hooks globales reutilizables** de la aplicación (ej. autenticación, detección de tamaño de pantalla, notificaciones toast, debounce).

## Reglas de la Carpeta
1. Los hooks en esta carpeta deben responder a necesidades cross-cutting (transversales) reutilizadas por múltiples módulos.
2. Los hooks de orquestación específicos de un solo módulo de negocio deben alojarse dentro de `src/modules/[modulo]/hooks/`.
