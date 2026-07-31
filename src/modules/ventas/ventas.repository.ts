import { prisma } from '@/lib/prisma'

export const ventasRepository = {
  transaction<T>(callback: (tx: any) => Promise<T>) {
    return prisma.$transaction(callback as any)
  },

  findVentas(where: any, db = prisma) {
    return db.venta.findMany({ where, orderBy: { fecha: 'desc' }, take: 200, include: { items: true } })
  },

  findConfigByClave(clave: string, db = prisma) {
    return db.config.findUnique({ where: { clave } })
  },

  updateConfigValor(clave: string, valor: string, db = prisma) {
    return db.config.update({ where: { clave }, data: { valor } })
  },

  findProductoById(id: number, db = prisma) {
    return db.producto.findUnique({ where: { id } })
  },

  createVenta(data: any, db = prisma) {
    return db.venta.create(data)
  },

  updateProductoStock(id: number, stock: number, db = prisma) {
    return db.producto.update({ where: { id }, data: { stock } })
  },

  createKardex(data: any, db = prisma) {
    return db.kardex.create({ data })
  },

  updateCotizacionEstado(id: number, estado: string, db = prisma) {
    return db.cotizacion.update({ where: { id }, data: { estado } })
  },

  updateClientesProspecto(nit: string, nombre: string, db = prisma) {
    return db.cliente.updateMany({
      where: {
        OR: [
          { nit },
          { nombre: { contains: nombre || '', mode: 'insensitive' } },
        ],
        tipo: 'prospecto',
      },
      data: { tipo: 'cliente' },
    })
  },

  createAuditLog(data: any, db = prisma) {
    return db.auditLog.create({ data })
  },

  updateVentaFelFields(id: number, data: any, db = prisma) {
    return db.venta.update({ where: { id }, data })
  },

  findVentaById(id: number, db = prisma) {
    return db.venta.findUnique({ where: { id } })
  },

  annularVenta(id: number, db = prisma) {
    return db.venta.update({ where: { id }, data: { estado: 'anulada' } })
  },
}
