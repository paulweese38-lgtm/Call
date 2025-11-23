export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  subscription_tier: 'free' | 'premium' | 'business';
  subscription_status: 'active' | 'canceled' | 'past_due';
  created_at: string;
  updated_at: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    share_analytics: boolean;
    marketing_emails: boolean;
  };
  legal: {
    auto_generate_documents: boolean;
    threat_analysis_enabled: boolean;
  };
  voicemail: {
    auto_transcribe: boolean;
    auto_categorize: boolean;
    sentiment_analysis: boolean;
  };
  voice: {
    preferred_personality: string;
    default_pitch: number;
    default_speed: number;
  };
}

export interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone_number?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface PasswordResetData {
  email: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  requiresEmailVerification?: boolean;
}