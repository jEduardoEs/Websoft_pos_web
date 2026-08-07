import { QuotationApproved } from '@/core/events/types/QuotationApproved';
import { VentaService } from '@/modules/ventas/services/venta.service';

export const quotationApprovedListener = async (event: QuotationApproved): Promise<void> => {
  const { quotationId } = event.payload;
  console.info(`[QuotationApprovedListener] Processing quotation ${quotationId}`);
  try {
    // This method will be added to VentaService
    await VentaService.createFromQuotation(quotationId);
  } catch (error) {
    console.error(`[QuotationApprovedListener] Error processing quotation ${quotationId}:`, error);
    throw error;
  }
};
