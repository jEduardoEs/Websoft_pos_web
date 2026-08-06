export interface Orden {
  id: number
  numero: string
  fecha: string
  clienteNombre: string
  clienteTelefono: string | null
  clienteNit?: string | null
  tipoEquipo: string
  marca: string | null
  modelo: string | null
  serie?: string | null
  accesorios?: string | null
  descripcionFalla: string
  observaciones?: string | null
  estado: string
  prioridad: string
  diagnostico: string | null
  trabajoRealizado: string | null
  costoReparacion: number
  costoRepuestos: number
  total: number
  tecnicoNombre: string | null
  fechaPromesa: string | null
  fechaEntrega: string | null
  repuestos: any[]
  historial: any[]
}

export class ServicioService {
  static async getOrdenes(filtroEstado?: string, buscar?: string): Promise<Orden[]> {
    const params = new URLSearchParams()
    if (filtroEstado) params.set('estado', filtroEstado)
    if (buscar) params.set('buscar', buscar)
    
    const res = await fetch(`/api/ordenes?${params.toString()}`)
    return res.json()
  }

  static async createOrden(data: any): Promise<any> {
    const res = await fetch('/api/ordenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  static async cambiarEstado(id: number, estado: string, comentario: string): Promise<any> {
    const res = await fetch(`/api/ordenes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, comentario }),
    })
    return res.json()
  }

  static async getOrdenById(id: number): Promise<Orden> {
    const res = await fetch(`/api/ordenes/${id}`)
    return res.json()
  }
}
