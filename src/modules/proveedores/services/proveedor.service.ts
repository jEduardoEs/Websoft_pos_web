import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { Proveedor } from '../types/proveedor';
import { prisma } from '@/lib/prisma';

export class ProveedorService {
  async getAll(buscar: string = '', limit: number = 100): Promise<Proveedor[]> {
    const where: any = { activo: true };
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { nit: { contains: buscar, mode: 'insensitive' } },
        { telefono: { contains: buscar, mode: 'insensitive' } },
      ];
    }
    const result = await prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: limit,
    });
    return result.map(p => ({
      id: p.id,
      nombre: p.nombre,
      nit: p.nit || undefined,
      telefono: p.telefono || undefined,
      email: p.email || undefined,
      direccion: p.direccion || undefined,
      contacto: p.contacto || undefined,
      notas: p.notas || undefined,
      activo: p.activo,
      creadoEn: p.createdAt
    }));
  }

  async getById(id: number): Promise<Proveedor | null> {
    const p = await prisma.proveedor.findUnique({ where: { id } });
    if (!p) return null;
    return { ...p, nit: p.nit || undefined, telefono: p.telefono || undefined, email: p.email || undefined, direccion: p.direccion || undefined, contacto: p.contacto || undefined, notas: p.notas || undefined, creadoEn: p.createdAt } as Proveedor;
  }

  async create(dto: CreateProveedorDto): Promise<Proveedor> {
    const p = await prisma.proveedor.create({ 
      data: {
        nombre: dto.nombre,
        nit: dto.nit,
        telefono: dto.telefono,
        email: dto.email,
        direccion: dto.direccion,
        contacto: dto.contacto,
        notas: dto.notas
      } 
    });
    return { ...p, nit: p.nit || undefined, telefono: p.telefono || undefined, email: p.email || undefined, direccion: p.direccion || undefined, contacto: p.contacto || undefined, notas: p.notas || undefined, creadoEn: p.createdAt } as Proveedor;
  }

  async update(id: number, dto: UpdateProveedorDto): Promise<Proveedor> {
    const p = await prisma.proveedor.update({ 
      where: { id }, 
      data: {
        nombre: dto.nombre,
        nit: dto.nit,
        telefono: dto.telefono,
        email: dto.email,
        direccion: dto.direccion,
        contacto: dto.contacto,
        notas: dto.notas
      } 
    });
    return { ...p, nit: p.nit || undefined, telefono: p.telefono || undefined, email: p.email || undefined, direccion: p.direccion || undefined, contacto: p.contacto || undefined, notas: p.notas || undefined, creadoEn: p.createdAt } as Proveedor;
  }

  async delete(id: number): Promise<void> {
    await prisma.proveedor.update({ where: { id }, data: { activo: false } });
  }
}
