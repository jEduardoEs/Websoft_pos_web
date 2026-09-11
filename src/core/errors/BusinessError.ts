import { AppError } from './AppError'

export class BusinessError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION', details)
  }
}
