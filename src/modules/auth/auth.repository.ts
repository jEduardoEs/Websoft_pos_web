import { prisma } from '@/lib/prisma'

export const authRepository = {
  findUsuarioByNombre(usuario: string) {
    return prisma.usuario.findFirst({
      where: {
        usuario: {
          equals: usuario,
          mode: 'insensitive',
        },
        activo: true,
      },
    })
  },

  findActiveSession(usuarioId: number) {
    return prisma.activeSession.findUnique({ where: { usuarioId } })
  },

  deleteActiveSession(usuarioId: number) {
    return prisma.activeSession.delete({ where: { usuarioId } })
  },

  upsertActiveSession(usuarioId: number, sessionToken: string) {
    return prisma.activeSession.upsert({
      where: { usuarioId },
      update: { sessionToken, lastActivity: new Date() },
      create: { usuarioId, sessionToken, lastActivity: new Date() },
    })
  },

  findConfigByClave(clave: string) {
    return prisma.config.findUnique({ where: { clave } })
  },

  updateUsuarioPermisos(usuarioId: number, permisos: string) {
    return prisma.usuario.update({ where: { id: usuarioId }, data: { permisos } })
  },

  findUsuarioById(id: number) {
    return prisma.usuario.findUnique({ where: { id } })
  },
}
