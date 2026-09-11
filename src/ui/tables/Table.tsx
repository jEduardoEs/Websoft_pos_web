'use client'
import React from 'react'
import { TableColumn } from '@/types/table.types'

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  emptyMessage?: string
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No hay registros' }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  padding: '10px 12px',
                  fontWeight: 600,
                  color: '#475569',
                  textAlign: col.align || 'left',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(item => (
              <tr key={keyExtractor(item)} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '10px 12px', color: '#334155', textAlign: col.align || 'left' }}>
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
