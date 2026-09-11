import { SaleCompleted } from '@/core/events/types/SaleCompleted';
import { ProyectoService } from '@/modules/proyectos/services/proyecto.service';

export const saleCompletedListener = async (event: SaleCompleted): Promise<void> => {
  const { saleId } = event.payload;
  console.info(`[SaleCompletedListener] Processing completed sale ${saleId}`);
  try {
    // This method will be added to ProyectoService
    await ProyectoService.markReadyForExecution(saleId);
  } catch (error) {
    console.error(`[SaleCompletedListener] Error processing completed sale ${saleId}:`, error);
    throw error;
  }
};
