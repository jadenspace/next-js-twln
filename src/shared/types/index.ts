// 공통 타입 정의
export interface ApiResponse<T = any> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
