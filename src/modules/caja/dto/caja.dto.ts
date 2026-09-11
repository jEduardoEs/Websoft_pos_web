export interface AbrirCajaDto {
  fondoInicial: number;
  notas?: string;
}

export interface MovimientoCajaDto {
  tipo: 'inyeccion' | 'retiro';
  monto: number;
  motivo?: string;
}

export interface CerrarCajaDto {
  efectivoContado: number;
  tarjetaBaucher?: number;
  transferenciaContada?: number;
  notas?: string;
}

export interface CajaRequestDto {
  accion: 'abrir' | 'cerrar' | 'inyeccion' | 'retiro';
  // Props opcionales para cubrir todos los escenarios
  fondo?: number;
  notas?: string;
  monto?: number;
  motivo?: string;
  efectivoContado?: number;
  tarjetaBaucher?: number;
  transferenciaContada?: number;
}
