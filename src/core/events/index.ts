import { registerCotizacionesListeners } from '@/modules/cotizaciones/registerEventListeners';
import { registerVentasListeners } from '@/modules/ventas/registerEventListeners';
import { registerProyectosListeners } from '@/modules/proyectos/registerEventListeners';
import { registerAuditoriaListeners } from '@/modules/auditoria/registerEventListeners';

export function initializeEventBus() {
  console.info('[EventBus] Initializing event listeners...');
  registerCotizacionesListeners();
  registerVentasListeners();
  registerProyectosListeners();
  registerAuditoriaListeners();
  console.info('[EventBus] Initialization complete.');
}
