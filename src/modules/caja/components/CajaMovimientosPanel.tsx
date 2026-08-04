import React, { useState } from 'react';
import { CajaResumen } from '../types/caja';

interface CajaMovimientosPanelProps {
  data: CajaResumen;
  loading: boolean;
  onRegistrarMovimiento: (tipo: 'inyeccion' | 'retiro', monto: number, motivo: string) => void;
}

export function CajaMovimientosPanel({ data, loading, onRegistrarMovimiento }: CajaMovimientosPanelProps) {
  const [montoMov, setMontoMov] = useState('');
  const [motivoMov, setMotivoMov] = useState('');

  const handleMovimiento = (tipo: 'inyeccion' | 'retiro') => {
    if (!montoMov || parseFloat(montoMov) <= 0) return;
    onRegistrarMovimiento(tipo, parseFloat(montoMov), motivoMov);
    setMontoMov('');
    setMotivoMov('');
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#2563eb', marginBottom: 4 }}>↓ Inyección de capital</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Agrega efectivo a la caja (cambio extra, fondo adicional)</div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Monto (Q)</label>
            <input className="input" type="number" min="0" step="0.01" value={montoMov} onChange={e => setMontoMov(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Motivo</label>
            <input className="input" value={motivoMov} onChange={e => setMotivoMov(e.target.value)} placeholder="Ej: Fondo de cambio adicional" />
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleMovimiento('inyeccion')} disabled={loading}>Registrar Inyección</button>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #d97706' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#d97706', marginBottom: 4 }}>↑ Retiro a bodega</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Saca efectivo para guardar en bodega o depositar al banco</div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Monto (Q)</label>
            <input className="input" type="number" min="0" step="0.01" value={montoMov} onChange={e => setMontoMov(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Motivo</label>
            <input className="input" value={motivoMov} onChange={e => setMotivoMov(e.target.value)} placeholder="Ej: Deposito bancario del dia" />
          </div>
          <button className="btn-warning" style={{ width: '100%' }} onClick={() => handleMovimiento('retiro')} disabled={loading}>Registrar Retiro</button>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
          Movimientos del turno ({data.movimientos.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Hora', 'Tipo', 'Monto', 'Motivo', 'Usuario'].map(h => (
                <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.movimientos.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin movimientos en este turno</td></tr>
                : data.movimientos.map((m: any) => (
                  <tr key={m.id}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(m.fecha).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <span className={m.tipo === 'inyeccion' ? 'badge-blue' : 'badge-orange'} style={{ fontSize: 10, textTransform: 'capitalize' }}>{m.tipo}</span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>Q{m.monto.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: 13 }}>{m.motivo || '—'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 12 }}>{m.usuarioNombre || '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
