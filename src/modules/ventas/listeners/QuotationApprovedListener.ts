import { QuotationApproved } from '@/core/events/types/QuotationApproved';
import { VentaService } from '@/modules/ventas/services/venta.service';

export const quotationApprovedListener = async (event: any): Promise<void> => {
  const quotationId = event.payload?.quotationId || event.payload?.cotizacionId;
  if (!quotationId) return;
  console.info(`[QuotationApprovedListener] Processing quotation ${quotationId}`);
  try {
    await VentaService.createFromQuotation(Number(quotationId));
  } catch (error) {
    console.error(`[QuotationApprovedListener] Error processing quotation ${quotationId}:`, error);
  }
};
