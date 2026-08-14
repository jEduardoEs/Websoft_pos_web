import { CreateCompraDto } from '../dto/create-compra.dto';
import { Compra } from '../types/compra';
import { CompraRepository } from '../repositories/compra.repository';

export class CompraService {
  private repository = new CompraRepository();

  async getAll(limit = 100): Promise<Compra[]> {
    return this.repository.findAll(limit);
  }

  async create(dto: CreateCompraDto, userId: number, userName: string): Promise<Compra> {
    return this.repository.createCompraWithTransaction(dto, userId, userName);
  }
}
