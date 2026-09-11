// src/modules/usuarios/dto/create-usuario.dto.ts

export class CreateUsuarioDto {
  nombre!: string;
  usuario!: string;
  password!: string;
  rol!: string;
  permisos?: string | string[];
  activo?: boolean;
  metaMensual?: number;
}
