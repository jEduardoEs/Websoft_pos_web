'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

interface Descuento { id: number; codigo: string; descripcion: string | null; tipo: string; valor: number; minimoCompra: number; usosMaximos: number; usosActuales: number; fechaInicio: string | null; fechaFin: string | null; activo: boolean }
const empty = { id: 0, codigo: '', descripcion: '', tipo: 'porcentaje', valor: '', minimoCompra: '', usosMaximos: '0', fechaInicio: '', fechaFin: '' }

export default function DescuentosPage() {
  const [descuentos, setDescuentos] = useState<Descuento[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => { setDescuentos(await (await fetch('/api/descuentos')).json()) }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.codigo || !form.valor) { toast.error('Código y valor son requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/descuentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setLoading(false)
    if ((await res.json()).ok) { toast.success('Guardado'); setShowModal(false); load() }
  }

  const del = async (d: Descuento) => {
    if (!confirm(`¿Desactivar código "${d.codigo}"?`)) return
    const res = await fetch(`/api/descuentos?id=${d.id}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success('Desactivado'); load() }
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Descuentos</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Códigos de descuento para ventas</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty); setShowModal(true) }}>+ Nuevo Código</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Código', 'Tipo', 'Valor', 'Mínimo', 'Usos', 'Vigencia', 'Estado', ''].map(h => (
                <th key={h} style={{ background: 'rgba(37,99,235,.1)', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {descuentos.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Sin descuentos</td></tr>
              : descuentos.map(d => (
                <tr key={d.id}>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#60a5fa', fontFamily: 'monospace' }}>{d.codigo}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{d.tipo}</span></td>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{d.tipo === 'porcentaje' ? `${d.valor}%` : fmt(d.valor)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8' }}>{d.minimoCompra > 0 ? fmt(d.minimoCompra) : '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{d.usosActuales}/{d.usosMaximos === 0 ? '∞' : d.usosMaximos}</td>
                  <td style={{ padding: '10px 13px', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8' }}>{d.fechaInicio ? `${fmtDate(d.fechaInicio)} — ${fmtDate(d.fechaFin)}` : 'Sin límite'}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}><span className={d.activo ? 'badge-green' : 'badge-red'}>{d.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <button className="btn-danger btn-sm" onClick={() => del(d)}>Desactivar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>Nuevo Código de Descuento</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Código *', key: 'codigo', full: true },
                { label: 'Descripción', key: 'descripcion', full: true },
                { label: 'Tipo', key: 'tipo', type: 'select', options: [['porcentaje', 'Porcentaje (%)'], ['fijo', 'Monto fijo']] },
                { label: 'Valor *', key: 'valor', type: 'number' },
                { label: 'Mínimo de compra', key: 'minimoCompra', type: 'number' },
                { label: 'Máx. usos (0=ilimitado)', key: 'usosMaximos', type: 'number' },
                { label: 'Fecha inicio', key: 'fechaInicio', type: 'date' },
                { label: 'Fecha fin', key: 'fechaFin', type: 'date' },
              ].map((f: any) => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="input" value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}>
                      {f.options.map(([v, l]: string[]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ) : (
                    <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
