'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import ZonasInstalacionTab from '@/components/ZonasInstalacionTab'

interface Cfg { [key: string]: string }

const SECTION = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="card" style={{ padding: 22, marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {children}
    </div>
  </div>
)

const FIELD = ({ label, helpText, full, children }: { label: string; helpText?: string; full?: boolean; children: React.ReactNode }) => (
  <div style={{ gridColumn: full ? '1/-1' : 'auto' }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{label}</label>
    {children}
    {helpText && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{helpText}</div>}
  </div>
)

export default function ConfigPage() {
  const [cfg, setCfg] = useState<Cfg>({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [asignando, setAsignando] = useState(false)
  const [resultadoAsignacion, setResultadoAsignacion] = useState<any>(null)

  const asignarCodigos = async (soloSinCodigo: boolean) => {
    if (!confirm(soloSinCodigo
      ? '¿Asignar códigos automáticos solo a productos sin código?'
      : '¿Reasignar códigos a TODOS los productos? Esto sobreescribirá códigos existentes.'))
      return
    setAsignando(true)
    setResultadoAsignacion(null)
    const res = await fetch('/api/productos/asignar-codigos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soloSinCodigo }),
    })
    const data = await res.json()
    setAsignando(false)
    if (data.ok) {
      setResultadoAsignacion(data)
      toast.success(data.mensaje)
    } else {
      toast.error(data.error || 'Error')
    }
  }
  const [activeTab, setActiveTab] = useState('empresa')

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setCfg)
  }, [])


  const set = (k: string, v: string) => setCfg(p => ({ ...p, [k]: v }))

  const save = async (keys?: string[]) => {
    setLoading(true)
    const toSave = keys ? Object.fromEntries(keys.map(k => [k, cfg[k]])) : cfg
    const res = await fetch('/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave),
    })
    setLoading(false)
    if ((await res.json()).ok) {
      toast.success('Configuración guardada')
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } else toast.error('Error al guardar')
  }

  const inp = (k: string, placeholder?: string, type = 'text') => (
    <input className="input" type={type} value={cfg[k] || ''} onChange={e => set(k, e.target.value)} placeholder={placeholder} />
  )

  const sel = (k: string, options: { value: string; label: string }[]) => (
    <select className="input" value={cfg[k] || ''} onChange={e => set(k, e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  const toggle = (k: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
      <button onClick={() => set(k, cfg[k] === 'true' ? 'false' : 'true')}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: cfg[k] === 'true' ? '#2563eb' : '#e2e8f0', transition: 'background .2s', position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: 'left .2s', left: cfg[k] === 'true' ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </button>
      <span style={{ fontSize: 13, color: cfg[k] === 'true' ? '#2563eb' : '#94a3b8', fontWeight: 600 }}>
        {cfg[k] === 'true' ? 'Activado' : 'Desactivado'}
      </span>
    </div>
  )

  const TABS = [
    { id: 'empresa',      label: 'Empresa' },
    { id: 'facturacion',  label: 'Facturación' },
    { id: 'productos',    label: 'Productos' },
    { id: 'ventas',       label: 'Ventas y Tickets' },
    { id: 'fel',          label: '🇬🇹 FEL / SAT' },
    { id: 'alertas',      label: 'Alertas' },
    { id: 'tienda',       label: 'Tienda Online' },
    { id: 'cuentas',      label: 'Cuentas Bancarias' },
    { id: 'zonas',        label: 'Zonas de Instalación' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Configuración del Sistema</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Personaliza todos los aspectos del sistema</p>
        </div>
        <button className="btn-primary" onClick={() => save()} disabled={loading} style={{ minWidth: 140 }}>
          {loading ? 'Guardando...' : saved ? ' Guardado' : 'Guardar todo'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s',
            background: activeTab === t.id ? '#2563eb' : '#f8fafc',
            color: activeTab === t.id ? '#fff' : '#64748b',
            boxShadow: activeTab === t.id ? '0 2px 8px rgba(37,99,235,.3)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* EMPRESA */}
      {activeTab === 'empresa' && (
        <SECTION title="Datos de la Empresa" icon="">
          <FIELD label="Nombre de la empresa" full><input className="input" value={cfg.empresa_nombre || ''} onChange={e => set('empresa_nombre', e.target.value)} /></FIELD>
          <FIELD label="NIT de la empresa"><input className="input" value={cfg.empresa_nit || ''} onChange={e => set('empresa_nit', e.target.value)} /></FIELD>
          <FIELD label="Teléfono"><input className="input" value={cfg.empresa_telefono || ''} onChange={e => set('empresa_telefono', e.target.value)} /></FIELD>
          <FIELD label="Email" full><input className="input" type="email" value={cfg.empresa_email || ''} onChange={e => set('empresa_email', e.target.value)} /></FIELD>
          <FIELD label="Dirección" full><input className="input" value={cfg.empresa_direccion || ''} onChange={e => set('empresa_direccion', e.target.value)} /></FIELD>
          <FIELD label="Sitio web"><input className="input" value={cfg.empresa_web || ''} onChange={e => set('empresa_web', e.target.value)} /></FIELD>
        </SECTION>
      )}

      {/* FACTURACION */}
      {activeTab === 'facturacion' && (
        <SECTION title="Configuración de Facturación" icon="">
          <FIELD label="Régimen fiscal" full>
            {sel('regimen_fiscal', [
              { value: 'pequeno_contribuyente', label: 'Pequeño Contribuyente (ISR 5%)' },
              { value: 'general', label: 'Régimen General (IVA 12%)' },
              { value: 'exento', label: 'Exento' },
            ])}
          </FIELD>
          <FIELD label="IVA (%)" helpText="5% para pequeño contribuyente, 12% régimen general">
            {sel('iva_porcentaje', [
              { value: '5', label: '5% — Pequeño Contribuyente' },
              { value: '12', label: '12% — Régimen General' },
              { value: '0', label: '0% — Exento' },
            ])}
          </FIELD>
          <FIELD label="Símbolo de moneda"><input className="input" value={cfg.moneda_simbolo || 'Q'} onChange={e => set('moneda_simbolo', e.target.value)} style={{ maxWidth: 80 }} /></FIELD>
          <FIELD label="Prefijo de factura" helpText="Ej: FAC → FAC-000001"><input className="input" value={cfg.factura_prefijo || 'FAC'} onChange={e => set('factura_prefijo', e.target.value.toUpperCase())} style={{ maxWidth: 120 }} /></FIELD>
          <FIELD label="Siguiente número de factura" helpText="Número consecutivo actual">
            <input className="input" type="number" min="1" value={cfg.numero_siguiente || '1'} onChange={e => set('numero_siguiente', e.target.value)} style={{ maxWidth: 120 }} />
          </FIELD>
        </SECTION>
      )}

      {/* PRODUCTOS */}
      {activeTab === 'productos' && (
        <SECTION title="Configuración de Productos" icon="">
          <FIELD label="Prefijo de código de producto" helpText="Ej: WSP → WSP-0001, WSP-0002...">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="input" value={cfg.producto_prefijo || 'WSP'} onChange={e => set('producto_prefijo', e.target.value.toUpperCase())} style={{ maxWidth: 120 }} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>→ Ej: <strong style={{ color: '#2563eb' }}>{cfg.producto_prefijo || 'WSP'}-0001</strong></span>
            </div>
          </FIELD>
          <FIELD label="Stock mínimo por defecto" helpText="Alerta cuando el stock baje de este número">
            <input className="input" type="number" min="0" value={cfg.stock_alerta_minimo || '5'} onChange={e => set('stock_alerta_minimo', e.target.value)} style={{ maxWidth: 120 }} />
          </FIELD>
          <FIELD label="Prefijo de cotización" helpText="Ej: COT → COT-000001">
            <input className="input" value={cfg.cotizacion_prefijo || 'COT'} onChange={e => set('cotizacion_prefijo', e.target.value.toUpperCase())} style={{ maxWidth: 120 }} />
          </FIELD>
          <FIELD label="Validez de cotizaciones (días)" helpText="Días por defecto para nuevas cotizaciones">
            <input className="input" type="number" min="1" value={cfg.cotizacion_validez || '15'} onChange={e => set('cotizacion_validez', e.target.value)} style={{ maxWidth: 120 }} />
          </FIELD>

          <div style={{ gridColumn: '1/-1', borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
               Asignación masiva de códigos
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
              Los productos que ya existen en la base de datos sin código pueden recibir uno automáticamente con el prefijo configurado arriba (<strong>{cfg.producto_prefijo || 'WSP'}</strong>).
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => asignarCodigos(true)}
                disabled={asignando}
                className="btn-primary"
                style={{ fontSize: 13 }}
              >
                {asignando ? 'Asignando...' : `Asignar a productos sin código`}
              </button>
              <button
                onClick={() => asignarCodigos(false)}
                disabled={asignando}
                className="btn-ghost"
                style={{ fontSize: 13, borderColor: '#fca5a5', color: '#dc2626' }}
              >
                Reasignar a TODOS los productos
              </button>
            </div>

            {resultadoAsignacion && (
              <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, color: '#16a34a', marginBottom: 8, fontSize: 13 }}>
                   {resultadoAsignacion.mensaje}
                </div>
                {resultadoAsignacion.productos?.length > 0 && (
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#dcfce7' }}>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: '#166534' }}>Código asignado</th>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: '#166534' }}>Producto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadoAsignacion.productos.map((p: any) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #dcfce7' }}>
                            <td style={{ padding: '3px 8px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{p.codigo}</td>
                            <td style={{ padding: '3px 8px', color: '#374151' }}>{p.nombre}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </SECTION>
      )}

      {/* VENTAS Y TICKETS */}
      {activeTab === 'ventas' && (
        <SECTION title="Ventas y Tickets de Impresión" icon="">
          <FIELD label="Mensaje en el ticket" full helpText="Aparece al final de cada ticket impreso">
            <input className="input" value={cfg.ticket_mensaje || ''} onChange={e => set('ticket_mensaje', e.target.value)} placeholder="¡Gracias por su compra! Vuelva pronto." />
          </FIELD>
          <FIELD label="Mostrar logo en el ticket">
            {toggle('ticket_mostrar_logo')}
          </FIELD>
          <FIELD label="Factura por correo (Resend)" full helpText="Envía automáticamente la factura al email del cliente al completar una venta">
            {toggle('email_factura_activo')}
          </FIELD>
          {cfg.email_factura_activo === 'true' && (
            <div style={{ gridColumn: '1/-1', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#166534', marginBottom: 12 }}>Configuración de Resend</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>RESEND_API_KEY</label>
                  <input className="input" type="password" value={cfg.resend_api_key || ''} onChange={e => set('resend_api_key', e.target.value)} placeholder="re_xxxxxxxxxxxxxxxxxxxx" />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Obtén tu key en <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#1581E3' }}>resend.com/api-keys</a></div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>EMAIL_FROM (remitente)</label>
                  <input className="input" value={cfg.email_from || ''} onChange={e => set('email_from', e.target.value)} placeholder="factura@tudominio.com" />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Para pruebas usa: <code>onboarding@resend.dev</code></div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                <strong>Nota:</strong> Si usas tu propio dominio (recomendado), primero verifícalo en Resend → Domains. Si solo tienes la API key sin dominio verificado, usa <code>onboarding@resend.dev</code> como remitente — solo funciona para testing.
              </div>
            </div>
          )}
        </SECTION>
      )}

      {/* FEL */}
      {activeTab === 'fel' && (
        <>
          <div style={{ background: cfg.fel_activo === 'true' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${cfg.fel_activo === 'true' ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>{cfg.fel_activo === 'true' ? '' : '⚙'}</span>
            <div>
              <div style={{ fontWeight: 700, color: cfg.fel_activo === 'true' ? '#166534' : '#92400e', marginBottom: 4 }}>
                {cfg.fel_activo === 'true' ? 'FEL Activado' : 'FEL Desactivado — Pendiente de configurar'}
              </div>
              <div style={{ fontSize: 12, color: cfg.fel_activo === 'true' ? '#166534' : '#78350f', lineHeight: 1.6 }}>
                {cfg.fel_activo === 'true'
                  ? 'El sistema está emitiendo facturas electrónicas. Ambiente: ' + (cfg.fel_ambiente === 'produccion' ? ' Producción (SAT real)' : ' Pruebas')
                  : 'Cuando tengas contrato con un certificador autorizado, llena los datos y activa FEL. Las credenciales van en Variables de Entorno de Vercel para mayor seguridad.'}
              </div>
            </div>
          </div>

          <SECTION title="Factura Electrónica FEL — SAT Guatemala" icon="🇬🇹">
            <FIELD label="Estado de FEL" full>
              {toggle('fel_activo')}
            </FIELD>
            <FIELD label="Certificador autorizado" helpText="Empresa certificadora contratada">
              {sel('fel_certificador', [
                { value: 'infile', label: 'INFILE (Recomendado)' },
                { value: 'digifact', label: 'Digifact' },
                { value: 'g4s', label: 'G4S' },
                { value: 'megaprint', label: 'Megaprint' },
                { value: 'otro', label: 'Otro' },
              ])}
            </FIELD>
            <FIELD label="Ambiente" helpText="Usa Pruebas hasta verificar que funciona, luego cambia a Producción">
              {sel('fel_ambiente', [
                { value: 'pruebas', label: 'Pruebas (no envía al SAT)' },
                { value: 'produccion', label: 'Producción (SAT real)' },
              ])}
            </FIELD>
            <FIELD label="NIT del emisor" helpText="Tu NIT de contribuyente">
              <input className="input" value={cfg.fel_nit_emisor || ''} onChange={e => set('fel_nit_emisor', e.target.value)} placeholder="Ej: 12345678" />
            </FIELD>
            <FIELD label="Nombre del emisor">
              <input className="input" value={cfg.fel_nombre_emisor || ''} onChange={e => set('fel_nombre_emisor', e.target.value)} placeholder="WebSoft Solutions" />
            </FIELD>
            <FIELD label="Usuario API del certificador" helpText="Credencial que te dio el certificador" full>
              <input className="input" value={cfg.fel_usuario || ''} onChange={e => set('fel_usuario', e.target.value)} placeholder="usuario@tuempresa.com" />
            </FIELD>

            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: 12, fontSize: 12, color: '#78350f' }}>
                <strong> Seguridad:</strong> La contraseña/clave del certificador NO se guarda aquí. Agrégala directamente en <strong>Vercel → Settings → Environment Variables</strong> como <code>FEL_CLAVE</code>. Esto evita que aparezca en la base de datos.
              </div>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10 }}> Pasos para activar FEL</div>
                {[
                  { n: '1', t: 'Contratar certificador', d: 'INFILE (infile.com.gt) o Digifact (digifact.com.gt) — desde Q45/mes. Pide tus credenciales de API.' },
                  { n: '2', t: 'Agregar clave en Vercel', d: 'Vercel → Settings → Environment Variables → FEL_CLAVE = tu contraseña del certificador.' },
                  { n: '3', t: 'Llenar datos arriba', d: 'Ingresa NIT emisor, nombre, usuario y selecciona tu certificador.' },
                  { n: '4', t: 'Probar en ambiente de pruebas', d: 'Activa FEL con ambiente "Pruebas", realiza una venta y verifica que no hay errores.' },
                  { n: '5', t: 'Cambiar a Producción', d: 'Cuando todo esté bien, cambia el ambiente a "Producción". Cada venta generará DTE válido ante SAT.' },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{s.n}</div>
                    <div><strong style={{ color: '#0f172a' }}>{s.t}:</strong> <span style={{ color: '#475569' }}>{s.d}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </SECTION>
        </>
      )}

      {/* ALERTAS */}
      {activeTab === 'alertas' && (
        <SECTION title="Alertas y Notificaciones" icon="">
          <FIELD label="Stock mínimo para alerta" helpText="El sistema marcará en rojo los productos con stock igual o menor a este valor">
            <input className="input" type="number" min="0" value={cfg.stock_alerta_minimo || '5'} onChange={e => set('stock_alerta_minimo', e.target.value)} style={{ maxWidth: 120 }} />
          </FIELD>
          <FIELD label="Vista previa de alertas de stock" full>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, fontSize: 12, color: '#991b1b' }}>
              ⚠ Se mostrarán alertas cuando el stock de un producto sea ≤ <strong>{cfg.stock_alerta_minimo || '5'}</strong> unidades
            </div>
          </FIELD>
        </SECTION>
      )}

      {/* TIENDA ONLINE */}
      {activeTab === 'tienda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#1e40af' }}>
             Tu tienda en línea se conecta automáticamente al POS. Los precios y stock se sincronizan en tiempo real. Los pedidos llegan al módulo <strong>Pedidos Web</strong>.
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Variables de entorno necesarias en Vercel</div>
            {[
              { key: 'STRIPE_SECRET_KEY', desc: 'Clave secreta de Stripe (stripe.com → Developers → API Keys)', req: true },
              { key: 'STRIPE_WEBHOOK_SECRET', desc: 'Secret del webhook de Stripe (para confirmar pagos automáticamente)', req: true },
              { key: 'NEXT_PUBLIC_POS_URL', desc: 'URL de tu POS (ej: https://websoft-pos-web.vercel.app)', req: true },
              { key: 'NEXT_PUBLIC_LANDING_URL', desc: 'URL de tu landing (ej: https://websoftsolutions.com.gt)', req: true },
            ].map(v => (
              <div key={v.key} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 5, fontSize: 12, fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{v.key}</code>
                  {v.req && <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>Requerido</span>}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{v.desc}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>API pública del catálogo</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Tu landing page puede llamar a estas URLs para obtener datos en tiempo real:</div>
            {[
              { url: '/api/tienda/productos', desc: 'Lista todos los productos con precio y stock actual' },
              { url: '/api/tienda/productos?categoria=CCTV', desc: 'Filtra por categoría' },
              { url: '/api/tienda/productos?buscar=camara', desc: 'Busca por nombre' },
              { url: '/api/tienda/pedidos (POST)', desc: 'Recibe pedidos de la tienda' },
              { url: '/api/tienda/checkout (POST)', desc: 'Crea sesión de pago en Stripe' },
            ].map(e => (
              <div key={e.url} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <code style={{ fontSize: 11, color: '#2563eb', fontFamily: 'monospace' }}>{e.url}</code>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUENTAS BANCARIAS */}
      {activeTab === 'cuentas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#1e40af' }}>
            Configura tus cuentas bancarias. Se usarán en el PDF descargable que puedes enviar a clientes para depósitos.
          </div>

          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Banco {i}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <FIELD label="Nombre del banco">
                  <input className="input" value={cfg[`banco${i}_nombre`] || ''} onChange={e => set(`banco${i}_nombre`, e.target.value)} placeholder="Ej: BANRURAL" />
                </FIELD>
                <FIELD label="Número de cuenta">
                  <input className="input" value={cfg[`banco${i}_cuenta`] || ''} onChange={e => set(`banco${i}_cuenta`, e.target.value)} placeholder="0000000000" />
                </FIELD>
                <FIELD label="Nombre del titular">
                  <input className="input" value={cfg[`banco${i}_titular`] || ''} onChange={e => set(`banco${i}_titular`, e.target.value)} placeholder="WebSoft Solutions" />
                </FIELD>
              </div>
            </div>
          ))}

          <div className="card" style={{ padding: 18 }}>
            <FIELD label="Nota / advertencia al pie" full>
              <textarea className="input" rows={3} value={cfg.cuentas_nota || ''} onChange={e => set('cuentas_nota', e.target.value)} placeholder="Estas son las únicas cuentas bancarias donde puede realizar su depósito..." />
            </FIELD>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-primary" onClick={() => save(['banco1_nombre','banco1_cuenta','banco1_titular','banco2_nombre','banco2_cuenta','banco2_titular','banco3_nombre','banco3_cuenta','banco3_titular','banco4_nombre','banco4_cuenta','banco4_titular','cuentas_nota'])}>
              Guardar cuentas
            </button>
            <button className="btn-ghost" onClick={() => window.open('/api/config/cuentas-pdf', '_blank')}>
              Ver PDF de cuentas
            </button>
            <a href="/api/config/cuentas-pdf" target="_blank"
              style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={e => {
                e.preventDefault()
                const w = window.open('/api/config/cuentas-pdf', '_blank')
                if (w) setTimeout(() => w.print(), 800)
              }}>
              Imprimir / Descargar PDF
            </a>
          </div>
        </div>
      )}

      {/* ZONAS DE INSTALACIÓN */}
      {activeTab === 'zonas' && <ZonasInstalacionTab />}

      {/* Save button bottom */}
      {activeTab !== 'zonas' && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn-primary" onClick={() => save()} disabled={loading} style={{ minWidth: 160, padding: '12px 24px' }}>
          {loading ? 'Guardando...' : saved ? ' Guardado' : ' Guardar Configuración'}
        </button>
      </div>
      )}
    </div>
  )
}
