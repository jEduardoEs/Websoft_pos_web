/**
 * WebSoft Solutions — Integración FEL (Factura Electrónica en Línea)
 * Certificador: INFILE S.A. — NIT 12521337
 *
 * Modos:
 *   FEL_MODO=sandbox   → Mock local, no llama a INFILE (usar mientras no hay contrato)
 *   FEL_MODO=pruebas   → Ambiente de pruebas oficial INFILE
 *   FEL_MODO=produccion → SAT real
 *
 * Variables de entorno requeridas (Vercel → Settings → Environment Variables):
 *   FEL_MODO           → "sandbox" | "pruebas" | "produccion"
 *   FEL_USUARIO        → usuario proporcionado por INFILE
 *   FEL_CLAVE          → clave/token de INFILE (NO guardar en DB)
 *   FEL_NIT_EMISOR     → NIT sin guion de WebSoft Solutions (115471413)
 *   FEL_NOMBRE_EMISOR  → "WebSoft Solutions"
 *   FEL_DIRECCION      → "Barrio el Calvario, Guastatoya, El Progreso"
 *   FEL_CODIGO_POSTAL  → "22001" (código postal El Progreso)
 *   FEL_DEPARTAMENTO   → "El Progreso"
 *   FEL_MUNICIPIO      → "Guastatoya"
 *   FEL_CORREO_EMISOR  → email de WebSoft Solutions
 *   FEL_SERIE          → serie asignada por INFILE (ej: "A" o "WSFT")
 */

export interface FELItem {
  cantidad: number
  descripcion: string
  precioUnitario: number
  descuento: number
  subtotal: number
  codigoProducto?: string
  unidadMedida?: string // "UND" por defecto
}

export interface FELInput {
  /** Número interno de la venta, ej: FAC-000042 */
  numeroInterno: string
  /** "FACT" = Factura, "FCAM" = Factura Cambiaria, "FESP" = Factura Especial */
  tipoDTE?: 'FACT' | 'FCAM' | 'FESP'
  /** NIT del cliente. "CF" = Consumidor Final */
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
  /** Fecha y hora de la venta en ISO 8601 */
  fechaEmision?: string
}

export interface FELResponse {
  ok: boolean
  /** UUID de autorización SAT (36 chars) */
  uuid?: string
  /** Serie asignada por INFILE */
  serie?: string
  /** Número correlativo */
  numero?: number
  /** Fecha y hora de certificación */
  fechaCertificacion?: string
  /** XML DTE firmado (para almacenar) */
  xmlCertificado?: string
  /** URL del PDF en INFILE (opcional) */
  pdfUrl?: string
  error?: string
  /** En modo sandbox, indica que es simulado */
  sandbox?: boolean
}

// ─── URLs INFILE ───────────────────────────────────────────────────────────────
const INFILE_URLS = {
  pruebas:    'https://api.feel-gt.com/api/documentos/emision/json/dte/?ambiente=2',
  produccion: 'https://api.feel-gt.com/api/documentos/emision/json/dte/?ambiente=1',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function nowGT(): string {
  // Guatemala es UTC-6, sin DST
  const now = new Date()
  const gt = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  return gt.toISOString().replace('Z', '-06:00').slice(0, 19) + '-06:00'
}

function nitFormat(nit: string): string {
  // INFILE quiere NIT sin guion, solo dígitos. CF se manda como "CF"
  if (!nit || nit.toUpperCase() === 'CF') return 'CF'
  return nit.replace(/[^0-9Kk]/g, '').toUpperCase()
}

// ─── Construir JSON DTE para INFILE ────────────────────────────────────────────
function buildDTE(input: FELInput): object {
  const env = process.env

  const tipoDTE = input.tipoDTE || 'FACT'
  const fechaEmision = input.fechaEmision || nowGT()

  // Calcular totales
  const baseImponible = input.total - input.impuesto
  const ivaTasa = 12

  const frases = tipoDTE === 'FACT'
    ? [{ TipoFrase: 1, CodigoEscenario: 1 }]  // SUJETO A PAGOS TRIMESTRALES ISR
    : [{ TipoFrase: 2, CodigoEscenario: 1 }]

  const items = input.items.map((it, idx) => ({
    NumeroLinea: idx + 1,
    BienOServicio: 'B',
    Cantidad: it.cantidad,
    UnidadMedida: it.unidadMedida || 'UND',
    Descripcion: it.descripcion,
    PrecioUnitario: Number(it.precioUnitario.toFixed(5)),
    Precio: Number((it.precioUnitario * it.cantidad).toFixed(5)),
    Descuento: Number((it.descuento || 0).toFixed(5)),
    Impuestos: [{
      NombreCorto: 'IVA',
      CodigoUnidadGravable: 1,
      MontoGravable: Number(((it.subtotal - it.descuento) / 1.12).toFixed(5)),
      MontoImpuesto: Number(((it.subtotal - it.descuento) - (it.subtotal - it.descuento) / 1.12).toFixed(5)),
    }],
    Total: Number((it.subtotal - (it.descuento || 0)).toFixed(5)),
  }))

  return {
    Version: 1,
    DatosEmision: {
      IDDoc: {
        CodigoTipo: tipoDTE,
        FechaHoraEmision: fechaEmision,
        CodigoMoneda: 'GTQ',
        NumeroAcceso: Math.floor(Math.random() * 9000000000) + 1000000000,
      },
      Emisor: {
        NITEmisor: nitFormat(env.FEL_NIT_EMISOR || '115471413'),
        NombreEmisor: env.FEL_NOMBRE_EMISOR || 'WebSoft Solutions',
        CodigoEstablecimiento: 1,
        TipoEmisor: 'INDIVIDUAL',
        NombreComercial: env.FEL_NOMBRE_EMISOR || 'WebSoft Solutions',
        DireccionEmisor: {
          Direccion: env.FEL_DIRECCION || 'Barrio el Calvario, Guastatoya, El Progreso',
          CodigoPostal: env.FEL_CODIGO_POSTAL || '22001',
          Municipio: env.FEL_MUNICIPIO || 'Guastatoya',
          Departamento: env.FEL_DEPARTAMENTO || 'El Progreso',
          Pais: 'GT',
        },
        CorreoEmisor: env.FEL_CORREO_EMISOR || '',
        AfiliacionIVA: 'GEN',
      },
      Receptor: {
        IDReceptor: nitFormat(input.nitReceptor),
        NombreReceptor: input.nombreReceptor || 'Consumidor Final',
        CorreoReceptor: input.correoReceptor || '',
        DireccionReceptor: {
          Direccion: input.direccionReceptor || 'Ciudad',
          CodigoPostal: '01001',
          Municipio: 'Guatemala',
          Departamento: 'Guatemala',
          Pais: 'GT',
        },
      },
      Frases: frases,
      Items: { Item: items },
      Totales: {
        TotalImpuestos: {
          TotalImpuesto: [{
            NombreCorto: 'IVA',
            TotalMontoImpuesto: Number(input.impuesto.toFixed(5)),
          }],
        },
        GranTotal: Number(input.total.toFixed(5)),
      },
    },
  }
}

// ─── Mock para sandbox ─────────────────────────────────────────────────────────
function mockResponse(input: FELInput): FELResponse {
  const uuid = 'SANDBOX-' + Math.random().toString(36).substring(2, 10).toUpperCase() +
               '-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  return {
    ok: true,
    uuid,
    serie: process.env.FEL_SERIE || 'TEST',
    numero: Math.floor(Math.random() * 900000) + 100000,
    fechaCertificacion: nowGT(),
    xmlCertificado: `<!-- XML DTE SANDBOX — ${input.numeroInterno} -->`,
    sandbox: true,
  }
}

// ─── Función principal ─────────────────────────────────────────────────────────
export async function emitirFEL(input: FELInput): Promise<FELResponse> {
  const modo = (process.env.FEL_MODO || 'sandbox').toLowerCase()

  // Modo sandbox: no llama a INFILE
  if (modo === 'sandbox') {
    console.log('[FEL] Modo SANDBOX — simulando DTE para', input.numeroInterno)
    return mockResponse(input)
  }

  const usuario = process.env.FEL_USUARIO
  const clave   = process.env.FEL_CLAVE

  if (!usuario || !clave) {
    console.error('[FEL] Faltan credenciales FEL_USUARIO / FEL_CLAVE')
    return { ok: false, error: 'Credenciales FEL no configuradas' }
  }

  const url = modo === 'produccion' ? INFILE_URLS.produccion : INFILE_URLS.pruebas
  const dte = buildDTE(input)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'usuario': usuario,
        'llave': clave,
        'identificador': input.numeroInterno,
      },
      body: JSON.stringify(dte),
    })

    const data = await res.json()

    if (!res.ok || data.resultado !== true) {
      console.error('[FEL] Error INFILE:', data)
      return {
        ok: false,
        error: data.descripcion || data.mensaje || `HTTP ${res.status}`,
      }
    }

    return {
      ok: true,
      uuid:               data.uuid,
      serie:              data.serie,
      numero:             data.numero,
      fechaCertificacion: data.fecha_certificacion || nowGT(),
      xmlCertificado:     data.xml_certificado,
      pdfUrl:             data.pdf_url,
    }

  } catch (err: any) {
    console.error('[FEL] Error de red:', err.message)
    return { ok: false, error: 'Error de conexión con INFILE: ' + err.message }
  }
}

// ─── Anulación DTE ─────────────────────────────────────────────────────────────
export async function anularFEL(uuid: string, motivo: string): Promise<{ ok: boolean; error?: string }> {
  const modo = (process.env.FEL_MODO || 'sandbox').toLowerCase()
  if (modo === 'sandbox') {
    console.log('[FEL] Anulación SANDBOX — UUID:', uuid)
    return { ok: true }
  }

  const usuario = process.env.FEL_USUARIO
  const clave   = process.env.FEL_CLAVE
  if (!usuario || !clave) return { ok: false, error: 'Credenciales no configuradas' }

  const url = modo === 'produccion'
    ? 'https://api.feel-gt.com/api/documentos/anulacion/json/dte/?ambiente=1'
    : 'https://api.feel-gt.com/api/documentos/anulacion/json/dte/?ambiente=2'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'usuario': usuario,
        'llave': clave,
      },
      body: JSON.stringify({
        Version: 1,
        DatosAnulacion: {
          IDDoc: {
            FechaEmisionDocumentoAnular: nowGT(),
            FechaAnulacion: nowGT(),
            NITEmisor: process.env.FEL_NIT_EMISOR || '115471413',
            IDReceptor: 'CF',
            NumeroDocumentoAnular: uuid,
            MotivoAnulacion: motivo,
          },
        },
      }),
    })
    const data = await res.json()
    if (data.resultado !== true) return { ok: false, error: data.descripcion }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}
