import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Default config values
const DEFAULTS: Record<string, string> = {
  // Empresa
  empresa_nombre:       'WebSoft Solutions',
  empresa_nit:          'CF',
  empresa_direccion:    'Barrio el Calvario, Guastatoya, El Progreso',
  empresa_telefono:     '3836-1044 / 3671-4377',
  empresa_email:        '',
  empresa_web:          'websoft-solutions.vercel.app',
  // Facturación
  moneda_simbolo:       'Q',
  iva_porcentaje:       '5',
  regimen_fiscal:       'pequeno_contribuyente',
  numero_siguiente:     '1',
  factura_prefijo:      'FAC',
  // Productos
  producto_prefijo:     'WSP',
  producto_siguiente:   '1',
  // Cotizaciones
  cotizacion_prefijo:   'COT',
  numero_siguiente_cotizacion: '1',
  cotizacion_validez:   '15',
  // Tickets
  ticket_mensaje:       '¡Gracias por su compra! Vuelva pronto.',
  ticket_mostrar_logo:  'true',
  // Alertas
  stock_alerta_minimo:  '5',
  // FEL
  fel_activo:           'false',
  fel_certificador:     'infile',
  fel_usuario:          '',
  fel_clave:            '',
  fel_nit_emisor:       '',
  fel_nombre_emisor:    'WebSoft Solutions',
  fel_ambiente:         'pruebas', // pruebas | produccion
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const rows = await prisma.config.findMany()
    const cfg: Record<string, string> = { ...DEFAULTS }
    rows.forEach(r => { cfg[r.clave] = r.valor })
    return NextResponse.json(cfg)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    // Upsert each key
    const ops = Object.entries(body).map(([clave, valor]) =>
      prisma.config.upsert({
        where: { clave },
        update: { valor: String(valor) },
        create: { clave, valor: String(valor) },
      })
    )
    await prisma.$transaction(ops)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
