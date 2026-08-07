'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePos } from '@/modules/pos/hooks/use-pos';
import { PosGrid } from '@/modules/pos/components/PosGrid';
import { PosCart } from '@/modules/pos/components/PosCart';
import { PosCheckoutModal } from '@/modules/pos/components/PosCheckoutModal';
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
    addInventario, addLibre, removeItem, changeQty, changePrice, resetPos
  } = actions;

  // Carga inicial
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => { if (tab === 'cotizacion') loadCotizaciones(); }, [tab, loadCotizaciones]);

  const cargarCotizacion = (cot: any) => {
    if (!cot || !cot.items || cot.items.length === 0) { toast.error('Cotización sin items'); return; }
    const nuevos: any[] = cot.items.map((it: any) => ({
      tipo: 'libre' as const, productoId: null, codigo: it.codigo || '', nombre: it.descripcion,
      cantidad: Math.max(1, Math.round(Number(it.cantidad) || 1)),
      precioUnitario: Number(it.precioUnitario) || 0,
      stock: 99999,
      descuento: Number(it.descuento) || 0,
      subtotal: Number(it.totalItem) || 0,
    }));
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
    
    toast.success(`Cotización ${cot.numero} cargada automáticamente`);
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

      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: clienteNombre.trim() || 'Consumidor Final',
          clienteNit: clienteNit.trim() || 'CF',
          clienteCorreo: clienteCorreo.trim() || undefined,
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
        cart={cart} changeQty={changeQty} changePrice={changePrice} removeItem={removeItem}
        clienteNit={clienteNit} setClienteNit={setClienteNit}
        clienteNombre={clienteNombre} setClienteNombre={setClienteNombre}
        nitStatus={nitStatus}
        ejecutarBusquedaNit={() => {}}
        setShowRegCliente={setShowRegCliente}
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

      {/* Modal de éxito de venta y ticket */}
      {lastVenta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#16a34a', fontSize: 18, fontWeight: 700 }}>Venta Realizada</h3>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>Comprobante No: <strong>{lastVenta.numero}</strong></p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setLastVenta(null)}>Cerrar</button>
              <button className="btn-primary" onClick={handleImprimirUltimoTicket}>️ Imprimir Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
