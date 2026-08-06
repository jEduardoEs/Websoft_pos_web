export interface Mant {
  id: number;
  numero: number;
  fechaProgramada: string;
  fechaRealizada: string | null;
  realizado: boolean;
  notas: string | null;
  cobrado: boolean;
  montoCobrado: number;
  tecnicoNombre: string | null;
  imagenes: string | null;
}

export interface Garantia {
  id: number;
  numero: string;
  fechaVencimiento: string;
  estado: string;
  productoNombre: string;
  diasGarantia: number;
  condiciones: string | null;
  ventaNumero: string | null;
}

export interface Proyecto {
  id: number;
  numero: string;
  nombre: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  clienteDireccion: string | null;
  clienteNit: string | null;
  contactoNombre: string | null;
  descripcion: string;
  alcance: string | null;
  cotizacionNumero: string | null;
  estado: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  notas: string | null;
  usuarioNombre: string | null;
  mantenimientos: Mant[];
  garantias: Garantia[];
  createdAt: string;
}

export class ProyectosService {
  static async getProyectos(tab: string, buscar: string): Promise<{ proyectos: Proyecto[], proximos: number, vencidos: number }> {
    const params = new URLSearchParams()
    if (tab !== 'todos') params.set('estado', tab)
    if (buscar) params.set('buscar', buscar)
    
    const res = await fetch(`/api/proyectos?${params}`)
    if (!res.ok) throw new Error('Error al obtener proyectos')
    return await res.json()
  }

  static async createProyecto(form: any): Promise<any> {
    const res = await fetch('/api/proyectos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    return await res.json()
  }

  static async deleteProyecto(id: number, pin?: string): Promise<any> {
    const res = await fetch(`/api/proyectos/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    return await res.json()
  }

  static async getProyecto(id: number | string): Promise<Proyecto | null> {
    const res = await fetch(`/api/proyectos/${id}`)
    if (!res.ok) return null
    return await res.json()
  }

  static async updateProyecto(id: number | string, data: any): Promise<any> {
    const res = await fetch(`/api/proyectos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return await res.json()
  }

  static async marcarMantenimiento(id: number | string, mantId: number, data: any): Promise<any> {
    const res = await fetch(`/api/proyectos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'marcar_mantenimiento', mantId, ...data }),
    })
    return await res.json()
  }
}
