import bcrypt from 'bcryptjs'
import { authRepository } from './auth.repository'
import { AuthSessionUser, CredentialsPayload } from './auth.types'

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function authorizeUser(credentials: CredentialsPayload): Promise<AuthSessionUser | null> {
  if (!credentials.usuario || !credentials.password) return null

  const user = await authRepository.findUsuarioByNombre(credentials.usuario)
  if (!user) return null

  const ok = await bcrypt.compare(credentials.password, user.password)
  if (!ok) return null

  if (user.rol !== 'admin') {
    try {
      const existing = await authRepository.findActiveSession(user.id)
      if (existing) {
        const hoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (existing.lastActivity > hoursAgo) {
          throw new Error('SESION_ACTIVA')
        }
        await authRepository.deleteActiveSession(user.id)
      }
    } catch (e: any) {
      if (e.message === 'SESION_ACTIVA') throw e
    }
  }

  const sessionToken = generateToken()
  try {
    await authRepository.upsertActiveSession(user.id, sessionToken)
  } catch {
    /* ignore */
  }

  let permisosResueltos = user.permisos || ''
  try {
    const parsed = permisosResueltos ? JSON.parse(permisosResueltos) : []
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const cfgRoles = await authRepository.findConfigByClave('roles_personalizados')
      const roles = cfgRoles ? JSON.parse(cfgRoles.valor || '[]') : []
      const rolDef = roles.find((r: any) => r.id === user.rol)
      if (rolDef?.permisos?.length) {
        permisosResueltos = JSON.stringify(rolDef.permisos)
        await authRepository.updateUsuarioPermisos(user.id, permisosResueltos)
      }
    }
  } catch {
    /* si falla el parseo, se usa el valor original */
  }

  return {
    id: String(user.id),
    name: user.nombre,
    email: user.usuario,
    role: user.rol,
    sessionToken,
    permisos: permisosResueltos,
  }
}

export async function refreshTokenClaims(context: any) {
  const token = context.token
  const user = context.user

  if (user) {
    token.role = (user as any).role
    token.id = user.id
    token.sessionToken = (user as any).sessionToken
    token.permisos = (user as any).permisos || ''
  }

  if (context.trigger === 'update' && token.id) {
    try {
      const fresh = await authRepository.findUsuarioById(parseInt(token.id as string))
      if (fresh) {
        token.permisos = fresh.permisos || ''
        token.role = fresh.rol
      }
    } catch {
      /* ignore */
    }
  }

  return token
}
