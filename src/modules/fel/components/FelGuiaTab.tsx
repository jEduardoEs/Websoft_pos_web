import React from 'react';

export function FelGuiaTab() {
  return (
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
  );
}
