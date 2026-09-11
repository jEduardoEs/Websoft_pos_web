# src/ui/ (Design System Profesional ERP / POS)

## Responsabilidad
Esta carpeta constituye la **Biblioteca de Componentes del Design System** compartida para todo el ERP/POS. Aloja 15 categorías de componentes visuales atómicos libres de estado de negocio.

## Estructura de Categorías
1. **`buttons/`**: Botones, IconButtons, ButtonGroups.
2. **`inputs/`**: Controles de entrada (TextField, Select, Checkbox, Switch, DatePicker).
3. **`forms/`**: Envoltorios de formulario (FormGroup, FormLabel, FormErrorMessage).
4. **`cards/`**: Tarjetas de información (StatCard, DataCard, CardHeader).
5. **`tables/`**: Componentes de tablas genéricas (TableHeader, TableRow, TablePagination).
6. **`badges/`**: Insignias de estado (StatusBadge, CountBadge).
7. **`chips/`**: Chips interactivos de filtro y etiquetas.
8. **`alerts/`**: Notificaciones visuales (InlineAlert, BannerAlert, ToastNotification).
9. **`dialogs/`**: Modales y superposiciones (ModalContainer, ConfirmDialog, Drawer).
10. **`dropdowns/`**: Menús desplegables (ActionDropdown, ContextMenu).
11. **`layouts/`**: Estructuras de maquetación (Grid, Flex, PageContainer, Divider).
12. **`navigation/`**: Navegación atómica (Breadcrumbs, TabList, PaginationControl).
13. **`icons/`**: Envoltorios normalizados de iconos e SVG.
14. **`skeletons/`**: Estados de carga esqueléticos (TableSkeleton, CardSkeleton).
15. **`loading/`**: Indicadores de carga (Spinner, ProgressBar, Overlay).

## Reglas
- Componentes estrictamente de presentación. Prohibido hacer `fetch()`, usar Prisma o guardar estado de negocio.
