import React, { useState, useRef, useEffect } from 'react';
import { fmt, fmtDate } from '@/lib/utils';
import { Cotizacion } from '../types/cotizacion';

interface CotizacionesTableProps {
  cotizaciones: Cotizacion[];
  loading: boolean;
  isAdmin: boolean;
  onView: (c: Cotizacion) => void;
  onAnular: (c: Cotizacion) => void;
  onEnviar: (c: Cotizacion) => void;
  onFacturar: (c: Cotizacion) => void;
}

export function CotizacionesTable({ cotizaciones, loading, isAdmin, onView, onAnular, onEnviar, onFacturar }: CotizacionesTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const estadoStyle = (est: string) => {
    switch (est) {
      case 'pendiente': return { bg: '#fffbeb', color: '#b45309' };
      case 'aceptada': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'anulada': return { bg: '#fef2f2', color: '#dc2626' };
      case 'facturada': return { bg: '#eff6ff', color: '#2563eb' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div className="card" style={{ overflow: 'visible' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            {['No.', 'Fecha', 'Cliente', 'Total', 'Estado', 'Vence en', ''].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cotizaciones.map(c => {
            const st = estadoStyle(c.estado);
            const menuOpen = openMenuId === c.id;
            
            // Check days left
            const f = new Date(c.createdAt || c.fecha);
            const exp = new Date(f.getTime() + c.validezDias * 24 * 60 * 60 * 1000);
            const hoy = new Date();
            const vencida = c.estado === 'pendiente' && hoy > exp;

            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1581E3' }}>{c.numero}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{fmtDate(c.fecha)}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                  {c.clienteNombre}
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.clienteNit || 'CF'}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(c.total)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, padding: '4px 8px', borderRadius: 20 }}>
                    {c.estado.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: vencida ? '#dc2626' : '#64748b', fontWeight: vencida ? 700 : 500 }}>
                  {c.estado === 'pendiente' ? (vencida ? 'Vencida' : `${c.validezDias} días`) : '—'}
                </td>
                <td style={{ padding: '12px 16px', position: 'relative' }}>
                  <button onClick={() => setOpenMenuId(menuOpen ? null : c.id)} style={{ padding: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>

                  {menuOpen && (
                    <div ref={menuRef} style={{ position: 'absolute', right: 20, top: 40, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 160, padding: 6 }}>
                      <button onClick={() => { onView(c); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}>
                        👀 Ver detalles
                      </button>
                      <button onClick={() => { onEnviar(c); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}>
                        ✉️ Enviar por correo
                      </button>
                      <a href={`/api/cotizaciones/${c.id}`} target="_blank" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, textDecoration: 'none' }}>
                        🖨️ Imprimir PDF
                      </a>
                      
                      {c.estado === 'pendiente' && (
                        <>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                          <button onClick={() => { onFacturar(c); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#16a34a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, fontWeight: 600 }}>
                            🛒 Convertir a Venta
                          </button>
                          {isAdmin && (
                            <button onClick={() => { onAnular(c); setOpenMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#dc2626', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4 }}>
                               Anular
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {cotizaciones.length === 0 && !loading && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No hay cotizaciones registradas</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
