import { UsuarioRepository } from '../repositories/usuario.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { Usuario } from '../types/usuario';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export class UsuarioService {
  private repo = new UsuarioRepository();

  async getAll(): Promise<Usuario[]> {
    return prisma.usuario.findMany({
      select: { id: true, nombre: true, usuario: true, rol: true, permisos: true, activo: true, metaMensual: true, createdAt: true } as any,
      orderBy: { nombre: 'asc' },
    });
  }

  async getById(id: number): Promise<Usuario | null> {
    return this.repo.findById(id);
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const hashed = await bcrypt.hash(dto.password, 12);
    const permisosStr = Array.isArray(dto.permisos) ? JSON.stringify(dto.permisos) : (dto.permisos || '');

    const data: any = {
      nombre: dto.nombre,
      usuario: dto.usuario,
      password: hashed,
      rol: dto.rol || 'cajero',
      permisos: permisosStr,
      activo: dto.activo ?? true,
      metaMensual: dto.metaMensual || 0,
    };
    return prisma.usuario.create({ data });
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const data: any = {};
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.usuario) data.usuario = dto.usuario;
    if (dto.rol) data.rol = dto.rol;
    if (dto.metaMensual !== undefined) data.metaMensual = dto.metaMensual;
    
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    if (dto.permisos !== undefined) {
      let finalPermisos = Array.isArray(dto.permisos) ? JSON.stringify(dto.permisos) : dto.permisos;
      if (Array.isArray(dto.permisos) && dto.permisos.length === 0) {
        const existing = await this.getById(id);
        if (existing?.permisos) finalPermisos = existing.permisos;
      }
      data.permisos = finalPermisos;
    }

    return prisma.usuario.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Usuario> {
    return this.repo.delete(id);
  }

  async activar(id: number): Promise<void> {
    await prisma.usuario.update({ where: { id }, data: { activo: true } });
  }

  async cerrarSesionActiva(id: number): Promise<void> {
    try {
      await prisma.activeSession.delete({ where: { usuarioId: id } });
    } catch { 
      // Ignorar si no hay sesión activa
    }
  }
}
