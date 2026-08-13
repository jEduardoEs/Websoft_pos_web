import { CreateClienteDto } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { Cliente } from '../types/cliente';
import { prisma } from '@/lib/prisma';
import { buildSearchWhereClause, rankSearchResults } from '@/lib/search-utils';

export class ClienteService {
  async getAll(buscar: string = '', limit: number = 100): Promise<Cliente[]> {
    const where: any = { activo: true };
    if (buscar && buscar.trim()) {
      const searchWhere = buildSearchWhereClause(buscar, ['nombre', 'nit', 'telefono', 'email', 'direccion']);
      Object.assign(where, searchWhere);
    }
    let result = await prisma.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: buscar && buscar.trim() ? limit * 2 : limit,
    });

    if (buscar && buscar.trim()) {
      result = rankSearchResults<any>(
        result,
        buscar,
        (c: any) => `${c.nombre} ${c.nit || ''} ${c.telefono || ''} ${c.email || ''} ${c.direccion || ''}`,
        (c: any) => c.nit
      );
      if (limit) {
        result = result.slice(0, limit);
      }
    }

    return result.map(c => ({
      id: c.id,
      nombre: c.nombre,
      nit: c.nit || undefined,
      telefono: c.telefono || undefined,
      email: c.email || undefined,
      direccion: c.direccion || undefined,
      notas: c.notas || undefined,
      activo: c.activo,
      creadoEn: c.createdAt
    }));
  }

  async getById(id: number): Promise<Cliente | null> {
    const c = await prisma.cliente.findUnique({ where: { id } });
    if (!c) return null;
    return { ...c, nit: c.nit || undefined, telefono: c.telefono || undefined, email: c.email || undefined, direccion: c.direccion || undefined, notas: c.notas || undefined, creadoEn: c.createdAt } as Cliente;
  }

  async create(dto: CreateClienteDto): Promise<Cliente> {
    const c = await prisma.cliente.create({ 
      data: {
        nombre: dto.nombre,
        nit: dto.nit,
        telefono: dto.telefono,
        email: dto.email,
        direccion: dto.direccion,
        notas: dto.notas
      } 
    });
    return { ...c, nit: c.nit || undefined, telefono: c.telefono || undefined, email: c.email || undefined, direccion: c.direccion || undefined, notas: c.notas || undefined, creadoEn: c.createdAt } as Cliente;
  }

  async update(id: number, dto: UpdateClienteDto): Promise<Cliente> {
    const c = await prisma.cliente.update({ 
      where: { id }, 
      data: {
        nombre: dto.nombre,
        nit: dto.nit,
        telefono: dto.telefono,
        email: dto.email,
        direccion: dto.direccion,
        notas: dto.notas
      } 
    });
    return { ...c, nit: c.nit || undefined, telefono: c.telefono || undefined, email: c.email || undefined, direccion: c.direccion || undefined, notas: c.notas || undefined, creadoEn: c.createdAt } as Cliente;
  }

  async delete(id: number): Promise<void> {
    await prisma.cliente.update({ where: { id }, data: { activo: false } });
  }
}
