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
    const rawCotId = data.cotizacionId ? Number(data.cotizacionId) : null;
    const rawCotNum = data.cotizacionNumero ? String(data.cotizacionNumero).trim() : null;

    let linkedCotId: number | null = rawCotId;
    let linkedCotNumero: string | null = null;
    let linkedVentaNumero: string | null = null;

    if (rawCotNum) {
      if (rawCotNum.toUpperCase().startsWith('FAC') || rawCotNum.toUpperCase().startsWith('VEN')) {
        linkedVentaNumero = rawCotNum;
        const cleanDigits = rawCotNum.replace(/\D/g, '');
        const venta = await prisma.venta.findFirst({
          where: {
            OR: [
              { numero: { equals: rawCotNum, mode: 'insensitive' } },
              ...(cleanDigits ? [{ felNumero: Number(cleanDigits) }] : [])
            ]
          }
        });
        if (venta) {
          const matchCotId = (venta.notas || '').match(/COT-(\d+)/i);
          if (matchCotId) {
            linkedCotId = Number(matchCotId[1]);
            const cot = await prisma.cotizacion.findUnique({ where: { id: linkedCotId } });
            if (cot) linkedCotNumero = cot.numero;
          }
        }
      } else if (rawCotNum.toUpperCase().startsWith('COT')) {
        linkedCotNumero = rawCotNum;
        const cot = await prisma.cotizacion.findFirst({ where: { numero: { equals: rawCotNum, mode: 'insensitive' } } });
        if (cot) {
          if (cot.estado !== 'facturada') {
            throw new Error(`La cotización "${cot.numero}" no ha sido facturada aún (Estado actual: ${cot.estado || 'Pendiente'}). Primero debes facturarla en el punto de venta (POS) para poder crear el proyecto.`);
          }
          linkedCotId = cot.id;
          const venta = await prisma.venta.findFirst({
            where: {
              OR: [
                { notas: { contains: cot.numero, mode: 'insensitive' } },
                { notas: { contains: `[Cotización COT-${cot.id}]`, mode: 'insensitive' } }
              ]
            }
          });
          if (venta) linkedVentaNumero = venta.numero;
        } else {
          throw new Error(`La cotización "${rawCotNum}" no fue encontrada en el sistema. Verifica el número e intenta de nuevo.`);
        }
      }
    } else if (rawCotId) {
      const cot = await prisma.cotizacion.findUnique({ where: { id: rawCotId } });
      if (cot) {
        if (cot.estado !== 'facturada') {
          throw new Error(`La cotización "${cot.numero}" no ha sido facturada aún (Estado actual: ${cot.estado || 'Pendiente'}). Primero debes facturarla en el punto de venta (POS) para poder crear el proyecto.`);
        }
        linkedCotNumero = cot.numero;
        const venta = await prisma.venta.findFirst({
          where: {
            OR: [
              { notas: { contains: cot.numero, mode: 'insensitive' } },
              { notas: { contains: `[Cotización COT-${cot.id}]`, mode: 'insensitive' } }
            ]
          }
        });
        if (venta) linkedVentaNumero = venta.numero;
      }
    }

    const orConditions: any[] = [];
    if (linkedCotId) {
      orConditions.push({ cotizacionId: linkedCotId });
    }
    if (rawCotNum) {
      orConditions.push({ cotizacionNumero: { equals: rawCotNum, mode: 'insensitive' } });
    }
    if (linkedCotNumero && linkedCotNumero.toLowerCase() !== rawCotNum?.toLowerCase()) {
      orConditions.push({ cotizacionNumero: { equals: linkedCotNumero, mode: 'insensitive' } });
    }
    if (linkedVentaNumero && linkedVentaNumero.toLowerCase() !== rawCotNum?.toLowerCase()) {
      orConditions.push({ cotizacionNumero: { equals: linkedVentaNumero, mode: 'insensitive' } });
    }

    if (orConditions.length > 0) {
      const existe = await prisma.proyecto.findFirst({
        where: { OR: orConditions }
      });

      if (existe) {
        const refLabel = rawCotNum || linkedCotNumero || linkedVentaNumero || `ID ${linkedCotId}`;
        throw new Error(`La cotización o factura "${refLabel}" ya posee un proyecto registrado (${existe.numero} — "${existe.nombre}"). No es posible vincularla a más de un proyecto.`);
      }
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
          cotizacionId: linkedCotId || (data.cotizacionId ? Number(data.cotizacionId) : null),
          cotizacionNumero: linkedCotNumero || data.cotizacionNumero || null,
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
