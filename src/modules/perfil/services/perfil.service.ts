import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export class PerfilService {
  /**
   * Obtiene la información pública del usuario autenticado
   */
  async getPerfil(userId: number) {
    return prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        rol: true,
        metaMensual: true,
      }
    });
  }

  /**
   * Actualiza el perfil del usuario (nombre y/o contraseña)
   */
  async updatePerfil(userId: number, data: { nombre: string; password?: string }) {
    const updateData: any = {
      nombre: data.nombre,
    };

    if (data.password && data.password.trim().length > 0) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        usuario: true,
        rol: true,
      }
    });
  }
}
