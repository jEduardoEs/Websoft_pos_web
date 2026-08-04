import React from 'react';
import { fmt, fmtDateTime } from '@/lib/utils';
import { Venta } from '../types/venta';

interface VentasTableProps {
  ventas: Venta[];
  onView: (venta: Venta) => void;
  onAnular: (id: number) => void;
}

export function VentasTable({ ventas, onView, onAnular }: VentasTableProps) {
  if (ventas.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
        No hay ventas en este período.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Documento</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Cliente</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Estado FEL</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(v => (
            <tr key={v.id} style={{ borderBottom: '1px solid #e2e8f0', background: v.estado === 'anulada' ? '#fff1f2' : '#fff', transition: 'background .2s' }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{v.numero}</div>
                {v.felSerie && <div style={{ fontSize: 11, color: '#64748b' }}>Serie: {v.felSerie} - {v.felNumero}</div>}
              </td>
              <td style={{ padding: '12px 16px', color: '#475569', fontSize: 13 }}>
                {fmtDateTime(v.fecha)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 500, color: '#0f172a' }}>{v.clienteNombre}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>NIT: {v.clienteNit}</div>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                {fmt(v.total)}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                {v.estado === 'anulada' ? (
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: '#fecdd3', color: '#be123c', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>ANULADA</span>
                ) : v.felEstado === 'certificado' ? (
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>DTE FEL</span>
                ) : v.felEstado === 'sandbox' ? (
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: '#fef08a', color: '#854d0e', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>PRUEBAS</span>
                ) : (
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>LOCAL</span>
                )}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <button onClick={() => onView(v)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 13, marginRight: 12 }}>
                  Ver Detalle
                </button>
                {v.estado !== 'anulada' && (
                  <button 
                    onClick={() => {
                      if(window.confirm('¿Seguro que deseas anular esta venta? Esto no devuelve el stock ni anula el DTE en la SAT automáticamente.')) {
                        onAnular(v.id);
                      }
                    }} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                  >
                    Anular
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
