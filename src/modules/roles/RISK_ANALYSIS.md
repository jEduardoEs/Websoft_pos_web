# RISK_ANALYSIS.md - ANÁLISIS DE RIESGOS Y ROLLBACK DEL MÓDULO "ROLES"

---

## 1. RIESGOS IDENTIFICADOS
- **R-01**: Desincronización de permisos en usuarios existentes. Si se modifica un rol personalizado, los usuarios asignados deben conservar o actualizar sus capacidades correctamente.
- **R-02**: Serialización JSON. El campo `roles_personalizados` debe parsearse de forma segura con un bloque `try/catch` para evitar fallos de renderizado si el JSON contuviera datos corruptos.

---

## 2. PLAN DE ROLLBACK
- Si ocurre algún error en la persistencia del archivo de configuración, se restaurará el comportamiento mediante los 5 roles predefinidos de `ROLES_BASE`.
