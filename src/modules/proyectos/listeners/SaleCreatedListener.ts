import { SaleCreated } from '@/core/events/types/SaleCreated';
import { ProyectoService } from '@/modules/proyectos/services/proyecto.service';

export const saleCreatedListener = async (event: any): Promise<void> => {
  const saleId = event.payload?.saleId || event.payload?.ventaId;
  if (!saleId) return;
  console.info(`[SaleCreatedListener] Processing sale ${saleId}`);
  try {
    await ProyectoService.createFromSale(Number(saleId));
  } catch (error) {
    console.error(`[SaleCreatedListener] Error processing sale ${saleId}:`, error);
  }
};
