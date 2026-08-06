import { prisma } from '@/lib/prisma';

export class SessionBackendService {
  static async ping(usuarioId: number) {
    await prisma.activeSession.upsert({
      where: { usuarioId },
      update: { lastActivity: new Date() },
      create: {
        usuarioId,
        sessionToken: 'ping',
        lastActivity: new Date(),
      },
    });
  }

  static async getAll() {
    const sessions = await prisma.activeSession.findMany({
      orderBy: { lastActivity: 'desc' },
    });
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, rol: true, usuario: true },
    });
    return sessions.map((s: any) => ({
      ...s,
      usuario: usuarios.find((u: any) => u.id === s.usuarioId) || null,
    }));
  }

  static async closeSession(usuarioId: number) {
    try {
      await prisma.activeSession.delete({ where: { usuarioId } });
    } catch {
      // Already deleted
    }
  }
}
