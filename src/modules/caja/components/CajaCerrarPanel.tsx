import React, { useState } from 'react';
import { CajaResumen } from '../types/caja';
import { fmt } from '@/lib/utils';

interface CajaCerrarPanelProps {
  data: CajaResumen;
  loading: boolean;
  onCerrarCaja: (efectivoContado: number, tarjetaBaucher: number, transferenciaContada: number, notas: string) => void;
  cierreResult: any;
}

export function CajaCerrarPanel({ data, loading, onCerrarCaja, cierreResult }: CajaCerrarPanelProps) {
  const [efectivoContado, setEfectivoContado] = useState('');
  const [tarjetaBaucher, setTarjetaBaucher] = useState('');
  const [transferenciaContada, setTransferenciaContada] = useState('');
  const [notasCierre, setNotasCierre] = useState('');

  const handleCerrar = () => {
    if (!efectivoContado) return;
    if (!confirm('¿Confirmar cierre de caja?')) return;
    onCerrarCaja(
      parseFloat(efectivoContado),
      parseFloat(tarjetaBaucher || '0'),
      parseFloat(transferenciaContada || '0'),
      notasCierre
    );
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };

  const contado = parseFloat(efectivoContado || '0');
  const baucher = parseFloat(tarjetaBaucher || '0');
  const transf = parseFloat(transferenciaContada || '0');
  const difEfectivo = contado - data.debeHaber;
  const difTarjeta = baucher - data.ventasTarjeta;
  const difTransferencia = transf - data.ventasTransferencia;

  const DifBadge = ({ dif, label }: { dif: number; label: string }) => (
    <div style={{ padding: '6px 10px', borderRadius: 8, background: dif === 0 ? '#f0fdf4' : dif > 0 ? '#eff6ff' : '#fef2f2', border: `1px solid ${dif === 0 ? '#bbf7d0' : dif > 0 ? '#bfdbfe' : '#fecaca'}`, marginTop: 4 }}>
      <div style={{ fontSize: 11, color: dif === 0 ? '#16a34a' : dif > 0 ? '#2563eb' : '#dc2626', fontWeight: 700 }}>
        {label}: {dif === 0 ? ' Cuadrado' : dif > 0 ? `+${fmt(dif)} sobrante` : `${fmt(dif)} FALTANTE`}
      </div>
    </div>
  );

  if (cierreResult) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 50, marginBottom: 10 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Caja Cerrada Exitosamente</h2>
        <p style={{ color: '#64748b', fontSize: 15, marginBottom: 20 }}>El turno ha finalizado y el arqueo fue guardado.</p>
        <div style={{ display: 'inline-block', textAlign: 'left', background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', minWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 }}>
            <span style={{ color: '#64748b' }}>Efectivo esperado:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(cierreResult.debeHaber)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 15 }}>
            <span style={{ color: '#64748b' }}>Efectivo contado:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(cierreResult.contado)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px dashed #cbd5e1', fontSize: 16 }}>
            <span style={{ color: '#64748b', fontWeight: 700 }}>Diferencia:</span>
            <span style={{ fontWeight: 800, color: cierreResult.diferencia === 0 ? '#16a34a' : cierreResult.diferencia > 0 ? '#2563eb' : '#dc2626' }}>
              {cierreResult.diferencia === 0 ? 'Exacto' : fmt(cierreResult.diferencia)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Arqueo de Caja</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Ingresa el dinero físico y comprobantes que tienes físicamente.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Efectivo físico contado (Billetes y monedas)</label>
            <input className="input" type="number" min="0" step="0.01" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} placeholder="0.00" />
            {efectivoContado !== '' && <DifBadge dif={difEfectivo} label="Efectivo" />}
          </div>
          <div>
            <label style={lbl}>Total en bauchers de tarjeta (POS)</label>
            <input className="input" type="number" min="0" step="0.01" value={tarjetaBaucher} onChange={e => setTarjetaBaucher(e.target.value)} placeholder="0.00" />
            {tarjetaBaucher !== '' && <DifBadge dif={difTarjeta} label="Tarjeta" />}
          </div>
          <div>
            <label style={lbl}>Total en capturas de transferencia</label>
            <input className="input" type="number" min="0" step="0.01" value={transferenciaContada} onChange={e => setTransferenciaContada(e.target.value)} placeholder="0.00" />
            {transferenciaContada !== '' && <DifBadge dif={difTransferencia} label="Transf." />}
          </div>
          <div>
            <label style={lbl}>Notas de cierre (opcional)</label>
            <textarea className="input" value={notasCierre} onChange={e => setNotasCierre(e.target.value)} rows={3} placeholder="Observaciones, faltantes justificados, etc." />
          </div>
          <button className="btn-primary" onClick={handleCerrar} disabled={loading || !efectivoContado} style={{ padding: 14, fontSize: 15, marginTop: 10 }}>
            Confirmar Cierre de Turno
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 24, background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Resumen Esperado por Sistema</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>Efectivo</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(data.debeHaber)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>Tarjeta (POS)</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(data.ventasTarjeta)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#475569', fontSize: 13, fontWeight: 600 }}>Transferencias</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(data.ventasTransferencia)}</span>
          </div>
          <div style={{ marginTop: 20, padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>Información</div>
            <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.5 }}>
              Al cerrar la caja, todos los movimientos y ventas del turno quedarán consolidados en un reporte de cierre.
              Asegúrate de que los bauchers coincidan con lo reportado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
