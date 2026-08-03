import { AppError } from './AppError'

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado para realizar esta acción', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details)
  }
}
