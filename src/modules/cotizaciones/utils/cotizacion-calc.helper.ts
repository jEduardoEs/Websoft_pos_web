import { calculateGravable, calculateIVA } from '@/shared/money';
import { LineItem } from '../types/cotizacion';

export function createNewCotizacionItem(tipo: LineItem['tipo'] = 'producto'): LineItem {
  const base: LineItem = {
    tipo,
    productoId: null,
    codigo: '',
    descripcion: '',
    costoCompra: 0,
    precioVenta: 0,
    cantidad: 1,
    descuento: 0,
    subtotal: 0,
    total: 0,
    zonaId: null,
    zonaNombre: '',
    zonaTarifa: 0,
    cargoAdicional: 0,
    notaAdicional: ''
  };

  if (tipo === 'instalacion') {
    return { ...base, codigo: 'INST-001', descripcion: 'Instalación técnica' };
  }
  return base;
}

export function calcInstalacionTarifa(item: LineItem): number {
  return (Number(item.zonaTarifa) || 0) + (Number(item.cargoAdicional) || 0);
}

export function recalcLineItem(item: LineItem): LineItem {
  let precio = parseFloat(String(item.precioVenta || 0)) || 0;
  if (item.tipo === 'instalacion') {
    precio = calcInstalacionTarifa(item);
    item = { ...item, precioVenta: precio };
  }

  const qty = parseFloat(String(item.cantidad || 0)) || 0;
  const sub = Number((precio * qty).toFixed(2));
  const descTotalLine = Math.max(0, parseFloat(String(item.descuento || 0)) || 0);
  const total = Number(Math.max(0, sub - descTotalLine).toFixed(2));

  return { ...item, subtotal: sub, total };
}

export function calculateCotizacionTotals(items: LineItem[]) {
  const itemsSubtotalBruto = Number(items.reduce((s, i) => s + (i.subtotal || 0), 0).toFixed(2));
  const itemsDescuentoTotal = Number(items.reduce((s, i) => s + (i.descuento || 0), 0).toFixed(2));
  const totalFinal = Number(Math.max(0, itemsSubtotalBruto - itemsDescuentoTotal).toFixed(2));
  const baseTotal = calculateGravable(totalFinal, 0.05);
  const ivaCalculado = calculateIVA(totalFinal, 0.05);

  return {
    itemsSubtotalBruto,
    itemsDescuentoTotal,
    totalFinal,
    baseTotal,
    ivaCalculado
  };
}
