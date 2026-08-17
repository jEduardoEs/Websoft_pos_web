import { prisma } from '@/lib/prisma';

export class ServicioBackendService {
  static async findAll(params: { estado?: string; buscar?: string }) {
    const { estado, buscar } = params;

    const where: any = {};
    if (estado) where.estado = estado;
    if (buscar) {
      where.OR = [
        { numero: { contains: buscar, mode: 'insensitive' } },
        { clienteNombre: { contains: buscar, mode: 'insensitive' } },
        { tipoEquipo: { contains: buscar, mode: 'insensitive' } },
        { marca: { contains: buscar, mode: 'insensitive' } },
      ];
    }

    return prisma.ordenTrabajo.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 100,
      include: {
        repuestos: true,
        historial: { orderBy: { fecha: 'desc' }, take: 5 },
      },
    });
  }

  static async create(data: any, user: any) {
    if (!data.clienteNombre || !data.tipoEquipo || !data.descripcionFalla) {
      throw new Error('Cliente, equipo y falla son requeridos');
    }

    const maxOt = await prisma.ordenTrabajo.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
    const nextOtId = (maxOt?.id || 0) + 1;
    const numero = `OT-${String(nextOtId).padStart(6, '0')}`;

    const total = (+data.costoReparacion || 0) + (+data.costoRepuestos || 0);

    const parsedUserId = isNaN(parseInt(user?.id)) ? 1 : parseInt(user.id);

    const orden = await prisma.ordenTrabajo.create({
      data: {
        numero,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        clienteNit: data.clienteNit,
        tipoEquipo: data.tipoEquipo,
        marca: data.marca,
        modelo: data.modelo,
        serie: data.serie,
        accesorios: data.accesorios,
        descripcionFalla: data.descripcionFalla,
        observaciones: data.observaciones,
        prioridad: data.prioridad || 'normal',
        fechaPromesa: data.fechaPromesa ? new Date(data.fechaPromesa) : null,
        tecnicoNombre: data.tecnicoNombre,
        costoReparacion: +data.costoReparacion || 0,
        costoRepuestos: +data.costoRepuestos || 0,
        total,
        notas: data.notas,
        usuarioId: parsedUserId,
        usuarioNombre: user?.name || 'Sistema',
        repuestos: data.repuestos?.length > 0 ? {
          create: data.repuestos.map((r: any) => ({
            nombre: r.nombre,
            cantidad: +r.cantidad,
            precioUnit: +r.precioUnit,
            subtotal: +r.cantidad * +r.precioUnit,
          }))
        } : undefined,
        historial: {
          create: { estadoNuevo: 'recibido', comentario: 'Orden creada', usuarioNombre: user?.name || 'Sistema' }
        },
      },
      include: { repuestos: true, historial: true },
    });

    // Deduct stock for assigned repuestos if product exists
    if (data.repuestos && data.repuestos.length > 0) {
      for (const r of data.repuestos) {
        if (!r.productoId) continue;
        const qty = +r.cantidad;
        try {
          const prod = await prisma.producto.update({
            where: { id: Number(r.productoId) },
            data: { stock: { decrement: qty } },
          });

          await prisma.kardex.create({
            data: {
              productoId: Number(r.productoId),
              tipo: 'salida',
              cantidad: qty,
              stockAntes: prod.stock + qty,
              stockDespues: prod.stock,
              motivo: `Repuesto en Orden de Trabajo ${numero}`,
              referencia: numero,
              usuarioId: parsedUserId,
              usuarioNombre: user?.name || 'Sistema',
            },
          });
        } catch { /* if product not found, continue */ }
      }
    }

    return orden;
  }

  static async findById(id: number) {
    return prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        repuestos: true,
        historial: { orderBy: { fecha: 'desc' } },
      },
    });
  }

  static async update(id: number, data: any, user: any) {
    const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });
    if (!orden) throw new Error('No encontrado');

    const d: any = {};
    if (data.diagnostico !== undefined) d.diagnostico = data.diagnostico;
    if (data.trabajoRealizado !== undefined) d.trabajoRealizado = data.trabajoRealizado;
    if (data.tecnicoNombre !== undefined) d.tecnicoNombre = data.tecnicoNombre;
    if (data.costoReparacion !== undefined) d.costoReparacion = +data.costoReparacion;
    if (data.costoRepuestos !== undefined) d.costoRepuestos = +data.costoRepuestos;

    if (d.costoReparacion !== undefined || d.costoRepuestos !== undefined) {
      d.total = (d.costoReparacion ?? orden.costoReparacion) + (d.costoRepuestos ?? orden.costoRepuestos);
    }

    return prisma.ordenTrabajo.update({
      where: { id },
      data: d,
    });
  }

  static async cambiarEstado(id: number, estado: string, comentario: string, user: any) {
    const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });
    if (!orden) throw new Error('No encontrado');

    if (orden.estado === estado) return orden;

    const d: any = { estado };
    if (estado === 'entregado' && !orden.fechaEntrega) {
      d.fechaEntrega = new Date();
    }

    return prisma.ordenTrabajo.update({
      where: { id },
      data: {
        ...d,
        historial: {
          create: {
            estadoAnterior: orden.estado,
            estadoNuevo: estado,
            comentario: comentario || `Cambio a ${estado}`,
            usuarioNombre: user.name,
          },
        },
      },
      include: { historial: true },
    });
  }

  static async delete(id: number, user: any) {
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      throw new Error('No autorizado');
    }
    await prisma.ordenTrabajo.delete({ where: { id } });
  }
}
