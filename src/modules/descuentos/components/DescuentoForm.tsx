'use client'
import React from 'react'
import { FormField, Input } from '@/ui'
import { DescuentoFormState } from '../types'

export interface DescuentoFormProps {
  form: DescuentoFormState
  onChange: (field: keyof DescuentoFormState, value: any) => void
}

export function DescuentoForm({ form, onChange }: DescuentoFormProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label="Código *" required>
          <Input
            value={form.codigo}
            onChange={e => onChange('codigo', e.target.value)}
            placeholder="Ej: DESC10"
          />
        </FormField>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label="Descripción">
          <Input
            value={form.descripcion}
            onChange={e => onChange('descripcion', e.target.value)}
            placeholder="Descripción opcional"
          />
        </FormField>
      </div>

      <FormField label="Tipo">
        <select
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: 14,
          }}
          value={form.tipo}
          onChange={e => onChange('tipo', e.target.value)}
        >
          <option value="porcentaje">Porcentaje (%)</option>
          <option value="fijo">Monto fijo</option>
        </select>
      </FormField>

      <FormField label="Valor *" required>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={form.valor}
          onChange={e => onChange('valor', e.target.value)}
        />
      </FormField>

      <FormField label="Mínimo de compra">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={form.minimoCompra}
          onChange={e => onChange('minimoCompra', e.target.value)}
        />
      </FormField>

      <FormField label="Máx. usos (0=ilimitado)">
        <Input
          type="number"
          step="1"
          min="0"
          value={form.usosMaximos}
          onChange={e => onChange('usosMaximos', e.target.value)}
        />
      </FormField>

      <FormField label="Fecha inicio">
        <Input
          type="date"
          value={form.fechaInicio}
          onChange={e => onChange('fechaInicio', e.target.value)}
        />
      </FormField>

      <FormField label="Fecha fin">
        <Input
          type="date"
          value={form.fechaFin}
          onChange={e => onChange('fechaFin', e.target.value)}
        />
      </FormField>
    </div>
  )
}
