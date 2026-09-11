import { UserRole } from './permissions.types'

export interface UserSession {
  id: string
  name: string
  email: string
  role: UserRole
  sessionToken: string
  permisos: string
}

export interface ActiveSessionPayload {
  usuarioId: number
  sessionToken: string
  ip?: string
  lastActivity: Date | string
}
