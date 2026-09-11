export interface IRepository<T, ID = number | string> {
  findById(id: ID): Promise<T | null>
  findAll(): Promise<T[]>
  create(entity: Partial<T>): Promise<T>
  update(id: ID, entity: Partial<T>): Promise<T>
  delete(id: ID): Promise<boolean>
}
