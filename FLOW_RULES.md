# FLOW_RULES.md - FLUJO OFICIAL DEL ERP Y MATRIZ DE PROHIBICIONES

## 1. CADENA OBLIGATORIA DE FLUJO DE DATOS
```
View (JSX) -> ViewModel -> Logic -> Service -> Repository -> Prisma
```

## 2. REGLAS PROHIBITIVAS DEL FLUJO
- ❌ **View NUNCA consume Prisma**: Las Vistas jamás importan Prisma ni ejecutan consultas SQL/ORM.
- ❌ **View NUNCA hace `fetch()`**: Las Vistas jamás invocan la API directamente; consumen servicios mediante ViewModel/Hooks.
- ❌ **Logic NUNCA renderiza UI**: La lógica del negocio no contiene JSX, elementos del DOM ni Hooks de React.
- ❌ **Repository NUNCA contiene reglas de negocio**: Los repositorios se limitan a guardar y leer datos.
- ❌ **Service NUNCA depende de componentes visuales**: Los servicios son clases/funciones puras de infraestructura.
