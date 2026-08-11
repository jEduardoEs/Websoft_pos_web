import { eventBus } from '@/core/events/EventBus';
import { prisma } from '@/lib/prisma';

export const warrantyClaimApprovedListener = async (event: any): Promise<void> => {
  const payload = event.payload || {};
  const { garantiaId, decision, crearOrdenTrabajo } = payload;

  if (!garantiaId || !crearOrdenTrabajo) return;

  console.info(`[WarrantyClaimApprovedListener] Processing claim repair order for Warranty ${garantiaId}`);

  try {
    const garantia = await prisma.garantia.findUnique({
      where: { id: Number(garantiaId) },
    });
    if (!garantia) return;

    // Create technical service order
    const countOT = await prisma.ordenTrabajo.count();
    const numOT = `OT-${String(countOT + 1).padStart(6, '0')}`;

    await prisma.ordenTrabajo.create({
      data: {
        numero: numOT,
        clienteNombre: garantia.clienteNombre,
        clienteTelefono: garantia.clienteTelefono || '',
        equipoNombre: garantia.productoNombre,
        equipoSerie: garantia.productoSerie || '',
        fallaReportada: payload.resolucion || 'Falla reportada en reclamo de garantía',
        diagnostico: 'Garantía en proceso de reparación autorizada por servicio técnico',
        estado: 'diagnostico',
        garantiaId: garantia.id,
        usuarioNombre: 'System (EventBus)',
      },
    });

    console.info(`[WarrantyClaimApprovedListener] Orden de Servicio Técnico ${numOT} creada para garantía ${garantia.numero}`);
  } catch (error) {
    console.error(`[WarrantyClaimApprovedListener] Error creating technical service order for warranty ${garantiaId}:`, error);
  }
};

export function registerWarrantyClaimApprovedListener(): void {
  eventBus.subscribe('WarrantyClaimApproved', warrantyClaimApprovedListener);
  console.info('[Garantias] WarrantyClaimApprovedListener registered successfully.');
}
