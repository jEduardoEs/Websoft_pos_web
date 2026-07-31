import { z } from 'zod'

export const credentialsSchema = z.object({
  usuario: z.string().nonempty({ message: 'Usuario es requerido' }),
  password: z.string().nonempty({ message: 'Contraseña es requerida' }),
})

export type CredentialsSchema = z.infer<typeof credentialsSchema>
