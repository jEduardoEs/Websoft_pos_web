export interface ApiResponse<T = unknown> {
  ok?: boolean
  data?: T
  error?: string
  message?: string
  status?: number
}

export interface ApiErrorResponse {
  ok: false
  error: string
  code?: string
  details?: unknown
}
