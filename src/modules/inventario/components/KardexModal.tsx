'use client';

import React, { useState, useEffect } from 'react';
import { Producto } from '@/modules/productos/types/producto';
import { useKardex } from '../hooks/use-kardex';
import { AjusteStockDto } from '../dto/ajuste-stock.dto';

interface KardexModalProps {
  producto: Producto | null;
  onClose: () => void;
  onSuccess: () => void; // Triggered when an adjustment is made to refresh parent views
}

export function KardexModal({ producto, onClose, onSuccess }: KardexModalProps) {
  const { kardex, loading, fetchKardex, aplicarAjuste } = useKardex();
  
  const [ajusteTipo, setAjusteTipo] = useState<'entrada' | 'salida'>('entrada');
  const [ajusteCantidad, setAjusteCantidad] = useState('');
  const [ajusteMotivo, setAjusteMotivo] = useState('');

  useEffect(() => {
    if (producto) {
      fetchKardex(Number(producto.id));
    }
  }, [producto]);

  if (!producto) return null;

  const ajustar = async () => {
    if (!ajusteCantidad) return;
    
    const dto: AjusteStockDto = {
      productoId: Number(producto.id),
      tipo: ajusteTipo,
      cantidad: Number(ajusteCantidad),
      motivo: ajusteMotivo
    };

    try {
      await aplicarAjuste(dto);
      setAjusteCantidad('');
      setAjusteMotivo('');
      onSuccess();
    } catch (e) {
      // errors handled by hook
    }
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' };
  const tdS: React.CSSProperties = { padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Kardex — {producto.nombre}</h3>
            {/* We show the latest stock from the hook, or fallback to product stock */}
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Stock actual: <strong style={{ color: '#2563eb' }}>{kardex[0]?.stockDespues ?? producto.stock}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>×</button>
        </div>

        {/* Ajuste manual */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Ajuste manual de stock</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <label style={lbl}>Tipo</label>
              <select className="input" value={ajusteTipo} onChange={e => setAjusteTipo(e.target.value as 'entrada' | 'salida')}>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Cantidad</label>
              <input className="input" type="number" min="1" step="1" value={ajusteCantidad} onChange={e => setAjusteCantidad(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Motivo</label>
              <input className="input" value={ajusteMotivo} onChange={e => setAjusteMotivo(e.target.value)} placeholder="Razón del ajuste..." />
            </div>
            <button className="btn-primary btn-sm" onClick={ajustar} disabled={loading}>Aplicar</button>
          </div>
        </div>

        {/* Historial */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Fecha','Tipo','Cantidad','Antes','Despues','Motivo','Usuario'].map(h => (
              <th key={h} style={thS}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {kardex.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Sin movimientos</td></tr>
            ) : kardex.map(k => (
              <tr key={k.id}>
                <td style={{ ...tdS, fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{k.fecha ? new Date(k.fecha).toLocaleString('es-GT') : ''}</td>
                <td style={tdS}><span className={k.tipo === 'entrada' ? 'badge-green' : k.tipo === 'salida' ? 'badge-red' : 'badge-blue'} style={{ fontSize: 10, textTransform: 'capitalize' }}>{k.tipo}</span></td>
                <td style={{ ...tdS, fontWeight: 700, textAlign: 'center' }}>{k.cantidad}</td>
                <td style={{ ...tdS, color: '#64748b', textAlign: 'center' }}>{k.stockAntes}</td>
                <td style={{ ...tdS, fontWeight: 700, color: '#2563eb', textAlign: 'center' }}>{k.stockDespues}</td>
                <td style={{ ...tdS, color: '#475569', fontSize: 12 }}>{k.motivo || '—'}</td>
                <td style={{ ...tdS, color: '#64748b', fontSize: 11 }}>{k.usuarioNombre || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
