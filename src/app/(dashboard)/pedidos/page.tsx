'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

interface PedidoWeb {
  id: number; numero: string; fecha: string
  clienteNombre: string; clienteEmail: string
  clienteTelefono: string | null; clienteNit: string | null
  clienteDireccion: string | null; metodoPago: string
  subtotal: number; total: number; estado: string
  ventaId: number | null; procesadoPor: string | null
  stripePaymentId: string | null; notas: string | null
  items: PedidoItem[]
}

interface PedidoItem {
  id: number; nombre: string; codigo: string | null
  cantidad: number; precioUnitario: number; subtotal: number
  imagenUrl: string | null
}

const ESTADOS = {
  pendiente:   { label: 'Pendiente',   color: '#d97706', bg: '#fef3c7' },
  pagado:      { label: 'Pagado',      color: '#2563eb', bg: '#eff6ff' },
  confirmado:  { label: 'Confirmado',  color: '#16a34a', bg: '#f0fdf4' },
  enviado:     { label: 'Enviado',     color: '#7c3aed', bg: '#f5f3ff' },
  entregado:   { label: 'Entregado',   color: '#64748b', bg: '#f8fafc' },
  cancelado:   { label: 'Cancelado',   color: '#dc2626', bg: '#fef2f2' },
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoWeb[]>([])
  const [selected, setSelected] = useState<PedidoWeb | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(false)
  const [procesando, setProcesando] = useState(false)

  const load = async () => {
    setLoading(true)
    const p = filtroEstado ? `?estado=${filtroEstado}` : ''
    const res = await fetch(`/api/tienda/pedidos${p}`)
    setPedidos(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [filtroEstado])

  // Auto-refresh every 30s for new orders
  useEffect(() => {
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [filtroEstado])

  const accion = async (id: number, accion: string) => {
    if (accion === 'confirmar' && !confirm('¿Confirmar pedido? Esto generará una venta y descontará el stock.')) return
    if (accion === 'cancelar' && !confirm('¿Cancelar este pedido?')) return
    setProcesando(true)
    const res = await fetch(`/api/tienda/pedidos/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion }),
    })
    const data = await res.json()
    setProcesando(false)
    if (data.ok) {
      toast.success(accion === 'confirmar' ? `Pedido confirmado — Factura ${data.venta?.numero}` : 'Estado actualizado')
      setSelected(null); load()
    } else toast.error(data.error || 'Error')
  }

  const pendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'pagado').length
  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            Pedidos Web
            {pendientes > 0 && (
              <span style={{ marginLeft: 10, background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                {pendientes} nuevo{pendientes > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Pedidos recibidos desde la tienda en línea · Auto-actualiza cada 30s</p>
          <div style={{ marginTop: 8, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#1e40af', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10}/><path d="M12 8v4l3 3"/></svg>
            Pedidos con tarjeta llegan en estado <strong>Pagado</strong> — solo confirmar y empaquetar. Transferencia/efectivo llegan como <strong>Pendiente</strong>.
          </div>
        </div>
        <button className="btn-ghost btn-sm" onClick={load} disabled={loading}>↺ Actualizar</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
        {Object.entries(ESTADOS).map(([key, s]) => {
          const count = pedidos.filter(p => p.estado === key).length
          return (
            <div key={key} onClick={() => setFiltroEstado(filtroEstado === key ? '' : key)}
              style={{ background: '#fff', border: `1.5px solid ${filtroEstado === key ? s.color : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{count}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Fecha', 'Cliente', 'Email', 'Items', 'Total', 'Pago', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {pedidos.length === 0
                ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                    {loading ? 'Cargando...' : 'Sin pedidos web aún'}
                  </td></tr>
                : pedidos.map(p => {
                  const est = ESTADOS[p.estado as keyof typeof ESTADOS] || ESTADOS.pendiente
                  return (
                    <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
                      <td style={{ ...tdS, fontWeight: 700, color: '#2563eb' }}>{p.numero}</td>
                      <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDateTime(p.fecha)}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{p.clienteNombre}</td>
                      <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{p.clienteEmail}</td>
                      <td style={{ ...tdS, color: '#64748b' }}>{p.items?.length || 0} items</td>
                      <td style={{ ...tdS, fontWeight: 700 }}>{fmt(p.total)}</td>
                      <td style={tdS}>
                        <span style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize' }}>
                          {p.metodoPago}
                        </span>
                      </td>
                      <td style={tdS}>
                        <span style={{ background: est.bg, color: est.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                          {est.label}
                        </span>
                      </td>
                      <td style={{ ...tdS }} onClick={e => e.stopPropagation()}>
                        {(p.estado === 'pendiente' || p.estado === 'pagado') && (
                          <button onClick={() => accion(p.id, 'confirmar')} disabled={procesando}
                            style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                             Confirmar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETALLE MODAL */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{selected.numero}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{fmtDateTime(selected.fecha)}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Cliente info */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Cliente', selected.clienteNombre],
                ['Email', selected.clienteEmail],
                ['Teléfono', selected.clienteTelefono || '—'],
                ['NIT', selected.clienteNit || 'CF'],
                ['Dirección', selected.clienteDireccion || '—', true],
              ].map(([l, v, full]) => (
                <div key={l as string} style={{ gridColumn: full ? '1/-1' : 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, color: '#0f172a' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>{['Producto', 'Cant.', 'Precio', 'Subtotal'].map(h => <th key={h} style={{ ...thS, padding: '8px 10px' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {selected.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.imagenUrl && <img src={item.imagenUrl} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />}
                        <span>{item.nombre}</span>
                      </div>
                    </td>
                    <td style={{ ...tdS, padding: '8px 10px', textAlign: 'center' }}>{item.cantidad}</td>
                    <td style={{ ...tdS, padding: '8px 10px', color: '#64748b' }}>{fmt(item.precioUnitario)}</td>
                    <td style={{ ...tdS, padding: '8px 10px', fontWeight: 700 }}>{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 18px', textAlign: 'right' }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#2563eb' }}>Total: {fmt(selected.total)}</div>
                {selected.stripePaymentId && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}> Pago Stripe confirmado</div>}
                {selected.ventaId && <div style={{ fontSize: 11, color: '#2563eb', marginTop: 3 }}> Procesado por {selected.procesadoPor}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setSelected(null)}>Cerrar</button>
              {selected.estado === 'cancelado' || selected.estado === 'entregado' ? null : (
                <>
                  {(selected.estado === 'pendiente' || selected.estado === 'pagado') && (
                    <>
                      <button onClick={() => accion(selected.id, 'cancelar')} disabled={procesando}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancelar
                      </button>
                      <button onClick={() => accion(selected.id, 'confirmar')} disabled={procesando}
                        style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {procesando ? 'Procesando...' : ' Confirmar y facturar'}
                      </button>
                    </>
                  )}
                  {selected.estado === 'confirmado' && (
                    <button onClick={() => accion(selected.id, 'enviado')} disabled={procesando}
                      style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Marcar como enviado
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
