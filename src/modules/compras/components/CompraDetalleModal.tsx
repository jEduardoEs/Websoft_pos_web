import React from 'react';
import { Compra } from '../types/compra';
import { fmt, fmtDate } from '@/lib/utils';

interface CompraDetalleModalProps {
  compra: Compra;
  onClose: () => void;
}

export function CompraDetalleModal({ compra, onClose }: CompraDetalleModalProps) {
  const lblS: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' };
  const valS: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 800, maxHeight: '90vh', overflowY: 'auto', padding: 30, background: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Compra {compra.numero}
            </h2>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              Registrada por <b>{compra.usuarioNombre}</b> el {fmtDate(compra.fecha.toString())}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
          <div>
            <div style={lblS}>Proveedor</div>
            <div style={valS}>{compra.proveedor?.nombre || compra.proveedorNombre || '-'}</div>
          </div>
          <div>
            <div style={lblS}>Factura</div>
            <div style={valS}>
              {compra.numeroFactura ? (
                <>
                  {compra.serieFactura && <span style={{ color: '#64748b', marginRight: 4 }}>{compra.serieFactura}</span>}
                  {compra.numeroFactura}
                  {compra.facturaUrl && (
                    <a href={compra.facturaUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', marginLeft: 8, fontSize: 12 }}>
                      (Ver PDF)
                    </a>
                  )}
                </>
              ) : '-'}
            </div>
          </div>
          <div>
            <div style={lblS}>Estado</div>
            <div style={{ ...valS, color: '#16a34a' }}>{compra.estado.toUpperCase()}</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Productos Adquiridos</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#475569' }}>Producto</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: '#475569' }}>Cantidad</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: '#475569' }}>Precio Unit.</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: '#475569' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {compra.items.map(it => (
                <tr key={it.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{it.nombre}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#0f172a', textAlign: 'right' }}>{it.cantidad}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#64748b', textAlign: 'right' }}>{fmt(it.precioUnitario)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#0f172a', textAlign: 'right', fontWeight: 600 }}>{fmt(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <tr>
                <td colSpan={3} style={{ padding: '12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#475569' }}>Total de la Compra:</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{fmt(compra.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {compra.notas && (
          <div style={{ background: '#fffbeb', padding: 16, borderRadius: 8, border: '1px solid #fcd34d' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 4 }}>NOTAS</div>
            <div style={{ fontSize: 13, color: '#92400e' }}>{compra.notas}</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
