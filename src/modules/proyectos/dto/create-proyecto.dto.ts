export interface CreateProyectoDto {
  nombre: string;
  clienteNombre: string;
  clienteTelefono?: string | null;
  clienteDireccion?: string | null;
  clienteNit?: string | null;
  contactoNombre?: string | null;
  descripcion: string;
  alcance?: string | null;
  cotizacionId?: number | string | null;
  cotizacionNumero?: string | null;
  fechaInicio?: string | Date;
  fechaFin?: string | Date | null;
  notas?: string | null;
  estado?: string;
}
