import { Injectable } from '@nestjs/common';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface Response<T = any> {
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
    pagination?: PaginationMeta;
  };
}

@Injectable()
export class ResponseService {
  private now() {
    return new Date().toISOString();
  }

  success<T>(data: T, message?: string, requestId?: string): Response<T> {
    return {
      status: 'success',
      data,
      message,
      meta: {
        timestamp: this.now(),
        requestId,
      },
    };
  }

  /**
   * Creates a successful API response with pagination metadata.
   * Automatically calculates totalPages, hasPrev, and hasNext if not provided.
   * @param data The response data
   * @param pagination Pagination information (totalPages, hasPrev, hasNext are optional and will be calculated)
   * @param message Optional success message (defaults to 'Data retrieved successfully')
   * @param requestId Optional request identifier
   * @returns Response with pagination metadata
   */
  successWithPagination<T>(
    data: T,
    pagination: Omit<PaginationMeta, 'totalPages' | 'hasPrev' | 'hasNext'> & {
      totalPages?: number;
    },
    message = 'Data retrieved successfully',
    requestId?: string,
  ): Response<T> {
    const totalPages =
      pagination.totalPages ?? Math.ceil(pagination.total / pagination.limit);

    // Basic validation
    if (pagination.page < 1 || pagination.limit < 1 || pagination.total < 0) {
      throw new Error('Invalid pagination parameters');
    }

    const hasPrev = pagination.page > 1;
    const hasNext = pagination.page < totalPages;

    return {
      status: 'success',
      data,
      message,
      meta: {
        timestamp: this.now(),
        requestId,
        pagination: { ...pagination, totalPages, hasPrev, hasNext },
      },
    };
  }

  created<T>(
    data: T,
    message = 'Resource created successfully',
    requestId?: string,
  ): Response<T> {
    return this.success(data, message, requestId);
  }

  noContent(
    message = 'Resource deleted successfully',
    requestId?: string,
  ): Response {
    return {
      status: 'success',
      message,
      meta: {
        timestamp: this.now(),
        requestId,
      },
    };
  }

  error(
    message: string,
    code = 'INTERNAL_ERROR',
    details?: any,
    requestId?: string,
  ): Response {
    return {
      status: 'error',
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: this.now(),
        requestId,
      },
    };
  }

  warning(message: string, data?: any, requestId?: string): Response {
    return {
      status: 'warning',
      message,
      data,
      meta: {
        timestamp: this.now(),
        requestId,
      },
    };
  }

  info(message: string, data?: any, requestId?: string): Response {
    return {
      status: 'info',
      message,
      data,
      meta: {
        timestamp: this.now(),
        requestId,
      },
    };
  }
}
