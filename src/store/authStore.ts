import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User, LoginCredentials, RegisterData } from '@/types/auth';
import { supabaseManager } from '@/lib/supabase';
import { supabaseClient } from '@/lib/supabaseClient';
import * as SecureStore from 'expo-secure-store';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials): Promise<boolean> => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(null);

          const { data, error } = await supabaseManager.signInWithEmail(
            credentials.email,
            credentials.password
          );

          if (error) {
            setError(error.message);
            return false;
          }

          if (data.user) {
            // Fetch user profile data
            const profileResult = await supabaseClient.selectOne<User>(
              'users',
              '*',
              { id: data.user.id }
            );

            if (profileResult.success && profileResult.data) {
              set({
                user: profileResult.data,
                session: data.session,
                isAuthenticated: true,
                error: null,
              });
              return true;
            } else {
              // Create user profile if it doesn't exist
              const newUserProfile = {
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata?.full_name || '',
                subscription_tier: 'free' as const,
                subscription_status: 'active' as const,
                preferences: {
                  notifications: {
                    email: true,
                    push: true,
                    sms: false,
                  },
                  privacy: {
                    share_analytics: false,
                    marketing_emails: false,
                  },
                  legal: {
                    auto_generate_documents: true,
                    threat_analysis_enabled: true,
                  },
                  voicemail: {
                    auto_transcribe: true,
                    auto_categorize: true,
                    sentiment_analysis: true,
                  },
                  voice: {
                    preferred_personality: 'Friendly Helper',
                    default_pitch: 1.0,
                    default_speed: 1.0,
                  },
                },
              };

              const createResult = await supabaseClient.insert<User>(
                'users',
                newUserProfile
              );

              if (createResult.success && createResult.data) {
                set({
                  user: createResult.data,
                  session: data.session,
                  isAuthenticated: true,
                  error: null,
                });
                return true;
              }
            }
          }

          return false;
        } catch (error: any) {
          setError(error.message || 'Login failed');
          return false;
        } finally {
          setLoading(false);
        }
      },

      register: async (data: RegisterData): Promise<boolean> => {
        const { setLoading, setError } = get();

        if (data.password !== data.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }

        if (!data.agreeToTerms || !data.agreeToPrivacy) {
          setError('You must agree to the terms and privacy policy');
          return false;
        }

        try {
          setLoading(true);
          setError(null);

          const { data: authData, error } = await supabaseManager.signUp(
            data.email,
            data.password,
            {
              data: {
                full_name: data.full_name,
                phone_number: data.phone_number,
              }
            }
          );

          if (error) {
            setError(error.message);
            return false;
          }

          // Note: User profile will be created on first login
          // after email verification
          set({
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          setError(error.message || 'Registration failed');
          return false;
        } finally {
          setLoading(false);
        }
      },

      loginWithGoogle: async (): Promise<boolean> => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(null);

          const { data, error } = await supabaseManager.signInWithGoogle();

          if (error) {
            setError(error.message);
            return false;
          }

          return true;
        } catch (error: any) {
          setError(error.message || 'Google login failed');
          return false;
        } finally {
          setLoading(false);
        }
      },

      logout: async (): Promise<void> => {
        const { setLoading } = get();

        try {
          setLoading(true);
          await supabaseManager.signOut();

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Logout error:', error);
        } finally {
          setLoading(false);
        }
      },

      resetPassword: async (email: string): Promise<boolean> => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(null);

          const { error } = await supabaseManager.client.auth.resetPasswordForEmail(
            email,
            {
              redirectTo: 'callwall://auth/reset-password',
            }
          );

          if (error) {
            setError(error.message);
            return false;
          }

          return true;
        } catch (error: any) {
          setError(error.message || 'Password reset failed');
          return false;
        } finally {
          setLoading(false);
        }
      },

      updateProfile: async (profileData: Partial<User>): Promise<boolean> => {
        const { user, setLoading, setError } = get();

        if (!user) {
          setError('Not authenticated');
          return false;
        }

        try {
          setLoading(true);
          setError(null);

          const result = await supabaseClient.update(
            'users',
            { ...profileData, updated_at: new Date().toISOString() },
            { id: user.id }
          );

          if (result.success && result.data) {
            set({
              user: { ...user, ...result.data },
              error: null,
            });
            return true;
          } else {
            setError(result.error?.message || 'Profile update failed');
            return false;
          }
        } catch (error: any) {
          setError(error.message || 'Profile update failed');
          return false;
        } finally {
          setLoading(false);
        }
      },

      refreshSession: async (): Promise<boolean> => {
        try {
          const { data, error } = await supabaseManager.client.auth.refreshSession();

          if (error) {
            return false;
          }

          const { user, session } = get();
          if (data.session && user) {
            set({
              session: data.session,
              isAuthenticated: true,
            });
            return true;
          }

          return false;
        } catch {
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeAuth: async (): Promise<void> => {
        const { setLoading } = get();

        try {
          setLoading(true);

          // Check for existing session
          const session = await supabaseManager.getSession();

          if (session?.user) {
            // Fetch user profile
            const profileResult = await supabaseClient.selectOne<User>(
              'users',
              '*',
              { id: session.user.id }
            );

            if (profileResult.success && profileResult.data) {
              set({
                user: profileResult.data,
                session,
                isAuthenticated: true,
                error: null,
              });
            } else {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
                error: null,
              });
            }
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              error: null,
            });
          }
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: null,
          });
        } finally {
          setLoading(false);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);