import { IHttpClient, RequestOptions } from './HttpClient'
import { ApiResponse } from '@/types/api.types'

export class FetchHttpClient implements IHttpClient {
  private buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
    if (!params) return url
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.append(key, String(val))
    })
    const queryString = query.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  private async request<T>(url: string, init: RequestInit, options?: RequestOptions): Promise<ApiResponse<T>> {
    const finalUrl = this.buildUrl(url, options?.params)
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    }

    try {
      const res = await fetch(finalUrl, {
        ...init,
        headers,
        signal: options?.signal,
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        return {
          ok: false,
          error: json.error || json.message || `Error HTTP ${res.status}`,
          status: res.status,
        }
      }

      return {
        ok: true,
        data: json.data !== undefined ? json.data : json,
        status: res.status,
      }
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Error de conexión a la red',
        status: 500,
      }
    }
  }

  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' }, options)
  }

  async post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, options)
  }

  async put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }, options)
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' }, options)
  }
}

export const fetchClient = new FetchHttpClient()
