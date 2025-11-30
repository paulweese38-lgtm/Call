import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserProfile } from '../types/User';
import { auth } from '../services/supabaseClient';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userData: { full_name: string; phone_number?: string }) => Promise<boolean>;
  refreshSession: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await auth.signIn(email, password);

          if (!response.success) {
            set({ isLoading: false, error: response.error?.message || 'Login failed' });
            return false;
          }

          const user = response.data?.user;

          // Fetch user profile from users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }

          set({
            user,
            profile: profile || null,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Login failed' });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await auth.signOut();

          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          set({ isLoading: false });
        }
      },

      register: async (email: string, password: string, userData: { full_name: string; phone_number?: string }) => {
        set({ isLoading: true, error: null });

        try {
          const response = await auth.signUp(email, password, userData);

          if (!response.success) {
            set({ isLoading: false, error: response.error?.message || 'Registration failed' });
            return false;
          }

          set({
            isLoading: false,
            error: null
          });

          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Registration failed' });
          return false;
        }
      },

      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            console.error('Session refresh error:', error);
            set({ isAuthenticated: false, user: null, profile: null });
            return;
          }

          if (data.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            set({
              user: data.user as User,
              profile: profile || null,
              isAuthenticated: true
            });
          }
        } catch (error) {
          console.error('Session refresh error:', error);
        }
      },

      updateProfile: async (profileData: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) return false;

        set({ isLoading: true });

        try {
          const { data, error } = await supabase
            .from('users')
            .update(profileData)
            .eq('id', user.id)
            .select()
            .single();

          if (error) {
            console.error('Profile update error:', error);
            set({ isLoading: false, error: error.message });
            return false;
          }

          set({
            profile: data,
            isLoading: false,
            error: null
          });

          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          return false;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          const response = await auth.getSession();

          if (!response.success || !response.data) {
            set({ isLoading: false, isAuthenticated: false, user: null, profile: null });
            return;
          }

          const user = response.data.user;

          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            set({
              user: user as User,
              profile: profile || null,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({ isLoading: false, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({ isLoading: false, isAuthenticated: false, user: null, profile: null });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
