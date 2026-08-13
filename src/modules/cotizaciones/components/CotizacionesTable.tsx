import React, { useState, useRef, useEffect } from 'react';
import { fmt, fmtDate } from '@/lib/utils';
import { Cotizacion } from '../types/cotizacion';


interface CotizacionesTableProps {
  cotizaciones: Cotizacion[];
  loading: boolean;
  isAdmin: boolean;
  onView: (c: Cotizacion) => void;
  onEdit?: (c: Cotizacion) => void;
  onDuplicate?: (c: Cotizacion) => void;
  onAnular: (c: Cotizacion) => void;
  onRevertir?: (c: Cotizacion) => void;
  onEnviar: (c: Cotizacion) => void;
  onFacturar: (c: Cotizacion) => void;
}

export function CotizacionesTable({ 
  cotizaciones, loading, isAdmin, onView, onEdit, onDuplicate, onAnular, onRevertir, onEnviar, onFacturar 
}: CotizacionesTableProps) {
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

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando cotizaciones...</div>;
  }

  if (cotizaciones.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 16 }}>No se encontraron cotizaciones</div>;
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 16, overflow: 'visible' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 16px' }}>Número</th>
            <th style={{ padding: '12px 16px' }}>Cliente</th>
            <th style={{ padding: '12px 16px' }}>Fecha</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
            <th style={{ padding: '12px 16px' }}>Vencimiento</th>
            <th style={{ padding: '12px 16px', width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {cotizaciones.map((c) => {
            const menuOpen = openMenuId === c.id;
            const vencida = new Date(c.createdAt).getTime() + (c.validezDias * 86400000) < Date.now();

            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1581E3' }}>
                  {c.numero}
                </td>
                <td style={{ padding: '12px 16px' }}>

                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.clienteNombre}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>NIT: {c.clienteNit || 'CF'}</div>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {fmtDate(c.createdAt)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                  {fmt(c.total)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ 
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                    background: c.estado === 'facturada' ? '#dcfce7' : c.estado === 'aceptada' ? '#dbeafe' : c.estado === 'anulada' ? '#fee2e2' : '#fef3c7',
                    color: c.estado === 'facturada' ? '#15803d' : c.estado === 'aceptada' ? '#1d4ed8' : c.estado === 'anulada' ? '#b91c1c' : '#b45309'
                  }}>
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
                    <div ref={menuRef} style={{ position: 'absolute', right: 20, top: 40, background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 175, padding: 6 }}>
                      <button onClick={() => { onView(c); setOpenMenuId(null); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f4f3ef')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        Ver detalles
                      </button>
                      
                      {c.estado === 'pendiente' && onEdit && (
                        <button onClick={() => { onEdit(c); setOpenMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0284c7', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, fontWeight: 600, transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#e0f2fe')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          Editar cotización
                        </button>
                      )}

                      {onDuplicate && (
                        <button onClick={() => { onDuplicate(c); setOpenMenuId(null); }}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#2563eb', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, fontWeight: 600, transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          Duplicar (Copiar)
                        </button>
                      )}

                      <button onClick={() => { onEnviar(c); setOpenMenuId(null); }}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f4f3ef')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        Enviar por correo
                      </button>
                      <a href={`/api/cotizaciones/${c.id}/pdf`} target="_blank"
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#0f172a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, textDecoration: 'none', transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f4f3ef')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        Imprimir PDF
                      </a>
                      
                      {c.estado === 'aceptada' && onRevertir && (
                        <>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                          <button onClick={() => { onRevertir(c); setOpenMenuId(null); }}
                            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#d97706', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, fontWeight: 600, transition: 'background .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#fef3c7')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            Revertir a Pendiente
                          </button>
                        </>
                      )}

                      {c.estado === 'pendiente' && (
                        <>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                          <button onClick={() => { onFacturar(c); setOpenMenuId(null); }}
                            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#16a34a', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, fontWeight: 600, transition: 'background .15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            Convertir a Venta
                          </button>
                          {isAdmin && (
                            <button onClick={() => { onAnular(c); setOpenMenuId(null); }}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, color: '#b13a2e', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, transition: 'background .15s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f8eeec')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
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
        </tbody>
      </table>
    </div>
  );
}
