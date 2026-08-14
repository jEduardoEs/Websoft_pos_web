import React, { useState } from 'react';
type Garantia = any;
import { fmtDate, diasRestantes } from '../utils/garantia-calc.helper';

interface GarantiaReclamoModalProps {
  garantiasHook: any;
  garantia: Garantia;
  onClose: () => void;
  onSuccess: () => void;
}

const MOTIVOS = [
  'Defecto de fábrica (no enciende / no funciona)',
  'Falla de componente interno',
  'Problema de software / firmware',
  'Daño físico previo a la entrega',
  'Accesorios incompletos o defectuosos',
  'Otro motivo de garantía',
];

export function GarantiaReclamoModal({ garantiasHook, garantia, onClose, onSuccess }: GarantiaReclamoModalProps) {
  const { crearReclamo, printTicketReclamo, loading } = garantiasHook;

  const [reclamoForm, setReclamoForm] = useState({
    motivoReclamo: '',
    descripcionFalla: '',
    clienteNit: garantia.clienteNit || 'CF',
    clienteDpi: '',
    clienteTelefono: garantia.clienteTelefono || '',
    tieneFactura: true,
    numeroFactura: garantia.ventaNumero || '',
    notas: '',
  });

  const setRF = (k: string, v: any) => setReclamoForm(p => ({ ...p, [k]: v }));

  const saveReclamo = async () => {
    if (!reclamoForm.motivoReclamo || !reclamoForm.descripcionFalla) {
      alert('Completa el motivo y la descripción del defecto');
      return;
    }
    try {
      const created = await crearReclamo({
        garantiaId: garantia.id,
        motivoReclamo: reclamoForm.motivoReclamo,
        descripcionFalla: reclamoForm.descripcionFalla,
        clienteNit: reclamoForm.clienteNit,
        clienteDpi: reclamoForm.clienteDpi,
        clienteTelefono: reclamoForm.clienteTelefono,
        tieneFactura: reclamoForm.tieneFactura,
        numeroFactura: reclamoForm.numeroFactura,
        notas: reclamoForm.notas,
      });

      if (created) {
        if (confirm('Reclamo registrado. ¿Imprimir comprobante de recepción?')) {
          printTicketReclamo(created, garantia);
        }
      }
      onSuccess();
    } catch (e: any) {
      alert(e.message || 'Error al guardar reclamo');
    }
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #dc2626' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>Reclamo de Garantía</h3>
            <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>{garantiasHook.numero} · {garantia.clienteNombre} · {garantia.productoNombre}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>&times;</button>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <span> Vence: <strong>{fmtDate(garantia.fechaVencimiento)}</strong></span>
            <span> {diasRestantes(garantia)} días restantes</span>
            <span> Serie: <strong>{garantia.productoSerie || '—'}</strong></span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>NIT del cliente</label>
            <input className="input" value={reclamoForm.clienteNit} onChange={e => setRF('clienteNit', e.target.value)} placeholder="CF" />
          </div>
          <div>
            <label style={lbl}>DPI del cliente</label>
            <input className="input" value={reclamoForm.clienteDpi} onChange={e => setRF('clienteDpi', e.target.value)} placeholder="Número de DPI" />
          </div>
          <div>
            <label style={lbl}>Teléfono</label>
            <input className="input" value={reclamoForm.clienteTelefono} onChange={e => setRF('clienteTelefono', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>¿Presenta factura original?</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" checked={reclamoForm.tieneFactura} onChange={() => setRF('tieneFactura', true)} /> Sí
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" checked={!reclamoForm.tieneFactura} onChange={() => setRF('tieneFactura', false)} /> No
              </label>
            </div>
          </div>
          {reclamoForm.tieneFactura && (
            <div>
              <label style={lbl}>Número de factura</label>
              <input className="input" value={reclamoForm.numeroFactura} onChange={e => setRF('numeroFactura', e.target.value)} />
            </div>
          )}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Motivo del reclamo *</label>
            <select className="input" value={reclamoForm.motivoReclamo} onChange={e => setRF('motivoReclamo', e.target.value)}>
              <option value="">Seleccionar motivo...</option>
              {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Descripción detallada del defecto *</label>
            <textarea className="input" rows={3} value={reclamoForm.descripcionFalla} onChange={e => setRF('descripcionFalla', e.target.value)} placeholder="Describe con detalle el problema que presenta el producto..." />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Notas internas</label>
            <input className="input" value={reclamoForm.notas} onChange={e => setRF('notas', e.target.value)} placeholder="Observaciones del técnico al recibir el equipo" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button onClick={saveReclamo} disabled={loading}
            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Registrando...' : 'Registrar Reclamo e Imprimir'}
          </button>
        </div>
      </div>
    </div>
  );
}
