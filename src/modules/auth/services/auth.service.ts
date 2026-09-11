import { signIn } from 'next-auth/react'

export class AuthService {
  static async login(credentials: any): Promise<any> {
    return await signIn('credentials', { ...credentials, redirect: false, callbackUrl: '/dashboard' })
  }
}
