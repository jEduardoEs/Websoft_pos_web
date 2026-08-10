import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { LineItem } from '../types/cotizacion';

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
  const sub = Math.round(precio * item.cantidad * 100) / 100;
  const total = Math.round((sub - (item.descuento || 0)) * 100) / 100;
  return { ...item, subtotal: sub, total };
}

export const emptyForm = {
  id: null as number | null,
  clienteNombre: '', clienteDireccion: '', clienteTelefono: '',
  clienteNit: 'CF', clienteCorreo: '',
  formaPago: 'Efectivo, Transferencia, Deposito, Cheque Preautorizado',
  descripcion: '', notas: '', validezDias: '15', tiempoInstalacion: '',
};

export function useCotizacionForm(onSuccess: () => void, cotizacionInitial?: any, isDuplicate: boolean = false) {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<LineItem[]>([newItem('producto')]);
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [buscarProd, setBuscarProd] = useState('');

  useEffect(() => {
    if (cotizacionInitial) {
      // Determine initial tipoIva if present
      let initialTipoIva: 'incluido' | '12' | '5' = 'incluido';
      if (cotizacionInitial.tipoIva) {
        initialTipoIva = cotizacionInitial.tipoIva;
      }

      setForm({
        id: isDuplicate ? null : cotizacionInitial.id,
        clienteNombre: cotizacionInitial.clienteNombre || '',
        clienteDireccion: cotizacionInitial.clienteDireccion || '',
        clienteTelefono: cotizacionInitial.clienteTelefono || '',
        clienteNit: cotizacionInitial.clienteNit || 'CF',
        clienteCorreo: cotizacionInitial.clienteCorreo || '',

        formaPago: cotizacionInitial.formaPago || 'Efectivo, Transferencia, Deposito, Cheque Preautorizado',
        descripcion: cotizacionInitial.descripcion || '',
        notas: cotizacionInitial.notas || '',
        validezDias: String(cotizacionInitial.validezDias || '15'),
        tiempoInstalacion: cotizacionInitial.tiempoInstalacion || '',
      });

      if (Array.isArray(cotizacionInitial.items) && cotizacionInitial.items.length > 0) {
        setItems(cotizacionInitial.items.map((it: any) => recalc({
          tipo: 'producto',
          productoId: it.productoId || null,
          codigo: it.codigo || '',
          descripcion: it.descripcion || '',
          costoCompra: 0,
          precioVenta: Number(it.precioUnitario) || 0,
          cantidad: Number(it.cantidad) || 1,
          descuento: Number(it.descuento) || 0,
          subtotal: Number(it.subtotal) || 0,
          total: Number(it.totalItem) || 0,
          zonaId: null,
          zonaNombre: '',
          zonaTarifa: 0,
          cargoAdicional: 0,
          notaAdicional: '',
        })));
      }

      if (isDuplicate) {
        toast.info(`Duplicando cotización ${cotizacionInitial.numero}`);
      }
    }
  }, [cotizacionInitial, isDuplicate]);

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

  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

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
        costoCompra: prod.costo || 0,
        precioVenta: prod.precio > 0 ? prod.precio : (prod.costo || 0) * 1.30,
      };
      return recalc(updated);
    }));
  };

  const addProductoToCotizacion = (prod: any) => {
    // Validate stock before adding
    if (prod.stock !== undefined && prod.stock <= 0) {
      toast.error(`Stock insuficiente para el producto ${prod.nombre}`);
      return;
    }
    const newRow: LineItem = {
      tipo: 'producto',
      productoId: prod.id,
      codigo: prod.codigo || '',
      descripcion: prod.nombre,
      costoCompra: prod.costo || 0,
      precioVenta: prod.precio > 0 ? prod.precio : (prod.costo || 0) * 1.30,
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
    const recalculated = recalc(newRow);

    setItems(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.tipo === 'producto' && !last.productoId && !last.descripcion.trim()) {
          return [...prev.slice(0, -1), recalculated];
        }
      }
      return [...prev, recalculated];
    });
    toast.success(`Producto agregado: ${prod.nombre}`);
  };

  const updItem = (i: number, k: keyof LineItem, v: number | string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [k]: v } as LineItem;
      // Stock validation for product items when quantity changes
      if (updated.tipo === 'producto' && updated.productoId && k === 'cantidad') {
        const prod = productos.find(p => p.id === updated.productoId);
        if (prod && prod.stock !== undefined && Number(v) > prod.stock) {
          toast.error(`Cantidad excede el stock disponible (${prod.stock})`);
          return item; // keep previous quantity
        }
      }
      return recalc(updated);
    }));
  };

  const addItem = (tipo: LineItem['tipo']) => setItems(p => [...p, newItem(tipo)]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));

  const baseTotal = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;

  // Fixed 5% IVA extracted from total (prices include IVA)
  const ivaRate = 0.05;
  const ivaCalculado = Math.round((baseTotal - baseTotal / (1 + ivaRate)) * 100) / 100;
  const grandTotal = baseTotal; // baseTotal already includes IVA

  const reset = () => {
    setForm(emptyForm);
    setItems([newItem('producto')]);
  };

  const guardar = async () => {
    if (loading) return;
    if (!form.clienteNombre.trim()) { toast.error('Nombre de cliente requerido'); return; }
    if (items.length === 0) { toast.error('Agrega al menos un item'); return; }

    setLoading(true);
    try {
      const dto = {
        clienteNombre: form.clienteNombre,
        clienteDireccion: form.clienteDireccion,
        clienteTelefono: form.clienteTelefono,
        clienteNit: form.clienteNit,

        formaPago: form.formaPago,
        descripcion: form.descripcion,
        notas: form.notas,
        subtotal: baseTotal,
        descuento: 0,
        total: grandTotal,
        validezDias: parseInt(form.validezDias) || 15,
        tiempoInstalacion: form.tiempoInstalacion,
        items: items.map(i => ({
          codigo: i.codigo,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precioVenta,
          subtotal: i.subtotal,
          descuento: i.descuento,
          totalItem: i.total,
        })),
      };

      const isEdit = !!form.id;
      const url = isEdit ? `/api/cotizaciones/${form.id}` : '/api/cotizaciones';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      toast.success(isEdit ? 'Cotización actualizada' : 'Cotización creada exitosamente');
      reset();
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return {
    state: { form, items, loading, productos, zonas, buscarProd, baseTotal, ivaCalculado, grandTotal, isEditMode: !!form.id },
    setters: { setForm, setItems, setBuscarProd, setF },
    actions: { buscarNitCliente, selProducto, addProductoToCotizacion, updItem, addItem, removeItem, guardar },
  };
}
