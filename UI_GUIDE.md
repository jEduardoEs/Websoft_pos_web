# UI_GUIDE.md - GUÍA DEL DESIGN SYSTEM V2

## 1. REGLAS GENERALES DEL DESIGN SYSTEM
- Todos los componentes del Design System residen en `src/ui/`.
- Son componentes estrictamente visuales (de presentación).
- No contienen lógica de negocio, no ejecutan `fetch()` ni interactúan con Prisma.
- Se importan desde el alias `@/ui`.

## 2. COMPONENTES DISPONIBLES
- **`Button`**: `@/ui/buttons`
- **`Input`**: `@/ui/inputs`
- **`FormField`**: `@/ui/forms`
- **`Card`**: `@/ui/cards`
- **`Table`**: `@/ui/tables`
- **`Modal`**: `@/ui/dialogs`
- **`Alert`**: `@/ui/alerts`
- **`Badge`**: `@/ui/badges`
- **`Container` / `Flex` / `Grid`**: `@/ui/layout`
- **`Tabs`**: `@/ui/navigation`
- **`Icon`**: `@/ui/icons`
- **`Spinner`**: `@/ui/loading`
- **`Skeleton`**: `@/ui/skeletons`
