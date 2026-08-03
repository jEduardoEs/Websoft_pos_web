// src/modules/clientes/dto/create-cliente.dto.ts

export class CreateClienteDto {
  nombre: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo?: boolean;
}
