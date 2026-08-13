'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePos } from '@/modules/pos/hooks/use-pos';
import { PosGrid } from '@/modules/pos/components/PosGrid';
import { PosCart } from '@/modules/pos/components/PosCart';
import { PosCheckoutModal } from '@/modules/pos/components/PosCheckoutModal';
import { ClienteFormModal } from '@/modules/clientes/components/ClienteFormModal';
import { buildTicketHTML, printTicketWindow } from '@/lib/ticket-printer';

export function PosModule() {
  const { state, setters, actions } = usePos();
  const [descMontoExacto, setDescMontoExacto] = useState<number | null>(null);
  
  const {
    productos, cotizaciones, cart, buscar, buscarCot, config,
    clienteNombre, clienteNit, clienteCorreo, clienteId, clienteTieneCorreo, nitStatus,
    metodoPago, montoRecibido, descPct, codigoDesc,
    loading, showCobro, showRegCliente, lastVenta, lastFel, tab, cotizacionId,
    regForm, libreForm, searchRef
  } = state;

  const {
    setBuscar, setBuscarCot,
    setClienteNombre, setClienteNit, setClienteCorreo, setClienteId, setClienteTieneCorreo, setNitStatus,
    setMetodoPago, setMontoRecibido, setDescPct, setCodigoDesc,
    setLoading, setShowCobro, setShowRegCliente, setLastVenta, setLastFel, setTab, setCotizacionId,
    setRegForm, setLibreForm, setCart
  } = setters;

  const {
    loadProductos, loadCotizaciones, loadConfig,
    addInventario, addLibre, removeItem, changeQty, changePrice, resetPos, clearCart
  } = actions;

  // Carga inicial
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { if (tab === 'cotizacion') loadCotizaciones(); }, [tab, loadCotizaciones]);

  // Limpiar descuentos automáticamente cuando el carrito está vacío
  useEffect(() => {
    if (cart.length === 0) {
      setDescMontoExacto(null);
      setDescPct(0);
      setCodigoDesc('');
    }
  }, [cart.length, setDescPct, setCodigoDesc]);


  const cargarCotizacion = async (cot: any) => {
    if (!cot) return;
    let items = cot.items;
    if ((!items || items.length === 0) && cot.id) {
      try {
        const fullCot = await fetch(`/api/cotizaciones/${cot.id}`).then(r => r.json());
        if (fullCot && fullCot.items) {
          items = fullCot.items;
        }
      } catch (err) {
        console.error('Error al obtener items de cotizacion:', err);
      }
    }

    if (!items || items.length === 0) {
      toast.error('Cotización sin items');
      return;
    }

    const nuevos: any[] = items.map((it: any) => {
      const match = productos.find(p => p.id === it.productoId || (p.codigo && it.codigo && p.codigo.trim().toUpperCase() === it.codigo.trim().toUpperCase()));
      const realStock = match ? match.stock : 99999;
      const cant = Math.max(1, Math.round(Number(it.cantidad) || 1));
      const itemNombre = it.descripcion || it.nombre || 'Item sin nombre';

      if (match && realStock < cant) {
        toast.warning(`Atención: '${itemNombre}' solo posee ${realStock} unidades en inventario`);
      }

      return {
        tipo: match ? ('inventario' as const) : ('libre' as const),
        productoId: match ? match.id : (it.productoId || null),
        codigo: it.codigo || (match ? match.codigo || '' : ''),
        nombre: itemNombre,
        cantidad: cant,
        precioUnitario: Number(it.precioUnitario) || 0,
        stock: realStock,
        descuento: Number(it.descuento) || 0,
        subtotal: Number(it.totalItem || it.subtotal || (Number(it.precioUnitario || 0) * cant)) || 0,
      };
    });
    setCart(nuevos);
    setClienteNombre(cot.clienteNombre || 'Consumidor Final');
    setClienteNit(cot.clienteNit || 'CF');
    setCotizacionId(cot.id);
    setTab('inventario');
    
    // Si la cotización ya trae un descuento explícito en monto
    if (cot.descuento && Number(cot.descuento) > 0) {
      setDescMontoExacto(Number(cot.descuento));
    } else {
      setDescMontoExacto(null);
    }
  };

  // Carga automática desde parámetro de URL (Ej: /pos?cotizacion=46)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cotId = params.get('cotizacion') || params.get('cotizacionId');
    if (cotId) {
      fetch(`/api/cotizaciones/${cotId}`)
        .then(res => res.json())
        .then(cot => {
          if (cot && cot.id) {
            cargarCotizacion(cot);
            window.history.replaceState({}, '', '/pos');
          }
        })
        .catch(() => {});
    }
  }, []);

  const subtotalCart = Math.round(cart.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;
  const descuentoCart = descMontoExacto !== null 
    ? Math.min(subtotalCart, descMontoExacto)
    : Math.round((subtotalCart * (descPct / 100)) * 100) / 100;
  const totalCart = Math.round(Math.max(0, subtotalCart - descuentoCart) * 100) / 100;

  const validarDescuento = async () => {
    if (!codigoDesc.trim()) {
      toast.error('Ingresa un código de cupón');
      return;
    }
    try {
      const res = await fetch('/api/descuentos/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoDesc.trim(), total: subtotalCart }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.montoDescuento !== undefined && data.descuento?.tipo === 'fijo') {
          setDescMontoExacto(Number(data.montoDescuento));
          setDescPct(data.porcentaje || 0);
          toast.success(`Cupón "${codigoDesc.toUpperCase()}" aplicado (-Q ${Number(data.montoDescuento).toFixed(2)})`);
        } else {
          setDescMontoExacto(null);
          setDescPct(data.porcentaje || 0);
          toast.success(`Cupón "${codigoDesc.toUpperCase()}" aplicado (${data.porcentaje}% de descuento)`);
        }
      } else {
        setDescMontoExacto(null);
        setDescPct(0);
        toast.error(data.error || 'Cupón no válido');
      }
    } catch {
      toast.error('Error de conexión al validar el cupón');
    }
  };

  const handleAbrirCobro = () => {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito primero');
      return;
    }
    setMontoRecibido(String(totalCart.toFixed(2)));
    setShowCobro(true);
  };

  const handleProcesarVenta = async () => {
    if (loading) return;
    const recNum = parseFloat(montoRecibido) || 0;
    if (metodoPago === 'efectivo' && recNum < totalCart) {
      toast.error('El monto recibido es menor al total');
      return;
    }

    setLoading(true);
    try {
      const itemsPayload = cart.map(i => ({
        productoId: i.productoId,
        nombre: i.nombre,
        codigo: i.codigo,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        descuento: i.descuento,
        subtotal: i.subtotal,
      }));

      const finalNit = (clienteNit || '').trim().toUpperCase() || 'CF';
      const finalNombre = (clienteNombre || '').trim() || (finalNit === 'CF' ? 'Consumidor Final' : 'Cliente Particular');

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: finalNombre,
          clienteNit: finalNit,
          clienteCorreo: (clienteCorreo || '').trim() || undefined,
          items: itemsPayload,
          subtotal: subtotalCart,
          descuento: descuentoCart,
          metodoPago,
          montoRecibido: recNum,
          cotizacionId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al procesar la venta');
      }

      toast.success(`Venta ${data.venta.numero} realizada con éxito`);
      setLastVenta(data.venta);
      setLastFel(data.fel || null);
      setShowCobro(false);
      setDescMontoExacto(null);
      resetPos();
      loadProductos();
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirUltimoTicket = () => {
    if (!lastVenta) return;
    const ivaPct = parseFloat(config?.iva_porcentaje || '5');
    const html = buildTicketHTML({
      empresaNombre: config?.empresa_nombre || '',
      empresaNit: config?.empresa_nit || '',
      empresaDireccion: config?.empresa_direccion || '',
      empresaTelefono: config?.empresa_telefono || '',
      cajero: lastVenta.usuarioNombre || 'Cajero',
      numero: lastVenta.numero,
      fecha: lastVenta.createdAt,
      clienteNombre: lastVenta.clienteNombre,
      clienteNit: lastVenta.clienteNit,
      felUuid: lastFel?.uuid,
      felSerie: lastFel?.serie,
      felNumero: lastFel?.numero,
      felCertificacion: lastFel?.fechaCertificacion,
      isSandbox: lastFel?.sandbox,
      items: (lastVenta.items || []).map((it: any) => ({
        nombre: it.nombre, cantidad: it.cantidad, precioUnitario: it.precioUnitario, descuento: it.descuento || 0, subtotal: it.subtotal
      })),
      subtotal: lastVenta.subtotal, descuento: lastVenta.descuento, impuesto: lastVenta.impuesto,
      total: lastVenta.total, metodoPago: lastVenta.metodoPago, montoRecibido: lastVenta.montoRecibido, cambio: lastVenta.cambio, ivaPct,
    });
    printTicketWindow(html);
  };

  // Search client by NIT and set related state
  const buscarClienteNit = async () => {
    const cleanNit = (clienteNit || '').trim().toUpperCase();
    if (!cleanNit || cleanNit === '' || cleanNit === 'CF') {
      setNitStatus('idle');
      setClienteNombre('Consumidor Final');
      setClienteNit('CF');
      setClienteCorreo('');
      setClienteId(null);
      setClienteTieneCorreo(false);
      setRegForm({ nombre: '', nit: 'CF', telefono: '', direccion: '', correo: '' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/clientes/buscar-nit?nit=${encodeURIComponent(cleanNit)}`);
      const data = await res.json();
      if (data.encontrado && data.cliente) {
        setClienteNombre(data.cliente.nombre);
        setClienteNit(data.cliente.nit || cleanNit);
        setClienteId(data.cliente.id);
        setClienteCorreo(data.cliente.email || '');
        setClienteTieneCorreo(!!data.cliente.email);
        setNitStatus('found');
      } else {
        // Reset previous client data completely so old client details do not stick!
        setNitStatus('notfound');
        setClienteId(null);
        setClienteCorreo('');
        setClienteTieneCorreo(false);
        setClienteNombre('');
        setRegForm({
          nombre: '',
          nit: cleanNit,
          telefono: '',
          direccion: '',
          correo: '',
        });
        toast.error('NIT no encontrado. Haz clic en "+ Crear" para registrarlo.');
      }
    } catch {
      setNitStatus('notfound');
      setClienteId(null);
      setClienteCorreo('');
      setClienteTieneCorreo(false);
      setClienteNombre('');
      setRegForm({
        nombre: '',
        nit: cleanNit,
        telefono: '',
        direccion: '',
        correo: '',
      });
      toast.error('Error al buscar cliente por NIT');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarCliente = async () => {
    if (!regForm.nombre.trim()) {
      toast.error('Nombre del cliente requerido');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: regForm.nombre.trim(),
          nit: regForm.nit || clienteNit || 'CF',
          telefono: regForm.telefono || undefined,
          email: regForm.correo || undefined,
          direccion: regForm.direccion || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.cliente) {
        setClienteNombre(data.cliente.nombre);
        setClienteNit(data.cliente.nit || 'CF');
        setClienteCorreo(data.cliente.email || '');
        setClienteId(data.cliente.id);
        setClienteTieneCorreo(!!data.cliente.email);
        setNitStatus('found');
        setShowRegCliente(false);
        toast.success('Cliente registrado y seleccionado');
      } else {
        toast.error(data.error || 'Error al registrar cliente');
      }
    } catch {
      toast.error('Error de conexión al registrar cliente');
    } finally {
      setLoading(false);
    }
  };

  const felActivo = config?.fel_activo === 'true';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      
      <PosGrid 
        tab={tab} setTab={setTab} felActivo={felActivo}
        buscar={buscar} setBuscar={setBuscar} searchRef={searchRef}
        productos={productos} addInventario={addInventario}
        buscarCot={buscarCot} setBuscarCot={setBuscarCot}
        cotizaciones={cotizaciones} cargarCotizacion={cargarCotizacion}
        libreForm={libreForm} setLibreForm={setLibreForm} addLibre={addLibre}
      />

      <PosCart 
        cart={cart} changeQty={changeQty} changePrice={changePrice} removeItem={removeItem} clearCart={clearCart}
        clienteNit={clienteNit} setClienteNit={setClienteNit}
        clienteNombre={clienteNombre} setClienteNombre={setClienteNombre}
        setClienteId={setClienteId}
        setClienteCorreo={setClienteCorreo}
        setNitStatus={setNitStatus}
        nitStatus={nitStatus}
        ejecutarBusquedaNit={buscarClienteNit}
        setShowRegCliente={setShowRegCliente}
        setRegForm={setRegForm}
        clienteTieneCorreo={clienteTieneCorreo}
        subtotal={subtotalCart}
        descuento={descuentoCart}
        impuesto={0}
        total={totalCart}
        descPct={descPct}
        codigoDesc={codigoDesc} setCodigoDesc={setCodigoDesc}
        validarDescuento={validarDescuento}
        setShowCobro={handleAbrirCobro}
      />

      {showCobro && (
        <PosCheckoutModal 
          showCobro={showCobro}
          setShowCobro={setShowCobro}
          lastVenta={lastVenta}
          loading={loading}
          cobrar={handleProcesarVenta}
          resetPos={resetPos}
          printTicket={handleImprimirUltimoTicket}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          montoRecibido={montoRecibido}
          setMontoRecibido={setMontoRecibido}
          total={totalCart}
        />
      )}

      {showRegCliente && (
        <ClienteFormModal
          form={{
            nombre: regForm.nombre || '',
            nit: regForm.nit || (clienteNit !== 'CF' ? clienteNit : ''),
            telefono: regForm.telefono || '',
            email: regForm.correo || '',
            direccion: regForm.direccion || '',
          }}
          setForm={(f: any) => {
            const next = typeof f === 'function' ? f(regForm) : f;
            setRegForm({
              nombre: next.nombre || '',
              nit: next.nit || '',
              telefono: next.telefono || '',
              correo: next.email || '',
              direccion: next.direccion || '',
            });
          }}
          onSave={handleRegistrarCliente}
          onClose={() => setShowRegCliente(false)}
          loading={loading}
        />
      )}


      {/* Modal de éxito de venta y ticket */}
      {lastVenta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#16a34a', fontSize: 18, fontWeight: 700 }}>Venta Realizada</h3>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>Comprobante No: <strong>{lastVenta.numero}</strong></p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setLastVenta(null)}>Cerrar</button>
              <button className="btn-primary" onClick={handleImprimirUltimoTicket}>Imprimir Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
