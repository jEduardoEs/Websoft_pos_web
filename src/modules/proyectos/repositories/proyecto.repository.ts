import { prisma } from '@/lib/prisma';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { enviarFacturaPorCorreo } from '@/lib/email-factura';
import { emitirFEL, FELResponse } from '@/lib/fel';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export class ProyectoRepository {
  async findAll(params: { estado?: string; buscar?: string }) {
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
      take: 50,
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

  async findById(id: number) {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        mantenimientos: { orderBy: { numero: 'asc' } },
        garantias: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!proyecto) return null;

    let cotizacion = null;
    if (proyecto.cotizacionId) {
      cotizacion = await prisma.cotizacion.findUnique({
        where: { id: proyecto.cotizacionId },
        include: { items: true },
      });
    }

    return {
      ...proyecto,
      cotizacion,
    };
  }

  async create(data: CreateProyectoDto, userId: number, userName: string) {
    if (data.cotizacionId) {
      const existe = await prisma.proyecto.findUnique({ where: { cotizacionId: Number(data.cotizacionId) } });
      if (existe) throw new Error('Ya existe un proyecto para esta cotización');
    }

    const inicio = data.fechaInicio ? new Date(data.fechaInicio) : new Date();

    return prisma.$transaction(async (tx) => {
      const count = await tx.proyecto.count();
      const numero = `PRY-${String(count + 1).padStart(6, '0')}`;

      const proyecto = await tx.proyecto.create({
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
        const parsedUserId = isNaN(Number(userId)) || !userId ? 1 : Number(userId);
        await tx.auditLog.create({
          data: {
            usuarioId: parsedUserId,
            usuarioNombre: userName,
            accion: 'CREATE',
            tabla: 'proyectos',
            registroId: String(proyecto.id),
            detalle: `Proyecto ${numero} creado`,
          }
        });
      } catch {}

      try {
        const { eventBus } = await import('@/core/events/EventBus');
        const { ProyectoCreado } = await import('@/core/events/types/ProyectoCreado');
        await eventBus.publish(new ProyectoCreado({
          proyectoId: proyecto.id,
          numero: proyecto.numero,
          nombre: proyecto.nombre,
          clienteNombre: proyecto.clienteNombre,
          cotizacionId: proyecto.cotizacionId,
          usuarioNombre: userName,
        }));
      } catch (err) {
        console.error('[ProyectoService] Error publishing ProyectoCreado:', err);
      }

      return proyecto;
    });
  }

  async update(id: number, data: Partial<CreateProyectoDto> & { pin?: string }, userId: number, userName: string) {
    const actual = await prisma.proyecto.findUnique({ where: { id } });
    if (!actual) throw new Error('Proyecto no encontrado');

    if (data.estado) {
      const { WorkflowEngine } = await import('@/core/state');
      WorkflowEngine.validateTransition('proyecto', actual.estado, data.estado);
    }

    const FASE_INDEX: Record<string, number> = { planificado: 0, en_ejecucion: 1, completado: 2 };

    if (data.estado && actual.estado && FASE_INDEX[data.estado] !== undefined && FASE_INDEX[actual.estado] !== undefined) {
      if (FASE_INDEX[data.estado] < FASE_INDEX[actual.estado]) {
        if (!data.pin) {
          throw new Error('Se requiere contraseña de administrador para regresar a una fase anterior');
        }
        const bcrypt = await import('bcryptjs');
        const admins = await prisma.usuario.findMany({ where: { rol: 'admin', activo: true } });
        let valido = false;
        for (const a of admins) {
          if (a.password && await bcrypt.compare(data.pin, a.password)) {
            valido = true;
            break;
          }
        }
        if (!valido) {
          throw new Error('Contraseña de administrador incorrecta');
        }
      }
    }

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
      const parsedUserId = isNaN(Number(userId)) || !userId ? 1 : Number(userId);
      await prisma.auditLog.create({
        data: {
          usuarioId: parsedUserId,
          usuarioNombre: userName,
          accion: 'UPDATE',
          tabla: 'proyectos',
          registroId: String(id),
          detalle: `Proyecto ${proyecto.numero} editado (${proyecto.estado})`,
        }
      });
    } catch {}

    try {
      const { eventBus } = await import('@/core/events/EventBus');
      if (proyecto.estado === 'cancelado') {
        const { ProyectoCancelado } = await import('@/core/events/types/ProyectoCancelado');
        await eventBus.publish(new ProyectoCancelado({
          proyectoId: proyecto.id,
          numero: proyecto.numero,
          usuarioNombre: userName,
        }));
      } else if (proyecto.estado === 'completado') {
        const { RuleEngine } = await import('@/core/rules');
        RuleEngine.assertCanCreditCommission({ estado: proyecto.estado });

        const { ComisionDevengada } = await import('@/core/events/types/ComisionDevengada');
        await eventBus.publish(new ComisionDevengada({
          proyectoId: proyecto.id,
          vendedorNombre: userName,
          monto: 100,
        }));
      }
    } catch (err) {
      console.error('[ProyectoService] Error publishing update events:', err);
    }

    return proyecto;
  }

  async facturarProyecto(id: number, data: any, userId: number, userName: string) {
    const { facturarProyectoHelper } = await import('./proyecto-facturacion.helper');
    return facturarProyectoHelper(id, data, userId, userName);
  }

  async registerMantenimiento(id: number, mantId: number, data: any, userId: number, userName: string) {
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
      const parsedUserId = isNaN(Number(userId)) || !userId ? 1 : Number(userId);
      await prisma.auditLog.create({
        data: {
          usuarioId: parsedUserId,
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

  async delete(id: number, role: string, pin?: string) {
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

  async handleInvoicing(projectId: number) {
    const proyecto = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!proyecto) throw new Error('Proyecto no encontrado');

    await prisma.proyecto.update({
      where: { id: projectId },
      data: { estado: 'facturado' },
    });

    return true;
  }
}
