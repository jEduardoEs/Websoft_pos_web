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

    const count = await prisma.ordenTrabajo.count();
    const numero = `OT-${String(count + 1).padStart(6, '0')}`;

    const total = (+data.costoReparacion || 0) + (+data.costoRepuestos || 0);

    return prisma.ordenTrabajo.create({
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
        usuarioId: parseInt(user.id),
        usuarioNombre: user.name,
        repuestos: data.repuestos?.length > 0 ? {
          create: data.repuestos.map((r: any) => ({
            nombre: r.nombre,
            cantidad: +r.cantidad,
            precioUnit: +r.precioUnit,
            subtotal: +r.cantidad * +r.precioUnit,
          }))
        } : undefined,
        historial: {
          create: { estadoNuevo: 'recibido', comentario: 'Orden creada', usuarioNombre: user.name }
        },
      },
      include: { repuestos: true, historial: true },
    });
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
