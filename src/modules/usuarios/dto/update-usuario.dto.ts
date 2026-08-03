// src/modules/usuarios/dto/update-usuario.dto.ts

export class UpdateUsuarioDto {
  nombre?: string;
  usuario?: string;
  password?: string;
  rol?: string;
  activo?: boolean;
  metaMensual?: number;
}
