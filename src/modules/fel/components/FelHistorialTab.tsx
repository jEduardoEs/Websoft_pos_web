import React from 'react';
import { fmt, fmtDateTime } from '@/lib/utils';
import { FelVenta } from '../hooks/use-fel';

interface FelHistorialTabProps {
  fi: string;
  setFi: (d: string) => void;
  ff: string;
  setFf: (d: string) => void;
  loading: boolean;
  loadVentasFel: () => void;
  ventas: FelVenta[];
}

export function FelHistorialTab({
  fi, setFi, ff, setFf, loading, loadVentasFel, ventas
}: FelHistorialTabProps) {

  const estadoBadge = (v: FelVenta) => {
    if (!v.felEstado && !v.felUuid) return null;
    const map: Record<string, { bg: string; color: string; label: string }> = {
      certificado: { bg: '#f0fdf4', color: '#166534', label: 'Certificado' },
      sandbox:     { bg: '#fffbeb', color: '#92400e', label: 'Sandbox' },
      anulado:     { bg: '#fef2f2', color: '#991b1b', label: 'Anulado' },
    };
    const s = map[v.felEstado || 'certificado'] || map.certificado;
    return (
      <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 10 }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
            <input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
            <input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={loadVentasFel} disabled={loading}>
            {loading ? 'Cargando...' : 'Buscar'}
          </button>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontWeight: 700 }}>
            {ventas.length} DTE emitidos
          </div>
        </div>
      </div>

      {ventas.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
          {loading ? 'Cargando...' : 'No hay DTE emitidos en este período. Cuando FEL esté activo, los documentos certificados aparecerán aquí.'}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Factura', 'Fecha', 'Cliente', 'NIT', 'UUID', 'Serie/No.', 'Total', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#1581E3' }}>{v.numero}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569' }}>{fmtDateTime(v.fecha)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#0f172a' }}>{v.clienteNombre}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{v.clienteNit}</td>
                  <td style={{ padding: '10px 14px', fontSize: 10, color: '#64748b', fontFamily: 'monospace', maxWidth: 180 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.felUuid}>
                      {v.felUuid || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>
                    {v.felSerie && v.felNumero ? `${v.felSerie}-${v.felNumero}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(v.total)}</td>
                  <td style={{ padding: '10px 14px' }}>{estadoBadge(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
