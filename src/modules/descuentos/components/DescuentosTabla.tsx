'use client'
import React from 'react'
import { Table, Button, Badge } from '@/ui'
import { TableColumn } from '@/types/table.types'
import { formatGTQ, formatDate } from '@/shared/formatters'
import { DescuentoResponseDTO } from '../dto/DescuentoDTO'

export interface DescuentosTablaProps {
  descuentos: DescuentoResponseDTO[]
  onDesactivar: (d: DescuentoResponseDTO) => void
}

export function DescuentosTabla({ descuentos, onDesactivar }: DescuentosTablaProps) {
  const columns: TableColumn<DescuentoResponseDTO>[] = [
    {
      key: 'codigo',
      label: 'Código',
      render: d => (
        <span style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{d.codigo}</span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: d => <Badge variant="default">{d.tipo}</Badge>,
    },
    {
      key: 'valor',
      label: 'Valor',
      render: d => (
        <span style={{ fontWeight: 700 }}>
          {d.tipo === 'porcentaje' ? `${d.valor}%` : formatGTQ(d.valor)}
        </span>
      ),
    },
    {
      key: 'minimoCompra',
      label: 'Mínimo',
      render: d => (d.minimoCompra > 0 ? formatGTQ(d.minimoCompra) : '—'),
    },
    {
      key: 'usos',
      label: 'Usos',
      render: d => `${d.usosActuales}/${d.usosMaximos === 0 ? '∞' : d.usosMaximos}`,
    },
    {
      key: 'vigencia',
      label: 'Vigencia',
      render: d =>
        d.fechaInicio ? `${formatDate(d.fechaInicio)} — ${formatDate(d.fechaFin)}` : 'Sin límite',
    },
    {
      key: 'activo',
      label: 'Estado',
      render: d => (
        <Badge variant={d.activo ? 'success' : 'danger'}>{d.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      key: 'acciones',
      label: '',
      align: 'right',
      render: d => (
        <Button variant="danger" size="sm" onClick={() => onDesactivar(d)}>
          Desactivar
        </Button>
      ),
    },
  ]

  return <Table columns={columns} data={descuentos} keyExtractor={d => d.id} emptyMessage="Sin descuentos registrados" />
}
