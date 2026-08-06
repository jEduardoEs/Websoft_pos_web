'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCotizaciones } from '@/modules/cotizaciones/hooks/use-cotizaciones';
import { CotizacionesTable } from '@/modules/cotizaciones/components/CotizacionesTable';
import { CotizacionFormModal } from '@/modules/cotizaciones/components/CotizacionFormModal';
import { fmt } from '@/lib/utils';
import { Cotizacion } from '@/modules/cotizaciones/types/cotizacion';

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

  // Render Detalle Modal directly here for brevity, or we could extract it to CotizacionDetalleModal.tsx
  const handleFacturar = (c: Cotizacion) => {
    // The previous implementation redirected to pos with cotizacion parameter or opened a modal
    window.location.href = `/pos?cotizacion=${c.id}`;
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Cotizaciones</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Presupuestos, servicios e instalaciones</p>
        </div>
        <button className="btn-primary" onClick={() => setShowFormModal(true)}>+ Nueva Cotización</button>
      </div>

      <CotizacionesTable 
        cotizaciones={cotizaciones}
        loading={loading}
        isAdmin={isAdmin}
        onView={setSelected}
        onAnular={(c) => setPinModal({ id: c.id, estado: 'anulada', numero: c.numero })}
        onEnviar={(c) => setSendModal(c)}
        onFacturar={handleFacturar}
      />

      {showFormModal && (
        <CotizacionFormModal 
          onClose={() => setShowFormModal(false)}
          onSuccess={() => loadCotizaciones()}
        />
      )}

      {/* Ver Detalles Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Detalle de Cotización</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 13, color: '#475569' }}>
              <div><strong>No.:</strong> {selected.numero}</div>
              <div><strong>Cliente:</strong> {selected.clienteNombre} ({selected.clienteNit || 'CF'})</div>
              <div><strong>Teléfono:</strong> {selected.clienteTelefono || '—'}</div>
              <div><strong>Vendedor:</strong> {selected.usuarioNombre || '—'}</div>
              <div><strong>Estado:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{selected.estado}</span></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Cant</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Precio</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items?.map(it => (
                  <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{it.descripcion}</div>
                      {it.codigo && <div style={{ fontSize: 10, color: '#64748b' }}>{it.codigo}</div>}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right' }}>{it.cantidad}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{fmt(it.totalItem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, fontSize: 14 }}>
              <div>Subtotal: <strong>{fmt(selected.subtotal)}</strong></div>
              <div>Descuento: <strong>{fmt(selected.descuento)}</strong></div>
              <div style={{ fontSize: 16 }}>Total: <strong style={{ color: '#1581E3' }}>{fmt(selected.total)}</strong></div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <a href={`/api/cotizaciones/${selected.id}`} target="_blank" className="btn-primary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>️ Imprimir PDF</a>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setSendModal(selected); setSelected(null); }}>️ Enviar Correo</button>
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

      {/* PIN Admin Modal */}
      {pinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 320 }}>
            <h3 style={{ marginTop: 0, fontSize: 16, color: '#dc2626', fontWeight: 700 }}>Confirmar {pinModal.estado}</h3>
            <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>Cotización {pinModal.numero}. Ingresa tu PIN de administrador.</p>
            <input type="password" placeholder="PIN" className="input" value={pin} onChange={e => { setPin(e.target.value); setPinError(''); }} autoFocus onKeyDown={e => e.key === 'Enter' && confirmPin()} style={{ marginBottom: 8, textAlign: 'center', letterSpacing: 4, fontSize: 20 }} />
            {pinError && <div style={{ color: '#dc2626', fontSize: 11, marginBottom: 12, textAlign: 'center' }}>{pinError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPinModal(null)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1, background: '#dc2626', borderColor: '#dc2626' }} onClick={confirmPin} disabled={pinLoading || !pin}>
                {pinLoading ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
