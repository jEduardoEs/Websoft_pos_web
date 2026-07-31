export interface CredentialsPayload {
  usuario?: string
  password?: string
}

export interface AuthSessionUser {
  id: string
  name: string
  email: string
  role: string
  sessionToken: string
  permisos: string
}

export interface AuthToken { 
  role?: string
  id?: string
  sessionToken?: string
  permisos?: string
  [key: string]: unknown
}
