import { prisma } from '@/lib/prisma'
import { DescuentoMapper } from '../mappers/descuentoMapper'
import { CrearDescuentoDTO, DescuentoResponseDTO } from '../dto/DescuentoDTO'

export class DescuentosRepository {
  async findAll(): Promise<DescuentoResponseDTO[]> {
    const list = await prisma.descuento.findMany({ orderBy: { id: 'desc' } })
    return DescuentoMapper.toDTOList(list)
  }

  async findByCodigo(codigo: string): Promise<DescuentoResponseDTO | null> {
    if (!codigo || !codigo.trim()) return null
    const clean = codigo.trim()
    const cleanUpper = clean.toUpperCase()

    // 1. Exact uppercase match
    let d = await prisma.descuento.findFirst({
      where: { codigo: cleanUpper },
    })

    // 2. Case-insensitive mode match
    if (!d) {
      d = await prisma.descuento.findFirst({
        where: { codigo: { equals: clean, mode: 'insensitive' } },
      })
    }

    // 3. Robust fallback: scan in memory for SQLite case-sensitivity differences
    if (!d) {
      const all = await prisma.descuento.findMany()
      d = all.find(item => item.codigo.trim().toUpperCase() === cleanUpper) || null
    }

    if (!d) return null
    return DescuentoMapper.toDTO(d)
  }


  async create(data: CrearDescuentoDTO): Promise<DescuentoResponseDTO> {
    const created = await prisma.descuento.create({
      data: {
        codigo: data.codigo.trim().toUpperCase(),
        descripcion: data.descripcion || null,
        tipo: data.tipo || 'porcentaje',
        valor: Number(data.valor) || 0,
        minimoCompra: Number(data.minimoCompra) || 0,
        usosMaximos: Number(data.usosMaximos) || 0,
        fechaInicio: data.fechaInicio ? new Date(`${data.fechaInicio.slice(0, 10)}T00:00:00.000`) : null,
        fechaFin: data.fechaFin ? new Date(`${data.fechaFin.slice(0, 10)}T23:59:59.999`) : null,
      },
    })
    return DescuentoMapper.toDTO(created)
  }

  async update(id: number, data: CrearDescuentoDTO): Promise<DescuentoResponseDTO> {
    const updated = await prisma.descuento.update({
      where: { id: Number(id) },
      data: {
        codigo: data.codigo.trim().toUpperCase(),
        descripcion: data.descripcion || null,
        tipo: data.tipo || 'porcentaje',
        valor: Number(data.valor) || 0,
        minimoCompra: Number(data.minimoCompra) || 0,
        usosMaximos: Number(data.usosMaximos) || 0,
        fechaInicio: data.fechaInicio ? new Date(`${data.fechaInicio.slice(0, 10)}T00:00:00.000`) : null,
        fechaFin: data.fechaFin ? new Date(`${data.fechaFin.slice(0, 10)}T23:59:59.999`) : null,
      },
    })
    return DescuentoMapper.toDTO(updated)
  }

  async softDelete(id: number): Promise<boolean> {
    await prisma.descuento.update({
      where: { id: Number(id) },
      data: { activo: false },
    })
    return true
  }

  async hardDelete(id: number): Promise<boolean> {
    await prisma.descuento.delete({
      where: { id: Number(id) },
    })
    return true
  }

  async toggleActivo(id: number, activo: boolean): Promise<boolean> {
    const existing = await prisma.descuento.findUnique({ where: { id: Number(id) } })
    if (!existing) return false

    const dataToUpdate: any = { activo }

    if (activo) {
      // If reactivating a discount code whose usage limit was reached, reset usage counter so it works
      if (existing.usosMaximos > 0 && existing.usosActuales >= existing.usosMaximos) {
        dataToUpdate.usosActuales = 0
      }
      // If reactivating an expired discount, clear the expired end date so it becomes active
      if (existing.fechaFin) {
        const end = new Date(existing.fechaFin)
        end.setHours(23, 59, 59, 999)
        if (new Date() > end) {
          dataToUpdate.fechaFin = null
        }
      }
    }

    await prisma.descuento.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    })
    return true
  }

}

export const descuentosRepository = new DescuentosRepository()
