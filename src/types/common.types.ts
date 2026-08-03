export type Nullable<T> = T | null | undefined

export interface SelectOption<T = string | number> {
  label: string
  value: T
  disabled?: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface BaseEntity {
  id: number
  createdAt?: string | Date
  updatedAt?: string | Date
}
