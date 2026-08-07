import { SaleCreated } from '@/core/events/types/SaleCreated';
import { ProyectoService } from '@/modules/proyectos/services/proyecto.service';

export const saleCreatedListener = async (event: SaleCreated): Promise<void> => {
  const { saleId } = event.payload;
  console.info(`[SaleCreatedListener] Processing sale ${saleId}`);
  try {
    // This method will be added to ProyectoService
    await ProyectoService.createFromSale(saleId);
  } catch (error) {
    console.error(`[SaleCreatedListener] Error processing sale ${saleId}:`, error);
    throw error;
  }
};
