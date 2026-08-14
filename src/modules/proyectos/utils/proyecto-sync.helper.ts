import { Prisma } from '@prisma/client';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function esCotizacionProyecto(cotizacion: any): boolean {
  if (!cotizacion) return false;
  
  // 1. Explicit check on tiempoInstalacion
  if (cotizacion.tiempoInstalacion && String(cotizacion.tiempoInstalacion).trim().length > 0) {
    return true;
  }
  
  // 2. Check general description
  if (cotizacion.descripcion && /instalac|proyecto|montaje|servicio técnico/i.test(cotizacion.descripcion)) {
    return true;
  }
  
  // 3. Check items
  if (cotizacion.items && Array.isArray(cotizacion.items)) {
    return cotizacion.items.some((i: any) => 
      (i.codigo && i.codigo.toUpperCase().includes('INST')) ||
      (i.descripcion && /instalac|proyecto|montaje|servicio/i.test(i.descripcion)) ||
      (i.tipo && i.tipo === 'instalacion')
    );
  }

  return false;
}

export async function syncProyectoDesdeCotizacion(
  _tx: any,
  _cotizacionId: number,
  _nuevoEstado: 'planificado' | 'en_ejecucion' | 'completado' = 'planificado',
  _usuarioNombre: string = 'Sistema',
  _ventaNumero?: string
) {
  // Proceso de cotizacion a proyecto es 100% manual por indicacion del sistema
  return null;
}

export async function handleReversionProyectoDesdeCotizacion(
  _tx: any,
  _cotizacionId: number,
  _nuevoEstadoCotizacion: string,
  _usuarioNombre: string = 'Sistema'
) {
  // Proceso de cotizacion a proyecto es 100% manual por indicacion del sistema
  return null;
}
