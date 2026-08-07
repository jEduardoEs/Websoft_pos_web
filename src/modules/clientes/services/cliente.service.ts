import { CreateClienteDto } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { Cliente } from '../types/cliente';
import { prisma } from '@/lib/prisma';

export class ClienteService {
  async getAll(buscar: string = '', limit: number = 100): Promise<Cliente[]> {
    const where: any = { activo: true };
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { nit: { contains: buscar, mode: 'insensitive' } },
        { telefono: { contains: buscar, mode: 'insensitive' } },
      ];
    }
    const result = await prisma.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: limit,
    });
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
