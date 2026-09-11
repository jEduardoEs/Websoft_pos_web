export interface RolDef {
  id: string;          // identificador interno (usado en usuarios.rol)
  nombre: string;       // nombre visible
  color: string;        // color hex para el badge
  permisos: string[];   // módulos habilitados
}
