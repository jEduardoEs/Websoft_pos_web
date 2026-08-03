import { AppError } from './AppError'

export class ConflictError extends AppError {
  constructor(message = 'Conflicto de recurso o registro duplicado', details?: unknown) {
    super(message, 409, 'CONFLICT_ERROR', details)
  }
}
