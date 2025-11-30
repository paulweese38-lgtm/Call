import { supabase } from '../lib/supabase';
import { PostgrestError, AuthError } from '@supabase/supabase-js';

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Retry logic for failed operations
 * Retries up to maxRetries times with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      // Don't retry on auth errors or forbidden
      if (error.code === 'PGRST301' || error.status === 401 || error.status === 403) {
        throw error;
      }

      // On last retry, throw the error
      if (i === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries reached');
}

/**
 * Handle Supabase errors and convert to ServiceResponse format
 */
function handleError(error: PostgrestError | AuthError | Error): ServiceResponse {
  console.error('Supabase error:', error);

  // Handle auth errors
  if ('status' in error) {
    if (error.status === 401) {
      return {
        success: false,
        error: { message: 'Unauthorized. Please log in again.', code: '401' }
      };
    }
    if (error.status === 403) {
      return {
        success: false,
        error: { message: 'Access denied. You do not have permission.', code: '403' }
      };
    }
    if (error.status === 429) {
      return {
        success: false,
        error: { message: 'Too many requests. Please try again later.', code: '429' }
      };
    }
  }

  // Handle Postgrest errors
  if ('code' in error && 'message' in error) {
    return {
      success: false,
      error: { message: error.message, code: error.code }
    };
  }

  // Generic error
  return {
    success: false,
    error: { message: error.message || 'An unexpected error occurred' }
  };
}

/**
 * Query database with error handling and retry logic
 */
export async function query<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<ServiceResponse<T>> {
  try {
    const result = await retryOperation(async () => {
      const { data, error } = await operation();
      if (error) throw error;
      return data;
    });

    return { success: true, data: result as T };
  } catch (error: any) {
    return handleError(error);
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob | File,
  onProgress?: (progress: number) => void
): Promise<ServiceResponse<{ path: string; url: string }>> {
  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl
      }
    };
  } catch (error: any) {
    return handleError(error);
  }
}

/**
 * Download file from Supabase Storage
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<ServiceResponse<Blob>> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return handleError(error);
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return handleError(error);
  }
}

/**
 * Subscribe to realtime changes
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => channel.unsubscribe()
  };
}

/**
 * Authentication helpers
 */
export const auth = {
  signUp: async (email: string, password: string, userData?: any): Promise<ServiceResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return handleError(error);
    }
  },

  signIn: async (email: string, password: string): Promise<ServiceResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return handleError(error);
    }
  },

  signOut: async (): Promise<ServiceResponse> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return handleError(error);
    }
  },

  resetPassword: async (email: string): Promise<ServiceResponse> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'callwall://auth/reset-password'
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return handleError(error);
    }
  },

  updatePassword: async (newPassword: string): Promise<ServiceResponse> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return handleError(error);
    }
  },

  getSession: async (): Promise<ServiceResponse> => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      return { success: true, data: data.session };
    } catch (error: any) {
      return handleError(error);
    }
  }
};
