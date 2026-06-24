'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Mant {
  id: number; numero: number; fechaProgramada: string
  fechaRealizada: string | null; realizado: boolean
  notas: string | null; cobrado: boolean; montoCobrado: number
  tecnicoNombre: string | null
}

interface Proyecto {
  id: number; numero: string; nombre: string
  clienteNombre: string; clienteTelefono: string | null
  clienteDireccion: string | null; clienteNit: string | null
  contactoNombre: string | null; descripcion: string
  alcance: string | null; cotizacionNumero: string | null
  estado: string; fechaInicio: string | null; fechaFin: string | null
  notas: string | null; usuarioNombre: string | null
  mantenimientos: Mant[]; createdAt: string
}

const ESTADO_COLOR: Record<string, string> = { planificado: '#1581E3', en_ejecucion: '#d97706', completado: '#16a34a', cancelado: '#94a3b8' }
const ESTADO_LABEL: Record<string, string> = { planificado: 'Planificado', en_ejecucion: 'En ejecución', completado: 'Completado', cancelado: 'Cancelado' }
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const diasPara = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

export default function ProyectoDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [editando, setEditando] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [showMarcar, setShowMarcar] = useState<Mant | null>(null)
  const [mantForm, setMantForm] = useState({ fechaRealizada: new Date().toISOString().split('T')[0], notas: '', cobrado: false, montoCobrado: '', tecnicoNombre: '' })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/proyectos/${params.id}`)
    if (!res.ok) { router.push('/proyectos'); return }
    const d = await res.json()
    setProyecto(d)
    setEditForm({
      nombre: d.nombre, clienteNombre: d.clienteNombre, clienteTelefono: d.clienteTelefono || '',
      clienteDireccion: d.clienteDireccion || '', clienteNit: d.clienteNit || '',
      contactoNombre: d.contactoNombre || '', descripcion: d.descripcion,
      alcance: d.alcance || '', notas: d.notas || '', estado: d.estado,
      fechaInicio: d.fechaInicio ? d.fechaInicio.split('T')[0] : '',
    })
  }, [params.id, router])

  useEffect(() => { load() }, [load])

  const guardarEdicion = async () => {
    setLoading(true)
    const res = await fetch(`/api/proyectos/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success('Proyecto actualizado'); setEditando(false); load() }
    else toast.error(d.error)
  }

  const marcarRealizado = async () => {
    if (!showMarcar) return
    setLoading(true)
    const res = await fetch(`/api/proyectos/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'marcar_mantenimiento', mantId: showMarcar.id, ...mantForm, montoCobrado: mantForm.montoCobrado ? Number(mantForm.montoCobrado) : 0 }),
    })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success(`Mantenimiento ${showMarcar.numero} marcado como realizado`); setShowMarcar(null); load() }
    else toast.error(d.error)
  }

  const cambiarEstado = async (estado: string) => {
    const res = await fetch(`/api/proyectos/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) })
    if ((await res.json()).ok) { toast.success(`Estado → ${ESTADO_LABEL[estado]}`); load() }
  }

  if (!proyecto) return <div style={{ padding: 24, color: '#94a3b8' }}>Cargando...</div>

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={() => router.push('/proyectos')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 8 }}>← Proyectos</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{proyecto.nombre}</h1>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${ESTADO_COLOR[proyecto.estado]}18`, color: ESTADO_COLOR[proyecto.estado] }}>
              {ESTADO_LABEL[proyecto.estado]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{proyecto.numero} · Creado el {fmt(proyecto.createdAt)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editando && (
            <>
              <select value={proyecto.estado} onChange={e => cambiarEstado(e.target.value)} className="input" style={{ fontSize: 12, padding: '6px 10px' }}>
                {Object.entries(ESTADO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className="btn-ghost" onClick={() => setEditando(true)}>Editar</button>
            </>
          )}
          {editando && (
            <>
              <button className="btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarEdicion} disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</button>
            </>
          )}
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Datos del cliente / empresa</div>
        {editando ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['nombre', 'Nombre del proyecto'],['clienteNombre', 'Cliente / Empresa'],['clienteNit', 'NIT'],['clienteTelefono', 'Teléfono'],['contactoNombre', 'Persona de contacto'],['clienteDireccion', 'Ubicación']].map(([k, label]) => (
              <div key={k} style={{ gridColumn: k === 'clienteDireccion' ? '1/-1' : 'auto' }}>
                <label style={lbl}>{label}</label>
                <input className="input" value={editForm[k] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[['Cliente', proyecto.clienteNombre], ['NIT', proyecto.clienteNit], ['Teléfono', proyecto.clienteTelefono], ['Contacto', proyecto.contactoNombre], ['Cotización', proyecto.cotizacionNumero], ['Técnico', proyecto.usuarioNombre]].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{val || '—'}</div>
              </div>
            ))}
            {proyecto.clienteDireccion && (
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>Ubicación</div>
                <div style={{ fontSize: 14, color: '#0f172a' }}>{proyecto.clienteDireccion}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Descripción */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Trabajo realizado</div>
        {editando ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={lbl}>Descripción *</label><textarea className="input" rows={2} value={editForm.descripcion || ''} onChange={e => setEditForm((p: any) => ({ ...p, descripcion: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div><label style={lbl}>Alcance / detalles técnicos</label><textarea className="input" rows={2} value={editForm.alcance || ''} onChange={e => setEditForm((p: any) => ({ ...p, alcance: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div><label style={lbl}>Notas internas</label><textarea className="input" rows={2} value={editForm.notas || ''} onChange={e => setEditForm((p: any) => ({ ...p, notas: e.target.value }))} style={{ resize: 'vertical' }} /></div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.7, marginBottom: proyecto.alcance ? 12 : 0 }}>{proyecto.descripcion}</p>
            {proyecto.alcance && <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>{proyecto.alcance}</p>}
            {proyecto.notas && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', marginTop: 12 }}>{proyecto.notas}</div>}
          </>
        )}
      </div>

      {/* Timeline de mantenimientos */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
          Mantenimientos de garantía — {proyecto.mantenimientos.filter(m => m.realizado).length}/3 realizados
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {proyecto.mantenimientos.map(m => {
            const dias = diasPara(m.fechaProgramada)
            const vencido = !m.realizado && dias < 0
            const proximo = !m.realizado && dias >= 0 && dias <= 15
            const futuro = !m.realizado && dias > 15
            const borderColor = m.realizado ? '#16a34a' : vencido ? '#dc2626' : proximo ? '#d97706' : '#e2e8f0'
            const bgColor = m.realizado ? '#f0fdf4' : vencido ? '#fef2f2' : proximo ? '#fffbeb' : '#f8fafc'
            return (
              <div key={m.id} style={{ border: `2px solid ${borderColor}`, borderRadius: 12, padding: 16, background: bgColor }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, color: m.realizado ? '#16a34a' : vencido ? '#dc2626' : proximo ? '#d97706' : '#e2e8f0', lineHeight: 1 }}>0{m.numero}</div>
                  {m.realizado ? <span style={{ fontSize: 18 }}>✓</span> : vencido ? <span style={{ fontSize: 16 }}>⚠</span> : proximo ? <span style={{ fontSize: 16 }}>⏰</span> : null}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Mantenimiento {m.numero}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  Programado: {fmt(m.fechaProgramada)}
                </div>
                {m.realizado ? (
                  <div>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Realizado: {fmt(m.fechaRealizada)}</div>
                    {m.tecnicoNombre && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Técnico: {m.tecnicoNombre}</div>}
                    {m.cobrado && <div style={{ fontSize: 11, color: '#d97706', marginTop: 2, fontWeight: 600 }}>Cobrado: Q {m.montoCobrado.toFixed(2)}</div>}
                    {m.notas && <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, borderTop: '1px solid #dcfce7', paddingTop: 6 }}>{m.notas}</div>}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: vencido ? '#dc2626' : proximo ? '#d97706' : '#94a3b8', marginBottom: 10 }}>
                      {vencido ? `Vencido hace ${Math.abs(dias)} días` : proximo ? `En ${dias} días` : `En ${dias} días`}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                      {m.numero <= 3 ? 'Gratuito — incluido en garantía' : 'Costo adicional'}
                    </div>
                    <button onClick={() => { setShowMarcar(m); setMantForm({ fechaRealizada: new Date().toISOString().split('T')[0], notas: '', cobrado: false, montoCobrado: '', tecnicoNombre: '' }) }}
                      style={{ width: '100%', padding: '8px', background: '#1581E3', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Marcar como realizado
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
          Los 3 mantenimientos son gratuitos durante el primer año de garantía (cada 4 meses). Posterior al año o si hay daños fuera de garantía, se cobra al cliente.
        </div>
      </div>

      {/* Modal marcar realizado */}
      {showMarcar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Marcar Mantenimiento {showMarcar.numero} — Realizado</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{proyecto.nombre} · {proyecto.clienteNombre}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Fecha realizado</label>
                <input className="input" type="date" value={mantForm.fechaRealizada} onChange={e => setMantForm(p => ({ ...p, fechaRealizada: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Técnico que realizó el mantenimiento</label>
                <input className="input" value={mantForm.tecnicoNombre} onChange={e => setMantForm(p => ({ ...p, tecnicoNombre: e.target.value }))} placeholder="Nombre del técnico" />
              </div>
              <div>
                <label style={lbl}>Notas del mantenimiento</label>
                <textarea className="input" rows={3} value={mantForm.notas} onChange={e => setMantForm(p => ({ ...p, notas: e.target.value }))} placeholder="Ej: Limpieza de cámaras, ajuste de ángulos, revisión de DVR..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  <input type="checkbox" checked={mantForm.cobrado} onChange={e => setMantForm(p => ({ ...p, cobrado: e.target.checked }))} />
                  Se cobró al cliente
                </label>
                {mantForm.cobrado && (
                  <input className="input" type="number" min="0" value={mantForm.montoCobrado} onChange={e => setMantForm(p => ({ ...p, montoCobrado: e.target.value }))} placeholder="Monto (Q)" style={{ maxWidth: 130 }} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowMarcar(null)}>Cancelar</button>
              <button className="btn-primary" onClick={marcarRealizado} disabled={loading}>{loading ? 'Guardando...' : 'Confirmar realizado'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
