# src/config/

## Responsabilidad
Esta carpeta aloja los archivos de configuración global de la aplicación (constantes de entorno, rutas principales, opciones globales de paginación y monedas).

## Reglas de la Carpeta
1. Almacena valores constantes estáticos o leídos de variables de entorno (`process.env`).
2. No debe ejecutar lógica de procesamiento transaccional del negocio.
