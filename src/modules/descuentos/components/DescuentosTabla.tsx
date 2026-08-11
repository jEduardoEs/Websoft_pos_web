'use client'
import React from 'react'
import { formatGTQ, formatDate } from '@/shared/formatters'
import { DescuentoResponseDTO } from '../dto/DescuentoDTO'

export interface DescuentosTablaProps {
  descuentos: DescuentoResponseDTO[]
  onDesactivar: (d: DescuentoResponseDTO) => void
  onActivar?: (d: DescuentoResponseDTO) => void
  onEliminar?: (d: DescuentoResponseDTO) => void
}

export function DescuentosTabla({ descuentos, onDesactivar, onActivar, onEliminar }: DescuentosTablaProps) {
  return (
    <div className="table-responsive" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
        <thead>
          <tr>
            {['Código', 'Tipo', 'Valor', 'Mínimo', 'Usos', 'Vigencia', 'Estado', ''].map(h => (
              <th
                key={h}
                style={{
                  background: '#f8fafc',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '.5px',
                  padding: '10px 14px',
                  textAlign: 'left',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {descuentos.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#8a887e', fontSize: 13 }}>
                Sin descuentos registrados
              </td>
            </tr>
          ) : (
            descuentos.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#1581E3' }}>
                  {d.codigo}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12 }}>
                  <span className="badge-blue" style={{ textTransform: 'capitalize' }}>
                    {d.tipo}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#18181b' }}>
                  {d.tipo === 'porcentaje' ? `${d.valor}%` : formatGTQ(d.valor)}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748b' }}>
                  {d.minimoCompra > 0 ? formatGTQ(d.minimoCompra) : '—'}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#18181b' }}>
                  {d.usosActuales}/{d.usosMaximos === 0 ? '∞' : d.usosMaximos}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                  {d.fechaInicio ? `${formatDate(d.fechaInicio)} — ${formatDate(d.fechaFin)}` : 'Sin límite'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={d.activo ? 'badge-green' : 'badge-red'}>
                    {d.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    {d.activo ? (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        style={{ color: '#475569', fontSize: 12 }}
                        onClick={() => onDesactivar(d)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        style={{ color: '#1581E3', fontWeight: 600, fontSize: 12 }}
                        onClick={() => onActivar?.(d)}
                      >
                        Activar
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      style={{ fontSize: 12 }}
                      onClick={() => onEliminar?.(d)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
