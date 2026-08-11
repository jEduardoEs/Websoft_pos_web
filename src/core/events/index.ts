import { registerCotizacionesListeners } from '@/modules/cotizaciones/registerEventListeners';
import { registerVentasListeners } from '@/modules/ventas/registerEventListeners';
import { registerProyectosListeners } from '@/modules/proyectos/registerEventListeners';
import { registerAuditoriaListeners } from '@/modules/auditoria/registerEventListeners';
import { registerInventoryEventListeners } from '@/core/inventory/InventoryEventListener';
import { registerWarrantyClaimApprovedListener } from '@/modules/garantias/listeners/WarrantyClaimApprovedListener';

export function initializeEventBus() {
  console.info('[EventBus] Initializing event listeners...');
  registerCotizacionesListeners();
  registerVentasListeners();
  registerProyectosListeners();
  registerAuditoriaListeners();
  registerInventoryEventListeners();
  registerWarrantyClaimApprovedListener();
  console.info('[EventBus] Initialization complete.');
}
