// General API Response Schema
export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'warning' | 'info';
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasPrev: boolean;
      hasNext: boolean;
    };
  };
}

// Pagination Query Parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Common Response Types
export type EmptyResponse = ApiResponse<null>;
