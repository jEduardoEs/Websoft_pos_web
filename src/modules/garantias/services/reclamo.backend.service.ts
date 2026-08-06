import { prisma } from '@/lib/prisma';

export class ReclamoBackendService {
  static async findAll(params: { garantiaId?: string }) {
    const where: any = {};
    if (params.garantiaId) where.garantiaId = Number(params.garantiaId);

    return prisma.reclamoGarantia.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 100,
    });
  }

  static async create(data: any, user: any) {
    if (!data.garantiaId || !data.motivoReclamo || !data.descripcionFalla) {
      throw new Error('Garantía, motivo y descripción son requeridos');
    }

    const garantia = await prisma.garantia.findUnique({ where: { id: Number(data.garantiaId) } });
    if (!garantia) throw new Error('Garantía no encontrada');
    if (garantia.estado === 'vencida') throw new Error('La garantía está vencida');
    if (garantia.estado === 'reclamada') throw new Error('Esta garantía ya fue reclamada');
    if (garantia.estado === 'anulada') throw new Error('Esta garantía está anulada');

    return prisma.$transaction(async (tx) => {
      const count = await tx.reclamoGarantia.count();
      const numero = `REC-${String(count + 1).padStart(6, '0')}`;

      const r = await tx.reclamoGarantia.create({
        data: {
          numero,
          garantiaId: Number(data.garantiaId),
          garantiaNumero: garantia.numero,
          clienteNombre: garantia.clienteNombre,
          clienteNit: data.clienteNit || garantia.clienteNit,
          clienteDpi: data.clienteDpi,
          clienteTelefono: data.clienteTelefono,
          productoNombre: garantia.productoNombre,
          productoSerie: garantia.productoSerie,
          motivoReclamo: data.motivoReclamo,
          descripcionFalla: data.descripcionFalla,
          tieneFactura: !!data.tieneFactura,
          numeroFactura: data.numeroFactura || garantia.ventaNumero,
          usuarioNombre: user.name,
          notas: data.notas,
        },
      });

      await tx.garantia.update({
        where: { id: Number(data.garantiaId) },
        data: { estado: 'reclamada' },
      });

      return r;
    });
  }

  static async update(id: number, data: any, user: any) {
    const reclamo = await prisma.reclamoGarantia.findUnique({ where: { id } });
    if (!reclamo) throw new Error('No encontrado');

    let ordenTrabajoId = reclamo.ordenTrabajoId;

    return prisma.$transaction(async (tx) => {
      if (data.decision === 'reparar' && !ordenTrabajoId && data.crearOrden) {
        const count = await tx.ordenTrabajo.count();
        const numero = `OT-${String(count + 1).padStart(6, '0')}`;
        const orden = await tx.ordenTrabajo.create({
          data: {
            numero,
            clienteNombre: reclamo.clienteNombre,
            clienteTelefono: reclamo.clienteTelefono,
            clienteNit: reclamo.clienteNit,
            tipoEquipo: reclamo.productoNombre,
            serie: reclamo.productoSerie,
            descripcionFalla: `GARANTÍA ${reclamo.garantiaNumero}: ${reclamo.descripcionFalla}`,
            observaciones: `Reclamo ${reclamo.numero} — ${reclamo.motivoReclamo}`,
            prioridad: 'urgente',
            usuarioId: parseInt(user.id),
            usuarioNombre: user.name,
            historial: {
              create: {
                estadoNuevo: 'recibido',
                comentario: `Creado desde reclamo de garantía ${reclamo.numero}`,
                usuarioNombre: user.name,
              },
            },
          },
        });
        ordenTrabajoId = orden.id;
      }

      await tx.reclamoGarantia.update({
        where: { id },
        data: {
          ...(data.estado && { estado: data.estado }),
          ...(data.decision && { decision: data.decision }),
          ...(data.resolucion && { resolucion: data.resolucion }),
          ...(ordenTrabajoId && { ordenTrabajoId }),
        },
      });

      return ordenTrabajoId;
    });
  }
}
