import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SecureStore } from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

class SupabaseClientManager {
  private client: ReturnType<typeof createClient>;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem: (key: string) => {
            return SecureStore.getItemAsync(key);
          },
          setItem: (key: string, value: string) => {
            SecureStore.setItemAsync(key, value);
          },
          removeItem: (key: string) => {
            SecureStore.deleteItemAsync(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'callwall-mobile',
        },
      },
    });

    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    if (Platform.OS === 'ios') {
      AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          this.client.auth.startAutoRefresh();
        } else {
          this.client.auth.stopAutoRefresh();
        }
      });
    }
  }

  getClient() {
    return this.client;
  }

  async signInWithEmail(email: string, password: string) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    });
  }

  async signUp(email: string, password: string, options?: { data?: any }) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: options?.data,
          emailRedirectTo: 'callwall://auth/callback',
        },
      });

      if (error) throw error;
      return data;
    });
  }

  async signInWithGoogle() {
    return this.retryOperation(async () => {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'callwall://auth/callback',
        },
      });

      if (error) throw error;
      return data;
    });
  }

  async signOut() {
    return this.retryOperation(async () => {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
    });
  }

  async getCurrentUser() {
    return this.retryOperation(async () => {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return user;
    });
  }

  async getSession() {
    return this.retryOperation(async () => {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    });
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }

  subscribeToTable(table: string, event: string, callback: (payload: any) => void) {
    return this.client
      .channel(`${table}-${event}`)
      .on('postgres_changes',
        { event, schema: 'public', table },
        callback
      )
      .subscribe();
  }

  async uploadFile(bucket: string, path: string, file: File | Blob, metadata?: Record<string, string>) {
    return this.retryOperation(async () => {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          metadata,
        });

      if (error) throw error;
      return data;
    });
  }

  async getPublicUrl(bucket: string, path: string) {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  handleOfflineMode() {
    return {
      getCachedData: async (key: string) => {
        try {
          return await SecureStore.getItemAsync(`cache_${key}`);
        } catch {
          return null;
        }
      },
      setCachedData: async (key: string, data: string, ttl: number = 3600000) => {
        try {
          const cacheItem = JSON.stringify({
            data,
            timestamp: Date.now(),
            ttl,
          });
          await SecureStore.setItemAsync(`cache_${key}`, cacheItem);
        } catch {
          // Silent fail for cache operations
        }
      }
    };
  }
}

export const supabaseManager = new SupabaseClientManager();
export default supabaseManager.getClient();