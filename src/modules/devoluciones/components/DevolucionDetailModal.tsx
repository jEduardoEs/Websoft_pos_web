"use client";
import React from 'react';
import { fmt, fmtDate } from '@/lib/utils';
import { Devolucion } from '../types/devolucion';

interface Props {
  devolucion: Devolucion;
  onClose: () => void;
}

export function DevolucionDetailModal({ devolucion, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Detalle de Devolución DEV-{String(devolucion.id).padStart(5, '0')}
            </h2>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              Creada el {fmtDate(devolucion.fecha)} por {devolucion.usuarioNombre || 'Sistema'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>&times;</button>
        </div>

        {/* Info grids */}
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Información de la Venta</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div><span style={{ color: '#94a3b8', fontSize: 12 }}>Factura/Venta:</span> <strong style={{ fontSize: 13 }}>{devolucion.ventaNumero || '—'}</strong></div>
              <div><span style={{ color: '#94a3b8', fontSize: 12 }}>Cliente:</span> <strong style={{ fontSize: 13 }}>{devolucion.venta?.clienteNombre || 'Consumidor Final'}</strong></div>
              <div><span style={{ color: '#94a3b8', fontSize: 12 }}>NIT:</span> <strong style={{ fontSize: 13 }}>{devolucion.venta?.clienteNit || 'CF'}</strong></div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Detalles de Devolución</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Estado:</span>{' '}
                <strong style={{ fontSize: 13, color: devolucion.estado === 'pendiente' ? '#d97706' : devolucion.estado === 'aprobada' ? '#16a34a' : '#dc2626' }}>
                  {devolucion.estado.toUpperCase()}
                </strong>
              </div>
              <div><span style={{ color: '#94a3b8', fontSize: 12 }}>Motivo:</span> <div style={{ fontSize: 13, marginTop: 4, background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0' }}>{devolucion.motivo}</div></div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>PRODUCTOS DEVUELTOS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#64748b' }}>Producto</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: '#64748b' }}>Cant.</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: '#64748b' }}>Precio</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: '#64748b' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {devolucion.items?.map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{item.nombre}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{item.cantidad}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{fmt(item.precioUnitario)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div style={{ padding: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 20px', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total a Devolver</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{fmt(devolucion.totalDevuelto)}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc', borderRadius: '0 0 12px 12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cerrar</button>
          <button onClick={() => import('../utils/pdfGenerators').then(m => m.printDevolucion(devolucion))} style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Imprimir PDF</button>
        </div>
      </div>
    </div>
  );
}
