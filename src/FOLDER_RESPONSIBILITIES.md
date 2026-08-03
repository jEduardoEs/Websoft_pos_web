# MATRIZ CONSTITUCIONAL DE RESPONSABILIDAD POR CARPETA V2

---

## 1. `src/modules/`
- **Responsabilidad Exacta**: Alojar los módulos aislados del ERP/POS (`Modular Monolith`).
- **Qué SÍ Puede Contener**: Módulos aislados con sus 17 capas privadas.
- **Qué JAMÁS Debe Contener**: Código global compartido o componentes reutilizables por todo el sistema.

## 2. `src/ui/`
- **Responsabilidad Exacta**: Design System de componentes visuales atómicos.
- **Qué SÍ Puede Contener**: Componentes visuales de presentación pura (`Button`, `Modal`, `Input`, `Table`).
- **Qué JAMÁS Debe Contener**: `fetch()`, `@prisma/client`, reglas de negocio o guardado de estado de backend.

## 3. `src/core/`
- **Responsabilidad Exacta**: Infraestructura central del ERP/POS (`auth`, `database`, `security`, `logger`, `errors`, `config`, `container`, `events`).
- **Qué SÍ Puede Contener**: Clientes de BD, instancias IoC, utilidades de seguridad, jerarquías de errores.
- **Qué JAMÁS Debe Contener**: Componentes React de presentación o lógica de módulos específicos.

## 4. `src/shared/`
- **Responsabilidad Exacta**: Recursos reutilizables transversales compartidos por 3+ módulos (`utils`, `formatters`, `hooks`, `dto`, `validators`).
- **Qué SÍ Puede Contener**: Transformadores de moneda/fecha, helpers puros, DTOs universales.
- **Qué JAMÁS Debe Contener**: Importaciones de archivos privados de `src/modules/[modulo]`.

## 5. `src/services/`
- **Responsabilidad Exacta**: Clientes HTTP de infraestructura y llamadas API.
- **Qué SÍ Puede Contener**: Clientes `fetch` fuertemente tipados.
- **Qué JAMÁS Debe Contener**: Elementos JSX ni estado de interfaz de React.

## 6. `src/types/`
- **Responsabilidad Exacta**: Tipos e interfaces globales de TypeScript.
- **Qué SÍ Puede Contener**: Declaraciones `interface`, `type`, `enum`.
- **Qué JAMÁS Debe Contener**: Código ejecutable JavaScript/TypeScript.
