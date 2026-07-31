import { prisma } from '@/lib/prisma'

export const clientesRepository = {
  findClientes(buscar: string) {
    const where: any = { activo: true }
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { nit: { contains: buscar, mode: 'insensitive' } },
        { telefono: { contains: buscar, mode: 'insensitive' } },
      ]
    }
    return prisma.cliente.findMany({ where, orderBy: { nombre: 'asc' } })
  },

  createCliente(data: any) {
    return prisma.cliente.create({ data })
  },

  updateCliente(id: number, data: any) {
    return prisma.cliente.update({ where: { id }, data })
  },

  softDeleteCliente(id: number) {
    return prisma.cliente.update({ where: { id }, data: { activo: false } })
  },
}
