'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface Zona {
  id: number; nombre: string; departamento: string; tarifa: number
  notas: string | null; activa: boolean; orden: number
}

const emptyForm = { nombre: '', departamento: '', tarifa: '', notas: '' }

export default function ZonasInstalacionTab() {
  const [zonas, setZonas] = useState<Zona[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/zonas-instalacion')
    const d = await res.json()
    setZonas(d.zonas || [])
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (z: Zona) => {
    setEditId(z.id)
    setForm({ nombre: z.nombre, departamento: z.departamento, tarifa: String(z.tarifa), notas: z.notas || '' })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.nombre || !form.departamento) { toast.error('Nombre y departamento son requeridos'); return }
    setLoading(true)
    const res = editId
      ? await fetch(`/api/zonas-instalacion/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      : await fetch('/api/zonas-instalacion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success(editId ? 'Zona actualizada' : 'Zona creada'); setShowModal(false); load() }
    else toast.error(d.error || 'Error')
  }

  const toggleActiva = async (z: Zona) => {
    const res = await fetch(`/api/zonas-instalacion/${z.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activa: !z.activa }) })
    if ((await res.json()).ok) { load() }
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta zona? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/zonas-instalacion/${id}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success('Zona eliminada'); load() }
  }

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }
  const tdS: React.CSSProperties = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1e40af' }}>
        Define una tarifa fija de instalación por zona (municipio o departamento). Los asesores seleccionan la zona al cotizar en lugar de calcular por kilometraje y combustible.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>{zonas.length} zona(s) configurada(s)</div>
        <button className="btn-primary" onClick={openNew}>+ Nueva Zona</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Zona', 'Departamento', 'Tarifa', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {zonas.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Sin zonas configuradas. Crea la primera.</td></tr>
                : zonas.map(z => (
                  <tr key={z.id} style={{ opacity: z.activa ? 1 : 0.5 }}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#0f172a' }}>{z.nombre}</td>
                    <td style={{ ...tdS, color: '#64748b' }}>{z.departamento}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: '#1581E3' }}>Q {z.tarifa.toFixed(2)}</td>
                    <td style={tdS}>
                      <button onClick={() => toggleActiva(z)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, background: z.activa ? '#f0fdf4' : '#f1f5f9', color: z.activa ? '#16a34a' : '#94a3b8' }}>
                        {z.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(z)}>Editar</button>
                        <button onClick={() => eliminar(z.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>{editId ? 'Editar Zona' : 'Nueva Zona de Instalación'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Nombre de la zona *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Guastatoya, Zona 10 Guatemala..." />
              </div>
              <div>
                <label style={lbl}>Departamento *</label>
                <input className="input" value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} placeholder="Ej: El Progreso" />
              </div>
              <div>
                <label style={lbl}>Tarifa de instalación (Q)</label>
                <input className="input" type="number" min="0" value={form.tarifa} onChange={e => setForm(p => ({ ...p, tarifa: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label style={lbl}>Notas (opcional)</label>
                <input className="input" value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} placeholder="Ej: Aplica recargo en horario nocturno" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear zona'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
