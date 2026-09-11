# src/modules/ (Monolito Modular V2)

## Responsabilidad
Esta carpeta contiene la implementación del **Monolito Modular (Modular Monolith)** para WebSoft POS / ERP. Cada subcarpeta representa un módulo funcional independiente del dominio de negocio (ej. Ventas, Inventario, Contabilidad, POS, Clientes, Compras).

## Reglas de la Carpeta
1. Cada módulo debe seguir estrictamente la estructura empresarial estandarizada de 17 capas en `src/modules/__template/`.
2. Los módulos están aislados. La comunicación entre módulos se realiza únicamente a través del archivo público `index.ts` expuesto por cada módulo.
3. Esta carpeta no contiene lógica global compartida; los elementos compartidos residen en `src/shared/` o `src/ui/`.
