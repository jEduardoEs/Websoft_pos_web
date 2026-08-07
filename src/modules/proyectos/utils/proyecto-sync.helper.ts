import { Prisma } from '@prisma/client';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function syncProyectoDesdeCotizacion(
  tx: any,
  cotizacionId: number,
  nuevoEstado: 'planificado' | 'en_ejecucion' | 'completado' = 'planificado',
  usuarioNombre: string = 'Sistema',
  ventaNumero?: string
) {
  // 1. Fetch quotation with items
  const cotizacion = await tx.cotizacion.findUnique({
    where: { id: cotizacionId },
    include: { items: true },
  });

  if (!cotizacion) return null;

  // 2. Check if project already exists for this quotation
  const existente = await tx.proyecto.findUnique({
    where: { cotizacionId },
    include: { mantenimientos: true },
  });

  if (existente) {
    // If project exists, advance status if needed and add notes
    const notasActuales = existente.notas || '';
    const notaNueva = ventaNumero 
      ? `Venta/Factura ${ventaNumero} vinculada.` 
      : `Estado actualizado a ${nuevoEstado}.`;

    const updatedProyecto = await tx.proyecto.update({
      where: { id: existente.id },
      data: {
        estado: nuevoEstado,
        notas: notasActuales ? `${notasActuales} | ${notaNueva}` : notaNueva,
      },
    });
    return updatedProyecto;
  }

  // 3. Create new project if none exists
  const count = await tx.proyecto.count();
  const numero = `PRY-${String(count + 1).padStart(6, '0')}`;
  
  const itemsText = cotizacion.items && cotizacion.items.length > 0
    ? cotizacion.items.map((i: any) => `${i.cantidad}x ${i.descripcion}`).join(', ')
    : cotizacion.descripcion || 'Instalación / Trabajo cotizado';

  const inicio = new Date();

  const nuevoProyecto = await tx.proyecto.create({
    data: {
      numero,
      nombre: cotizacion.descripcion || `Proyecto ${cotizacion.clienteNombre} (${cotizacion.numero})`,
      clienteNombre: cotizacion.clienteNombre,
      clienteNit: cotizacion.clienteNit || null,
      clienteTelefono: cotizacion.clienteTelefono || null,
      clienteDireccion: cotizacion.clienteDireccion || null,
      contactoNombre: cotizacion.atencion || null,
      descripcion: itemsText,
      cotizacionId: cotizacion.id,
      cotizacionNumero: cotizacion.numero,
      fechaInicio: inicio,
      estado: nuevoEstado,
      notas: ventaNumero ? `Generado desde venta ${ventaNumero}` : `Generado desde cotización ${cotizacion.numero}`,
      usuarioNombre,
      mantenimientos: {
        create: [1, 2, 3].map(n => ({
          numero: n,
          fechaProgramada: addMonths(inicio, n * 4),
        })),
      },
    },
    include: { mantenimientos: true },
  });

  return nuevoProyecto;
}
