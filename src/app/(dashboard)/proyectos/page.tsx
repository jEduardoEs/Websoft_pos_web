'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Mant {
  id: number; numero: number; fechaProgramada: string
  fechaRealizada: string | null; realizado: boolean
}

interface Proyecto {
  id: number; numero: string; nombre: string
  clienteNombre: string; clienteTelefono: string | null
  clienteDireccion: string | null; descripcion: string
  cotizacionNumero: string | null; estado: string
  fechaInicio: string | null; mantenimientos: Mant[]
  createdAt: string
}

const ESTADOS = ['planificado', 'en_ejecucion', 'completado', 'cancelado'] as const
const ESTADO_LABEL: Record<string, string> = { planificado: 'Planificado', en_ejecucion: 'En ejecución', completado: 'Completado', cancelado: 'Cancelado' }
const ESTADO_COLOR: Record<string, string> = { planificado: '#1581E3', en_ejecucion: '#d97706', completado: '#16a34a', cancelado: '#94a3b8' }
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const emptyForm = { nombre: '', clienteNombre: '', clienteTelefono: '', clienteDireccion: '', clienteNit: '', contactoNombre: '', descripcion: '', alcance: '', cotizacionNumero: '', fechaInicio: new Date().toISOString().split('T')[0], notas: '' }

export default function ProyectosPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [alertas, setAlertas] = useState({ proximos: 0, vencidos: 0 })
  const [tab, setTab] = useState<'todos'|'planificado'|'en_ejecucion'|'completado'>('todos')
  const [buscar, setBuscar] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (tab !== 'todos') params.set('estado', tab)
    if (buscar) params.set('buscar', buscar)
    const res = await fetch(`/api/proyectos?${params}`)
    const d = await res.json()
    setProyectos(d.proyectos || [])
    setAlertas({ proximos: d.proximos || 0, vencidos: d.vencidos || 0 })
  }, [tab, buscar])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.nombre || !form.clienteNombre || !form.descripcion) { toast.error('Nombre, cliente y descripción requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/proyectos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success(`${d.proyecto.numero} creado — 3 mantenimientos programados`); setShowModal(false); setForm(emptyForm); load() }
    else toast.error(d.error || 'Error')
  }

  const diasPara = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)

  const getAlertaMant = (mantenimientos: Mant[]) => {
    const pendientes = mantenimientos.filter(m => !m.realizado)
    if (pendientes.length === 0) return null
    const next = pendientes[0]
    const dias = diasPara(next.fechaProgramada)
    if (dias < 0) return { tipo: 'vencido', dias: Math.abs(dias), num: next.numero }
    if (dias <= 15) return { tipo: 'proximo', dias, num: next.numero }
    return null
  }

  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }
  const tdS: React.CSSProperties = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Proyectos</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Gestión de proyectos instalados con control de mantenimientos de garantía</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Proyecto</button>
      </div>

      {/* Alertas */}
      {(alertas.vencidos > 0 || alertas.proximos > 0) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {alertas.vencidos > 0 && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠ {alertas.vencidos} proyecto(s) con mantenimiento vencido</div>}
          {alertas.proximos > 0 && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>⏰ {alertas.proximos} mantenimiento(s) en los próximos 15 días</div>}
        </div>
      )}

      {/* Tabs + Buscar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4 }}>
          {(['todos', 'planificado', 'en_ejecucion', 'completado'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: tab === t ? '#1581E3' : 'transparent', color: tab === t ? '#fff' : '#64748b' }}>
              {t === 'todos' ? 'Todos' : ESTADO_LABEL[t]}
            </button>
          ))}
        </div>
        <input className="input" style={{ flex: 1, maxWidth: 280 }} placeholder="Buscar por cliente, nombre o número..." value={buscar} onChange={e => setBuscar(e.target.value)} />
      </div>

      {/* Tabla */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Proyecto / Cliente', 'Descripción', 'Cotización', 'Estado', 'Inicio', 'Mantenimientos', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {proyectos.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 50, color: '#94a3b8', fontSize: 13 }}>Sin proyectos. Crea el primero.</td></tr>
                : proyectos.map(p => {
                  const alerta = getAlertaMant(p.mantenimientos)
                  const realizados = p.mantenimientos.filter(m => m.realizado).length
                  return (
                    <tr key={p.id} onClick={() => router.push(`/proyectos/${p.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ ...tdS, fontWeight: 700, color: '#1581E3', fontSize: 12 }}>{p.numero}</td>
                      <td style={tdS}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{p.clienteNombre}</div>
                        {p.clienteTelefono && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.clienteTelefono}</div>}
                      </td>
                      <td style={{ ...tdS, maxWidth: 200, color: '#475569', fontSize: 12 }}>{p.descripcion.substring(0, 80)}{p.descripcion.length > 80 ? '...' : ''}</td>
                      <td style={{ ...tdS, fontSize: 12, color: '#64748b' }}>{p.cotizacionNumero || '—'}</td>
                      <td style={tdS}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${ESTADO_COLOR[p.estado]}18`, color: ESTADO_COLOR[p.estado], border: `1px solid ${ESTADO_COLOR[p.estado]}40`, textTransform: 'capitalize' }}>
                          {ESTADO_LABEL[p.estado] || p.estado}
                        </span>
                      </td>
                      <td style={{ ...tdS, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmt(p.fechaInicio)}</td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {p.mantenimientos.map(m => (
                              <div key={m.id} title={`Mant. ${m.numero} — ${fmt(m.fechaProgramada)}`}
                                style={{ width: 16, height: 16, borderRadius: '50%', background: m.realizado ? '#16a34a' : diasPara(m.fechaProgramada) < 0 ? '#dc2626' : diasPara(m.fechaProgramada) <= 15 ? '#d97706' : '#e2e8f0', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.realizado ? '#fff' : diasPara(m.fechaProgramada) < 0 || diasPara(m.fechaProgramada) <= 15 ? '#fff' : '#94a3b8', fontWeight: 700 }}>
                                {m.numero}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{realizados}/3</span>
                          {alerta && (
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: alerta.tipo === 'vencido' ? '#fef2f2' : '#fffbeb', color: alerta.tipo === 'vencido' ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                              {alerta.tipo === 'vencido' ? `⚠ M${alerta.num} vencido` : `⏰ M${alerta.num} en ${alerta.dias}d`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={tdS} onClick={e => e.stopPropagation()}>
                        <button className="btn-ghost btn-sm" onClick={() => router.push(`/proyectos/${p.id}`)}>Ver →</button>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Proyecto */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Nuevo Proyecto</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nombre del proyecto *</label>
                <input className="input" value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Ej: Sistema CCTV Farmacia San José" />
              </div>
              <div>
                <label style={lbl}>Cliente / Empresa *</label>
                <input className="input" value={form.clienteNombre} onChange={e => setF('clienteNombre', e.target.value)} placeholder="Nombre del cliente o empresa" />
              </div>
              <div>
                <label style={lbl}>NIT</label>
                <input className="input" value={form.clienteNit} onChange={e => setF('clienteNit', e.target.value)} placeholder="NIT del cliente" />
              </div>
              <div>
                <label style={lbl}>Teléfono</label>
                <input className="input" value={form.clienteTelefono} onChange={e => setF('clienteTelefono', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Persona de contacto</label>
                <input className="input" value={form.contactoNombre} onChange={e => setF('contactoNombre', e.target.value)} placeholder="Ej: Gerente, encargado..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Ubicación / Dirección</label>
                <input className="input" value={form.clienteDireccion} onChange={e => setF('clienteDireccion', e.target.value)} placeholder="Colonia, municipio, zona..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripción del trabajo realizado *</label>
                <textarea className="input" rows={2} value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Ej: Instalación sistema CCTV 8 cámaras IP Hilook + DVR 16ch + monitor 21pul" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Alcance / detalles técnicos adicionales</label>
                <textarea className="input" rows={2} value={form.alcance} onChange={e => setF('alcance', e.target.value)} placeholder="Metraje de cable, configuración especial, equipos adicionales..." style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={lbl}>Fecha de instalación *</label>
                <input className="input" type="date" value={form.fechaInicio} onChange={e => setF('fechaInicio', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>No. Cotización / Venta vinculada</label>
                <input className="input" value={form.cotizacionNumero} onChange={e => setF('cotizacionNumero', e.target.value)} placeholder="COT-000001 o FAC-000001" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Notas internas</label>
                <input className="input" value={form.notas} onChange={e => setF('notas', e.target.value)} />
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1e40af', margin: '16px 0' }}>
              Al guardar, el sistema programará automáticamente los 3 mantenimientos de garantía: a los 4, 8 y 12 meses desde la fecha de instalación.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Crear proyecto'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
