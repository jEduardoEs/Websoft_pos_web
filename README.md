# WS POS System
**Sistema de Facturacion White-Label**

Sistema POS profesional listo para personalizar con los datos de cualquier empresa.

## Primera vez que abre el sistema
Al iniciar sesion por primera vez aparece un asistente de configuracion donde ingresa:
- Nombre de la empresa
- NIT
- Telefono y direccion
- Logo de la empresa (imagen)
- Mensaje del ticket
- IVA

## Credenciales iniciales
| Usuario | Contrasena | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |
| cajero | cajero123 | Cajero |

Cambia las contrasenas en el modulo Usuarios al primer uso.

## Modulos incluidos
- Dashboard con estadisticas del dia
- Nueva Venta (POS) con lector de codigo de barras
- Historial de ventas
- Inventario con Kardex
- Clientes con consulta NIT automatica
- Devoluciones
- Proveedores y Compras
- Codigos de descuento
- Cierre y Apertura de caja
- Reportes profesionales
- Backup automatico y manual
- Log de Auditoria
- Usuarios y roles

## Generar instalador
```
npm install
npm run build
```

## Base de datos
Se guarda en: AppData\Roaming\ws-pos\ws_pos.db
