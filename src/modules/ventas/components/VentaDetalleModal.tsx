import React from 'react';
import { fmt, fmtDateTime } from '@/lib/utils';
import { Venta } from '../types/venta';

interface VentaDetalleModalProps {
  venta: Venta;
  onClose: () => void;
}

export function VentaDetalleModal({ venta, onClose }: VentaDetalleModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Venta {venta.numero}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {fmtDateTime(venta.fecha)} por {venta.usuarioNombre || 'Sistema'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {venta.estado === 'anulada' && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
            ️ Esta venta se encuentra ANULADA
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Datos del Cliente</div>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{venta.clienteNombre}</div>
            <div style={{ color: '#475569', fontSize: 13, marginTop: 2 }}>NIT: {venta.clienteNit}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Datos DTE (FEL)</div>
            {venta.felUuid ? (
              <>
                <div style={{ fontWeight: 600, color: '#166534', fontSize: 13 }}>CERTIFICADA</div>
                <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>Serie: {venta.felSerie} - Num: {venta.felNumero}</div>
                {venta.felPdfUrl && (
                  <a href={venta.felPdfUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                     Descargar PDF FEL
                  </a>
                )}
              </>
            ) : (
              <div style={{ color: '#64748b', fontSize: 13 }}>Documento interno. No certificada.</div>
            )}
          </div>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCTO</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569' }}>CANTIDAD</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRECIO BASE</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>IVA</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(venta.items || []).map((it, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#0f172a' }}>
                    {it.codigo ? <span style={{ color: '#64748b', fontSize: 11, marginRight: 6 }}>[{it.codigo}]</span> : null}
                    {it.nombre}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569', textAlign: 'center' }}>{it.cantidad}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569', textAlign: 'right' }}>{fmt(it.precioUnitario)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 13 }}>
              <span>Subtotal</span><span>{fmt(venta.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', color: '#ef4444', fontSize: 13 }}>
              <span>Descuento</span><span>- {fmt(venta.descuento)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 800, color: '#0f172a', fontSize: 18 }}>
              <span>Total</span><span>{fmt(venta.total)}</span>
            </div>
          </div>
        </div>

        {venta.notas && (
          <div style={{ marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
            <strong>Notas:</strong> {venta.notas}
          </div>
        )}

      </div>
    </div>
  );
}
