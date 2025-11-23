import supabase from './supabase';
import { Alert } from 'react-native';

export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: DatabaseError | null;
  success: boolean;
}

class SupabaseWrapper {
  private defaultRetryAttempts = 3;
  private defaultRetryDelay = 1000;

  async handleDatabaseOperation<T>(
    operation: () => Promise<{ data?: T; error?: any }>,
    customErrorMessage?: string
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.defaultRetryAttempts; attempt++) {
      try {
        const result = await operation();

        if (result.error) {
          lastError = result.error;

          // Don't retry on authentication or validation errors
          if (this.isNonRetryableError(result.error)) {
            break;
          }

          if (attempt < this.defaultRetryAttempts) {
            await this.delay(this.defaultRetryDelay * attempt);
            continue;
          }
        }

        if (result.error) {
          this.logError(result.error, customErrorMessage);
          return {
            data: null,
            error: this.formatError(result.error),
            success: false
          };
        }

        return {
          data: result.data || null,
          error: null,
          success: true
        };

      } catch (error: any) {
        lastError = error;

        if (this.isNonRetryableError(error)) {
          break;
        }

        if (attempt < this.defaultRetryAttempts) {
          await this.delay(this.defaultRetryDelay * attempt);
        }
      }
    }

    this.logError(lastError, customErrorMessage);
    return {
      data: null,
      error: this.formatError(lastError),
      success: false
    };
  }

  async insert<T>(
    table: string,
    data: Record<string, any>,
    customErrorMessage?: string
  ): Promise<ApiResponse<T>> {
    return this.handleDatabaseOperation(
      () => supabase.from(table).insert(data).select().single(),
      customErrorMessage || `Failed to insert data into ${table}`
    );
  }

  async select<T>(
    table: string,
    columns: string = '*',
    filters: Record<string, any> = {},
    customErrorMessage?: string
  ): Promise<ApiResponse<T[]>> {
    return this.handleDatabaseOperation(
      () => {
        let query = supabase.from(table).select(columns);

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        return query;
      },
      customErrorMessage || `Failed to select data from ${table}`
    );
  }

  async selectOne<T>(
    table: string,
    columns: string = '*',
    filters: Record<string, any> = {},
    customErrorMessage?: string
  ): Promise<ApiResponse<T>> {
    return this.handleDatabaseOperation(
      () => {
        let query = supabase.from(table).select(columns);

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        return query.single();
      },
      customErrorMessage || `Failed to select single record from ${table}`
    );
  }

  async update<T>(
    table: string,
    data: Record<string, any>,
    filters: Record<string, any>,
    customErrorMessage?: string
  ): Promise<ApiResponse<T>> {
    return this.handleDatabaseOperation(
      () => {
        let query = supabase.from(table).update(data);

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        return query.select().single();
      },
      customErrorMessage || `Failed to update data in ${table}`
    );
  }

  async delete(
    table: string,
    filters: Record<string, any>,
    customErrorMessage?: string
  ): Promise<ApiResponse<null>> {
    return this.handleDatabaseOperation(
      () => {
        let query = supabase.from(table).delete();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        return query;
      },
      customErrorMessage || `Failed to delete data from ${table}`
    );
  }

  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    metadata?: Record<string, string>,
    customErrorMessage?: string
  ): Promise<ApiResponse<{ path: string }>> {
    return this.handleDatabaseOperation(
      () => supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          metadata,
        }),
      customErrorMessage || `Failed to upload file to ${bucket}`
    );
  }

  async deleteFile(
    bucket: string,
    paths: string[],
    customErrorMessage?: string
  ): Promise<ApiResponse<null>> {
    return this.handleDatabaseOperation(
      () => supabase.storage.from(bucket).remove(paths),
      customErrorMessage || `Failed to delete file(s) from ${bucket}`
    );
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'PGRST116', // Not found
      'PGRST301', // Forbidden
      '42501',    // Insufficient privilege
      '23505',    // Unique violation
      '23503',    // Foreign key violation
      '23502',    // Not null violation
      '42P01',    // Undefined table
    ];

    const nonRetryableMessages = [
      'authentication failed',
      'invalid token',
      'validation error',
      'duplicate key',
      'not found',
    ];

    return (
      nonRetryableCodes.includes(error?.code) ||
      nonRetryableMessages.some(msg =>
        error?.message?.toLowerCase().includes(msg)
      ) ||
      error?.status === 401 ||
      error?.status === 403 ||
      error?.status === 404
    );
  }

  private formatError(error: any): DatabaseError {
    return {
      message: error?.message || 'An unexpected error occurred',
      details: error?.details,
      hint: error?.hint,
      code: error?.code || 'UNKNOWN_ERROR',
    };
  }

  private logError(error: any, customMessage?: string) {
    const logData = {
      timestamp: new Date().toISOString(),
      customMessage,
      error: {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      },
    };

    console.error('Supabase Operation Error:', JSON.stringify(logData, null, 2));

    // In development, you might want to show alerts
    if (__DEV__ && customMessage) {
      Alert.alert('Database Error', customMessage);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to check if user is online
  async isOnline(): Promise<boolean> {
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Graceful offline mode handler
  async withOfflineFallback<T>(
    onlineOperation: () => Promise<ApiResponse<T>>,
    cacheKey: string,
    fallbackData?: T
  ): Promise<ApiResponse<T>> {
    const isOnline = await this.isOnline();

    if (isOnline) {
      const result = await onlineOperation();

      // Cache successful results for offline use
      if (result.success && result.data) {
        try {
          const { supabaseManager } = await import('./supabase');
          const cache = supabaseManager.handleOfflineMode();
          await cache.setCachedData(cacheKey, JSON.stringify(result.data));
        } catch {
          // Silent fail for caching
        }
      }

      return result;
    }

    // Return cached data if available
    try {
      const { supabaseManager } = await import('./supabase');
      const cache = supabaseManager.handleOfflineMode();
      const cachedData = await cache.getCachedData(cacheKey);

      if (cachedData) {
        return {
          data: JSON.parse(cachedData),
          error: null,
          success: true
        };
      }
    } catch {
      // Silent fail for cache retrieval
    }

    // Return fallback data or offline error
    if (fallbackData) {
      return {
        data: fallbackData,
        error: null,
        success: true
      };
    }

    return {
      data: null,
      error: {
        message: 'No internet connection and no cached data available',
        code: 'OFFLINE_NO_CACHE'
      },
      success: false
    };
  }
}

export const supabaseClient = new SupabaseWrapper();
export default supabaseClient;