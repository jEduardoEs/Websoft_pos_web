'use client'

export default function FelPage() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 800 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Facturación Electrónica FEL</h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Integración con SAT Guatemala — Factura Electrónica en Línea</p>
      </div>

      {/* Status */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20 }}>⚙️</span>
        <div>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Pendiente de configurar</div>
          <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
            Para emitir facturas electrónicas válidas en Guatemala necesitas contratar un <strong>Certificador de FEL</strong> autorizado por el SAT. Una vez que tengas tu contrato, se activa en 3 pasos.
          </div>
        </div>
      </div>

      {/* Certificadores recomendados */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>Certificadores autorizados SAT — Recomendaciones</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { nombre: 'INFILE', url: 'https://infile.com.gt', precio: 'Desde Q50/mes', recomendado: true, desc: 'El más usado en Guatemala. API REST fácil de integrar, soporte local, planes para pequeños contribuyentes.' },
            { nombre: 'Digifact', url: 'https://digifact.com.gt', precio: 'Desde Q45/mes', recomendado: true, desc: 'Buen soporte técnico, integración simple. Popular en comercios medianos.' },
            { nombre: 'G4S', url: 'https://gt.g4s.com', precio: 'Consultar', recomendado: false, desc: 'Para empresas más grandes, con más requerimientos de seguridad.' },
            { nombre: 'Megaprint', url: 'https://megaprint.com.gt', precio: 'Desde Q40/mes', recomendado: false, desc: 'Buena opción económica, sencillo de configurar.' },
          ].map(c => (
            <div key={c.nombre} style={{ border: `1.5px solid ${c.recomendado ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 10, padding: 14, background: c.recomendado ? '#f8fafc' : '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{c.nombre}</span>
                {c.recomendado && <span style={{ fontSize: 10, fontWeight: 700, background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: 10 }}>⭐ Recomendado</span>}
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

      {/* Pasos para integrar */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>Cómo activar FEL en este sistema (3 pasos)</div>
        {[
          { num: '1', title: 'Contratar certificador', desc: 'Elige INFILE o Digifact, contrata el plan básico y pide tus credenciales de API (usuario, clave, NIT emisor).' },
          { num: '2', title: 'Configurar en Vercel', desc: 'Agrega en Vercel → Settings → Environment Variables: FEL_CERTIFICADOR=infile, FEL_USUARIO=tu_usuario, FEL_CLAVE=tu_clave, FEL_NIT_EMISOR=tu_nit, FEL_NOMBRE_EMISOR=WebSoft Solutions.' },
          { num: '3', title: 'Activar en configuración', desc: 'Ve a Configuración → Sistema → activa "Facturación FEL". A partir de ese momento cada venta genera automáticamente la factura electrónica y la envía al SAT.' },
        ].map(s => (
          <div key={s.num} style={{ display: 'flex', gap: 14, marginBottom: 16, padding: '14px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{s.num}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Qué incluye FEL */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>Qué incluirá la integración FEL</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            '✅ Factura electrónica automática en cada venta',
            '✅ Envío automático al SAT en tiempo real',
            '✅ PDF de DTE para imprimir o enviar por WhatsApp',
            '✅ Nota de crédito en devoluciones',
            '✅ Factura cambiaria y especial',
            '✅ Anulación electrónica de facturas',
            '✅ Historial de DTE emitidos',
            '✅ QR de verificación SAT en cada factura',
          ].map(item => (
            <div key={item} style={{ fontSize: 13, color: '#374151', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>{item}</div>
          ))}
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#166534' }}>
        💡 <strong>Para pequeño contribuyente</strong> — con tu régimen del 5% de ISR, el FEL aplica igual. El certificador te guía en la configuración específica para tu tipo de contribuyente.
      </div>
    </div>
  )
}
