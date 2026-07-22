// Integración FEL con DTEvia (QAPI) para Guatemala
// Docs: https://docs.dtevia.com.gt
// La API key se lee de Config (clave: dtevia_api_key) con fallback a env DTEVIA_API_KEY
// Key qapi_test_... = sandbox (certificador MOCK), qapi_live_... = producción SAT

import { prisma } from './prisma'

export interface FELItem {
  cantidad: number
  descripcion: string
  precioUnitario: number   // precio CON IVA (como se maneja en el POS)
  descuento: number
  subtotal: number
  codigoProducto?: string
  unidadMedida?: string
}

export interface FELInput {
  numeroInterno: string
  tipoDTE?: 'FACT'
  nitReceptor: string
  nombreReceptor: string
  correoReceptor?: string
  direccionReceptor?: string
  items: FELItem[]
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  metodoPago?: string
  fechaEmision?: string
}

export interface FELResponse {
  ok: boolean
  uuid?: string
  serie?: string
  numero?: number
  fechaCertificacion?: string
  xmlCertificado?: string
  pdfUrl?: string
  error?: string
  sandbox?: boolean
}

const BASE = 'https://api.dtevia.com.gt/v1'

function nowGT(): string {
  const gt = new Date(Date.now() - 6 * 60 * 60 * 1000)
  return gt.toISOString().slice(0, 19) + '-06:00'
}

function nitFormat(nit: string): string {
  if (!nit || nit.trim().toUpperCase() === 'CF') return 'CF'
  return nit.replace(/[^0-9Kk]/g, '').toUpperCase()
}

async function getApiKey(): Promise<string | null> {
  try {
    const row = await prisma.config.findUnique({ where: { clave: 'dtevia_api_key' } })
    if (row?.valor) return row.valor
  } catch {}
  return process.env.DTEVIA_API_KEY || null
}

function buildInvoice(input: FELInput) {
  const env = process.env
  // DTEvia pide precio_unitario SIN IVA; el POS maneja precios CON IVA (12%)
  const items = input.items.map(it => {
    const totalLinea = it.subtotal - (it.descuento || 0)   // con IVA
    const gravable = totalLinea / 1.12
    const iva = totalLinea - gravable
    return {
      tipo: 'B',
      cantidad: it.cantidad,
      unidad_medida: it.unidadMedida || 'UND',
      descripcion: it.descripcion,
      precio_unitario: Number((it.precioUnitario / 1.12).toFixed(6)),
      descuento: Number(((it.descuento || 0) / 1.12).toFixed(6)),
      impuestos: [{
        nombre: 'IVA',
        codigo_unidad_gravable: 1,
        monto_gravable: Number(gravable.toFixed(6)),
        monto_impuesto: Number(iva.toFixed(6)),
      }],
    }
  })

  return {
    tipo_dte: 'FACT',
    moneda: 'GTQ',
    fecha_emision: input.fechaEmision || nowGT(),
    emisor: {
      nit: nitFormat(env.FEL_NIT_EMISOR || '115471413'),
      nombre: env.FEL_NOMBRE_EMISOR || 'WebSoft Solutions',
      nombre_comercial: env.FEL_NOMBRE_EMISOR || 'WebSoft Solutions',
      codigo_establecimiento: 1,
      afiliacion_iva: 'GEN',
      direccion: {
        calle: env.FEL_DIRECCION || 'Barrio el Calvario',
        municipio: env.FEL_MUNICIPIO || 'Guastatoya',
        departamento: env.FEL_DEPARTAMENTO || 'El Progreso',
        codigo_postal: env.FEL_CODIGO_POSTAL || '02001',
        pais: 'GT',
      },
      correo: env.FEL_CORREO_EMISOR || 'fact@websoftsolutions.com.gt',
    },
    receptor: {
      id: nitFormat(input.nitReceptor),
      tipo_id: 'NIT',
      nombre: input.nombreReceptor || 'Consumidor Final',
      ...(input.correoReceptor ? { correo: input.correoReceptor } : {}),
    },
    frases: [{ tipo_frase: 1, codigo_escenario: 1 }],
    items,
  }
}

async function pollCertification(invoiceId: string, apiKey: string): Promise<any> {
  const headers = { Authorization: `Bearer ${apiKey}` }
  for (let i = 0; i < 12; i++) {
    const res = await fetch(`${BASE}/invoices/${invoiceId}`, { headers })
    const inv = await res.json()
    if (inv.status === 'CERTIFIED') return inv
    if (inv.status === 'FAILED') throw new Error(inv.error_message || 'Certificación fallida')
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error('Timeout esperando certificación DTEvia')
}

export async function emitirFEL(input: FELInput): Promise<FELResponse> {
  const apiKey = await getApiKey()
  if (!apiKey) {
    console.error('[FEL] DTEVIA_API_KEY no configurada (Config dtevia_api_key o env var)')
    return { ok: false, error: 'API key de DTEvia no configurada' }
  }

  const esSandbox = apiKey.startsWith('qapi_test_')
  const payload = buildInvoice(input)

  try {
    const res = await fetch(`${BASE}/invoices`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok || !data.id) {
      console.error('[FEL] Error DTEvia:', data)
      return { ok: false, error: data.message || data.error || `HTTP ${res.status}` }
    }

    const cert = await pollCertification(data.id, apiKey)

    return {
      ok: true,
      uuid: cert.uuid_sat,
      serie: cert.serie,
      numero: Number(cert.numero_dte),
      fechaCertificacion: cert.certified_at,
      pdfUrl: cert.pdf_url,
      sandbox: esSandbox,
    }
  } catch (err: any) {
    console.error('[FEL] Error DTEvia:', err)
    return { ok: false, error: err?.message || 'Error interno DTEvia' }
  }
}
