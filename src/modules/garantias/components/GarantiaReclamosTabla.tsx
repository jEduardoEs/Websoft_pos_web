import React from 'react';
import { fmtDate } from '../utils/garantia-calc.helper';

interface GarantiaReclamosTablaProps {
  buscar: string;
  reclamosFiltrados: any[];
  onSetBuscar: (val: string) => void;
  onResolverReclamo: (r: any, decision: string, resolucion: string) => void;
}

export function GarantiaReclamosTabla({
  buscar,
  reclamosFiltrados,
  onSetBuscar,
  onResolverReclamo,
}: GarantiaReclamosTablaProps) {
  const estadoReclamoBadge: any = { recibido: 'badge-blue', en_revision: 'badge-orange', aprobado: 'badge-green', rechazado: 'badge-red', resuelto: 'badge-gray' };
  const thS = { background: '#f4f3ef', fontSize: 11, fontWeight: 700 as const, color: '#8a887e', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1.5px solid #d8d6cd' };
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #e3e1d8' };

  return (
    <>
      <div className="card" style={{ padding: 14 }}>
        <input className="input" placeholder="Buscar reclamo por cliente, garantía, motivo, número..." value={buscar} onChange={e => onSetBuscar(e.target.value)} style={{ width: '100%' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ ...thS, width: 110 }}>No. Reclamo</th>
                <th style={{ ...thS, width: 100 }}>Fecha</th>
                <th style={{ ...thS, width: 110 }}>Garantía</th>
                <th style={{ ...thS, width: 170 }}>Cliente</th>
                <th style={{ ...thS, minWidth: 180 }}>Motivo</th>
                <th style={{ ...thS, width: 110 }}>Decisión</th>
                <th style={{ ...thS, width: 100 }}>Estado</th>
                <th style={{ ...thS, width: 230, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reclamosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#8a887e', fontSize: 13 }}>
                    Sin reclamos registrados
                  </td>
                </tr>
              ) : (
                reclamosFiltrados.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color .15s' }}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>{r.numero}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(r.fecha)}</td>
                    <td style={{ ...tdS, color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.garantiaNumero}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: '#18181b', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clienteNombre}</td>
                    <td style={{ ...tdS, color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.motivoReclamo}</td>
                    <td style={tdS}>
                      {r.decision ? (
                        <span className="badge-blue" style={{ textTransform: 'capitalize' }}>
                          {r.decision}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>Pendiente</span>
                      )}
                    </td>
                    <td style={tdS}>
                      <span className={estadoReclamoBadge[r.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>
                        {r.estado}
                      </span>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right' }}>
                      {r.estado === 'recibido' ? (
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => onResolverReclamo(r, 'reparar', 'En reparación')}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Reparar
                          </button>
                          <button
                            onClick={() => onResolverReclamo(r, 'reemplazar', 'Producto reemplazado')}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Reemplazar
                          </button>
                          <button
                            onClick={() => onResolverReclamo(r, 'rechazar', 'No cubre garantía')}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : r.ordenTrabajoId ? (
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>OT #{r.ordenTrabajoId}</span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
