'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCotizaciones } from '@/modules/cotizaciones/hooks/use-cotizaciones';
import { CotizacionesTable } from '@/modules/cotizaciones/components/CotizacionesTable';
import { CotizacionFormModal } from '@/modules/cotizaciones/components/CotizacionFormModal';
import { fmt } from '@/lib/utils';
import { Cotizacion } from '@/modules/cotizaciones/types/cotizacion';
import { toast } from 'sonner';
import { buildTicketHTML, printTicketWindow } from '@/lib/ticket-printer';

export function CotizacionesModule() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const { state, setters, actions } = useCotizaciones();
  
  const { 
    cotizaciones, loading, 
    pinModal, pin, pinLoading, pinError, 
    showFormModal, selected, 
    sendModal, sendEmail, sendLoading 
  } = state;

  const { 
    setPinModal, setPin, setPinError, 
    setShowFormModal, setSelected, 
    setSendModal, setSendEmail 
  } = setters;

  const { loadCotizaciones, confirmPin, enviarPorCorreo } = actions;

  const [formInitial, setFormInitial] = useState<any>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [facturaModal, setFacturaModal] = useState<any>(null);
  const [facturaLoading, setFacturaLoading] = useState(false);

  const handleVerFactura = async (c: Cotizacion) => {
    setFacturaLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${c.id}/factura`);
      const d = await res.json();
      if (d && d.id) {
        setFacturaModal(d);
      } else {
        toast.error(d.error || 'No se encontró la factura correspondiente a esta cotización.');
      }
    } catch {
      toast.error('Error al consultar la factura emitida.');
    } finally {
      setFacturaLoading(false);
    }
  };

  const fetchFullCotizacion = async (c: Cotizacion): Promise<Cotizacion> => {
    if (c.items && c.items.length > 0) return c;
    try {
      const res = await fetch(`/api/cotizaciones/${c.id}`);
      const full = await res.json();
      return full && full.id ? full : c;
    } catch {
      return c;
    }
  };

  const handleFacturar = (c: Cotizacion) => {
    if (c.estado === 'facturada') {
      handleVerFactura(c);
      return;
    }
    window.location.href = `/pos?cotizacion=${c.id}`;
  };

  const handleView = async (c: Cotizacion) => {
    const full = await fetchFullCotizacion(c);
    setSelected(full);
  };

  const handleEdit = async (c: Cotizacion) => {
    const full = await fetchFullCotizacion(c);
    setFormInitial(full);
    setIsDuplicate(false);
    setShowFormModal(true);
  };

  const handleDuplicate = async (c: Cotizacion) => {
    const full = await fetchFullCotizacion(c);
    setFormInitial(full);
    setIsDuplicate(true);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setFormInitial(null);
    setIsDuplicate(false);
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Cotizaciones</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Presupuestos, servicios e instalaciones</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormInitial(null); setIsDuplicate(false); setShowFormModal(true); }}>+ Nueva Cotización</button>
      </div>

      <CotizacionesTable 
        cotizaciones={cotizaciones}
        loading={loading || facturaLoading}
        isAdmin={isAdmin}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onAnular={(c) => setPinModal({ id: c.id, estado: 'anulada', numero: c.numero })}
        onRevertir={(c) => setPinModal({ id: c.id, estado: 'pendiente', numero: c.numero })}
        onEnviar={(c) => setSendModal(c)}
        onFacturar={handleFacturar}
        onVerFactura={handleVerFactura}
      />

      {/* Modal Factura Emitida / Recuperar Factura */}
      {facturaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '90%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Factura Emitida #{facturaModal.numero}
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0 0' }}>
                  Comprobante fiscal / Venta registrada en el sistema
                </p>
              </div>
              <button onClick={() => setFacturaModal(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: '#334155' }}>
              <div><strong>Cliente:</strong> {facturaModal.clienteNombre}</div>
              <div><strong>NIT:</strong> {facturaModal.clienteNit || 'CF'}</div>
              <div><strong>Fecha de Emisión:</strong> {new Date(facturaModal.fecha).toLocaleString('es-GT')}</div>
              <div><strong>Método de Pago:</strong> <span style={{ textTransform: 'capitalize' }}>{facturaModal.metodoPago}</span></div>
              {facturaModal.felSerie && (
                <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 8, borderRadius: 6, color: '#166534', fontSize: 12 }}>
                  <strong>FEL Certificado SAT:</strong> Serie {facturaModal.felSerie} - No. {facturaModal.felNumero}
                  {facturaModal.felUuid && <div style={{ fontSize: 11, wordBreak: 'break-all', opacity: 0.9 }}>UUID: {facturaModal.felUuid}</div>}
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item / Producto</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Cant.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>P/Unit.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(facturaModal.items || []).map((it: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <td style={{ padding: '8px 12px' }}>{it.nombre}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{it.cantidad}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(it.subtotal || (it.cantidad * it.precioUnitario))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 16, marginBottom: 20, fontWeight: 700, color: '#1581E3' }}>
              Total Pagado: Q {facturaModal.total?.toFixed(2)}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {facturaModal.felPdfUrl && (
                <a href={facturaModal.felPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#16a34a', borderColor: '#16a34a' }}>
                  Descargar Factura FEL (PDF)
                </a>
              )}
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                const ticketData = {
                  empresaNombre: 'WebSoft Solutions',
                  empresaNit: 'CF',
                  numero: facturaModal.numero,
                  fecha: facturaModal.fecha,
                  clienteNombre: facturaModal.clienteNombre,
                  clienteNit: facturaModal.clienteNit || 'CF',
                  cajero: facturaModal.usuarioNombre || 'Sistema',
                  subtotal: facturaModal.subtotal || facturaModal.total,
                  descuento: facturaModal.descuento || 0,
                  impuesto: facturaModal.impuesto || 0,
                  total: facturaModal.total,
                  montoRecibido: facturaModal.montoRecibido || facturaModal.total,
                  cambio: facturaModal.cambio || 0,
                  metodoPago: facturaModal.metodoPago || 'efectivo',
                  felSerie: facturaModal.felSerie,
                  felNumero: facturaModal.felNumero,
                  felUuid: facturaModal.felUuid,
                  felCertificacion: facturaModal.felCertificacion,
                  items: (facturaModal.items || []).map((it: any) => ({
                    nombre: it.nombre,
                    cantidad: it.cantidad,
                    precioUnitario: it.precioUnitario,
                    descuento: it.descuento || 0,
                    subtotal: it.subtotal || (it.cantidad * it.precioUnitario),
                  })),
                };
                printTicketWindow(buildTicketHTML(ticketData));
              }}>
                Reimprimir Ticket POS
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setFacturaModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}




      {showFormModal && (
        <CotizacionFormModal 
          onClose={handleCloseFormModal}
          onSuccess={() => loadCotizaciones()}
          cotizacionInitial={formInitial}
          isDuplicate={isDuplicate}
        />
      )}

      {/* Ver Detalles Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Detalle de Cotización {selected.numero}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 13, color: '#475569' }}>
              <div><strong>Cliente:</strong> {selected.clienteNombre}</div>
              <div><strong>NIT:</strong> {selected.clienteNit || 'CF'}</div>
              <div><strong>Teléfono:</strong> {selected.clienteTelefono || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Forma de Pago:</strong> {selected.formaPago || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Descripción / Asunto:</strong> {selected.descripcion || '—'}</div>
              {selected.notas && (
                <div style={{ gridColumn: '1 / -1', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, color: '#1e3a8a' }}>
                  <strong>Anotaciones al Cliente:</strong><br/>
                  {selected.notas}
                </div>
              )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Descripción</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Cant.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Precio U.</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(selected.items || []).map((it: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13 }}>{it.descripcion}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'center' }}>{it.cantidad}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{fmt(it.totalItem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, fontSize: 14, marginBottom: 20 }}>
              <div>Subtotal: <strong>{fmt(selected.subtotal)}</strong></div>
              <div>Descuento: <strong>{fmt(selected.descuento)}</strong></div>
              <div style={{ fontSize: 16 }}>Total: <strong style={{ color: '#1581E3' }}>{fmt(selected.total)}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { handleDuplicate(selected); setSelected(null); }}>
                 Duplicar (Copiar)
              </button>
              {selected.estado === 'pendiente' && (
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { handleEdit(selected); setSelected(null); }}>
                   Editar Cotización
                </button>
              )}
              {selected.estado === 'aceptada' && (
                <button className="btn-secondary" style={{ flex: 1, color: '#d97706', borderColor: '#fcd34d' }} onClick={() => { setPinModal({ id: selected.id, estado: 'pendiente', numero: selected.numero }); setSelected(null); }}>
                  Revertir a Pendiente
                </button>
              )}
              <a href={`/api/cotizaciones/${selected.id}/pdf`} target="_blank" className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                ️ Imprimir PDF
              </a>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setSendModal(selected); setSelected(null); }}>
                ️ Enviar Correo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación / PIN para Anular o Revertir Cotización */}
      {pinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 420, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700, color: pinModal.estado === 'anulada' ? '#dc2626' : '#d97706' }}>
              {pinModal.estado === 'anulada' ? `¿Anular Cotización ${pinModal.numero}?` : `¿Revertir Cotización ${pinModal.numero} a Pendiente?`}
            </h3>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              {pinModal.estado === 'anulada' 
                ? <>Esta acción cambiará el estado de la cotización a <strong style={{ color: '#dc2626' }}>ANULADA</strong>.</>
                : <>Esta acción cambiará el estado de la cotización a <strong style={{ color: '#d97706' }}>PENDIENTE</strong> para permitir modificaciones.</>}
            </p>

            {!isAdmin && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">PIN de Administrador (Requerido)</label>
                <input 
                  className="input" 
                  type="password" 
                  maxLength={6} 
                  placeholder="Ingrese PIN de administrador..." 
                  value={pin} 
                  onChange={e => setPin(e.target.value)} 
                />
              </div>
            )}

            {pinError && (
              <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 12, fontWeight: 600 }}>
                {pinError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setPinModal(null); setPin(''); setPinError(''); }}>
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                style={pinModal.estado === 'anulada' ? { background: '#dc2626', borderColor: '#dc2626' } : { background: '#d97706', borderColor: '#d97706' }} 
                onClick={confirmPin} 
                disabled={pinLoading || (!isAdmin && !pin)}
              >
                {pinLoading ? 'Procesando...' : (pinModal.estado === 'anulada' ? 'Confirmar Anulación' : 'Confirmar Reversión')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enviar Correo Modal */}
      {sendModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400 }}>
            <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 700 }}>Enviar Cotización {sendModal.numero}</h3>
            <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>El PDF se enviará como enlace al cliente.</p>
            <input className="input" type="email" placeholder="correo@cliente.com" value={sendEmail} onChange={e => setSendEmail(e.target.value)} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setSendModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={enviarPorCorreo} disabled={sendLoading || !sendEmail.includes('@')}>
                {sendLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
