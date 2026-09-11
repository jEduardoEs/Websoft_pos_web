import { ApiResponseDTO } from './ApiResponseDTO'

export interface PageMetaDTO {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResultDTO<T> {
  items: T[]
  meta: PageMetaDTO
}

export type PaginatedApiResponseDTO<T> = ApiResponseDTO<PaginatedResultDTO<T>>
