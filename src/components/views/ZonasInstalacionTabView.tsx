'use client'
import { ReactNode } from 'react'

interface Zona {
  id: number
  nombre: string
  departamento: string
  tarifa: number
  notas: string | null
  activa: boolean
}

type ZonaFormField = 'nombre' | 'departamento' | 'tarifa' | 'notas'

interface ZonasInstalacionTabViewProps {
  zonas: Zona[]
  showModal: boolean
  editId: number | null
  form: { nombre: string; departamento: string; tarifa: string; notas: string }
  loading: boolean
  onOpenNew: () => void
  onOpenEdit: (z: Zona) => void
  onSave: () => void
  onToggleActiva: (z: Zona) => void
  onEliminar: (id: number) => void
  onChangeForm: (field: ZonaFormField, value: string) => void
  onCancel: () => void
}

export default function ZonasInstalacionTabView({ zonas, showModal, editId, form, loading, onOpenNew, onOpenEdit, onSave, onToggleActiva, onEliminar, onChangeForm, onCancel }: ZonasInstalacionTabViewProps) {
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
        <button className="btn-primary" onClick={onOpenNew}>+ Nueva Zona</button>
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
                      <button onClick={() => onToggleActiva(z)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, background: z.activa ? '#f0fdf4' : '#f1f5f9', color: z.activa ? '#16a34a' : '#94a3b8' }}>
                        {z.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-ghost btn-sm" onClick={() => onOpenEdit(z)}>Editar</button>
                        <button onClick={() => onEliminar(z.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Eliminar</button>
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
                <input className="input" value={form.nombre} onChange={(e) => onChangeForm('nombre', e.target.value)} placeholder="Ej: Guastatoya, Zona 10 Guatemala..." />
              </div>
              <div>
                <label style={lbl}>Departamento *</label>
                <input className="input" value={form.departamento} onChange={(e) => onChangeForm('departamento', e.target.value)} placeholder="Ej: El Progreso" />
              </div>
              <div>
                <label style={lbl}>Tarifa de instalación (Q)</label>
                <input className="input" type="number" min="0" value={form.tarifa} onChange={(e) => onChangeForm('tarifa', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label style={lbl}>Notas (opcional)</label>
                <input className="input" value={form.notas} onChange={(e) => onChangeForm('notas', e.target.value)} placeholder="Ej: Aplica recargo en horario nocturno" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
              <button className="btn-primary" onClick={onSave} disabled={loading}>{loading ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear zona'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
