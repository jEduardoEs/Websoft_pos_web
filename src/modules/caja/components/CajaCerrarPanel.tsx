import React, { useState } from 'react';
import { CajaResumen } from '../types/caja';
import { fmt } from '@/lib/utils';

interface CajaCerrarPanelProps {
  data: CajaResumen;
  loading: boolean;
  onCerrarCaja: (efectivoContado: number, tarjetaBaucher: number, transferenciaContada: number, notas: string) => void;
  cierreResult: any;
}

export function CajaCerrarPanel({ data, loading, onCerrarCaja, cierreResult, onDismissCierreResult }: CajaCerrarPanelProps & { onDismissCierreResult?: () => void }) {
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
  const difEfectivo = data ? contado - data.debeHaber : 0;
  const difTarjeta = data ? baucher - data.ventasTarjeta : 0;
  const difTransferencia = data ? transf - data.ventasTransferencia : 0;

  const DifBadge = ({ dif, label }: { dif: number; label: string }) => (
    <div style={{ padding: '6px 10px', borderRadius: 8, background: dif === 0 ? '#f0fdf4' : dif > 0 ? '#eff6ff' : '#fef2f2', border: `1px solid ${dif === 0 ? '#bbf7d0' : dif > 0 ? '#bfdbfe' : '#fecaca'}`, marginTop: 4 }}>
      <div style={{ fontSize: 11, color: dif === 0 ? '#16a34a' : dif > 0 ? '#2563eb' : '#dc2626', fontWeight: 700 }}>
        {label}: {dif === 0 ? ' Cuadrado' : dif > 0 ? `+${fmt(dif)} sobrante` : `${fmt(dif)} FALTANTE`}
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 24, borderTop: '3px solid #dc2626' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>Cierre de Caja</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>Cuenta el dinero físicamente y registra el cierre del turno.</div>

          {/* Resumen esperado */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 8, fontSize: 13 }}>Resumen del turno</div>
            {[
              [`Ventas (${data?.numVentas || 0} transacciones)`, fmt(data?.totalVentas || 0)],
              ['Ventas en efectivo', fmt(data?.ventasEfectivo || 0)],
              ['Ventas con tarjeta', fmt(data?.ventasTarjeta || 0)],
              ['Ventas por transferencia', fmt(data?.ventasTransferencia || 0)],
              ['Inyecciones de capital', fmt(data?.totalInyecciones || 0)],
              ['Retiros a bodega', fmt(-(data?.totalRetiros || 0))],
            ].map(([l, v]) => (
              <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                <span>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 6, color: '#2563eb' }}>
              <span>Debe haber en caja</span><span>{fmt(data?.debeHaber || 0)}</span>
            </div>
          </div>

          {/* Efectivo */}
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Efectivo contado físicamente (Q)</label>
            <input className="input" type="number" min="0" step="0.01" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} placeholder="Cuenta los billetes y monedas" style={{ fontSize: 15, fontWeight: 700 }} />
            {efectivoContado !== '' && <DifBadge dif={difEfectivo} label="Efectivo" />}
          </div>

          {/* Tarjeta baucher */}
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Total bauchers de tarjeta (Q)</label>
            <input className="input" type="number" min="0" step="0.01" value={tarjetaBaucher} onChange={e => setTarjetaBaucher(e.target.value)} placeholder={`POS registro: ${fmt(data?.ventasTarjeta || 0)}`} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>POS registro: <strong>{fmt(data?.ventasTarjeta || 0)}</strong></div>
            {tarjetaBaucher !== '' && <DifBadge dif={difTarjeta} label="Tarjeta" />}
          </div>

          {/* Transferencia */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Transferencias verificadas (Q)</label>
            <input className="input" type="number" min="0" step="0.01" value={transferenciaContada} onChange={e => setTransferenciaContada(e.target.value)} placeholder={`POS registro: ${fmt(data?.ventasTransferencia || 0)}`} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>POS registro: <strong>{fmt(data?.ventasTransferencia || 0)}</strong></div>
            {transferenciaContada !== '' && <DifBadge dif={difTransferencia} label="Transferencia" />}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Notas del cierre</label>
            <textarea className="input" rows={2} value={notasCierre} onChange={e => setNotasCierre(e.target.value)} placeholder="Irregularidades, observaciones..." />
          </div>

          <button className="btn-danger" style={{ width: '100%', padding: 13, fontSize: 15 }} onClick={handleCerrar} disabled={loading || !efectivoContado}>
            {loading ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
          </button>
        </div>

        {/* Right panel - movimientos resumen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Ventas del turno por método</div>
            {[
              { label: 'Efectivo', sistema: data?.ventasEfectivo || 0, contado: contado !== 0 ? contado : null },
              { label: 'Tarjeta', sistema: data?.ventasTarjeta || 0, contado: baucher !== 0 ? baucher : null },
              { label: 'Transferencia', sistema: data?.ventasTransferencia || 0, contado: transf !== 0 ? transf : null },
            ].map(r => (
              <div key={r.label} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>Sistema: {fmt(r.sistema)}</span>
                </div>
                {r.contado !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Contado:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.contado - r.sistema === 0 ? '#16a34a' : r.contado - r.sistema > 0 ? '#2563eb' : '#dc2626' }}>
                      {fmt(r.contado)} {r.contado - r.sistema !== 0 ? `(${r.contado - r.sistema > 0 ? '+' : ''}${fmt(r.contado - r.sistema)})` : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RESULTADO CIERRE POPUP MODAL ─── */}
      {cierreResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', color: '#0f172a', marginBottom: 20 }}>Resumen de Cierre</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              {[
                ['Ventas del turno', fmt(cierreResult.totalVentas || cierreResult.resumen?.totalVentas || 0)],
                ['Efectivo — Sistema', fmt(cierreResult.debeHaber ?? cierreResult.resumen?.debeHaber ?? 0)],
                ['Efectivo — Contado', fmt(cierreResult.contado ?? cierreResult.resumen?.contado ?? 0)],
                ['Diferencia efectivo', fmt(cierreResult.diferencia ?? cierreResult.resumen?.diferencia ?? 0)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#475569' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: l.includes('Diferencia') ? ((cierreResult.diferencia ?? cierreResult.resumen?.diferencia ?? 0) === 0 ? '#16a34a' : (cierreResult.diferencia ?? cierreResult.resumen?.diferencia ?? 0) > 0 ? '#2563eb' : '#dc2626') : '#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: (cierreResult.diferencia ?? cierreResult.resumen?.diferencia ?? 0) === 0 ? '#16a34a' : (cierreResult.diferencia ?? cierreResult.resumen?.diferencia ?? 0) > 0 ? '#2563eb' : '#dc2626', marginBottom: 20 }}>
              {(cierreResult.diferencia ?? cierreResult.resumen?.diferencia ?? 0) === 0 ? 'Caja cuadrada' : (cierreResult.diferencia ?? cierreResult.resumen?.diferencia ?? 0) > 0 ? `Sobrante: ${fmt(cierreResult.diferencia ?? cierreResult.resumen?.diferencia)}` : `Faltante: ${fmt(Math.abs(cierreResult.diferencia ?? cierreResult.resumen?.diferencia))}`}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => onDismissCierreResult && onDismissCierreResult()}>Listo</button>
          </div>
        </div>
      )}
    </>
  );
}
