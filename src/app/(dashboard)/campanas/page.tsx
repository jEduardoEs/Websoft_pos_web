'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface Cliente {
  id: number; nombre: string; telefono: string | null; email: string | null
  tipo: string; notas: string | null
}

const VARIABLES = ['{nombre}', '{negocio}', '{telefono}']
const PLANTILLAS = [
  { nombre: 'Saludo promocional', texto: 'Hola {nombre}! Le saludamos de WebSoft Solutions. Tenemos ofertas especiales en tecnología y seguridad para su negocio. ¿Le interesa recibir más información?' },
  { nombre: 'Recordatorio mantenimiento', texto: 'Hola {nombre}! Le contactamos de WebSoft Solutions para recordarle que su sistema de seguridad está próximo a su mantenimiento preventivo. Contáctenos para agendar.' },
  { nombre: 'Oferta CCTV', texto: 'Hola {nombre}! En WebSoft Solutions tenemos paquetes de cámaras de seguridad desde Q500. Proteja su negocio y hogar. ¿Le interesa una cotización sin costo?' },
  { nombre: 'Seguimiento cotización', texto: 'Hola {nombre}! Le seguimos de WebSoft Solutions. ¿Tuvo oportunidad de revisar la cotización que le enviamos? Con gusto le atendemos cualquier consulta.' },
]

export default function CampanasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [mensaje, setMensaje] = useState(PLANTILLAS[0].texto)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'prospecto' | 'cliente'>('todos')
  const [soloConTel, setSoloConTel] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [enviados, setEnviados] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    const res = await fetch('/api/clientes?buscar=' + encodeURIComponent(buscar))
    const data = await res.json()
    setClientes(Array.isArray(data) ? data : [])
  }, [buscar])

  useEffect(() => { load() }, [load])

  const clientesFiltrados = clientes.filter(c => {
    if (filtroTipo !== 'todos' && (c.tipo || 'prospecto') !== filtroTipo) return false
    if (soloConTel && !c.telefono) return false
    return true
  })

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const seleccionarTodos = () => {
    if (seleccionados.size === clientesFiltrados.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(clientesFiltrados.map(c => c.id)))
    }
  }

  const construirMensaje = (cliente: Cliente) => {
    return mensaje
      .replace(/{nombre}/g, cliente.nombre)
      .replace(/{negocio}/g, cliente.nombre)
      .replace(/{telefono}/g, cliente.telefono || '')
  }

  const abrirWA = (cliente: Cliente) => {
    if (!cliente.telefono) { toast.error(`${cliente.nombre} no tiene teléfono`); return }
    const tel = cliente.telefono.replace(/\D/g, '')
    const num = tel.startsWith('502') ? tel : '502' + tel
    const msg = construirMensaje(cliente)
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
    setEnviados(prev => new Set([...prev, cliente.id]))
  }

  const enviarATodos = () => {
    const lista = clientesFiltrados.filter(c => seleccionados.has(c.id) && c.telefono)
    if (lista.length === 0) { toast.error('Ningún cliente seleccionado tiene teléfono'); return }
    lista.forEach((c, i) => {
      setTimeout(() => abrirWA(c), i * 800) // espaciado para no saturar
    })
    toast.success(`Abriendo WhatsApp para ${lista.length} cliente(s)...`)
  }

  const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }

  return (
    <div className="page-wrap" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>Campañas WhatsApp</h1>
          <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>Envía mensajes personalizados a tus clientes y prospectos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, alignItems: 'start' }} className="grid-2col">

        {/* PANEL IZQUIERDO — mensaje */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#18181b', marginBottom: 14 }}>Mensaje</div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Plantilla rápida</label>
              <select className="input" onChange={e => { const p = PLANTILLAS.find(t => t.nombre === e.target.value); if (p) setMensaje(p.texto) }}>
                {PLANTILLAS.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Mensaje personalizado</label>
              <textarea className="input" rows={6} value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Escribe tu mensaje..." style={{ resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#8a887e', alignSelf: 'center' }}>Variables:</span>
              {VARIABLES.map(v => (
                <button key={v} onClick={() => setMensaje(m => m + v)}
                  style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1.5px solid #d8d6cd', background: '#f4f3ef', cursor: 'pointer', fontFamily: 'Courier New, monospace', color: '#1581E3', fontWeight: 700 }}>
                  {v}
                </button>
              ))}
            </div>

            <div style={{ background: '#f4f3ef', border: '1.5px solid #e3e1d8', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', marginBottom: 6 }}>Vista previa</div>
              <div style={{ fontSize: 13, color: '#18181b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {mensaje.replace(/{nombre}/g, 'Juan García').replace(/{negocio}/g, 'Juan García').replace(/{telefono}/g, '5555-1234')}
              </div>
            </div>
          </div>

          {seleccionados.size > 0 && (
            <button onClick={enviarATodos}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 20px', background: '#25D366', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar a {seleccionados.size} cliente(s) seleccionado(s)
            </button>
          )}
        </div>

        {/* PANEL DERECHO — lista clientes */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1.5px solid #e3e1d8', background: '#f4f3ef' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#18181b', marginBottom: 12 }}>
              Destinatarios
              <span style={{ fontWeight: 400, fontSize: 12, color: '#8a887e', marginLeft: 8 }}>{clientesFiltrados.length} disponibles</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)} />
              <select className="input" style={{ maxWidth: 140 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as any)}>
                <option value="todos">Todos</option>
                <option value="prospecto">Prospectos</option>
                <option value="cliente">Clientes</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#52524d', cursor: 'pointer' }}>
                <input type="checkbox" checked={soloConTel} onChange={e => setSoloConTel(e.target.checked)} />
                Solo con teléfono
              </label>
              <button onClick={seleccionarTodos} style={{ fontSize: 11, color: '#1581E3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                {seleccionados.size === clientesFiltrados.length && clientesFiltrados.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {clientesFiltrados.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#8a887e' }}>Sin clientes que coincidan con el filtro</div>
              : clientesFiltrados.map(c => {
                const sel = seleccionados.has(c.id)
                const enviado = enviados.has(c.id)
                return (
                  <div key={c.id} onClick={() => toggleSeleccion(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid #e3e1d8', cursor: 'pointer', background: sel ? '#eaf3fd' : '#fff', transition: 'background .1s' }}>
                    <input type="checkbox" checked={sel} onChange={() => toggleSeleccion(c.id)} onClick={e => e.stopPropagation()} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</div>
                      <div style={{ fontSize: 11, color: c.telefono ? '#25D366' : '#8a887e', fontWeight: c.telefono ? 600 : 400 }}>
                        {c.telefono || 'Sin teléfono'}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', background: (c.tipo || 'prospecto') === 'cliente' ? '#eef5ee' : '#faf1e3', color: (c.tipo || 'prospecto') === 'cliente' ? '#2f6b3a' : '#b87410', border: `1px solid ${(c.tipo || 'prospecto') === 'cliente' ? '#c7dcc9' : '#e8cfa0'}`, flexShrink: 0 }}>
                      {c.tipo || 'prospecto'}
                    </span>
                    {c.telefono && (
                      <button onClick={e => { e.stopPropagation(); abrirWA(c) }}
                        style={{ background: enviado ? '#f4f3ef' : '#25D366', border: 'none', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                        title="Enviar WhatsApp ahora">
                        {enviado
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2f6b3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        }
                      </button>
                    )}
                  </div>
                )
              })
            }
          </div>
        </div>

      </div>
    </div>
  )
}
