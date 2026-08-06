import React from 'react';
import { fmt, fmtDateTime } from '@/lib/utils';
import { Venta } from '../types/venta';

interface VentasTableProps {
  ventas: Venta[];
  onView: (venta: Venta) => void;
  onAnular: (id: number) => void;
}

export function VentasTable({ ventas, onView, onAnular }: VentasTableProps) {
  return (
    <div className="table-card">
      <div className="table-card-inner">
        <table>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'center' }}>Estado FEL</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#8a887e' }}>
                  No hay ventas en este periodo.
                </td>
              </tr>
            ) : (
              ventas.map(v => (
                <tr key={v.id} style={{ background: v.estado === 'anulada' ? '#fef2f2' : undefined }}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#18181b' }}>{v.numero}</div>
                    {v.felSerie && <div style={{ fontSize: 11, color: '#8a887e' }}>Serie: {v.felSerie} - {v.felNumero}</div>}
                  </td>
                  <td style={{ color: '#52524d', fontSize: 13 }}>{fmtDateTime(v.fecha)}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#18181b' }}>{v.clienteNombre}</div>
                    <div style={{ fontSize: 11, color: '#8a887e' }}>NIT: {v.clienteNit}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(v.total)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {v.estado === 'anulada' ? (
                      <span className="badge-red">Anulada</span>
                    ) : v.felEstado === 'certificado' ? (
                      <span className="badge-green">DTE FEL</span>
                    ) : v.felEstado === 'sandbox' ? (
                      <span className="badge-orange">Pruebas</span>
                    ) : (
                      <span className="badge-gray">Local</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => onView(v)} className="btn-ghost btn-sm">
                        Ver Detalle
                      </button>
                      {v.estado !== 'anulada' && (
                        <button
                          onClick={() => {
                            if (window.confirm('¿Seguro que deseas anular esta venta? Esto no devuelve el stock ni anula el DTE en la SAT automáticamente.')) {
                              onAnular(v.id);
                            }
                          }}
                          className="btn-ghost btn-sm"
                          style={{ color: '#b13a2e', borderColor: '#e3c3bd', background: '#f8eeec' }}
                        >
                          Anular
                        </button>
                      )}
                    </div>
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
