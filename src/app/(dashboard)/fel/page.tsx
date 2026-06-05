'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Venta {
  id: number; numero: string; fecha: string
  clienteNombre: string; clienteNit: string; total: number
  felUuid?: string; felSerie?: string; felNumero?: number
  felCertificacion?: string; felEstado?: string
}

export default function FelPage() {
  const [tab, setTab] = useState<'estado'|'historial'|'guia'>('estado')
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [fi, setFi] = useState(new Date().toISOString().slice(0, 10))
  const [ff, setFf] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig)
  }, [])

  useEffect(() => {
    if (tab === 'historial') loadVentasFel()
  }, [tab, fi, ff])

  const loadVentasFel = async () => {
    setLoading(true)
    const p = new URLSearchParams({ fecha_ini: fi, fecha_fin: ff })
    const res = await fetch(`/api/ventas?${p}`)
    const data = await res.json()
    // Filtrar las que tienen UUID FEL
    setVentas(Array.isArray(data) ? data.filter((v: Venta) => v.felUuid || v.felEstado) : [])
    setLoading(false)
  }

  const modo = config.fel_ambiente || 'sandbox'
  const felActivo = config.fel_activo === 'true'
  const emailActivo = config.email_factura_activo === 'true'
  const certificador = config.fel_certificador || 'infile'

  const tabStyle = (t: string) => ({
    padding: '7px 18px', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13,
    fontWeight: 600, fontFamily: 'inherit',
    background: tab === t ? '#1581E3' : '#f8fafc',
    color: tab === t ? '#fff' : '#64748b',
    transition: 'all .15s',
  })

  const fmtFecha = (s: string) => new Date(s).toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const fmt = (n: number) => `Q ${n.toFixed(2)}`

  const estadoBadge = (v: Venta) => {
    if (!v.felEstado && !v.felUuid) return null
    const map: Record<string, { bg: string; color: string; label: string }> = {
      certificado: { bg: '#f0fdf4', color: '#166534', label: 'Certificado' },
      sandbox:     { bg: '#fffbeb', color: '#92400e', label: 'Sandbox' },
      anulado:     { bg: '#fef2f2', color: '#991b1b', label: 'Anulado' },
    }
    const s = map[v.felEstado || 'certificado'] || map.certificado
    return (
      <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 10 }}>
        {s.label}
      </span>
    )
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 960 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Facturación Electrónica FEL</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Integración INFILE · SAT Guatemala · Certificador NIT 12521337</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ background: felActivo ? '#f0fdf4' : '#fffbeb', border: `1px solid ${felActivo ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: felActivo ? '#166534' : '#92400e' }}>
            FEL: {felActivo ? 'Activo' : 'Inactivo'}
          </div>
          {felActivo && (
            <div style={{ background: modo === 'produccion' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${modo === 'produccion' ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: modo === 'produccion' ? '#166534' : '#1e40af' }}>
              {modo === 'produccion' ? 'Producción' : modo === 'pruebas' ? 'Pruebas INFILE' : 'Sandbox Local'}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={tabStyle('estado')} onClick={() => setTab('estado')}>Estado y Configuración</button>
        <button style={tabStyle('historial')} onClick={() => setTab('historial')}>Historial DTE</button>
        <button style={tabStyle('guia')} onClick={() => setTab('guia')}>Guía de Activación</button>
      </div>

      {/* ── TAB: ESTADO ── */}
      {tab === 'estado' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status card */}
          <div style={{ background: felActivo ? '#f0fdf4' : '#fffbeb', border: `1px solid ${felActivo ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 24, marginTop: 2 }}>{felActivo ? '' : ''}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: felActivo ? '#166534' : '#92400e', marginBottom: 4 }}>
                {felActivo ? `FEL Activo — ${modo === 'produccion' ? 'Producción' : modo === 'pruebas' ? 'Pruebas INFILE' : 'Sandbox Local'}` : 'FEL Inactivo — Sin contrato con certificador'}
              </div>
              <div style={{ fontSize: 12, color: felActivo ? '#166534' : '#78350f', lineHeight: 1.6 }}>
                {felActivo
                  ? modo === 'produccion'
                    ? 'Las ventas generan DTE válidos enviados al SAT en tiempo real. Las facturas son legalmente vinculantes.'
                    : modo === 'pruebas'
                    ? 'Conectado al ambiente de pruebas de INFILE. Los DTE generados NO son válidos ante el SAT.'
                    : 'Modo sandbox activado. Los DTE son simulados localmente, no se envía nada a INFILE ni al SAT. Ideal para probar el flujo antes de tener contrato.'
                  : 'Para emitir facturas electrónicas válidas necesitas contratar INFILE. Mientras tanto, el sistema funciona normalmente sin FEL.'}
              </div>
            </div>
          </div>

          {/* Config resumen */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Configuración actual</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Certificador', value: certificador === 'infile' ? 'INFILE S.A.' : certificador },
                { label: 'Ambiente', value: modo === 'produccion' ? 'Producción (SAT real)' : modo === 'pruebas' ? 'Pruebas INFILE' : 'Sandbox local' },
                { label: 'NIT Emisor', value: config.fel_nit_emisor || '(no configurado)' },
                { label: 'Nombre Emisor', value: config.fel_nombre_emisor || '(no configurado)' },
                { label: 'Usuario INFILE', value: config.fel_usuario ? `${config.fel_usuario.slice(0, 6)}···` : '(no configurado)' },
                { label: 'Clave INFILE', value: 'En variable de entorno FEL_CLAVE' },
                { label: 'Correo por email', value: emailActivo ? 'Activo' : 'Inactivo' },
                { label: 'Provider email', value: process.env.EMAIL_PROVIDER || '(no configurado en .env)' },
              ].map(r => (
                <div key={r.label} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 7 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
              Para modificar la configuración FEL, ve a <strong>Configuración → FEL / SAT</strong>.
              La clave de INFILE se configura en <strong>Vercel → Settings → Environment Variables → FEL_CLAVE</strong>.
            </div>
          </div>

          {/* Variables de entorno necesarias */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>Variables de entorno requeridas (Vercel)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { key: 'FEL_MODO', desc: '"sandbox" | "pruebas" | "produccion"', req: true },
                { key: 'FEL_USUARIO', desc: 'Usuario proporcionado por INFILE', req: true },
                { key: 'FEL_CLAVE', desc: 'Clave/token de INFILE (NO guardar en DB)', req: true },
                { key: 'FEL_NIT_EMISOR', desc: 'NIT de WebSoft Solutions sin guion', req: true },
                { key: 'FEL_NOMBRE_EMISOR', desc: 'WebSoft Solutions', req: false },
                { key: 'FEL_SERIE', desc: 'Serie asignada por INFILE (ej: A, WSFT)', req: false },
                { key: 'EMAIL_PROVIDER', desc: '"resend" (recomendado) | "smtp"', req: false },
                { key: 'RESEND_API_KEY', desc: 'API key de resend.com (gratis hasta 3,000/mes)', req: false },
                { key: 'EMAIL_FROM', desc: 'WebSoft Solutions <facturas@...>', req: false },
              ].map(v => (
                <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#f8fafc', borderRadius: 6, fontFamily: 'monospace' }}>
                  <span style={{ fontWeight: 700, color: '#1581E3', fontSize: 12, minWidth: 180 }}>{v.key}</span>
                  <span style={{ fontSize: 11, color: '#64748b', flex: 1 }}>{v.desc}</span>
                  {v.req && <span style={{ fontSize: 9, fontWeight: 700, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 6 }}>REQUERIDO</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
                <input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
                <input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={loadVentasFel} disabled={loading}>
                {loading ? 'Cargando...' : 'Buscar'}
              </button>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                {ventas.length} DTE emitidos
              </div>
            </div>
          </div>

          {ventas.length === 0
            ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                {loading ? 'Cargando...' : 'No hay DTE emitidos en este período. Cuando FEL esté activo, los documentos certificados aparecerán aquí.'}
              </div>
            )
            : (
              <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['Factura', 'Fecha', 'Cliente', 'NIT', 'UUID', 'Serie/No.', 'Total', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#1581E3' }}>{v.numero}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569' }}>{fmtFecha(v.fecha)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#0f172a' }}>{v.clienteNombre}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{v.clienteNit}</td>
                        <td style={{ padding: '10px 14px', fontSize: 10, color: '#64748b', fontFamily: 'monospace', maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.felUuid}>
                            {v.felUuid || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>
                          {v.felSerie && v.felNumero ? `${v.felSerie}-${v.felNumero}` : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(v.total)}</td>
                        <td style={{ padding: '10px 14px' }}>{estadoBadge(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* ── TAB: GUIA ── */}
      {tab === 'guia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Pasos */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>Cómo activar FEL con INFILE</div>
            {[
              {
                num: '1', title: 'Contratar INFILE',
                desc: 'Visita infile.com.gt y contrata el plan básico (desde ~Q50/mes). Durante el registro te pedirán tu NIT, nombre comercial y tipo de régimen. INFILE te asignará usuario, clave y serie.',
                url: 'https://infile.com.gt', urlLabel: 'Visitar INFILE',
              },
              {
                num: '2', title: 'Configurar en Vercel',
                desc: 'Ve a tu proyecto en Vercel → Settings → Environment Variables. Agrega las 4 variables requeridas: FEL_MODO=produccion, FEL_USUARIO, FEL_CLAVE, FEL_NIT_EMISOR. Haz redeploy.',
                url: 'https://vercel.com/dashboard', urlLabel: 'Ir a Vercel',
              },
              {
                num: '3', title: 'Activar en Configuración',
                desc: 'Ve a Configuración → FEL / SAT en este sistema. Activa "FEL Activo", selecciona INFILE como certificador, y elige el ambiente (pruebas primero, luego producción). Guarda.',
                url: '/config', urlLabel: 'Ir a Configuración',
              },
              {
                num: '4', title: 'Probar con una venta',
                desc: 'Haz una venta de prueba en el POS. Si FEL funciona, verás el UUID de autorización en el modal de cobro y en el ticket. Luego cambia a producción para facturas válidas ante el SAT.',
                url: '/pos', urlLabel: 'Ir al POS',
              },
            ].map(s => (
              <div key={s.num} style={{ display: 'flex', gap: 14, marginBottom: 16, padding: 14, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1581E3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{s.num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 6 }}>{s.desc}</div>
                  <a href={s.url} target={s.url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" style={{ fontSize: 12, color: '#1581E3', fontWeight: 700, textDecoration: 'none' }}>{s.urlLabel} →</a>
                </div>
              </div>
            ))}
          </div>

          {/* Proveedores alternativos */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Certificadores autorizados SAT</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { nombre: 'INFILE', url: 'https://infile.com.gt', precio: 'Desde Q50/mes', recomendado: true, desc: 'El más usado. API REST simple, soporte local, integrado en este sistema.' },
                { nombre: 'Digifact', url: 'https://digifact.com.gt', precio: 'Desde Q45/mes', recomendado: true, desc: 'Buen soporte, popular en comercios medianos. Integración similar a INFILE.' },
                { nombre: 'G4S', url: 'https://gt.g4s.com', precio: 'Consultar', recomendado: false, desc: 'Para empresas grandes con requisitos de seguridad adicionales.' },
                { nombre: 'Megaprint', url: 'https://megaprint.com.gt', precio: 'Desde Q40/mes', recomendado: false, desc: 'Opción económica. API más simple.' },
              ].map(c => (
                <div key={c.nombre} style={{ border: `1.5px solid ${c.recomendado ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 10, padding: 14, background: c.recomendado ? '#f8fafc' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.nombre}</span>
                    {c.recomendado && <span style={{ fontSize: 10, fontWeight: 700, background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: 10 }}>Recomendado</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, lineHeight: 1.5 }}>{c.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{c.precio}</span>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Ver sitio →</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Correo */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>Activar envío de factura por correo</div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8, marginBottom: 12 }}>
              Para enviar la factura automáticamente por email al cliente, tienes dos opciones:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { nombre: 'Resend (recomendado)', vars: 'RESEND_API_KEY + EMAIL_FROM', desc: 'Plan gratuito: 3,000 emails/mes. Fácil de configurar, sin servidor SMTP.', url: 'https://resend.com' },
                { nombre: 'Gmail SMTP', vars: 'SMTP_HOST + SMTP_USER + SMTP_PASS', desc: 'Usa tu cuenta de Gmail con contraseña de app. Gratuito pero con límite diario.', url: 'https://myaccount.google.com/apppasswords' },
              ].map(p => (
                <div key={p.nombre} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, lineHeight: 1.5 }}>{p.desc}</div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#1581E3', marginBottom: 6 }}>{p.vars}</div>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>Ver documentación →</a>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#166534' }}>
              Activa "Factura por correo" en <strong>Configuración → Ventas y Tickets</strong>. El campo de correo del cliente aparece automáticamente en el POS cuando está activo.
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
