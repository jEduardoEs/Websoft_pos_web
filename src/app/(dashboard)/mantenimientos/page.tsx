'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface Mant {
  id: number; numero: string; clienteNombre: string; clienteTelefono: string | null
  clienteDireccion: string | null; descripcion: string; fechaInstalacion: string
  mant1Fecha: string | null; mant1Realizado: boolean; mant1Notas: string | null
  mant2Fecha: string | null; mant2Realizado: boolean; mant2Notas: string | null
  mant3Fecha: string | null; mant3Realizado: boolean; mant3Notas: string | null
  estado: string; notas: string | null; ventaNumero: string | null
}

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const diasPara = (d: string | null) => { if (!d) return null; const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return diff }

export default function MantenimientosPage() {
  const [tab, setTab] = useState<'proximos'|'todos'|'vencidos'>('proximos')
  const [todos, setTodos] = useState<Mant[]>([])
  const [proximos, setProximos] = useState<Mant[]>([])
  const [vencidos, setVencidos] = useState<Mant[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showMarcar, setShowMarcar] = useState<{ mant: Mant; num: 1|2|3 } | null>(null)
  const [notas, setNotas] = useState('')
  const [form, setForm] = useState({ clienteNombre:'', clienteTelefono:'', clienteDireccion:'', descripcion:'', fechaInstalacion: new Date().toISOString().split('T')[0], notas:'', ventaNumero:'' })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/mantenimientos')
    const d = await res.json()
    setTodos(d.todos || []); setProximos(d.proximos || []); setVencidos(d.vencidos || [])
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.clienteNombre || !form.descripcion) { toast.error('Cliente y descripción requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/mantenimientos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success(`Registro ${d.mantenimiento.numero} creado — mantenimientos programados automáticamente`); setShowModal(false); load() }
    else toast.error(d.error)
  }

  const marcarRealizado = async () => {
    if (!showMarcar) return
    setLoading(true)
    const res = await fetch('/api/mantenimientos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: showMarcar.mant.id, mant: showMarcar.num, notas }) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success('Mantenimiento marcado como realizado'); setShowMarcar(null); setNotas(''); load() }
    else toast.error(d.error)
  }

  const lista = tab === 'proximos' ? proximos : tab === 'vencidos' ? vencidos : todos

  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }
  const tdS: React.CSSProperties = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }

  const MantBadge = ({ fecha, realizado, notas: n, num, mant }: { fecha: string|null; realizado: boolean; notas: string|null; num: 1|2|3; mant: Mant }) => {
    const dias = diasPara(fecha)
    const vencido = dias !== null && dias < 0 && !realizado
    const proximo = dias !== null && dias >= 0 && dias <= 15 && !realizado
    if (realizado) return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 700 }}>✓ {fmt(fecha)}</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: vencido ? '#fef2f2' : proximo ? '#fffbeb' : '#f8fafc', color: vencido ? '#dc2626' : proximo ? '#d97706' : '#64748b', fontWeight: 700 }}>
          {vencido ? `⚠ Vencido ${fmt(fecha)}` : proximo ? `⏰ En ${dias}d — ${fmt(fecha)}` : fmt(fecha)}
        </span>
        <button onClick={() => { setShowMarcar({ mant, num }); setNotas('') }}
          style={{ fontSize: 10, padding: '2px 7px', background: '#1581E3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          Marcar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Mantenimientos</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>3 mantenimientos gratuitos por instalación — cada 4 meses durante el primer año</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nueva Instalación</button>
      </div>

      {/* Alertas */}
      {(proximos.length > 0 || vencidos.length > 0) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {vencidos.length > 0 && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠ {vencidos.length} mantenimiento(s) vencido(s) — requieren atención</div>}
          {proximos.length > 0 && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>⏰ {proximos.length} mantenimiento(s) próximo(s) en los siguientes 15 días</div>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([['proximos', `Próximos (${proximos.length})`], ['vencidos', `Vencidos (${vencidos.length})`], ['todos', `Todos (${todos.length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: tab === id ? '#1581E3' : 'transparent', color: tab === id ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Cliente', 'Instalación', 'Descripción', 'Mant. 1 (4m)', 'Mant. 2 (8m)', 'Mant. 3 (12m)'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {lista.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Sin registros</td></tr>
                : lista.map(m => (
                  <tr key={m.id}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#1581E3', fontSize: 12 }}>{m.numero}</td>
                    <td style={tdS}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.clienteNombre}</div>
                      {m.clienteTelefono && <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.clienteTelefono}</div>}
                      {m.clienteDireccion && <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.clienteDireccion}</div>}
                    </td>
                    <td style={{ ...tdS, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmt(m.fechaInstalacion)}</td>
                    <td style={{ ...tdS, maxWidth: 200, color: '#475569' }}>{m.descripcion}</td>
                    <td style={tdS}><MantBadge fecha={m.mant1Fecha} realizado={m.mant1Realizado} notas={m.mant1Notas} num={1} mant={m} /></td>
                    <td style={tdS}><MantBadge fecha={m.mant2Fecha} realizado={m.mant2Realizado} notas={m.mant2Notas} num={2} mant={m} /></td>
                    <td style={tdS}><MantBadge fecha={m.mant3Fecha} realizado={m.mant3Realizado} notas={m.mant3Notas} num={3} mant={m} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Instalación */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Registrar Nueva Instalación</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Cliente *</label>
                  <input className="input" value={form.clienteNombre} onChange={e => setForm(p => ({ ...p, clienteNombre: e.target.value }))} placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label style={lbl}>Teléfono</label>
                  <input className="input" value={form.clienteTelefono} onChange={e => setForm(p => ({ ...p, clienteTelefono: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Fecha instalación *</label>
                  <input className="input" type="date" value={form.fechaInstalacion} onChange={e => setForm(p => ({ ...p, fechaInstalacion: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Dirección</label>
                  <input className="input" value={form.clienteDireccion} onChange={e => setForm(p => ({ ...p, clienteDireccion: e.target.value }))} placeholder="Colonia, zona, municipio..." />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Descripción del equipo instalado *</label>
                  <input className="input" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Ej: Sistema CCTV 4 cámaras Hilook + DVR 8ch" />
                </div>
                <div>
                  <label style={lbl}>No. venta / cotización</label>
                  <input className="input" value={form.ventaNumero} onChange={e => setForm(p => ({ ...p, ventaNumero: e.target.value }))} placeholder="FAC-000001" />
                </div>
                <div>
                  <label style={lbl}>Notas</label>
                  <input className="input" value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
                </div>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1e40af' }}>
                Al guardar, el sistema programará automáticamente los 3 mantenimientos gratuitos: a los 4, 8 y 12 meses desde la fecha de instalación.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar y programar mantenimientos'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Marcar Realizado */}
      {showMarcar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Marcar Mantenimiento {showMarcar.num} como Realizado</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>{showMarcar.mant.clienteNombre} — {showMarcar.mant.descripcion}</p>
            <label style={lbl}>Notas del mantenimiento (opcional)</label>
            <textarea className="input" rows={3} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: Limpieza de cámaras, ajuste de ángulos, revisión DVR..." style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn-ghost" onClick={() => setShowMarcar(null)}>Cancelar</button>
              <button className="btn-primary" onClick={marcarRealizado} disabled={loading}>{loading ? 'Guardando...' : 'Confirmar realizado'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
