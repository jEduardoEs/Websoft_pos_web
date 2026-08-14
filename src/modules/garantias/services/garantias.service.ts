export interface Garantia {
  id: number
  numero: string
  fechaVenta: string
  fechaVencimiento: string
  diasGarantia: number
  clienteNombre: string
  clienteTelefono: string | null
  clienteNit: string | null
  productoNombre: string
  productoSerie: string | null
  ventaNumero: string | null
  estado: string
  condiciones: string | null
}

export interface Reclamo {
  id: number
  numero: string
  fecha: string
  garantiaNumero: string
  clienteNombre: string
  motivoReclamo: string
  descripcionFalla: string
  tieneFactura: boolean
  numeroFactura: string | null
  estado: string
  decision: string | null
  resolucion: string | null
  ordenTrabajoId: number | null
}

export class GarantiasService {
  static async getGarantias(buscar?: string, estado?: string): Promise<Garantia[]> {
    const params = new URLSearchParams()
    if (buscar) params.set('buscar', buscar)
    if (estado) params.set('estado', estado)
    const res = await fetch(`/api/garantias?${params.toString()}`)
    return res.json()
  }

  static async getReclamos(garantiaId?: number): Promise<Reclamo[]> {
    const p = garantiaId ? `?garantia_id=${garantiaId}` : ''
    const res = await fetch(`/api/garantias/reclamos${p}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Error al cargar reclamos (status ${res.status})`)
    }
    return res.json()
  }

  static async getVentas(): Promise<any[]> {
    const res = await fetch('/api/ventas?estado=completada')
    return res.json()
  }

  static async createGarantia(data: any): Promise<any> {
    const res = await fetch('/api/garantias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  static async createReclamo(data: any): Promise<any> {
    const res = await fetch('/api/garantias/reclamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  static async resolverReclamo(reclamoId: number, data: any): Promise<any> {
    const res = await fetch(`/api/garantias/reclamos/${reclamoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  static async anularGarantia(id: number): Promise<any> {
    const res = await fetch(`/api/garantias/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'anulada' }),
    })
    return res.json()
  }

  static async eliminarGarantia(id: number): Promise<any> {
    const res = await fetch(`/api/garantias/${id}`, {
      method: 'DELETE',
    })
    return res.json()
  }
}
