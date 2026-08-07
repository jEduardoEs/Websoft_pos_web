import { ProjectInvoiced } from '@/core/events/types/ProjectInvoiced';
import { VentaService } from '@/modules/ventas/services/venta.service';

export const projectInvoicedListener = async (event: ProjectInvoiced): Promise<void> => {
  const { saleId, projectId } = event.payload;
  if (!saleId) {
    console.info(`[ProjectInvoicedListener] Skipping project ${projectId} (no saleId)`);
    return;
  }
  
  console.info(`[ProjectInvoicedListener] Processing invoiced project ${projectId} for sale ${saleId}`);
  try {
    // This method will be added to VentaService
    await VentaService.markInvoiced(saleId);
  } catch (error) {
    console.error(`[ProjectInvoicedListener] Error marking sale ${saleId} as invoiced:`, error);
    throw error;
  }
};
