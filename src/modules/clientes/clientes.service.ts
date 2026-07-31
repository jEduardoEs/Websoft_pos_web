import { auth } from '@/lib/auth'
import { clientesRepository } from './clientes.repository'

export const clientesService = {
  async requireSession() {
    const session = await auth()
    if (!session) throw new Error('No autorizado')
    return session
  },

  async requireAdmin(session: any) {
    if (!session || session.user.role !== 'admin') throw new Error('No autorizado')
    return session
  },

  async listClientes(buscar: string) {
    return clientesRepository.findClientes(buscar)
  },

  async saveCliente(body: any) {
    const { id, nombre, nit, telefono, email, direccion, notas } = body
    if (!nombre) throw new Error('Nombre requerido')

    if (id) {
      return clientesRepository.updateCliente(Number(id), { nombre, nit, telefono, email, direccion, notas })
    }

    return clientesRepository.createCliente({ nombre, nit, telefono, email, direccion, notas })
  },

  async deleteCliente(id: number, session: any) {
    await this.requireAdmin(session)
    return clientesRepository.softDeleteCliente(id)
  },
}
