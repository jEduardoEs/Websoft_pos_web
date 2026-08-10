// Transition maps for WebSoft POS State Machine
// Defines allowed state transitions for each domain.

import { CotizacionState, VentaState, ProyectoState, FacturacionState, ComisionState, StateDomain } from './StateEnums';

export const CotizacionTransitionMap: Record<string, string[]> = {
  [CotizacionState.PENDIENTE]: [
    CotizacionState.ACEPTADA,
    CotizacionState.RECHAZADA,
    CotizacionState.FACTURADA,
    CotizacionState.ANULADA,
  ],
  [CotizacionState.ACEPTADA]: [
    CotizacionState.FACTURADA,
    CotizacionState.ANULADA,
  ],
  [CotizacionState.RECHAZADA]: [
    CotizacionState.PENDIENTE,
    CotizacionState.ANULADA,
  ],
  [CotizacionState.FACTURADA]: [],
  [CotizacionState.ANULADA]: [],
};

export const VentaTransitionMap: Record<string, string[]> = {
  [VentaState.PENDIENTE]: [
    VentaState.COMPLETADA,
    VentaState.ANULADA,
  ],
  [VentaState.COMPLETADA]: [
    VentaState.ANULADA,
  ],
  [VentaState.ANULADA]: [],
};

export const ProyectoTransitionMap: Record<string, string[]> = {
  [ProyectoState.PLANIFICADO]: [
    ProyectoState.EN_EJECUCION,
    ProyectoState.CANCELADO,
  ],
  [ProyectoState.EN_EJECUCION]: [
    ProyectoState.COMPLETADO,
    ProyectoState.PLANIFICADO,
    ProyectoState.CANCELADO,
  ],
  [ProyectoState.COMPLETADO]: [
    ProyectoState.EN_EJECUCION,
  ],
  [ProyectoState.CANCELADO]: [
    ProyectoState.PLANIFICADO,
  ],
};

export const FacturacionTransitionMap: Record<string, string[]> = {
  [FacturacionState.GENERADA]: [
    FacturacionState.EMITIDA,
    FacturacionState.CERTIFICADO,
    FacturacionState.SANDBOX,
    FacturacionState.ERROR,
    FacturacionState.ANULADA,
  ],
  [FacturacionState.EMITIDA]: [
    FacturacionState.ANULADA,
  ],
  [FacturacionState.SANDBOX]: [
    FacturacionState.CERTIFICADO,
    FacturacionState.ANULADA,
  ],
  [FacturacionState.CERTIFICADO]: [
    FacturacionState.ANULADA,
  ],
  [FacturacionState.ERROR]: [
    FacturacionState.GENERADA,
    FacturacionState.EMITIDA,
    FacturacionState.ANULADA,
  ],
  [FacturacionState.ANULADA]: [],
};

export const ComisionTransitionMap: Record<string, string[]> = {
  [ComisionState.PENDIENTE]: [
    ComisionState.CALCULADA,
    ComisionState.ANULADA,
  ],
  [ComisionState.CALCULADA]: [
    ComisionState.APROBADA,
    ComisionState.ANULADA,
  ],
  [ComisionState.APROBADA]: [
    ComisionState.PAGADA,
    ComisionState.ANULADA,
  ],
  [ComisionState.PAGADA]: [],
  [ComisionState.ANULADA]: [],
};

export const DOMAIN_TRANSITION_MAPS: Record<StateDomain, Record<string, string[]>> = {
  cotizacion: CotizacionTransitionMap,
  venta: VentaTransitionMap,
  proyecto: ProyectoTransitionMap,
  facturacion: FacturacionTransitionMap,
  comision: ComisionTransitionMap,
};
