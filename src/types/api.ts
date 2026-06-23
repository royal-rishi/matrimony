// ============================================================
// API TYPES - Rishtajodo Matrimony
// Standard response wrappers for all Route Handlers
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
}
