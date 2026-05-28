'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function ConfigPage() {
  const [cfg, setCfg] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('empresa')

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setCfg)
  }, [])

  const save = async (keys: string[]) => {
    setLoading(true)
    const partial: any = {}
    keys.forEach(k => { partial[k] = cfg[k] || '' })
    const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(partial) })
    setLoading(false)
    if ((await res.json()).ok) toast.success('Configuración guardada')
    else toast.error('Error al guardar')
  }

  const set = (k: string, v: string) => setCfg((p: any) => ({ ...p, [k]: v }))

  const tabs = [
    { id: 'empresa', label: 'Empresa' },
    { id: 'ticket', label: 'Ticket' },
    { id: 'sistema', label: 'Sistema' },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Configuración</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Personaliza tu sistema</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              color: tab === t.id ? '#2B7FD4' : '#4a5568',
              borderBottom: `2px solid ${tab === t.id ? '#2B7FD4' : 'transparent'}`,
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {tab === 'empresa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}>Información de tu empresa para los tickets y reportes.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Nombre de la empresa', key: 'empresa_nombre', full: true },
                  { label: 'NIT', key: 'empresa_nit' },
                  { label: 'Teléfono', key: 'empresa_telefono' },
                  { label: 'Email', key: 'empresa_email', full: true },
                  { label: 'Dirección', key: 'empresa_direccion', full: true },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</label>
                    <input className="input" value={cfg[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => save(['empresa_nombre', 'empresa_nit', 'empresa_telefono', 'empresa_email', 'empresa_direccion'])} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}

          {tab === 'ticket' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}>Configuración del ticket impreso.</p>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Mensaje del ticket</label>
                <textarea className="input" value={cfg.ticket_mensaje || ''} onChange={e => set('ticket_mensaje', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => save(['ticket_mensaje'])} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          )}

          {tab === 'sistema' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}>Parámetros del sistema.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>IVA (%)</label>
                  <input className="input" type="number" value={cfg.iva_porcentaje || '12'} onChange={e => set('iva_porcentaje', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Símbolo moneda</label>
                  <input className="input" value={cfg.moneda_simbolo || 'Q'} onChange={e => set('moneda_simbolo', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Número siguiente factura</label>
                  <input className="input" type="number" value={cfg.numero_siguiente || '1'} onChange={e => set('numero_siguiente', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Número siguiente compra</label>
                  <input className="input" type="number" value={cfg.numero_siguiente_compra || '1'} onChange={e => set('numero_siguiente_compra', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => save(['iva_porcentaje', 'moneda_simbolo', 'numero_siguiente', 'numero_siguiente_compra'])} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
