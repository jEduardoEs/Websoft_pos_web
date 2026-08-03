import { ApiResponse } from '@/types/api.types'

export function createSuccessResponse<T>(data: T, status = 200): ApiResponse<T> {
  return {
    ok: true,
    data,
    status,
  }
}

export function createErrorResponse<T = never>(error: string, status = 500): ApiResponse<T> {
  return {
    ok: false,
    error,
    status,
  }
}
