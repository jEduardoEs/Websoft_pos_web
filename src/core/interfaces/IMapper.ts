export interface IMapper<DomainEntity, DTO, PersistenceModel = unknown> {
  toDomain(raw: PersistenceModel | unknown): DomainEntity
  toDTO(entity: DomainEntity): DTO
  toPersistence?(entity: DomainEntity): PersistenceModel
}
