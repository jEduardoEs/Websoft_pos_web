import { prisma } from '@/lib/prisma';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { enviarFacturaPorCorreo } from '@/lib/email-factura';
import { emitirFEL, FELResponse } from '@/lib/fel';

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

  static async findById(id: number) {
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

  static async create(data: CreateProyectoDto, userId: number, userName: string) {
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
        await tx.auditLog.create({
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

  static async update(id: number, data: Partial<CreateProyectoDto> & { pin?: string }, userId: number, userName: string) {
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
      await prisma.auditLog.create({
        data: {
          usuarioId: userId,
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
          monto: 100, // standard project completion bonus commission
        }));
      }
    } catch (err) {
      console.error('[ProyectoService] Error publishing update events:', err);
    }

    return proyecto;
  }

  static async facturarProyecto(id: number, data: any, userId: number, userName: string) {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
    });

    if (!proyecto) throw new Error('Proyecto no encontrado');

    const { RuleEngine } = await import('@/core/rules');
    RuleEngine.assertCanInvoiceProject({ estado: proyecto.estado, id: proyecto.id });

    // Validar que el proyecto no haya sido facturado previamente
    const garantiaExistente = await prisma.garantia.findFirst({
      where: { proyectoId: id }
    });
    if (garantiaExistente || (proyecto.notas && proyecto.notas.includes('Facturado con Venta'))) {
      throw new Error('Este proyecto ya fue facturado en el sistema. No es posible emitir la factura nuevamente.');
    }

    let cotizacion: any = null;
    if (proyecto.cotizacionId) {
      cotizacion = await prisma.cotizacion.findUnique({
        where: { id: proyecto.cotizacionId },
        include: { items: true },
      });

      const ventaExistente = await prisma.venta.findFirst({
        where: { cotizacionId: proyecto.cotizacionId }
      });
      if (ventaExistente) {
        throw new Error(`La cotización vinculada al proyecto ya fue facturada con la venta ${ventaExistente.numero}.`);
      }
    }

    const clienteNombre = data.clienteNombre || proyecto.clienteNombre;
    const clienteNit = data.clienteNit || proyecto.clienteNit || 'CF';
    const clienteCorreo = data.clienteCorreo || '';
    const clienteTelefono = data.clienteTelefono || proyecto.clienteTelefono || '';
    const total = Number(data.total || data.montoTotal || 0);
    if (!total || total <= 0) throw new Error('El total a facturar debe ser mayor a 0');

    const diasGarantia = Number(data.diasGarantia || 365);

    // 1. Transaction to generate sale invoice, update project status, & create warranty
    const result = await prisma.$transaction(async (tx) => {
      // Get next sale number
      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente' } });
      const num = parseInt(cfg?.valor || '1');
      const numeroVenta = `FAC-${String(num).padStart(6, '0')}`;

      // Increment sequence number
      await tx.config.upsert({
        where: { clave: 'numero_siguiente' },
        create: { clave: 'numero_siguiente', valor: String(num + 1) },
        update: { valor: String(num + 1) },
      });

      const impuesto = Number((total - total / 1.05).toFixed(2));
      const subtotal = Number((total - impuesto).toFixed(2));

      // Build sale items
      const itemsList = cotizacion?.items && cotizacion.items.length > 0
        ? cotizacion.items.map((it: any) => ({
            codigo: it.codigo || 'PRY-ITEM',
            nombre: it.descripcion,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            descuento: it.descuento || 0,
            subtotal: it.totalItem,
          }))
        : [
            {
              codigo: proyecto.numero,
              nombre: proyecto.nombre || proyecto.descripcion || 'Servicios y Trabajos del Proyecto',
              cantidad: 1,
              precioUnitario: subtotal,
              descuento: 0,
              subtotal: subtotal,
            },
          ];

      // Create Venta record in POS database
      const venta = await tx.venta.create({
        data: {
          numero: numeroVenta,
          fecha: new Date(),
          clienteNombre,
          clienteNit,
          subtotal,
          descuento: 0,
          impuesto,
          total,
          metodoPago: data.metodoPago || 'efectivo',
          montoRecibido: total,
          cambio: 0,
          notas: `Facturado desde proyecto ${proyecto.numero}`,
          usuarioId: userId,
          usuarioNombre: userName,
          items: {
            create: itemsList.map(it => ({
              codigo: it.codigo,
              nombre: it.nombre,
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
              descuento: it.descuento,
              subtotal: it.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // Update project status to completado
      const updatedProyecto = await tx.proyecto.update({
        where: { id },
        data: {
          estado: 'completado',
          notas: proyecto.notas
            ? `${proyecto.notas} | Facturado con Venta ${numeroVenta}`
            : `Facturado con Venta ${numeroVenta}`,
        },
      });

      // Create and activate Garantia in POS database
      const countG = await tx.garantia.count();
      const numG = `GAR-${String(countG + 1).padStart(6, '0')}`;
      const now = new Date();
      const fVenc = new Date(now.getTime() + diasGarantia * 24 * 60 * 60 * 1000);

      const garantia = await tx.garantia.create({
        data: {
          numero: numG,
          clienteNombre,
          clienteTelefono,
          clienteNit,
          productoNombre: proyecto.nombre || proyecto.descripcion || 'Servicios / Equipos del Proyecto',
          productoSerie: data.productoSerie || data.serie || null,
          ventaNumero: numeroVenta,
          ventaId: venta.id,
          proyectoId: proyecto.id,
          diasGarantia,
          fechaVenta: now,
          fechaVencimiento: fVenc,
          estado: 'vigente',
          notas: `Garantía activada tras la emisión de factura ${numeroVenta} del proyecto ${proyecto.numero}`,
          usuarioNombre: userName,
        },
      });

      return { venta, garantia, updatedProyecto, itemsList };
    });

    // 2. Side-effect: FEL Certification & Email Transmission
    let felResult: FELResponse | null = null;
    let emailSent = false;

    try {
      const configs = await prisma.config.findMany({
        where: { clave: { in: ['fel_activo', 'email_factura_activo'] } }
      });
      const configMap = Object.fromEntries(configs.map(c => [c.clave, c.valor]));

      if (configMap['fel_activo'] === 'true' || process.env.DTEVIA_API_KEY) {
        felResult = await emitirFEL({
          numeroInterno: result.venta.numero,
          nitReceptor: clienteNit,
          nombreReceptor: clienteNombre,
          correoReceptor: clienteCorreo,
          items: result.itemsList.map(it => ({
            cantidad: it.cantidad,
            descripcion: it.nombre,
            precioUnitario: it.precioUnitario,
            descuento: it.descuento || 0,
            subtotal: it.subtotal,
            codigoProducto: it.codigo,
          })),
          subtotal: result.venta.subtotal,
          descuento: 0,
          impuesto: result.venta.impuesto,
          total: result.venta.total,
          metodoPago: result.venta.metodoPago,
        });

        if (felResult && felResult.ok) {
          await prisma.venta.update({
            where: { id: result.venta.id },
            data: {
              felUuid: felResult.uuid,
              felSerie: felResult.serie,
              felNumero: felResult.numero,
              felCertificacion: felResult.fechaCertificacion,
              felPdfUrl: felResult.pdfUrl,
              felEstado: felResult.sandbox ? 'sandbox' : 'certificado',
            },
          });
        }
      }

      if (configMap['email_factura_activo'] === 'true' && clienteCorreo && clienteCorreo.includes('@')) {
        const mailRes = await enviarFacturaPorCorreo({
          uuid: felResult?.uuid,
          serie: felResult?.serie,
          numero: felResult?.numero,
          fechaCertificacion: felResult?.fechaCertificacion,
          pdfUrl: felResult?.pdfUrl,
          sandbox: felResult?.sandbox,
          numeroInterno: result.venta.numero,
          fecha: result.venta.fecha,
          clienteNombre,
          clienteNit,
          clienteCorreo,
          items: result.itemsList.map(it => ({
            codigo: it.codigo,
            nombre: it.nombre,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            descuento: it.descuento || 0,
            subtotal: it.subtotal,
          })),
          subtotal: result.venta.subtotal,
          descuento: 0,
          impuesto: result.venta.impuesto,
          total: result.venta.total,
          metodoPago: result.venta.metodoPago,
        });
        emailSent = Boolean(mailRes && mailRes.ok);
      }
    } catch (err) {
      console.error('[ProyectoService] Error processing FEL/email side-effects:', err);
    }

    try {
      const { eventBus } = await import('@/core/events/EventBus');
      const { FacturaEmitida, PagoRegistrado } = await import('@/core/events/types');

      await eventBus.publish(new FacturaEmitida({
        proyectoId: result.updatedProyecto.id,
        ventaId: result.venta.id,
        numeroFactura: felResult?.numero || result.venta.numero,
        uuid: felResult?.uuid,
        clienteNombre,
        total: result.venta.total,
        usuarioNombre: userName,
      }));

      await eventBus.publish(new PagoRegistrado({
        proyectoId: result.updatedProyecto.id,
        ventaId: result.venta.id,
        monto: result.venta.total,
        metodoPago: data.metodoPago || 'efectivo',
        clienteNombre,
        usuarioNombre: userName,
      }));
    } catch (err) {
      console.error('[ProyectoService] Error publishing facturarProyecto events:', err);
    }

    return {
      ok: true,
      venta: result.venta,
      garantia: result.garantia,
      proyecto: result.updatedProyecto,
      fel: felResult,
      emailSent,
    };
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
  static async createFromSale(saleId: number) {
    const venta = await prisma.venta.findUnique({
      where: { id: saleId },
      include: { items: true },
    });
    if (!venta) throw new Error('Venta no encontrada');

    // Mapear de Venta a CreateProyectoDto
    const dto: CreateProyectoDto = {
      nombre: `Proyecto Venta ${venta.numero}`,
      clienteNombre: venta.clienteNombre,
      clienteNit: venta.clienteNit,
      descripcion: `Proyecto generado automáticamente a partir de la venta ${venta.numero}`,
      cotizacionId: venta.cotizacionId ? String(venta.cotizacionId) : undefined,
    };

    // Usar 'System' para creaciones automáticas
    const proyecto = await this.create(dto, 1, 'System');
    
    // Update relationship with Sale if your DB schema supports it.
    // If not, we just rely on emitting the event for now.
    
    const { eventBus } = require('@/core/events/EventBus');
    await eventBus.publish({
      type: 'ProjectCreated',
      payload: { projectId: proyecto.id, saleId: venta.id },
      timestamp: new Date(),
    });

    return proyecto;
  }

  static async markReadyForExecution(saleId: number) {
    // Si la base de datos no tiene saleId en Proyecto, buscar por el cotizacionId o notas.
    // Para simplificar, si se agrega la relación se buscará directamente:
    // await prisma.proyecto.updateMany({ where: { saleId }, data: { estado: 'listo' } });
    console.info(`[ProyectoService] markReadyForExecution called for sale ${saleId}`);
    return true;
  }

  static async handleInvoicing(projectId: number) {
    const proyecto = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!proyecto) throw new Error('Proyecto no encontrado');

    await prisma.proyecto.update({
      where: { id: projectId },
      data: { estado: 'facturado' },
    });

    const { eventBus } = require('@/core/events/EventBus');
    // Para simplificar, extraemos saleId si estuviera almacenado, si no, se pasa undefined y el eventBus se encarga de loguear
    await eventBus.publish({
      type: 'ProjectInvoiced',
      payload: { projectId, saleId: undefined },
      timestamp: new Date(),
    });

    return true;
  }
}
