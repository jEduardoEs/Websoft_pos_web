import React from 'react';
import { Compra } from '../types/compra';
import { fmtDate, fmt } from '@/lib/utils';

interface ComprasTableProps {
  compras: Compra[];
  onView: (c: Compra) => void;
}

export function ComprasTable({ compras, onView }: ComprasTableProps) {
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' };

  return (
    <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thS}>Número</th>
            <th style={thS}>Fecha</th>
            <th style={thS}>Proveedor</th>
            <th style={thS}>Factura</th>
            <th style={thS}>Registró</th>
            <th style={{ ...thS, textAlign: 'right' }}>Total</th>
            <th style={thS}></th>
          </tr>
        </thead>
        <tbody>
          {compras.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                No hay compras registradas
              </td>
            </tr>
          )}
          {compras.map(c => (
            <tr key={c.id}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0f172a' }}>{c.numero}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{fmtDate(c.fecha.toString())}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 500 }}>
                {c.proveedor?.nombre || c.proveedorNombre || '-'}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                {c.numeroFactura ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {c.serieFactura && <span style={{ fontSize: 10, background: '#e2e8f0', padding: '2px 4px', borderRadius: 4 }}>{c.serieFactura}</span>}
                    {c.numeroFactura}
                    {c.facturaUrl && (
                      <a href={c.facturaUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', marginLeft: 4 }} title="Ver factura">
                        
                      </a>
                    )}
                  </span>
                ) : '-'}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 12 }}>{c.usuarioNombre}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>
                {fmt(c.total)}
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                <button onClick={() => onView(c)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>
                  Ver Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
