import { prisma } from '@/lib/prisma';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export class ProyectoService {
  static async findAll(params: { estado?: string; buscar?: string }) {
    const { estado, buscar } = params;
    const hoy = new Date();
    const en15dias = new Date();
    en15dias.setDate(hoy.getDate() + 15);

    const where: any = {};
    if (estado) where.estado = estado;
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { clienteNombre: { contains: buscar, mode: 'insensitive' } },
        { numero: { contains: buscar, mode: 'insensitive' } },
      ];
    }

    const proyectos = await prisma.proyecto.findMany({
      where,
      include: {
        mantenimientos: { orderBy: { numero: 'asc' } },
        garantias: { select: { id: true, numero: true, fechaVencimiento: true, estado: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const proximos = proyectos.filter((p: any) =>
      p.mantenimientos.some((m: any) => !m.realizado && m.fechaProgramada >= hoy && m.fechaProgramada <= en15dias)
    );
    const vencidos = proyectos.filter((p: any) =>
      p.mantenimientos.some((m: any) => !m.realizado && m.fechaProgramada < hoy)
    );

    return { proyectos, proximos: proximos.length, vencidos: vencidos.length };
  }

  static async findById(id: number) {
    return prisma.proyecto.findUnique({
      where: { id },
      include: {
        mantenimientos: { orderBy: { numero: 'asc' } },
        garantias: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  static async create(data: CreateProyectoDto, userId: number, userName: string) {
    if (data.cotizacionId) {
      const existe = await prisma.proyecto.findUnique({ where: { cotizacionId: Number(data.cotizacionId) } });
      if (existe) throw new Error('Ya existe un proyecto para esta cotización');
    }

    const count = await prisma.proyecto.count();
    const numero = `PRY-${String(count + 1).padStart(6, '0')}`;
    const inicio = data.fechaInicio ? new Date(data.fechaInicio) : new Date();

    const proyecto = await prisma.proyecto.create({
      data: {
        numero,
        nombre: data.nombre,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        clienteDireccion: data.clienteDireccion,
        clienteNit: data.clienteNit,
        contactoNombre: data.contactoNombre,
        descripcion: data.descripcion,
        alcance: data.alcance,
        cotizacionId: data.cotizacionId ? Number(data.cotizacionId) : null,
        cotizacionNumero: data.cotizacionNumero,
        fechaInicio: inicio,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        notas: data.notas,
        usuarioNombre: userName,
        mantenimientos: {
          create: [1, 2, 3].map(n => ({
            numero: n,
            fechaProgramada: addMonths(inicio, n * 4),
          })),
        },
      },
      include: { mantenimientos: true },
    });

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: userId,
          usuarioNombre: userName,
          accion: 'CREATE',
          tabla: 'proyectos',
          registroId: String(proyecto.id),
          detalle: `Proyecto ${numero} creado`,
        }
      });
    } catch {}

    return proyecto;
  }

  static async update(id: number, data: Partial<CreateProyectoDto>, userId: number, userName: string) {
    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        clienteDireccion: data.clienteDireccion,
        clienteNit: data.clienteNit,
        contactoNombre: data.contactoNombre,
        descripcion: data.descripcion,
        alcance: data.alcance,
        estado: data.estado,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
        notas: data.notas,
      },
      include: {
        mantenimientos: { orderBy: { numero: 'asc' } },
        garantias: { orderBy: { createdAt: 'desc' } },
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: userId,
          usuarioNombre: userName,
          accion: 'UPDATE',
          tabla: 'proyectos',
          registroId: String(id),
          detalle: `Proyecto ${proyecto.numero} editado`,
        }
      });
    } catch {}

    return proyecto;
  }

  static async registerMantenimiento(id: number, mantId: number, data: any, userId: number, userName: string) {
    const mant = await prisma.mantenimientoProyecto.update({
      where: { id: mantId },
      data: {
        realizado: true,
        fechaRealizada: data.fechaRealizada ? new Date(data.fechaRealizada) : new Date(),
        notas: data.notas || null,
        cobrado: data.cobrado ?? false,
        montoCobrado: data.montoCobrado ? Number(data.montoCobrado) : 0,
        tecnicoNombre: data.tecnicoNombre || userName,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: userId,
          usuarioNombre: userName,
          accion: 'MANTENIMIENTO_REALIZADO',
          tabla: 'proyectos',
          registroId: String(id),
          detalle: `Mantenimiento ${mant.numero} realizado`,
        }
      });
    } catch {}

    return mant;
  }

  static async delete(id: number, role: string, pin?: string) {
    if (role !== 'admin' && role !== 'supervisor') {
      if (!pin) throw new Error('Se requiere contraseña de administrador');
      const bcrypt = await import('bcryptjs');
      const admins = await prisma.usuario.findMany({ where: { rol: 'admin', activo: true } });
      let valido = false;
      for (const a of admins) {
        if (a.password && await bcrypt.compare(pin, a.password)) { valido = true; break; }
      }
      if (!valido) throw new Error('Contraseña incorrecta');
    }
    await prisma.proyecto.delete({ where: { id } });
  }
}
