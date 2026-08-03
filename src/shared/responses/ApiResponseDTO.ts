export interface ApiResponseDTO<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  message?: string
  code?: string
  status?: number
}
