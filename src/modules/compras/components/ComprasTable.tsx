import React from 'react';
import { Compra } from '../types/compra';
import { fmtDate, fmt } from '@/lib/utils';

interface ComprasTableProps {
  compras: Compra[];
  onView: (c: Compra) => void;
}

export function ComprasTable({ compras, onView }: ComprasTableProps) {
  return (
    <div className="table-card">
      <div className="table-card-inner">
        <table>
          <thead>
            <tr>
              <th>Numero</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Factura</th>
              <th>Registr&oacute;</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#8a887e' }}>
                  No hay compras registradas
                </td>
              </tr>
            ) : (
              compras.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: '#18181b' }}>{c.numero}</td>
                  <td style={{ color: '#52524d' }}>{fmtDate(c.fecha.toString())}</td>
                  <td style={{ fontWeight: 500 }}>{c.proveedor?.nombre || c.proveedorNombre || '-'}</td>
                  <td style={{ color: '#52524d' }}>
                    {c.numeroFactura ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {c.serieFactura && <span style={{ fontSize: 10, background: '#f4f3ef', padding: '2px 4px', borderRadius: 3, border: '1px solid #d8d6cd' }}>{c.serieFactura}</span>}
                        {c.numeroFactura}
                        {c.facturaUrl && (
                          <a href={c.facturaUrl} target="_blank" rel="noreferrer" style={{ color: '#1581E3', marginLeft: 4 }} title="Ver factura">
                            Ver
                          </a>
                        )}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ color: '#8a887e', fontSize: 12 }}>{c.usuarioNombre}</td>
                  <td style={{ fontWeight: 700, color: '#18181b', textAlign: 'right' }}>{fmt(c.total)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => onView(c)} className="btn-ghost btn-sm">
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
