import { DescuentoResponseDTO } from '../dto/DescuentoDTO'
import { DescuentoFormState } from '../types'

export class DescuentoMapper {
  static toDTO(prismaEntity: any): DescuentoResponseDTO {
    return {
      id: prismaEntity.id,
      codigo: prismaEntity.codigo,
      descripcion: prismaEntity.descripcion,
      tipo: prismaEntity.tipo,
      valor: Number(prismaEntity.valor) || 0,
      minimoCompra: Number(prismaEntity.minimoCompra) || 0,
      usosMaximos: Number(prismaEntity.usosMaximos) || 0,
      usosActuales: Number(prismaEntity.usosActuales) || 0,
      fechaInicio: prismaEntity.fechaInicio ? new Date(prismaEntity.fechaInicio).toISOString() : null,
      fechaFin: prismaEntity.fechaFin ? new Date(prismaEntity.fechaFin).toISOString() : null,
      activo: Boolean(prismaEntity.activo),
    }
  }

  static toDTOList(prismaEntities: any[]): DescuentoResponseDTO[] {
    return prismaEntities.map(e => DescuentoMapper.toDTO(e))
  }

  static dtoToFormState(dto: DescuentoResponseDTO): DescuentoFormState {
    return {
      id: dto.id,
      codigo: dto.codigo,
      descripcion: dto.descripcion || '',
      tipo: dto.tipo,
      valor: dto.valor,
      minimoCompra: dto.minimoCompra,
      usosMaximos: dto.usosMaximos,
      fechaInicio: dto.fechaInicio ? dto.fechaInicio.split('T')[0] : '',
      fechaFin: dto.fechaFin ? dto.fechaFin.split('T')[0] : '',
    }
  }
}
