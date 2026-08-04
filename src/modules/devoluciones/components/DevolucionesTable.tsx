"use client";
import React from 'react';
import { fmt, fmtDate } from '@/lib/utils';
import { Devolucion } from '../types/devolucion';

interface DevolucionesTableProps {
  devoluciones: Devolucion[];
  loading: boolean;
  isAdmin: boolean;
  onView: (d: Devolucion) => void;
  onAprobar: (id: number) => void;
  onAnular: (id: number) => void;
}

export function DevolucionesTable({ devoluciones, loading, isAdmin, onView, onAprobar, onAnular }: DevolucionesTableProps) {
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const estadoStyle = (e: string) => {
    switch (e) {
      case 'pendiente': return { bg: '#fffbeb', color: '#b45309' };
      case 'aprobada': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'anulada': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div className="card" style={{ overflow: 'visible' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            {['No.', 'Fecha', 'Cliente', 'Total', 'Estado', ''].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {devoluciones.map(d => {
            const st = estadoStyle(d.estado);
            const menuOpen = openMenuId === d.id;
            return (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1581E3' }}>{d.numero}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{fmtDate(d.fecha)}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                  {d.clienteNombre}
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{d.clienteNit || 'CF'}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(d.total)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, padding: '4px 8px', borderRadius: 20 }}>
                    {d.estado.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', position: 'relative' }}>
                  <button onClick={() => setOpenMenuId(menuOpen ? null : d.id)} style={{ padding: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>
                  {menuOpen && (
                    <div ref={menuRef} style={{ position: 'absolute', right: 20, top: 40, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 160, padding: 6 }}>
                      <button onClick={() => { onView(d); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}>
                        👀 Ver detalle
                      </button>
                      <a href={`/api/devoluciones/${d.id}`} target="_blank" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, textDecoration: 'none' }}>
                        🖨️ Imprimir PDF
                      </a>
                      {isAdmin && d.estado === 'pendiente' && (
                        <>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                          <button onClick={() => { onAprobar(d.id); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#16a34a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}>
                            ✅ Aprobar
                          </button>
                          <button onClick={() => { onAnular(d.id); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#dc2626', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}>
                            ❌ Anular
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {devoluciones.length === 0 && !loading && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No hay devoluciones registradas</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
