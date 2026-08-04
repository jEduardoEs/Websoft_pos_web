import React from 'react';

interface FelEstadoTabProps {
  config: Record<string, string>;
  dteviaKey: string;
  setDteviaKey: (key: string) => void;
  savingKey: boolean;
  guardarDteviaKey: () => void;
  toggleFel: () => void;
}

export function FelEstadoTab({
  config, dteviaKey, setDteviaKey, savingKey, guardarDteviaKey, toggleFel
}: FelEstadoTabProps) {
  const modo = config.fel_ambiente || 'sandbox';
  const felActivo = config.fel_activo === 'true';
  const emailActivo = config.email_factura_activo === 'true';
  const certificador = config.fel_certificador || 'infile';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* API Key Panel */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#18181b', marginBottom: 4 }}>Certificador: DTEvia (QAPI)</div>
        <div style={{ fontSize: 12, color: '#8a887e', marginBottom: 16 }}>
          Pega tu API key de dtevia.com.gt. Con key <code style={{ background: '#f4f3ef', padding: '1px 5px', borderRadius: 3 }}>qapi_test_...</code> los DTE son de prueba; con <code style={{ background: '#f4f3ef', padding: '1px 5px', borderRadius: 3 }}>qapi_live_...</code> son reales ante la SAT.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>API Key DTEvia</label>
            <input 
              className="input" 
              type="password" 
              placeholder={config.dtevia_api_key ? '••••••••  (ya configurada)' : 'qapi_test_... o qapi_live_...'} 
              value={dteviaKey} 
              onChange={e => setDteviaKey(e.target.value)} 
            />
          </div>
          <button className="btn-primary" disabled={!dteviaKey || savingKey} onClick={guardarDteviaKey}>
            {savingKey ? 'Guardando...' : 'Guardar key'}
          </button>
          <button onClick={toggleFel}
            style={{ 
              padding: '10px 18px', borderRadius: 4, border: '1.5px solid', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: felActivo ? '#fef2f2' : '#f0fdf4',
              color: felActivo ? '#b13a2e' : '#166534',
              borderColor: felActivo ? '#e3c3bd' : '#bbf7d0' 
            }}>
            {felActivo ? 'Desactivar FEL' : 'Activar FEL'}
          </button>
        </div>
      </div>

      {/* Status card */}
      <div style={{ background: felActivo ? '#f0fdf4' : '#fffbeb', border: `1px solid ${felActivo ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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
  );
}
