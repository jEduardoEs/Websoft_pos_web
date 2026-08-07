import { prisma } from '@/lib/prisma'
import { DescuentoMapper } from '../mappers/descuentoMapper'
import { CrearDescuentoDTO, DescuentoResponseDTO } from '../dto/DescuentoDTO'

export class DescuentosRepository {
  async findAll(): Promise<DescuentoResponseDTO[]> {
    const list = await prisma.descuento.findMany({ orderBy: { id: 'desc' } })
    return DescuentoMapper.toDTOList(list)
  }

  async findByCodigo(codigo: string): Promise<DescuentoResponseDTO | null> {
    const d = await prisma.descuento.findUnique({
      where: { codigo: codigo.toUpperCase() },
    })
    if (!d || !d.activo) return null
    return DescuentoMapper.toDTO(d)
  }

  async create(data: CrearDescuentoDTO): Promise<DescuentoResponseDTO> {
    const created = await prisma.descuento.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        descripcion: data.descripcion || null,
        tipo: data.tipo || 'porcentaje',
        valor: Number(data.valor) || 0,
        minimoCompra: Number(data.minimoCompra) || 0,
        usosMaximos: Number(data.usosMaximos) || 0,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      },
    })
    return DescuentoMapper.toDTO(created)
  }

  async update(id: number, data: CrearDescuentoDTO): Promise<DescuentoResponseDTO> {
    const updated = await prisma.descuento.update({
      where: { id: Number(id) },
      data: {
        codigo: data.codigo.toUpperCase(),
        descripcion: data.descripcion || null,
        tipo: data.tipo || 'porcentaje',
        valor: Number(data.valor) || 0,
        minimoCompra: Number(data.minimoCompra) || 0,
        usosMaximos: Number(data.usosMaximos) || 0,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
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

  async toggleActivo(id: number, activo: boolean): Promise<boolean> {
    await prisma.descuento.update({
      where: { id: Number(id) },
      data: { activo },
    })
    return true
  }
}

export const descuentosRepository = new DescuentosRepository()
