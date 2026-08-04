'use client';

import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePos } from '@/modules/pos/hooks/use-pos';
import { PosGrid } from '@/modules/pos/components/PosGrid';
import { PosCart } from '@/modules/pos/components/PosCart';
import { PosCheckoutModal } from '@/modules/pos/components/PosCheckoutModal';
import { buildTicketHTML, printTicketWindow } from '@/lib/ticket-printer';

export default function POSPage() {
  const { state, setters, actions } = usePos();
  
  // Destructuring para más facilidad
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

  // Barcode scanner logic
  const barcodeBuffer = useRef({ val: '', timer: null as any });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const buf = barcodeBuffer.current;
      if (e.key === 'Enter' && buf.val.length > 2) { 
        setBuscar(buf.val); 
        setTab('inventario'); 
        buf.val = ''; 
        return; 
      }
      if (e.key.length === 1) {
        buf.val += e.key;
        clearTimeout(buf.timer);
        buf.timer = setTimeout(() => { buf.val = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setBuscar, setTab]);

  // Math for cart
  const subtotal = cart.reduce((s, x) => s + x.subtotal, 0);
  const descuento = subtotal * (descPct / 100);
  const ivaPct = parseFloat(config?.iva_porcentaje || '5');
  const impuesto = (subtotal - descuento) * (ivaPct / 100);
  const total = subtotal - descuento + impuesto;
  const cambio = Math.max(0, parseFloat(montoRecibido || '0') - total);

  // Funciones específicas que combinan estado y API
  const ejecutarBusquedaNit = async () => {
    if (clienteNit.length < 3 || clienteNit.toUpperCase() === 'CF') return;
    const res = await fetch(`/api/clientes/buscar-nit?nit=${encodeURIComponent(clienteNit)}`);
    const data = await res.json();
    if (data.encontrado) {
      setClienteNombre(data.cliente.nombre);
      setNitStatus('found');
      setClienteId(data.cliente.id);
      const emailGuardado = data.cliente.email || data.cliente.correo || '';
      setClienteCorreo(emailGuardado);
      setClienteTieneCorreo(!!emailGuardado);
      setRegForm({ nombre: data.cliente.nombre, telefono: data.cliente.telefono || '', direccion: data.cliente.direccion || '', correo: emailGuardado });
      toast.success(`Cliente: ${data.cliente.nombre}`);
    } else {
      setNitStatus('notfound'); setClienteId(null); setClienteTieneCorreo(false); setClienteNombre('');
    }
  };

  const registrarCliente = async () => {
    if (!regForm.nombre.trim()) { toast.error('Nombre requerido'); return; }
    const body = clienteId
      ? { id: clienteId, nombre: regForm.nombre, nit: clienteNit, telefono: regForm.telefono, direccion: regForm.direccion, email: regForm.correo }
      : { nombre: regForm.nombre, nit: clienteNit, telefono: regForm.telefono, direccion: regForm.direccion, email: regForm.correo };
    
    const res = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.ok) {
      setClienteNombre(regForm.nombre);
      if (regForm.correo) setClienteCorreo(regForm.correo);
      setClienteTieneCorreo(!!regForm.correo);
      setNitStatus('found');
      setShowRegCliente(false);
      toast.success(clienteId ? 'Cliente actualizado' : 'Cliente registrado');
    } else {
      toast.error(data.error || 'Error al guardar');
    }
  };

  const validarDescuento = async () => {
    if (!codigoDesc.trim()) return;
    const res = await fetch('/api/descuentos/validar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: codigoDesc, total: subtotal }) });
    const data = await res.json();
    if (data.ok) { 
      setDescPct(data.porcentaje); 
      toast.success(`Descuento ${data.porcentaje}% aplicado`); 
    } else {
      toast.error(data.error || 'Código inválido');
    }
  };

  const cobrar = async () => {
    if (cart.length === 0) { toast.error('Carrito vacío'); return; }
    if (metodoPago === 'efectivo' && parseFloat(montoRecibido || '0') < total) { toast.error('Monto insuficiente'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: clienteNombre || 'Consumidor Final',
          clienteNit: clienteNit || 'CF',
          clienteCorreo,
          cotizacionId,
          items: cart, subtotal, descuento, impuesto, total,
          metodoPago, montoRecibido: parseFloat(montoRecibido || '0'), cambio,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setLastVenta(data.venta);
        setLastFel(data.fel);
        setShowCobro(true);
        if (data.fel?.ok && !data.fel?.sandbox) toast.success(`Venta ${data.venta.numero} — DTE certificado`);
        else if (data.fel?.ok && data.fel?.sandbox) toast.success(`Venta ${data.venta.numero} — FEL sandbox`);
        else if (data.fel && !data.fel.ok) toast.warning(`Venta registrada, pero FEL falló: ${data.fel.error}`);
        else toast.success(`Venta ${data.venta.numero}`);
        
        if (data.email?.ok) toast.success(`Factura enviada a ${clienteCorreo}`);
        
        loadProductos();
        
        // Print ticket automatically
        setTimeout(() => {
          if (!config || !data.venta) return;
          const v = data.venta;
          const f = data.fel;
          const html = buildTicketHTML({
            empresaNombre: config.empresa_nombre, empresaNit: config.empresa_nit,
            empresaDireccion: config.empresa_direccion, empresaTelefono: config.empresa_telefono,
            empresaLogoUrl: 'https://websoftsolutions.com.gt/logo.png',
            mostrarLogo: config.ticket_mostrar_logo !== 'false',
            ticketMensaje: config.ticket_mensaje,
            numero: v.numero, fecha: v.fecha,
            clienteNombre: v.clienteNombre, clienteNit: v.clienteNit,
            cajero: v.usuarioNombre || 'Cajero',
            felUuid: f?.uuid, felSerie: f?.serie, felNumero: f?.numero,
            felCertificacion: f?.fechaCertificacion, isSandbox: f?.sandbox,
            items: (v.items || []).map((it: any) => ({ nombre: it.nombre, cantidad: it.cantidad, precioUnitario: it.precioUnitario, descuento: it.descuento || 0, subtotal: it.subtotal })),
            subtotal: v.subtotal, descuento: v.descuento, impuesto: v.impuesto,
            total: v.total, metodoPago: v.metodoPago, montoRecibido: v.montoRecibido, cambio: v.cambio, ivaPct,
          });
          printTicketWindow(html);
        }, 400);
      } else {
        toast.error(data.error || 'Error');
      }
    } catch { 
      toast.error('Error de conexión'); 
    }
    setLoading(false);
  };

  const printTicket = () => {
    if (!lastVenta || !config) return;
    const html = buildTicketHTML({
      empresaNombre: config.empresa_nombre,
      empresaNit: config.empresa_nit,
      empresaDireccion: config.empresa_direccion,
      empresaTelefono: config.empresa_telefono,
      empresaLogoUrl: 'https://websoftsolutions.com.gt/logo.png',
      mostrarLogo: config.ticket_mostrar_logo !== 'false',
      ticketMensaje: config.ticket_mensaje,
      numero: lastVenta.numero,
      fecha: lastVenta.fecha,
      clienteNombre: lastVenta.clienteNombre,
      clienteNit: lastVenta.clienteNit,
      cajero: lastVenta.usuarioNombre || 'Cajero',
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

  const cargarCotizacion = (cot: any) => {
    if (cot.items?.length === 0) { toast.error('Cotización sin items'); return; }
    const nuevos: any[] = cot.items.map((it: any) => ({
      tipo: 'libre' as const, productoId: null, codigo: it.codigo || '', nombre: it.descripcion,
      cantidad: it.cantidad, precioUnitario: it.precioUnitario, stock: 99999, descuento: it.descuento || 0, subtotal: it.totalItem,
    }));
    setCart(nuevos);
    setClienteNombre(cot.clienteNombre);
    setClienteNit(cot.clienteNit || 'CF');
    setTab('inventario');
    toast.success(`Cotización ${cot.numero} cargada`);
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
        nitStatus={nitStatus} ejecutarBusquedaNit={ejecutarBusquedaNit}
        setShowRegCliente={setShowRegCliente} clienteTieneCorreo={clienteTieneCorreo}
        subtotal={subtotal} descuento={descuento} impuesto={impuesto} total={total}
        descPct={descPct} codigoDesc={codigoDesc} setCodigoDesc={setCodigoDesc}
        validarDescuento={validarDescuento}
        setShowCobro={setShowCobro}
      />

      <PosCheckoutModal 
        showCobro={showCobro} setShowCobro={setShowCobro}
        lastVenta={lastVenta} loading={loading}
        cobrar={cobrar} resetPos={resetPos} printTicket={printTicket}
        metodoPago={metodoPago} setMetodoPago={setMetodoPago}
        montoRecibido={montoRecibido} setMontoRecibido={setMontoRecibido}
        total={total}
      />

      {/* Modal de Registro de Cliente (Simple) */}
      {showRegCliente && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>{clienteId ? 'Actualizar' : 'Registrar'} Cliente</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 11, fontWeight: 700 }}>NIT</label><input className="input" value={clienteNit} disabled style={{ background: '#f8fafc' }} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 700 }}>Nombre *</label><input className="input" value={regForm.nombre} onChange={e => setRegForm({ ...regForm, nombre: e.target.value })} autoFocus /></div>
              <div><label style={{ fontSize: 11, fontWeight: 700 }}>Teléfono</label><input className="input" value={regForm.telefono} onChange={e => setRegForm({ ...regForm, telefono: e.target.value })} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 700 }}>Correo (FEL)</label><input className="input" type="email" value={regForm.correo} onChange={e => setRegForm({ ...regForm, correo: e.target.value })} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 700 }}>Dirección</label><input className="input" value={regForm.direccion} onChange={e => setRegForm({ ...regForm, direccion: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowRegCliente(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={registrarCliente} className="btn-primary" style={{ flex: 1 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
