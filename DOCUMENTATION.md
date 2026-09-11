# WebSoft Solutions POS & ERP — Documentación de Arquitectura y Sistema

## 1. Resumen General del Sistema
WebSoft POS & ERP es una solución integral para la gestión comercial, ventas POS, proyectos, cotizaciones, inventarios por eventos, garantizaciones, contabilidad y facturación electrónica (FEL DTE SAT) en Guatemala.

---

## 2. Arquitectura del Sistema (Fase 6)

### 2.1 Motor Central de Estados (`src/core/state`)
- **Catalogo de Enums (`StateEnums.ts`)**: Define estados unificados para Cotización, Venta, Proyecto, Facturación y Comisión.
- **State Machine (`StateMachine.ts`)**: Validador genérico de transiciones válidas.
- **Workflow Engine (`WorkflowEngine.ts`)**: Fachada central para validaciones de transición en la capa de servicios.

### 2.2 Motor de Eventos de Dominio (`src/core/events`)
- **EventBus (`EventBus.ts`)**: Bus de eventos interno para desacoplamiento síncrono/asíncrono de módulos.
- **Catálogo de Eventos**: `CotizacionCreada`, `CotizacionAprobada`, `VentaCreada`, `VentaCancelada`, `ProyectoCreado`, `ProyectoCancelado`, `FacturaEmitida`, `FacturaAnulada`, `PagoRegistrado`, `ComisionReservada`, `ComisionDevengada`.

### 2.3 Workflow Comercial Automatizado
`Cotización creada` → `Anticipo registrado` → `Cotización aprobada` → `Venta creada (automática)` → `Proyecto creado (automático)` → `Inventario reservado` → `Comisión reservada`.

### 2.4 Business Rules Engine (`src/core/rules`)
- **Regla 1**: No facturar proyectos que no estén aprobados/en ejecución.
- **Regla 2**: No cancelar facturas emitidas sin el flujo de anulación formal.
- **Regla 3**: No modificar precios ni ítems tras generar la venta.
- **Regla 4**: No eliminar ventas facturadas o completadas.
- **Regla 5**: No acreditar comisiones antes de la finalización del proyecto.

### 2.5 Sistema Inteligente de Cancelaciones (`src/core/cancellations`)
- Política de retención del 50% de anticipo por gastos administrativos.
- Liberación automática de inventario a Kardex.
- Anulación de comisión reservada o generación de ajuste negativo (`AJUSTE_COMISION_NEGATIVO`) si ya fue pagada.

### 2.6 Inventario por Eventos (`src/core/inventory`)
Estados: `Disponible` → `Reservado` → `Entregado` / `Consumido` → `Devuelto`.

### 2.7 Auditoría Total (`src/modules/auditoria`)
Registro completo de los 9 parámetros clave en la tabla `audit_log`: Usuario, Fecha, IP, Equipo/Browser, Estado Anterior, Estado Nuevo, Módulo, Acción y Valores Modificados (JSON).

### 2.8 Caché y Rendimiento (`src/core/cache`)
- **AppCache**: Caché en memoria con TTL para métricas del dashboard operativo y lecturas recurrentes.

---

## 3. Configuración y Despliegue

### Variables de Entorno Clave (`.env`):
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/websoft_pos"
AUTH_SECRET="tu_secreto_auth"
FEL_MODO="sandbox" # o 'produccion'
FEL_USUARIO="tu_usuario_infile"
FEL_CLAVE="tu_clave_infile"
FEL_NIT_EMISOR="115471413"
```

---

## 4. Estándares de Desarrollo
- **Regla de Oro**: CERO EMOJIS en el código fuente, interfaz de usuario o comentarios.
- **Tipado Estricto**: Todo cambio debe pasar `npx tsc --noEmit` con 0 errores.
- **Preservación de Esquemas**: Mantener compatibilidad total hacia atrás sin alterar tablas core ni contratos API existentes.
