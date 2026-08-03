# ESTÁNDAR Y GOBIERNO DE MANEJO DE ESTADO EN LA ARQUITECTURA V2

Este documento clasifica estrictamente los 4 niveles de estado permitidos en el ERP/POS y establece las prohibiciones de almacenamiento.

---

## 1. ESTADO DE COMPONENTE (COMPONENT STATE)
- **Definición**: Estado efímero exclusivo de la interfaz visual local.
- **Ubicación**: Dentro del componente atómico en `components/` o `src/ui/`.
- **Ejemplos Permitidos**:
  - `isHovered`: Estado visual de un botón.
  - `isExpanded`: Estado de colapso de un acordeón o menú.
- **Herramienta**: React `useState` simple.

---

## 2. ESTADO DE MÓDULO (MODULE STATE / VIEWMODEL)
- **Definición**: Estado de presentación del flujo de trabajo del módulo.
- **Ubicación**: En `hooks/` o `state/` del módulo mediante `BaseViewModel`.
- **Ejemplos Permitidos**:
  - Carrito de compras actual en el módulo POS (`items`, `subtotal`, `descuento`).
  - Datos del formulario de creación de cotización.
  - Estado de carga y error del listado del módulo.
- **Herramienta**: Custom Hooks desacoplados (`useForm`, `useModal`, `usePagination`).

---

## 3. ESTADO DEL SERVIDOR (SERVER STATE)
- **Definición**: Datos persistidos en la base de datos PostgreSQL que pertenecen a la verdad central del ERP.
- **Ubicación**: Gestionado a través de los Servicios HTTP (`services/`) y API Routes (`src/app/api/`).
- **Ejemplos**:
  - Catalogo oficial de productos, clientes, historial de ventas, asientos contables.
- **Herramienta**: `fetchClient` + revalidación de datos del servidor.

---

## 4. LO QUE JAMÁS DEBE ALMACENARSE EN ESTADO LOCAL
❌ **PROHIBIDO**:
1. **Credenciales o Secretos**: Tokens secretos de pasarelas (Stripe Secret Key, DTEvia API Key) jamás residen en estado del cliente.
2. **Cálculos de Reglas de Negocio Duplicados**: El total final de una venta con impuestos no debe guardarse de forma redundante como estado primario; debe derivarse mediante funciones puras de `logic/`.
3. **Estado Global Sin Control**: Prohibido crear almacenes globales mutables sin desacoplamiento.
