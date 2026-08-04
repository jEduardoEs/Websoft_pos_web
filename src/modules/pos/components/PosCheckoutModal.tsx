import React from 'react';
import { fmt } from '@/lib/utils';

interface PosCheckoutModalProps {
  showCobro: boolean;
  setShowCobro: (b: boolean) => void;
  lastVenta: any;
  loading: boolean;
  cobrar: () => void;
  resetPos: () => void;
  printTicket: () => void;
  
  metodoPago: string;
  setMetodoPago: (m: string) => void;
  montoRecibido: string;
  setMontoRecibido: (m: string) => void;
  
  total: number;
}

export function PosCheckoutModal({
  showCobro, setShowCobro, lastVenta, loading, cobrar, resetPos, printTicket,
  metodoPago, setMetodoPago, montoRecibido, setMontoRecibido, total
}: PosCheckoutModalProps) {
  if (!showCobro) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        {lastVenta ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Venta Completada</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Documento: {lastVenta.numero}</p>
            
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Total Cobrado</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#16a34a' }}>{fmt(lastVenta.total)}</div>
              {lastVenta.metodoPago === 'efectivo' && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
                  <span>Cambio / Vuelto:</span>
                  <span style={{ color: '#2563eb' }}>{fmt(lastVenta.cambio)}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={printTicket} className="btn-secondary" style={{ padding: 12, fontWeight: 700 }}>🖨️ Re-Imprimir</button>
              <button onClick={resetPos} className="btn-primary" style={{ padding: 12, fontWeight: 700 }}>Nueva Venta</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Completar Pago</h2>
              <button onClick={() => setShowCobro(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total a Pagar</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>{fmt(total)}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Método de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => setMetodoPago('efectivo')} style={{ padding: '12px 16px', borderRadius: 8, border: metodoPago === 'efectivo' ? '2px solid #2563eb' : '1px solid #e2e8f0', background: metodoPago === 'efectivo' ? '#eff6ff' : '#fff', color: metodoPago === 'efectivo' ? '#1e40af' : '#475569', fontWeight: 700, cursor: 'pointer' }}>Efectivo</button>
                <button onClick={() => setMetodoPago('tarjeta')} style={{ padding: '12px 16px', borderRadius: 8, border: metodoPago === 'tarjeta' ? '2px solid #2563eb' : '1px solid #e2e8f0', background: metodoPago === 'tarjeta' ? '#eff6ff' : '#fff', color: metodoPago === 'tarjeta' ? '#1e40af' : '#475569', fontWeight: 700, cursor: 'pointer' }}>Tarjeta / POS</button>
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Monto Recibido</label>
                <input 
                  type="number" 
                  className="input" 
                  autoFocus
                  style={{ fontSize: 24, padding: '12px 16px', textAlign: 'center', fontWeight: 700, height: 54 }}
                  placeholder="0.00" 
                  value={montoRecibido} 
                  onChange={e => setMontoRecibido(e.target.value)} 
                />
                
                {/* Botones de sugerencia rápida */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => setMontoRecibido(total.toString())} className="btn-secondary" style={{ flex: 1, padding: 8, fontSize: 12 }}>Exacto</button>
                  <button onClick={() => setMontoRecibido((Math.ceil(total / 50) * 50).toString())} className="btn-secondary" style={{ flex: 1, padding: 8, fontSize: 12 }}>Q{Math.ceil(total / 50) * 50}</button>
                  <button onClick={() => setMontoRecibido((Math.ceil(total / 100) * 100).toString())} className="btn-secondary" style={{ flex: 1, padding: 8, fontSize: 12 }}>Q{Math.ceil(total / 100) * 100}</button>
                </div>

                {parseFloat(montoRecibido || '0') >= total && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 8, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Cambio a dar</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>{fmt(parseFloat(montoRecibido || '0') - total)}</span>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={cobrar} 
              disabled={loading || (metodoPago === 'efectivo' && parseFloat(montoRecibido || '0') < total)}
              className="btn-primary" 
              style={{ width: '100%', height: 50, fontSize: 16, fontWeight: 800 }}
            >
              {loading ? 'Procesando...' : `Confirmar Cobro ${fmt(total)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
