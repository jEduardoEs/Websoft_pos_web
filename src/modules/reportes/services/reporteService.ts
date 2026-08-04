export class ReporteService {
  static async obtenerReporteVentas(fechaIni: string, fechaFin: string) {
    const res = await fetch(`/api/reportes?fecha_ini=${fechaIni}&fecha_fin=${fechaFin}`)
    if (!res.ok) throw new Error('Error al generar reporte de ventas')
    return res.json()
  }

  static async obtenerReporteInventario() {
    const res = await fetch('/api/reportes/inventario')
    if (!res.ok) throw new Error('Error al generar valoración de inventario')
    return res.json()
  }

  static async obtenerReportePatrimonio() {
    const res = await fetch('/api/reportes/patrimonio')
    if (!res.ok) throw new Error('Error al generar reporte de patrimonio')
    return res.json()
  }
}
