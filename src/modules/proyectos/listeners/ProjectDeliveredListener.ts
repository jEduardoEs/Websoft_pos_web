import { eventBus } from '@/core/events/EventBus';
import { GarantiaAggregate } from '@/core/domain/GarantiaAggregate';
import { ComisionAggregate } from '@/core/domain/ComisionAggregate';
import { prisma } from '@/lib/prisma';

export const projectDeliveredListener = async (event: any): Promise<void> => {
  const payload = event.payload || {};
  const { projectId, clienteNombre, diasGarantia } = payload;
  if (!projectId) return;

  console.info(`[ProjectDeliveredListener] Processing delivery for Project ${projectId}`);

  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: Number(projectId) },
      include: { cotizacion: true },
    });
    if (!proyecto) return;

    // 1. Birth Warranty Certificate (BR-007)
    const countG = await prisma.garantia.count();
    const numG = `GAR-${String(countG + 1).padStart(6, '0')}`;
    const garantiaAgg = GarantiaAggregate.createOnProjectDelivery({
      id: countG + 1,
      numero: numG,
      proyectoId: proyecto.id,
      clienteNombre: proyecto.clienteNombre,
      productoNombre: proyecto.nombre || 'Equipos / Servicios del Proyecto',
      diasGarantia: diasGarantia || 365,
    });

    // Check if warranty already exists
    const existingGar = await prisma.garantia.findFirst({ where: { proyectoId: proyecto.id } });
    if (!existingGar) {
      await prisma.garantia.create({
        data: {
          numero: numG,
          clienteNombre: proyecto.clienteNombre,
          clienteNit: proyecto.clienteNit || 'CF',
          clienteTelefono: proyecto.clienteTelefono,
          productoNombre: proyecto.nombre || 'Equipos / Servicios del Proyecto',
          proyectoId: proyecto.id,
          diasGarantia: diasGarantia || 365,
          fechaVenta: new Date(),
          fechaVencimiento: garantiaAgg.fechaVencimiento,
          estado: 'vigente',
          notas: `Garantía entregada tras finalización del proyecto ${proyecto.numero}`,
          usuarioNombre: 'System (EventBus)',
        },
      });
      await garantiaAgg.dispatchEvents();
    }

    // 2. Evaluate Commission (BR-009)
    const totalMonto = proyecto.cotizacion?.total || 1000;
    const countC = await prisma.auditLog.count();
    const comisionAgg = ComisionAggregate.evaluateOnProjectDelivery({
      id: countC + 1,
      proyectoId: proyecto.id,
      asesorId: 1,
      asesorNombre: proyecto.usuarioNombre || 'Asesor Comercial',
      totalProyecto: totalMonto,
      porcentajeComision: 5,
    });
    await comisionAgg.dispatchEvents();

  } catch (error) {
    console.error(`[ProjectDeliveredListener] Error processing project delivery for ${projectId}:`, error);
  }
};

export function registerProjectDeliveredListener(): void {
  eventBus.subscribe('ProjectDelivered', projectDeliveredListener);
  console.info('[Proyectos] ProjectDeliveredListener registered successfully.');
}
