import { ApiResponse } from '@/types/api.types'

export interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  signal?: AbortSignal
}

export interface IHttpClient {
  get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>
  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>
  delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>
}
