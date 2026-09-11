export interface TableColumn<T = unknown> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (item: T) => React.ReactNode
}

export interface TableSort {
  columnKey: string
  direction: 'asc' | 'desc'
}

export interface TableState {
  page: number
  pageSize: number
  search: string
  sort?: TableSort
}
