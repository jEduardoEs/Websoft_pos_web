// src/modules/usuarios/types/usuario.ts

export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  password: string;
  rol: string;
  activo: boolean;
  permisos?: string;
  creadoEn?: Date;
  metaMensual?: number;
}
