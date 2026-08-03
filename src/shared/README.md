# src/shared/ (Recursos Compartidos Genéricos)

## Responsabilidad
Esta carpeta centraliza los recursos compartidos reutilizables genéricos requeridos por 3 o más módulos del ERP.

## Estructura de Subcarpetas (7 Categorías)
1. **`utils/`**: Helpers puros agnósticos (manipulación de estructuras de datos).
2. **`validators/`**: Validadores transversales genéricos (formato NIT, emails, teléfonos).
3. **`constants/`**: Valores constantes compartidos por múltiples módulos.
4. **`formatters/`**: Transformadores de presentación (monedas `GTQ`, fechas `es-GT`, porcentajes).
5. **`helpers/`**: Pequeñas funciones auxiliares de utilidad del sistema.
6. **`schemas/`**: Esquemas de Zod reutilizables para DTOs genéricos (paginación, filtros).
7. **`types/`**: Tipos e interfaces compartidas genéricas (`ApiResponse<T>`).

## Reglas
- Recursos puros e agnósticos a la lógica interna de un solo módulo.
- Queda prohibido importar código alojado en `src/modules/[modulo]`.
