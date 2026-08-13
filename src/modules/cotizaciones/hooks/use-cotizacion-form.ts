import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
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
  clienteNit: 'CF', clienteCorreo: '', atencion: '',
  formaPago: 'Efectivo, Transferencia, Deposito, Cheque Preautorizado',
  descripcion: '', notas: '', validezDias: '15', tiempoInstalacion: '',
};

export function useCotizacionForm(onSuccess: () => void, cotizacionInitial?: any, isDuplicate: boolean = false) {
  const { data: session } = useSession();
  const userName = session?.user?.name || '';

  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<LineItem[]>([newItem('producto')]);
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [buscarProd, setBuscarProd] = useState('');
  const lastNitRef = useRef<string>('');

  // Sync logged in user into atencion field for new quotations
  useEffect(() => {
    if (!cotizacionInitial && userName && !form.atencion) {
      setForm(p => ({ ...p, atencion: userName }));
    }
  }, [userName, cotizacionInitial]);

  useEffect(() => {
    if (cotizacionInitial) {
      setForm({
        id: isDuplicate ? null : cotizacionInitial.id,
        clienteNombre: cotizacionInitial.clienteNombre || '',
        clienteDireccion: cotizacionInitial.clienteDireccion || '',
        clienteTelefono: cotizacionInitial.clienteTelefono || '',
        clienteNit: cotizacionInitial.clienteNit || 'CF',
        clienteCorreo: cotizacionInitial.clienteCorreo || '',
        atencion: cotizacionInitial.atencion || userName,

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
        // Form initialized for duplication
      }
    }
  }, [cotizacionInitial, isDuplicate, userName]);

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
    const cleanNit = (nit || '').trim();
    setF('clienteNit', cleanNit);
    if (cleanNit.length < 3 || cleanNit.toUpperCase() === 'CF') return;
    if (lastNitRef.current === cleanNit && form.clienteNombre) return;
    try {
      const res = await fetch(`/api/clientes/buscar-nit?nit=${encodeURIComponent(cleanNit)}`);
      const data = await res.json();
      if (data.encontrado && data.cliente) {
        lastNitRef.current = cleanNit;
        setForm(p => ({
          ...p,
          clienteNombre: data.cliente.nombre,
          clienteTelefono: data.cliente.telefono || p.clienteTelefono,
          clienteDireccion: data.cliente.direccion || p.clienteDireccion,
          clienteCorreo: data.cliente.email || p.clienteCorreo,
          clienteNit: data.cliente.nit || cleanNit,
        }));
      }
    } catch { /* ignore */ }
  };

  const selClienteRegistrado = (cliente: any) => {
    if (!cliente) return;
    setForm(p => ({
      ...p,
      clienteNombre: cliente.nombre || p.clienteNombre,
      clienteNit: cliente.nit || 'CF',
      clienteTelefono: cliente.telefono || p.clienteTelefono,
      clienteDireccion: cliente.direccion || p.clienteDireccion,
      clienteCorreo: cliente.email || p.clienteCorreo,
    }));
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
        precioVenta: prod.precio,
      };
      return recalc(updated);
    }));
  };

  const addProductoToCotizacion = (prod: any) => {
    const nuevo: LineItem = recalc({
      tipo: 'producto',
      productoId: prod.id,
      codigo: prod.codigo || '',
      descripcion: prod.nombre,
      costoCompra: prod.costo,
      precioVenta: prod.precio,
      cantidad: 1,
      descuento: 0,
      subtotal: 0,
      total: 0,
      zonaId: null,
      zonaNombre: '',
      zonaTarifa: 0,
      cargoAdicional: 0,
      notaAdicional: '',
    });
    setItems(prev => [...prev, nuevo]);
    toast.success(`Agregado: ${prod.nombre}`);
  };

  const updItem = (i: number, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      let updated = { ...item, [field]: value };

      if (field === 'zonaId') {
        const z = zonas.find(zn => zn.id === Number(value));
        if (z) {
          updated.zonaNombre = z.nombre;
          updated.zonaTarifa = z.tarifa;
        } else {
          updated.zonaNombre = '';
          updated.zonaTarifa = 0;
        }
      }

      return recalc(updated);
    }));
  };

  const addItem = (tipo: LineItem['tipo']) => setItems(prev => [...prev, newItem(tipo)]);
  const removeItem = (i: number) => {
    if (items.length <= 1) return toast.warning('La cotización debe tener al menos una línea');
    setItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    setForm({ ...emptyForm, atencion: userName });
    setItems([newItem('producto')]);
  };

  const baseTotal = items.reduce((s, i) => s + (i.total || 0), 0);
  const ivaCalculado = Math.round(baseTotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((baseTotal + ivaCalculado) * 100) / 100;

  const guardar = async () => {
    if (!form.clienteNombre.trim()) return toast.error('El nombre del cliente es obligatorio');
    if (items.length === 0) return toast.error('Agrega al menos una línea a la cotización');

    for (const item of items) {
      if (!item.descripcion.trim()) return toast.error('Todas las líneas deben tener una descripción');
      if (item.cantidad <= 0) return toast.error('La cantidad debe ser mayor a 0');
    }

    setLoading(true);
    try {
      const dto = {
        clienteNombre: form.clienteNombre.trim(),
        clienteDireccion: form.clienteDireccion.trim() || undefined,
        clienteTelefono: form.clienteTelefono.trim() || undefined,
        clienteNit: form.clienteNit.trim() || 'CF',
        clienteCorreo: form.clienteCorreo.trim() || undefined,
        atencion: form.atencion.trim() || userName || undefined,
        formaPago: form.formaPago.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        notas: form.notas.trim() || undefined,
        validezDias: parseInt(form.validezDias) || 15,
        tiempoInstalacion: form.tiempoInstalacion.trim() || undefined,
        items: items.map(i => ({
          productoId: i.productoId || undefined,
          codigo: i.codigo || undefined,
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la cotización');

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
    actions: { buscarNitCliente, selClienteRegistrado, selProducto, addProductoToCotizacion, updItem, addItem, removeItem, guardar },
  };
}
