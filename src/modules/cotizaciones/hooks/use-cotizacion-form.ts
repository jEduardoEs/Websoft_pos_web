import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { LineItem } from '../types/cotizacion';

const IVA = 0.05;

function newItem(tipo: LineItem['tipo']): LineItem {
  const base = { tipo, productoId: null, codigo: '', descripcion: '', costoCompra: 0, precioVenta: 0, cantidad: 1, descuento: 0, subtotal: 0, total: 0, zonaId: null, zonaNombre: '', zonaTarifa: 0, cargoAdicional: 0, notaAdicional: '' };
  if (tipo === 'instalacion') return { ...base, codigo: 'INST-001', descripcion: 'Instalacion tecnica' };
  return base as LineItem;
}

function calcInstalacion(item: LineItem) {
  return (item.zonaTarifa || 0) + (item.cargoAdicional || 0);
}

function recalc(item: LineItem): LineItem {
  let precio = item.precioVenta;
  if (item.tipo === 'producto' && item.costoCompra > 0) {
    if (!item.productoId) {
      precio = item.costoCompra * 1.30;
      item = { ...item, precioVenta: precio };
    }
  }
  if (item.tipo === 'instalacion') {
    precio = calcInstalacion(item);
    item = { ...item, precioVenta: precio };
  }
  const sub = precio * item.cantidad;
  const total = sub - (item.descuento || 0);
  return { ...item, subtotal: sub, total };
}

export const emptyForm = {
  clienteNombre: '', clienteDireccion: '', clienteTelefono: '',
  clienteNit: 'CF', clienteCorreo: '', atencion: '',
  formaPago: 'Efectivo, Transferencia, Deposito, Cheque Preautorizado',
  descripcion: '', notas: '', validezDias: '15', tiempoInstalacion: '',
};

export function useCotizacionForm(onSuccess: () => void) {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<LineItem[]>([newItem('producto')]);
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [buscarProd, setBuscarProd] = useState('');

  const loadProductos = useCallback(async () => {
    try {
      const res = await fetch(`/api/productos?buscar=${encodeURIComponent(buscarProd)}`);
      setProductos(await res.json());
    } catch { /* ignore */ }
  }, [buscarProd]);

  const loadZonas = useCallback(async () => {
    try {
      const res = await fetch('/api/zonas-instalacion?activas=true');
      const d = await res.json();
      setZonas(d.zonas || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadZonas(); }, [loadZonas]);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const buscarNitCliente = async (nit: string) => {
    setF('clienteNit', nit);
    if (nit.length < 3 || nit.toUpperCase() === 'CF') return;
    try {
      const res = await fetch(`/api/clientes/buscar-nit?nit=${encodeURIComponent(nit)}`);
      const data = await res.json();
      if (data.encontrado && data.cliente) {
        setForm(p => ({
          ...p,
          clienteNombre: data.cliente.nombre,
          clienteTelefono: data.cliente.telefono || p.clienteTelefono,
          clienteDireccion: data.cliente.direccion || p.clienteDireccion,
          clienteNit: nit,
        }));
        toast.success(`Cliente: ${data.cliente.nombre}`);
      }
    } catch { /* ignore */ }
  };

  const selProducto = (i: number, prod: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated: LineItem = {
        ...item,
        productoId: prod.id,
        codigo: prod.codigo || '',
        descripcion: prod.nombre,
        costoCompra: prod.costo,
        precioVenta: prod.precio > 0 ? prod.precio : prod.costo * 1.30,
      };
      return recalc(updated);
    }));
  };

  const updItem = (i: number, k: keyof LineItem, v: number | string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [k]: v };
      return recalc(updated as LineItem);
    }));
  };

  const addItem = (tipo: LineItem['tipo']) => setItems(p => [...p, newItem(tipo)]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));

  const baseTotal = items.reduce((s, i) => s + i.total, 0);
  const iva = baseTotal * IVA;
  const grandTotal = baseTotal + iva;

  const reset = () => {
    setForm(emptyForm);
    setItems([newItem('producto')]);
  };

  const guardar = async () => {
    if (!form.clienteNombre.trim()) return toast.error('Falta nombre del cliente');
    if (items.length === 0) return toast.error('Agrega al menos un item');

    const validItems = items.filter(i => i.descripcion.trim().length > 0 && i.total >= 0);
    if (validItems.length === 0) return toast.error('Items inválidos o vacíos');

    setLoading(true);
    try {
      const payload = {
        ...form,
        subtotal: baseTotal,
        descuento: 0,
        total: grandTotal,
        items: validItems.map(i => ({
          codigo: i.codigo,
          descripcion: i.tipo === 'instalacion' && i.zonaNombre ? `Instalación ${i.zonaNombre} - ${i.notaAdicional}`.trim() : i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precioVenta,
          subtotal: i.subtotal,
          descuento: i.descuento,
          totalItem: i.total,
        })),
      };

      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Cotización guardada');
      reset();
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return {
    state: { form, items, loading, productos, zonas, buscarProd, baseTotal, iva, grandTotal },
    setters: { setForm, setItems, setBuscarProd, setF },
    actions: { buscarNitCliente, selProducto, updItem, addItem, removeItem, guardar, reset }
  };
}
