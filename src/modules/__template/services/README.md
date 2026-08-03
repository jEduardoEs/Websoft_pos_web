# services/ (Comunicación API HTTP)

## Responsabilidad
Abstraer las peticiones `fetch()` hacia los endpoints backend de Next.js (`src/app/api/`) correspondientes a este módulo.

## Reglas
- Métodos asíncronos que retornan promesas fuertemente tipadas.
- Captura y transformación de errores HTTP en errores de dominio.
- No utiliza estados de React.
